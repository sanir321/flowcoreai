const { chromium } = require('playwright');

const PROJECT_REF = 'bnpdrelienfnlkceluip';
const ACCESS_TOKEN = 'eyJhbGciOiJFUzI1NiIsImtpZCI6ImVjNjQyNjYyLTZlMjQtNDFlNy04MGY1LThjMmQxM2I3NTRjZCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2JucGRyZWxpZW5mbmxrY2VsdWlwLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI1YzE4OWQyYi1lYmVmLTQ4ZmMtODdjNi1mODg2YTFjZjQ4NzIiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzgwMDIyODU2LCJpYXQiOjE3ODAwMTkyNTYsImVtYWlsIjoiemVub3NheXowNUBnbWFpbC5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6Imdvb2dsZSIsInByb3ZpZGVycyI6WyJnb29nbGUiXSwid29ya3NwYWNlX2lkIjoiNTNhZTI0ZDctMzNlYS00YWY4LWE0MTQtNWI2NjM1Y2QyZTFjIn0sInVzZXJfbWV0YWRhdGEiOnsiYXZhdGFyX3VybCI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0xQOWFYaG4zWTdaUEExNVRXV0lTZjJDUHlaakhDLTNpN1EyeWVJdkFfXzlYd09zS2hJPXM5Ni1jIiwiZW1haWwiOiJ6ZW5vc2F5ejA1QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmdWxsX25hbWUiOiJTYW1pciBTYXl6IiwiaXNzIjoiaHR0cHM6Ly9hY2NvdW50cy5nb29nbGUuY29tIiwibmFtZSI6IlNhbWlyIFNheXoiLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NMUDlhWGhuM1k3WlBBMTVUV1dJU2YyQ1B5WmpIQy0zaTdRMnllSXZBX185WHdPc0toST1zOTYtYyIsInByb3ZpZGVyX2lkIjoiMTAxNjcyMDcwNDcxMDU2NDI1MTAyIiwic3ViIjoiMTAxNjcyMDcwNDcxMDU2NDI1MTAyIn0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoib3RwIiwidGltZXN0YW1wIjoxNzgwMDE5MjU2fV0sInNlc3Npb25faWQiOiIxYzM1MmEwYS0wZDdhLTQyYmMtYmY1YS1kNTU4ZjBhNGEyM2MiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.CgYc5fvZOC_4JaHDF4UK4K_EHqzr-wlR3HyL-CyBCL7cU4H3fbBW_Krz4CL4fA7eLN0Jjv6yGlPYt6o7nBQ11g';
const REFRESH_TOKEN = 'amn6obgevzsg';

const SITE = 'https://7flowcore.vercel.app';

const cookieName = 'sb-' + PROJECT_REF + '-auth-token';
const session = {
  access_token: ACCESS_TOKEN,
  refresh_token: REFRESH_TOKEN,
  expires_in: 3600,
  expires_at: 1780022856,
  token_type: 'bearer',
};

async function takeScreenshots() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1270, height: 760 } });

  // Inject auth cookie into the context BEFORE any protected page navigation
  // This ensures Supabase SSR receives the cookie on the very first request
  await context.addCookies([{
    name: cookieName,
    value: encodeURIComponent(JSON.stringify(session)),
    domain: '7flowcore.vercel.app',
    path: '/',
    sameSite: 'Lax',
  }]);

  // Landing hero — public page, no auth needed, viewport-only not fullPage
  await screenshot(context, '/', 'landing-hero');

  // Dashboard pages (require auth cookie from context)
  await screenshot(context, '/inbox', 'inbox');
  await screenshot(context, '/insights', 'analytics');
  await screenshot(context, '/contacts', 'contacts');
  await screenshot(context, '/knowledge', 'knowledge-base');
  await screenshot(context, '/appointments', 'appointments');
  await screenshot(context, '/settings', 'settings');

  await browser.close();
  console.log('DONE - all screenshots in public/producthunt/');
}

async function screenshot(context, path, name) {
  const page = await context.newPage();
  const url = SITE + path;
  console.log('Screenshot:', name, '->', url);

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  } catch (e) {
    console.log('  goto warning:', e.message.substring(0, 100));
  }

  // Extra wait for JS rendering
  await page.waitForTimeout(3000);

  const fp = 'public/producthunt/' + name + '.png';
  // Use fullPage: false for consistent 1270x760 viewport screenshots
  await page.screenshot({ path: fp, fullPage: false });
  console.log('  Saved:', fp, `(${require('fs').statSync(fp).size} bytes)`);

  await page.close();
}

takeScreenshots().catch(e => { console.error(e); process.exit(1); });
