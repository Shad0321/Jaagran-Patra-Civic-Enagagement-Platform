import emailjs from '@emailjs/nodejs';

const SERVICE_ID = process.env.EMAILJS_SERVICE_ID || '';
const TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID || '';
const USER_ID = process.env.EMAILJS_USER_ID || '';

export async function sendVerificationEmail(email: string, token: string) {
  const templateParams = {
    to_email: email,
    verification_token: token,
  };
  await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, {
    publicKey: USER_ID,
  });
}

export async function sendResetPasswordEmail(email: string, token: string) {
  const templateParams = {
    to_email: email,
    reset_token: token,
  };
  await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, {
    publicKey: USER_ID,
  });
}
