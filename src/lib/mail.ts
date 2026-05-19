import nodemailer from 'nodemailer';

const email = process.env.SMTP_USER;
const pass = process.env.SMTP_PASSWORD;

if (!email || !pass) {
  console.warn('[SMTP] SMTP_USER or SMTP_PASSWORD not configured. Email sending will fail.');
}

let transporter: nodemailer.Transporter;
if (email && pass) {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user: email, pass },
  });
}

export async function sendEmail({ to, subject, html }: { to: string, subject: string, html: string }) {
  if (!email || !pass || !transporter) {
    return { data: null, error: new Error('SMTP not configured') };
  }

  try {
    const info = await transporter.sendMail({
      from: `"FlowCore" <${email}>`,
      to,
      subject,
      html,
    });
    return { data: info, error: null };
  } catch (error) {
    console.error('[SMTP] Error sending email:', error);
    return { data: null, error };
  }
}
