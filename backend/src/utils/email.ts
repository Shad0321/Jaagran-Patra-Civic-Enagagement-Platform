import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendVerificationEmail(email: string, token: string) {
  const subject = 'Verify your email';
  const frontendBaseUrl =
    process.env.FRONTEND_BASE_URL || 'http://localhost:5173';
  const verifyUrl = `${frontendBaseUrl}/verify-email?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;
  const text = `Your verification token is: ${token}\nOr click the link to verify: ${verifyUrl}`;
  const html = `<p>Your verification token is: <b>${token}</b></p><p>Or <a href="${verifyUrl}">click here to verify your email</a>.</p>`;
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject,
    text,
    html,
  });
}

export async function sendResetPasswordEmail(email: string, token: string) {
  const subject = 'Reset your password';
  const frontendBaseUrl =
    process.env.FRONTEND_BASE_URL || 'http://localhost:5173';
  const resetUrl = `${frontendBaseUrl}/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;
  const text = `Your password reset token is: ${token}\nOr click the link to reset your password: ${resetUrl}`;
  const html = `<p>Your password reset token is: <b>${token}</b></p><p>Or <a href="${resetUrl}">click here to reset your password</a>.</p>`;
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject,
    text,
    html,
  });
}
