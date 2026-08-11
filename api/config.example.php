<?php
/**
 * Copie este arquivo para "config.php" (mesma pasta) e preencha os valores reais.
 * config.php NÃO deve ser versionado (já está no .gitignore) — ele guarda a senha
 * de app do Gmail, que nunca pode aparecer em código público.
 */

return [
  // Envio de e-mail via SMTP do Gmail (sem precisar verificar domínio):
  // 1. Ative a verificação em duas etapas em myaccount.google.com/security
  // 2. Gere uma "senha de app" em myaccount.google.com/apppasswords
  'GMAIL_SMTP_USER' => 'CHANGE_ME_seu-email@gmail.com',
  'GMAIL_SMTP_APP_PASSWORD' => 'CHANGE_ME_16_caracteres_sem_espaco',
  'GMAIL_SMTP_FROM_NAME' => 'Academia PX',

  // URL pública final da landing page (sem barra no fim).
  // É pra onde o link do e-mail vai apontar.
  'SITE_URL' => 'https://academiapx.com.br/curso-nr-35',

  // Mesmos valores já usados no script.js — mantenha iguais.
  'SUPABASE_URL' => 'https://supabase.px.center',
  'SUPABASE_KEY' => 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzY0MDAyOTM2fQ.dMGaLZiuABWuyamF_0qirSJzsOs5O_I9wTn5QP1MQtQ',
  'SUPABASE_PROFILE' => 'website_academia_px', // trocar para _dev em homologação
  'LP_SLUG' => 'curso-nr-35',
  'CONSENT_VERSION' => 'v1',

  // Recebem um aviso a cada novo cadastro (não em reenvios/updates).
  'ADMIN_NOTIFY_EMAILS' => [
    'kaylany.ribeiro@academiapx.com.br',
  ],
];
