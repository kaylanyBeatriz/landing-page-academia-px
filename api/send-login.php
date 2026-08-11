<?php
/**
 * Recebe { email } do formulário "Já se cadastrou?" e manda por e-mail (SMTP
 * do Gmail) um link com o access_token existente — via lp_resend_access
 * (Supabase), que devolve o token e o nome já cadastrados sem exigir
 * full_name de novo. O acesso só é liberado quando a pessoa clica no link.
 *
 * Exige PHP com extensão cURL (chamadas ao Supabase). Não funciona no
 * servidor estático de dev (.local-server.js) — rode com
 * `php -S localhost:8000` localmente, ou publique num host com PHP
 * (ex.: HostGator) para testar de verdade.
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
$email = isset($body['email']) ? trim((string) $body['email']) : '';

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
  http_response_code(400);
  echo json_encode(['success' => false, 'error' => 'invalid_email']);
  exit;
}
$email = strtolower($email);

/* 1. Busca o token/nome já existentes via lp_resend_access */
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

[$status, $rows] = supabaseRpc($config, 'lp_resend_access', [
  'p_lp_slug' => $config['LP_SLUG'],
  'p_email' => $email,
]);

if ($status === 429 || $status === 400) {
  // 53400 (too many requests) chega como erro do Postgres via PostgREST
  http_response_code(429);
  echo json_encode(['success' => false, 'error' => 'rate_limited']);
  exit;
}
if ($status !== 200) {
  http_response_code(502);
  echo json_encode(['success' => false, 'error' => 'lookup_failed']);
  exit;
}

$lead = (is_array($rows) && count($rows) > 0) ? $rows[0] : null;
if (!$lead || empty($lead['access_token'])) {
  // Não revela no HTTP status se o e-mail existe ou não além do payload —
  // o front decide a mensagem, mas aqui é seguro dizer "não encontrado"
  // porque quem já sabe o e-mail de alguém não ganha nada demais com isso.
  http_response_code(404);
  echo json_encode(['success' => false, 'error' => 'email_not_found']);
  exit;
}

$fullName = $lead['full_name'] ?: '';
$loginUrl = $config['SITE_URL'] . '?login_token=' . urlencode($lead['access_token']);

/* 2. Envia o e-mail com o link, via SMTP do Gmail */
$firstName = $fullName ? explode(' ', $fullName)[0] : '';
$greeting = $firstName ? 'Olá, ' . htmlspecialchars($firstName) . '!' : 'Olá!';
$html = '<p>' . $greeting . '</p>'
  . '<p>Clique no link abaixo para acessar os materiais do Curso NR-35:</p>'
  . '<p><a href="' . htmlspecialchars($loginUrl) . '">' . htmlspecialchars($loginUrl) . '</a></p>'
  . '<p>Se você não solicitou este acesso, pode ignorar este e-mail.</p>';

$sent = sendGmailSmtp($config, $email, 'Seu acesso aos materiais NR 35', $html);

if (!$sent) {
  http_response_code(502);
  echo json_encode(['success' => false, 'error' => 'email_send_failed']);
  exit;
}

echo json_encode(['success' => true]);
