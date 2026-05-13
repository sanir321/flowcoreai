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
      if (k === 'SMTP_USER') process.env.SMTP_USER = valueParts.join('=').trim();
      if (k === 'SMTP_PASSWORD') process.env.SMTP_PASSWORD = valueParts.join('=').trim();
      if (k === 'RESEND_API_KEY') process.env.RESEND_API_KEY = valueParts.join('=').trim();
    }
  }

  const { sendEmail } = await import('../src/lib/mail');
  const { render } = await import('@react-email/components');
  const React = await import('react');
  const { WelcomeEmail } = await import('../src/components/emails/welcome');
  const { OtpEmail } = await import('../src/components/emails/otp-email');
  const { SignInNotificationEmail } = await import('../src/components/emails/sign-in-notification');
  const { ReEngagementEmail } = await import('../src/components/emails/re-engagement');

  const testUser = {
    email: 'harinisl666@gmail.com',
    username: 'Harini'
  };

  try {
    console.log('--- Testing Personalized Automation Emails ---');

    // 1. Welcome Email
    console.log('\n1. Sending Welcome Email...');
    const welcomeHtml = await render(React.createElement(WelcomeEmail, { 
      username: testUser.username,
      loginUrl: 'https://flowcore.ai/login'
    }));
    const welcomeRes = await sendEmail({
      to: testUser.email,
      subject: `Welcome to FlowCore, ${testUser.username}!`,
      html: welcomeHtml
    });
    console.log(welcomeRes.error ? 'FAILED' : 'SUCCESS');

    // 2. OTP Verification Email
    console.log('\n2. Sending OTP Email...');
    const otpHtml = await render(React.createElement(OtpEmail, { 
      otpCode: '482931'
    }));
    const otpRes = await sendEmail({
      to: testUser.email,
      subject: 'Your FlowCore verification code',
      html: otpHtml
    });
    console.log(otpRes.error ? 'FAILED' : 'SUCCESS');

    // 3. Sign-in Notification
    console.log('\n3. Sending Sign-in Notification...');
    const signinHtml = await render(React.createElement(SignInNotificationEmail, { 
      username: testUser.username,
      time: new Date().toLocaleString(),
      device: 'Chrome on Windows Diagnostic'
    }));
    const signinRes = await sendEmail({
      to: testUser.email,
      subject: 'New Sign-in detected on FlowCore',
      html: signinHtml
    });
    console.log(signinRes.error ? 'FAILED' : 'SUCCESS');

    // 4. Re-engagement Email
    console.log('\n4. Sending Re-engagement Email...');
    const reengageHtml = await render(React.createElement(ReEngagementEmail, { 
      username: testUser.username,
      loginUrl: 'https://flowcore.ai/login'
    }));
    const reengageRes = await sendEmail({
      to: testUser.email,
      subject: `We miss you, ${testUser.username}!`,
      html: reengageHtml
    });
    console.log(reengageRes.error ? 'FAILED' : 'SUCCESS');

    console.log('\n--- Automation Email Tests Complete ---');
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

main();
