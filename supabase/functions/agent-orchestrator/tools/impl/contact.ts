import { PipelineContext } from "../../lib/types.ts";

export async function getHistory(params: Record<string, unknown>, ctx: PipelineContext) {
  const { data: session } = await ctx.supabase.from("conversation_sessions").select("contact_id").eq("id", ctx.session.id).single();
  let contactId = session?.contact_id;
  if (!contactId) {
    const jid = ctx.payload.customer_jid || ctx.session.customer_jid;
    const { data: found } = await ctx.supabase.from("contacts").select("id").eq("workspace_id", ctx.payload.workspace_id).or(`whatsapp_jid.eq.${jid},session_token.eq.${jid}`).maybeSingle();
    if (found) contactId = found.id;
  }
  if (!contactId) return { success: false, error: "Contact not found" };
  const { data: contact } = await ctx.supabase.from("contacts").select("*").eq("id", contactId).single();
  const { data: byContact } = await ctx.supabase.from("appointments").select("*")
    .eq("contact_id", contactId)
    .order("created_at", { ascending: false });
  const { data: bySession } = await ctx.supabase.from("appointments").select("*")
    .eq("session_id", ctx.session.id)
    .order("created_at", { ascending: false });
  const merged = [...(byContact || []), ...(bySession || [])];
  const seen = new Set<string>();
  const appointments = merged.filter(a => { const k = a.id; return seen.has(k) ? false : (seen.add(k), true); });
  return { success: true, data: { ...contact, appointments: appointments || [] } };
}

export async function update(
  params: { name?: string; email?: string; phone?: string; notes?: string },
  ctx: PipelineContext
) {
  const { data: session } = await ctx.supabase.from("conversation_sessions").select("contact_id").eq("id", ctx.session.id).single();
  if (!session?.contact_id) {
    const jid = ctx.payload.customer_jid || ctx.session.customer_jid;
    const { data: found } = await ctx.supabase.from("contacts").select("id").eq("workspace_id", ctx.payload.workspace_id).or(`whatsapp_jid.eq.${jid},session_token.eq.${jid}`).maybeSingle();
    if (!found) return { success: false, error: "Contact not found" };
    const { data: updated } = await ctx.supabase.from("contacts").update({
      name: params.name, email: params.email, phone: params.phone,
      notes: params.notes ? `[Update] ${params.notes}` : undefined,
      updated_at: new Date().toISOString()
    }).eq("id", found.id).select().single();
    return { success: true, data: updated };
  }
  const { data: updated } = await ctx.supabase.from("contacts").update({
    name: params.name, email: params.email, phone: params.phone,
    notes: params.notes ? `[Update] ${params.notes}` : undefined,
    updated_at: new Date().toISOString()
  }).eq("id", session.contact_id).select().single();
  return { success: true, data: updated };
}
