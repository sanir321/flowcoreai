import * as fs from 'fs';
import * as path from 'path';

async function main() {
  // Manually load .env.local for testing
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    for (const line of lines) {
      const [key, ...valueParts] = line.split('=');
      const k = key?.trim();
      if (k === 'SMTP_USER') {
        process.env.SMTP_USER = valueParts.join('=').trim();
      }
      if (k === 'SMTP_PASSWORD') {
        process.env.SMTP_PASSWORD = valueParts.join('=').trim();
      }
    }
  }

  // Dynamically import our new mail helper
  const { sendEmail } = await import('../src/lib/mail');

  if (!process.env.SMTP_PASSWORD) {
    console.error('SMTP_PASSWORD is not defined in .env.local');
    process.exit(1);
  }

  try {
    console.log(`Testing SMTP connection for ${process.env.SMTP_USER || 'dser08680@gmail.com'}...`);
    
    const { data, error } = await sendEmail({
      to: 'zenosayz05@gmail.com',
      subject: 'FlowCore - Gmail SMTP Test',
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2 style="color: #c65f39;">Gmail SMTP Integration Test</h2>
          <p>This is a test email sent via <strong>Gmail SMTP</strong>.</p>
          <p>Sender: ${process.env.SMTP_USER || 'dser08680@gmail.com'}</p>
          <hr />
          <p style="font-size: 12px; color: #666;">Sent via FlowCore Diagnostic Tool</p>
        </div>
      `,
    });

    if (error) {
      console.error('SMTP Send Error:', error);
      console.log('\nTIP: Make sure you are using a "Gmail App Password", not your normal password.');
    } else {
      console.log('Email sent successfully via SMTP!');
      console.log('Message ID:', (data as any)?.messageId);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

main();
