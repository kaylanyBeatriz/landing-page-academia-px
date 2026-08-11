<?php
/**
 * Envio de e-mail via SMTP do Gmail (smtp.gmail.com:465, TLS implícito),
 * sem dependências externas (sem Composer/PHPMailer) — só sockets do PHP.
 *
 * Por quê: o Resend em modo sandbox só entrega pro dono da conta; pra
 * enviar pra qualquer lead de verdade sem verificar um domínio (DNS),
 * usamos a própria conta Gmail como relay. Exige uma "senha de app" do
 * Google (não a senha normal da conta) — ver GMAIL_SMTP_USER/
 * GMAIL_SMTP_APP_PASSWORD no config.php.
 *
 * Limite do Gmail: ~500 e-mails/dia por conta.
 */

function sendGmailSmtp($config, $to, $subject, $html) {
  $host = 'smtp.gmail.com';
  $port = 465;
  $user = $config['GMAIL_SMTP_USER'];
  $pass = $config['GMAIL_SMTP_APP_PASSWORD'];
  $fromName = $config['GMAIL_SMTP_FROM_NAME'] ?? 'Academia PX';

  $errno = 0;
  $errstr = '';
  $socket = @stream_socket_client(
    "ssl://{$host}:{$port}",
    $errno,
    $errstr,
    15,
    STREAM_CLIENT_CONNECT
  );
  if (!$socket) {
    error_log("SMTP connect failed: $errstr ($errno)");
    return false;
  }

  $read = function () use ($socket) {
    $data = '';
    while ($line = fgets($socket, 515)) {
      $data .= $line;
      // Linha final de uma resposta multi-linha tem um espaço depois do código, não hífen.
      if (isset($line[3]) && $line[3] === ' ') break;
    }
    return $data;
  };

  $write = function ($cmd) use ($socket) {
    fwrite($socket, $cmd . "\r\n");
  };

  $expect = function ($expectedCode) use ($read, &$lastResponse) {
    $lastResponse = $read();
    return substr($lastResponse, 0, 3) === (string) $expectedCode;
  };

  $lastResponse = '';
  $ok = true;
  $ok = $ok && $expect(220);
  $write('EHLO academiapx.com.br');
  $ok = $ok && $expect(250);
  $write('AUTH LOGIN');
  $ok = $ok && $expect(334);
  $write(base64_encode($user));
  $ok = $ok && $expect(334);
  $write(base64_encode($pass));
  $ok = $ok && $expect(235);

  if (!$ok) {
    error_log('SMTP auth/handshake failed: ' . $lastResponse);
    fclose($socket);
    return false;
  }

  $write("MAIL FROM:<{$user}>");
  $ok = $ok && $expect(250);
  $write("RCPT TO:<{$to}>");
  $ok = $ok && $expect(250);
  $write('DATA');
  $ok = $ok && $expect(354);

  if (!$ok) {
    error_log('SMTP envelope failed: ' . $lastResponse);
    fclose($socket);
    return false;
  }

  $headers = [
    'From: ' . mb_encode_mimeheader($fromName) . " <{$user}>",
    'To: <' . $to . '>',
    'Subject: ' . mb_encode_mimeheader($subject),
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
  ];
  $body = implode("\r\n", $headers) . "\r\n\r\n" . $html . "\r\n.";
  $write($body);
  $ok = $ok && $expect(250);

  $write('QUIT');
  fclose($socket);

  if (!$ok) {
    error_log('SMTP send failed: ' . $lastResponse);
  }
  return $ok;
}
