import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.108.1"

Deno.serve(async (req) => {
  try {
    // Auth: Bearer must be a server-side secret (INTERNAL_CRON_SECRET or
    // service_role / SERVICE_KEY) — never a user JWT or anon key.
    const authHeader = req.headers.get('Authorization') || ''
    const token = authHeader.replace('Bearer ', '')
    const internalSecret = Deno.env.get('INTERNAL_CRON_SECRET')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const serviceKey = Deno.env.get('SERVICE_KEY') || ''
    const validTokens = new Set([internalSecret, serviceRoleKey, serviceKey].filter(Boolean))
    if (!token || !validTokens.has(token)) {
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

    // L3: the range may contain a sheet name with spaces/special chars — encode
    // it for the path segment (but keep the `!` and `:` structural characters).
    const rangeForPath = sheetRange.replace('!', '%21')

    const headersList = [
      'Name', 'Email', 'Phone', 'Channel', 'Tags', 'Last Contacted', 'Created At'
    ]

    const appendUrl = new URL(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${rangeForPath}:append`)
    appendUrl.searchParams.set('valueInputOption', 'USER_ENTERED')

    const resp = await fetch(appendUrl.toString(), {
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
    })

    // L3: check the Sheets response instead of assuming success.
    if (!resp.ok) {
      const errText = await resp.text()
      throw new Error(`Sheets API error ${resp.status}: ${errText.slice(0, 300)}`)
    }

    return new Response(
      JSON.stringify({ success: true, exported: contacts.length }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error("[crm-export] Export failed")
    return new Response(
      JSON.stringify({ error: "Export failed" }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
