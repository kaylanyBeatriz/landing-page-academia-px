<?php
/**
 * Recebe os dados do formulário de cadastro completo, registra o lead no
 * Supabase (lp_register_lead) e devolve o access_token pro front liberar o
 * acesso na hora — igual ao fluxo anterior. A diferença: agora passa por aqui
 * pra poder disparar um e-mail de aviso (ADMIN_NOTIFY_EMAILS) toda vez que for
 * um cadastro NOVO de verdade (checado antes via lp_check_email, pra não
 * notificar de novo quando alguém já cadastrado reenvia o formulário).
 *
 * Exige PHP com extensão cURL. Não funciona no servidor estático de dev
 * (.local-server.js) — rode com `php -S localhost:8000` localmente, ou publique
 * num host com PHP (ex.: HostGator) para testar de verdade.
 */

require __DIR__ . '/mailer.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['success' => false, 'error' => 'method_not_allowed']);
  exit;
}

$configPath = __DIR__ . '/config.php';
if (!file_exists($configPath)) {
  http_response_code(500);
  echo json_encode(['success' => false, 'error' => 'missing_config']);
  exit;
}
$config = require $configPath;

$body = json_decode(file_get_contents('php://input'), true);
if (!is_array($body)) $body = [];

$fullName = isset($body['full_name']) ? trim((string) $body['full_name']) : '';
$email = isset($body['email']) ? trim((string) $body['email']) : '';
$jobTitle = isset($body['job_title']) ? trim((string) $body['job_title']) : '';
$phone = isset($body['phone']) ? trim((string) $body['phone']) : '';
$company = isset($body['company']) ? trim((string) $body['company']) : '';
$consentGiven = !empty($body['consent_given']);

if (mb_strlen($fullName) < 3) {
  http_response_code(400);
  echo json_encode(['success' => false, 'error' => 'invalid_full_name']);
  exit;
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
  http_response_code(400);
  echo json_encode(['success' => false, 'error' => 'invalid_email']);
  exit;
}
if (!$consentGiven) {
  http_response_code(400);
  echo json_encode(['success' => false, 'error' => 'consent_required']);
  exit;
}
$email = strtolower($email);

function supabaseRpc($config, $fn, $payload) {
  $ch = curl_init($config['SUPABASE_URL'] . '/rest/v1/rpc/' . $fn);
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode($payload),
    CURLOPT_HTTPHEADER => [
      'apikey: ' . $config['SUPABASE_KEY'],
      'Authorization: Bearer ' . $config['SUPABASE_KEY'],
      'Content-Type: application/json',
      'Content-Profile: ' . $config['SUPABASE_PROFILE'],
    ],
    CURLOPT_TIMEOUT => 15,
  ]);
  $raw = curl_exec($ch);
  $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);
  return [$status, json_decode($raw, true)];
}

/* 1. Já existia antes de registrar? (pra decidir se notifica) */
[, $existedRows] = supabaseRpc($config, 'lp_check_email', [
  'p_lp_slug' => $config['LP_SLUG'],
  'p_email' => $email,
]);
$isNewLead = ($existedRows !== true);

/* 2. Registra/atualiza o lead de verdade */
$payload = [
  'lp_slug' => $config['LP_SLUG'],
  'full_name' => $fullName,
  'email' => $email,
  'consent_given' => true,
  'consent_version' => $config['CONSENT_VERSION'],
];
if ($jobTitle !== '') $payload['job_title'] = $jobTitle;
if ($phone !== '') $payload['phone'] = $phone;
if ($company !== '') $payload['company'] = $company;

foreach (['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid', 'referrer', 'landing_page'] as $field) {
  if (!empty($body[$field])) $payload[$field] = (string) $body[$field];
}

[$status, $lead] = supabaseRpc($config, 'lp_register_lead', ['p' => $payload]);

if ($status !== 200 || empty($lead['access_token'])) {
  http_response_code(502);
  echo json_encode(['success' => false, 'error' => 'lead_register_failed']);
  exit;
}

/* 3. Notifica os admins, só se for cadastro novo de verdade */
$notifyEmails = $config['ADMIN_NOTIFY_EMAILS'] ?? [];
if ($isNewLead && !empty($notifyEmails)) {
  $rows = [
    'Nome' => $fullName,
    'E-mail' => $email,
    'Cargo' => $jobTitle ?: '—',
    'Telefone' => $phone ?: '—',
    'Empresa' => $company ?: '—',
    'Landing page' => $config['LP_SLUG'],
  ];
  $html = '<h2>Novo cadastro — Curso NR-35</h2><table cellpadding="6" style="border-collapse:collapse">';
  foreach ($rows as $label => $value) {
    $html .= '<tr><td style="color:#666"><strong>' . htmlspecialchars($label) . '</strong></td><td>' . htmlspecialchars($value) . '</td></tr>';
  }
  $html .= '</table>';

  foreach ($notifyEmails as $notifyEmail) {
    sendGmailSmtp($config, $notifyEmail, 'Novo lead — Curso NR-35', $html);
    // Falha no envio do aviso não deve impedir o cadastro em si — só loga, não retorna erro.
  }
}

echo json_encode([
  'success' => true,
  'access_token' => $lead['access_token'],
  'full_name' => $fullName,
]);
