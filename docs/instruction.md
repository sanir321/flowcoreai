<meta name="google-site-verification" content="SxmdSGeyyW2UFS1-YFJ6M1bB1fJHNXDJD-ZtKkkeRJg" />

Sitemap could not be read" means Google can fetch the URL but the XML is invalid or has an issue.
The most likely cause — your middleware is redirecting /sitemap.xml to /login because it treats all routes as protected.

Fix — Exclude sitemap from auth middleware
Open your middleware.ts file and make sure these paths are public:
tsexport const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.png$).*)',
  ],
}
Or if you have a manual auth check:
tsconst publicPaths = ['/', '/login', '/signup', '/sitemap.xml', '/robots.txt']

if (publicPaths.includes(pathname)) {
  return NextResponse.next()
}

Quick test:

Open an incognito window
Go to https://flowter-bay.vercel.app/sitemap.xml
Does it show the XML, or does it redirect to login?

If it redirects → the middleware fix above will solve it. Tell me what happens.