const nodemailer = require('nodemailer');

let transporter;

function isEmailConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
}

function getTransporter() {
  if (transporter) return transporter;

  if (!isEmailConfigured()) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  return transporter;
}

async function sendPasswordResetEmail({ to, resetUrl }) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const subject = 'Restablecer contraseña — Obsidian Gallery';
  const text = [
    'Recibimos una solicitud para restablecer tu contraseña.',
    '',
    `Haz clic en el siguiente enlace (válido por 1 hora):`,
    resetUrl,
    '',
    'Si no solicitaste este cambio, ignora este correo.'
  ].join('\n');

  const html = `
    <p>Recibimos una solicitud para restablecer tu contraseña.</p>
    <p><a href="${resetUrl}">Restablecer contraseña</a></p>
    <p>Este enlace expira en 1 hora.</p>
    <p>Si no solicitaste este cambio, ignora este correo.</p>
  `;

  const mailTransporter = getTransporter();

  if (!mailTransporter) {
    // eslint-disable-next-line no-console
    console.warn('[email] SMTP no configurado. Enlace de recuperación (solo dev):');
    // eslint-disable-next-line no-console
    console.warn(resetUrl);
    return { sent: false, previewUrl: resetUrl };
  }

  await mailTransporter.sendMail({ from, to, subject, text, html });
  return { sent: true };
}

module.exports = {
  isEmailConfigured,
  sendPasswordResetEmail
};
