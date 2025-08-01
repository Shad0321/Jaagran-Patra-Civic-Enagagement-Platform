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

function createEmailTemplate(content: string, title: string) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333333;
      background-color: #f5f5f5;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #00b074 0%, #008a5a 100%);
      padding: 30px 40px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .logo {
      width: 80px;
      height: 80px;
      border-radius: 12px;
      margin-bottom: 15px;
      border: 3px solid rgba(255, 255, 255, 0.2);
    }
    .brand-name {
      color: #ffffff;
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 8px;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .brand-tagline {
      color: rgba(255, 255, 255, 0.9);
      font-size: 14px;
      font-weight: 300;
    }
    .content {
      padding: 40px;
    }
    .greeting {
      font-size: 18px;
      color: #333333;
      margin-bottom: 25px;
      font-weight: 500;
    }
    .message {
      font-size: 16px;
      color: #555555;
      margin-bottom: 30px;
      line-height: 1.7;
    }
    .action-button {
      display: inline-block;
      background: linear-gradient(135deg, #00b074 0%, #008a5a 100%);
      color: #ffffff !important;
      text-decoration: none;
      padding: 15px 35px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      text-align: center;
      box-shadow: 0 4px 12px rgba(0, 176, 116, 0.3);
      transition: all 0.3s ease;
      margin: 20px 0;
    }
    .action-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 176, 116, 0.4);
    }
    .alternative-text {
      font-size: 14px;
      color: #777777;
      margin-top: 25px;
      padding: 20px;
      background-color: #f8f9fa;
      border-left: 4px solid #00b074;
      border-radius: 4px;
    }
    .footer {
      background-color: #333333;
      color: #ffffff;
      padding: 30px 40px;
      text-align: center;
      border-radius: 0 0 8px 8px;
    }
    .footer-brand {
      font-size: 18px;
      font-weight: bold;
      color: #00b074;
      margin-bottom: 10px;
    }
    .footer-description {
      font-size: 14px;
      color: #cccccc;
      margin-bottom: 20px;
      line-height: 1.5;
    }
    .footer-links {
      font-size: 12px;
      color: #999999;
    }
    .footer-links a {
      color: #00b074;
      text-decoration: none;
    }
    .security-notice {
      background-color: #fff3cd;
      border: 1px solid #ffeaa7;
      border-radius: 6px;
      padding: 15px;
      margin: 20px 0;
      font-size: 14px;
      color: #856404;
    }
    @media (max-width: 600px) {
      .email-container {
        margin: 0;
        border-radius: 0;
      }
      .header, .content, .footer {
        padding: 25px 20px;
      }
      .brand-name {
        font-size: 24px;
      }
      .action-button {
        padding: 12px 25px;
        font-size: 14px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <img src="https://res.cloudinary.com/dib0peewu/image/upload/v1753975258/full-JP_ozatse.png" alt="Jaagran Patra Logo" class="logo">
      <div class="brand-name">Jaagran Patra</div>
      <div class="brand-tagline">Empowering Civic Engagement</div>
    </div>
    
    <div class="content">
      ${content}
    </div>
    
    <div class="footer">
      <div class="footer-brand">Jaagran Patra</div>
      <div class="footer-description">
        Your trusted platform for news, issue tracking, and civic analytics.<br>
        Building stronger communities through informed citizen engagement.
      </div>
      <div class="footer-links">
        <p>This email was sent from Jaagran Patra. If you have any questions, please contact our support team.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export async function sendVerificationEmail(email: string, token: string) {
  const subject = 'Welcome to Jaagran Patra - Verify Your Email';
  const frontendBaseUrl =
    process.env.FRONTEND_BASE_URL || 'http://localhost:5173';
  const verifyUrl = `${frontendBaseUrl}/verify-email?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;

  const content = `
    <div class="greeting">Welcome to Jaagran Patra! 🎉</div>
    <div class="message">
      Thank you for joining our civic engagement platform. We're excited to have you as part of our community working towards better governance and transparency.
      <br><br>
      To complete your registration and start tracking issues, reading news, and accessing analytics, please verify your email address by clicking the button below:
    </div>
    <div style="text-align: center;">
      <a href="${verifyUrl}" class="action-button">Verify My Email</a>
    </div>
    <div class="alternative-text">
      <strong>Alternative verification:</strong><br>
      If the button doesn't work, you can copy and paste this link into your browser:<br>
      <a href="${verifyUrl}" style="color: #00b074; word-break: break-all;">${verifyUrl}</a>
    </div>
    <div class="security-notice">
      <strong>Security Notice:</strong> This verification link is valid for 24 hours. If you didn't create an account with Jaagran Patra, please ignore this email.
    </div>
  `;

  const html = createEmailTemplate(
    content,
    'Email Verification - Jaagran Patra'
  );

  const text = `Welcome to Jaagran Patra!

Thank you for joining our civic engagement platform. To complete your registration, please verify your email address by clicking the following link:

${verifyUrl}

This verification link is valid for 24 hours. If you didn't create an account with Jaagran Patra, please ignore this email.

Best regards,
Jaagran Patra Team`;

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject,
    text,
    html,
  });
}

export async function sendResetPasswordEmail(email: string, token: string) {
  const subject = 'Reset Your Jaagran Patra Password';
  const frontendBaseUrl =
    process.env.FRONTEND_BASE_URL || 'http://localhost:5173';
  const resetUrl = `${frontendBaseUrl}/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;

  const content = `
    <div class="greeting">Password Reset Request</div>
    <div class="message">
      We received a request to reset the password for your Jaagran Patra account associated with this email address.
      <br><br>
      If you made this request, click the button below to reset your password. If you didn't request a password reset, you can safely ignore this email.
    </div>
    <div style="text-align: center;">
      <a href="${resetUrl}" class="action-button">Reset My Password</a>
    </div>
    <div class="alternative-text">
      <strong>Alternative method:</strong><br>
      If the button doesn't work, you can copy and paste this link into your browser:<br>
      <a href="${resetUrl}" style="color: #00b074; word-break: break-all;">${resetUrl}</a>
    </div>
    <div class="security-notice">
      <strong>Security Notice:</strong> This password reset link is valid for 1 hour. For your security, we recommend choosing a strong password that you haven't used before.
    </div>
  `;

  const html = createEmailTemplate(content, 'Password Reset - Jaagran Patra');

  const text = `Password Reset Request - Jaagran Patra

We received a request to reset the password for your Jaagran Patra account.

If you made this request, click the following link to reset your password:
${resetUrl}

If you didn't request a password reset, you can safely ignore this email.

This password reset link is valid for 1 hour.

Best regards,
Jaagran Patra Team`;

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject,
    text,
    html,
  });
}
