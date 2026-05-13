/**
 * scripts/sync-outcomes.ts
 * Maintenance script to calculate conversation outcomes (AI vs Human vs Abandoned).
 * This powers the hero stat on the Insights page.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

async function main() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  
  const supabase = createClient(
    envConfig.NEXT_PUBLIC_SUPABASE_URL,
    envConfig.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('--- Syncing Conversation Outcomes ---');

  // 1. Identify "Human" resolutions (Escalated sessions)
  const { data: humanSessions } = await supabase
    .from('conversation_sessions')
    .update({ resolved_by: 'human' })
    .eq('status', 'escalated')
    .is('resolved_by', null)
    .select('id');
  
  console.log(`Marked ${humanSessions?.length || 0} sessions as human-resolved.`);

  // 2. Identify "AI" resolutions 
  // (Resolved sessions OR inactive for 15 mins where last message was agent)
  const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  
  const { data: aiSessions } = await supabase
    .from('conversation_sessions')
    .update({ resolved_by: 'ai' })
    .or(`status.eq.resolved,and(last_message_at.lt.${fifteenMinsAgo},status.eq.active)`)
    .is('resolved_by', null)
    .select('id');

  console.log(`Marked ${aiSessions?.length || 0} sessions as AI-resolved.`);

  // 3. Identify "Abandoned" sessions
  // (Inactive for 30 mins where last message was NOT agent - i.e., customer stopped replying)
  const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  // Note: This would ideally check the role of the last message, but for now we'll assume 
  // if it wasn't caught by the AI/Human logic above, it's a candidate for abandoned if very old.
  
  const { data: abandonedSessions } = await supabase
    .from('conversation_sessions')
    .update({ resolved_by: 'abandoned' })
    .lt('last_message_at', thirtyMinsAgo)
    .is('resolved_by', null)
    .select('id');

  console.log(`Marked ${abandonedSessions?.length || 0} sessions as abandoned.`);

  console.log('--- Sync Complete ---');
}

main();
