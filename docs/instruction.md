I have a Next.js 14 app hosted on Vercel using Supabase Auth with Google OAuth. 
The sign-in flow completes on Supabase's side (logs show /authorize and /callback 
completing) but the app hangs after redirect. 

Please audit the following and report ALL issues found:

1. **Auth Callback Route** (`app/auth/callback/route.ts`)
   - Is exchangeCodeForSession being called correctly?
   - Is the redirect URL hardcoded to localhost anywhere?
   - Any missing error handling?

2. **Middleware** (`middleware.ts`)
   - Is /auth/callback being blocked or intercepted?
   - Is the matcher pattern excluding auth routes properly?
   - Any infinite redirect loops possible?

3. **Environment Variables**
   - Search entire codebase for any hardcoded localhost:3000 URLs
   - Check if NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are 
     used correctly everywhere
   - Any places where env vars might be undefined in production?

4. **Supabase Client Setup**
   - Check createRouteHandlerClient, createServerComponentClient, 
     createClientComponentClient usage
   - Any client being created incorrectly for server vs client components?

5. **Dashboard/Protected Route** (`app/dashboard/page.tsx` or similar)
   - Is there a slow or broken DB query running on first load after login?
   - Any missing user/tenant record creation after first OAuth login?
   - RLS policies that might block the newly logged-in user?

6. **package.json**
   - Check @supabase/auth-helpers-nextjs version — anything below 0.8.0 has 
     known OAuth bugs

Report each issue with: file path, line number, what's wrong, and exact fix.