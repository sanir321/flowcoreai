import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.108.1"

Deno.serve(async (req) => {
  try {
    // Auth: Bearer token must match INTERNAL_CRON_SECRET
    const authHeader = req.headers.get('Authorization') || ''
    const internalSecret = Deno.env.get('INTERNAL_CRON_SECRET')
    if (!internalSecret) {
      return new Response(JSON.stringify({ error: 'Server misconfigured' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
    if (authHeader !== `Bearer ${internalSecret}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { workspace_id } = await req.json()

    const { data: tokens, error: tokenError } = await supabase
      .from('google_oauth_tokens')
      .select('*')
      .eq('workspace_id', workspace_id)
      .single()

    if (tokenError || !tokens) throw new Error('No Google integration found')
    if (!tokens.sheet_id) throw new Error('Google Sheet ID not configured in integration')

    const { data: contacts, error: leadError } = await supabase
      .from('contacts')
      .select('*')
      .eq('workspace_id', workspace_id)
      .not('email', 'is', null)
      .is('deleted_at', null)

    if (leadError) throw leadError

    const accessToken = tokens.access_token
    const sheetId = tokens.sheet_id
    const sheetRange = tokens.sheet_range ?? 'Sheet1!A:Z'

    const headersList = [
      'Name', 'Email', 'Phone', 'Channel', 'Tags', 'Last Contacted', 'Created At'
    ]

    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetRange}:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [
            headersList,
            ...contacts.map((c: Record<string, any>) => [
              c.name ?? '',
              c.email ?? '',
              c.phone ?? '',
              c.channel ?? '',
              Array.isArray(c.tags) ? c.tags.join(', ') : (c.tags ?? ''),
              c.last_contacted_at ?? '',
              c.created_at ?? '',
            ]),
          ],
        }),
      }
    )

    return new Response(
      JSON.stringify({ success: true, exported: contacts.length }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error(error)
    return new Response(
      JSON.stringify({ error: "Export failed" }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
