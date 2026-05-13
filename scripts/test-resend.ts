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
      if (key?.trim() === 'RESEND_API_KEY') {
        process.env.RESEND_API_KEY = valueParts.join('=').trim();
        break;
      }
    }
  }

  // Dynamically import resend to ensure process.env is set
  const { resend } = await import('../src/lib/resend');

  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is still not defined after manual load');
    process.exit(1);
  }

  try {
    console.log('Testing Resend connection...');
    const { data: keysData, error: keysError } = await resend.apiKeys.list();
    
    if (keysError) {
      console.error('Resend API error (Keys):', keysError);
      process.exit(1);
    }
    
    console.log('Resend connection successful!');
    console.log('API Keys found:', (keysData as any)?.data?.length || 0);

    console.log('Checking verified domains...');
    const { data: domainsData, error: domainsError } = await resend.domains.list();
    if (domainsError) {
      console.error('Resend API error (Domains):', domainsError);
    } else {
      const domains = (domainsData as any)?.data || [];
      console.log('Domains found:', domains.length);
      domains.forEach((d: any) => {
        console.log(`- ${d.name} (${d.status})`);
      });

      const targetDomain = 'updates.flowcore.ai';
      const isVerified = domains.some((d: any) => d.name === targetDomain && d.status === 'verified');
      if (isVerified) {
        console.log(`SUCCESS: Domain ${targetDomain} is verified!`);
      } else {
        console.warn(`WARNING: Domain ${targetDomain} is NOT verified or not found. Emails from this domain may fail.`);
      }
    }

    // Try sending a test email
    console.log('\nSending test email to zenosayz05@gmail.com...');
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'zenosayz05@gmail.com',
      subject: 'FlowCore - Resend Sandbox Test',
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2 style="color: #c65f39;">Resend Integration Test</h2>
          <p>This is a test email sent via the <strong>Resend Sandbox</strong> (onboarding@resend.dev).</p>
          <p>Status: API Connection Verified.</p>
          <hr />
          <p style="font-size: 12px; color: #666;">Sent via FlowCore Diagnostic Tool</p>
        </div>
      `,
    });

    if (emailError) {
      console.error('Email Send Error:', emailError);
    } else {
      console.log('Email sent successfully!');
      console.log('Email ID:', (emailData as any)?.id);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

main();
