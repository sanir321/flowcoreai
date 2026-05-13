Integrate PostHog with Next.js
Read the docs
Automated installation
AI setup wizard
Try using the AI setup wizard to automatically install PostHog.

Run the following command from the root of your Next.js project.

npx -y @posthog/wizard@latest
OR
Manual installation
1. Install the package
required
Install the PostHog JavaScript library using your package manager:

npm
yarn
pnpm
npm install posthog-js
2. Add environment variables
required
Add your PostHog project token and host to your .env.local file and to your hosting provider (e.g. Vercel, Netlify). These values need to start with NEXT_PUBLIC_ to be accessible on the client-side.

NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN=phc_qchginmvQCWDvkYjhpqySykUyprwhEwrozzbrKxibdCb
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
3. Initialize PostHog
required
Choose the integration method based on your Next.js version and router type.

Next.js 15.3+
App router
Pages router
If you're using Next.js 15.3+, you can use instrumentation-client.ts for a lightweight, fast integration:

import posthog from 'posthog-js'

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    defaults: '2026-01-30'
})
Defaults option
The defaults option automatically configures PostHog with recommended settings for new projects. See SDK defaults for details.

4. Accessing PostHog on the client
recommended
Next.js 15.3+
App/Pages router
Once initialized in instrumentation-client.ts, import posthog from posthog-js anywhere and call the methods you need:

'use client'

import posthog from 'posthog-js'

export default function CheckoutPage() {
    function handlePurchase() {
        posthog.capture('purchase_completed', { amount: 99 })
    }

    return <button onClick={handlePurchase}>Complete purchase</button>
}
5. Server-side setup
optional
To capture events from API routes or server actions, install posthog-node:

npm
yarn
pnpm
npm install posthog-node
Then, initialize PostHog in your API route or server action. Choose the method based on your router type:

App router
Pages router
For the App router, you can use PostHog in API routes or server actions. Create a new PostHog client instance for each request, or reuse a singleton instance across requests:

import { PostHog } from 'posthog-node'

export async function POST(request: Request) {
    const posthog = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
        host: process.env.NEXT_PUBLIC_POSTHOG_HOST
    })

    posthog.capture({
        distinctId: 'distinct_id_of_the_user',
        event: 'event_name'
    })

    await posthog.shutdown()
}
You can also use PostHog in server actions:

'use server'

import { PostHog } from 'posthog-node'

export async function myServerAction() {
    const posthog = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
        host: process.env.NEXT_PUBLIC_POSTHOG_HOST
    })

    posthog.capture({
        distinctId: 'distinct_id_of_the_user',
        event: 'server_action_completed'
    })

    await posthog.shutdown()
}
Important
Always call await posthog.shutdown() when you're done with the client to ensure all events are flushed before the request completes. For better performance, consider creating a singleton PostHog instance that you reuse across requests.

6. Send events
recommended
Click around and view a couple pages to generate some events. PostHog automatically captures pageviews, clicks, and other interactions for you.

If you'd like, you can also manually capture custom events:

posthog.capture('my_custom_event', { property: 'value' 









Project token & ID
Your project token and ID used to connect SDKs and APIs to this environment.

Project token
phc_qchginmvQCWDvkYjhpqySykUyprwhEwrozzbrKxibdCb
Write-only key for use in client libraries. Safe to use in public apps.

Project ID
421770
Use this ID in the PostHog API.

Region
US Cloud
Where your PostHog data is hosted.

Debug information
Include this snippet when creating an issue (feature request or bug report) on GitHub.

Session: https://us.posthog.com/project/sTMFPsFhdP1Ssg/replay/019e200b-2166-7b4e-8099-8c74ea08aac8?t=1358
Admin: http://go/adminOrgUS/019e2010-a81a-0000-c74d-4c5ab353ddc3 (project ID 421770)
SDK setup
Install PostHog in your app using one of our SDKs. Select your platform to see the setup instructions. Docs

You can either add the JavaScript snippet directly to your HTML or install the JavaScript SDK via your package manager.

HTML snippet
JavaScript SDK
Add this snippet to your website within the <head> tag. This can also be used in services like Google Tag Manager:

<script>
    !function(t,e){var o,n,p,r;e.__SV||(window.posthog && window.posthog.__loaded)||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="Mi Ri init Vi Gi Rr Wi Ji Bi capture calculateEventProperties tn register register_once register_for_session unregister unregister_for_session an getFeatureFlag getFeatureFlagPayload getFeatureFlagResult isFeatureEnabled reloadFeatureFlags updateFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSurveysLoaded onSessionId getSurveys getActiveMatchingSurveys renderSurvey displaySurvey cancelPendingSurvey canRenderSurvey canRenderSurveyAsync un identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset setIdentity clearIdentity get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException addExceptionStep captureLog startExceptionAutocapture stopExceptionAutocapture loadToolbar get_property getSessionProperty nn Xi createPersonProfile setInternalOrTestUser sn Hi cn opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing get_explicit_consent_status is_capturing clear_opt_in_out_capturing Ki debug Lr rn getPageViewId captureTraceFeedback captureTraceMetric Di".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
    posthog.init('phc_qchginmvQCWDvkYjhpqySykUyprwhEwrozzbrKxibdCb', {
        api_host: 'https://us.i.posthog.com',
        defaults: '2026-01-30',
        person_profiles: 'identified_only', // or 'always' to create profiles for anonymous users as well
    })
</script>


6 recommendations to improve your setup
0 of 6 checks passed
!
$pageview
Docs
Complete the PostHog installation to start seeing events in your dashboard.
$pageleave
Docs
Without $pageleave events, bounce rate and session duration might be inaccurate.
Scroll depth
Docs
Enable scroll depth to see how far users read your content before leaving.
Authorized URLs
No authorized URLs configured. Some filters won't work correctly until you let us know what domains you are sending events from.
!
Reverse proxy
Docs
A reverse proxy routes PostHog requests through your own domain and helps prevent ad blockers from blocking tracking. Some metrics may not be accurate until this is configured.
$web_vitals
Docs
Enabled but no data yet. Core Web Vitals (LCP, INP, CLS) measure real user experience.
