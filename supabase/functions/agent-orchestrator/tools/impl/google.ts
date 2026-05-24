export async function getGoogleConfig(supabase: any, workspace_id: string) {
  const { data: config } = await supabase.from("google_oauth_tokens")
    .select("*").eq("workspace_id", workspace_id).is("deleted_at", null)
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!config) throw new Error("Google integration not found");

  const now = new Date();
  const expiry = new Date(config.token_expiry);
  if (expiry.getTime() - now.getTime() < 5 * 60 * 1000) {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: Deno.env.get("GOOGLE_CLIENT_ID")!,
        client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET")!,
        refresh_token: config.refresh_token,
        grant_type: "refresh_token"
      })
    });
    const newTokens = await response.json();
    if (!response.ok) {
      if (newTokens?.error === "invalid_grant") {
        await supabase.from("google_oauth_tokens").update({ deleted_at: new Date().toISOString() }).eq("workspace_id", workspace_id);
      }
      throw new Error("Failed to refresh Google token");
    }
    const newExpiry = new Date(Date.now() + newTokens.expires_in * 1000).toISOString();
    await supabase.from("google_oauth_tokens").update({ access_token: newTokens.access_token, token_expiry: newExpiry }).eq("workspace_id", workspace_id);
    return { ...config, access_token: newTokens.access_token };
  }
  return config;
}
