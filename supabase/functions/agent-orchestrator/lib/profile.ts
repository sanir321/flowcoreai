import { PipelineContext } from "./types.ts";

export function buildBusinessProfile(ctx: PipelineContext): string {
  const workspace = ctx.workspace || {};
  const profile = (workspace as any).business_profile || {};
  const parts: string[] = [];

  if (profile.description) parts.push(`About: ${profile.description}`);
  if (profile.contact?.phone) parts.push(`Phone: ${profile.contact.phone}`);
  if (profile.contact?.email) parts.push(`Email: ${profile.contact.email}`);
  if (profile.contact?.address) parts.push(`Address: ${profile.contact.address}`);
  if (profile.contact?.google_maps_link) parts.push(`Maps: ${profile.contact.google_maps_link}`);

  if (profile.social) {
    const entries = Object.entries(profile.social)
      .filter(([, url]) => url)
      .map(([platform, url]) => `${platform.charAt(0).toUpperCase() + platform.slice(1)} (${url})`);
    if (entries.length) parts.push(`Social: ${entries.join(', ')}`);
  }

  if (workspace.services_offered) parts.push(`Services: ${workspace.services_offered}`);

  if (profile.hours?.daily) {
    const openDays = Object.entries(profile.hours.daily)
      .filter(([, d]: [string, any]) => !d.closed)
      .map(([day, d]: [string, any]) => `${day.charAt(0).toUpperCase() + day.slice(1)}: ${d.open}-${d.close}`);
    const closedDays = Object.entries(profile.hours.daily)
      .filter(([, d]: [string, any]) => d.closed)
      .map(([day]: [string, any]) => day.charAt(0).toUpperCase() + day.slice(1));
    if (openDays.length) parts.push(`Business Hours: ${openDays.join(', ')}`);
    if (closedDays.length) parts.push(`Closed on: ${closedDays.join(', ')}`);
  }

  if (profile.amenities?.length) parts.push(`Amenities: ${profile.amenities.join(', ')}`);
  if (profile.pricing?.description) parts.push(`Pricing: ${profile.pricing.description}`);

  if (profile.policies) {
    const entries = Object.entries(profile.policies).filter(([, v]) => v);
    if (entries.length) parts.push(`Policies: ${entries.map(([k, v]) => `${k}: ${v}`).join(' | ')}`);
  }

  if (profile.extras?.specials?.length) parts.push(`Specials: ${profile.extras.specials.join(', ')}`);
  if (profile.extras?.project_types?.length) parts.push(`Project Types: ${profile.extras.project_types.join(', ')}`);

  return parts.length > 0
    ? parts.join('\n')
    : 'No profile data yet. Call get_business_info for details.';
}

export function buildSentimentLine(working: any): string {
  if (!working?.sentiment) return '';
  const suffix = working.sentiment === 'frustrated'
    ? ' — escalate if they remain frustrated.'
    : '';
  return `\nCustomer sentiment: ${working.sentiment}${suffix}`;
}
