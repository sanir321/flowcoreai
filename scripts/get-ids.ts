import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getIds() {
  const { data: workspaces } = await supabase.from("workspaces").select("id").limit(1);
  const { data: agents } = await supabase.from("workspace_agents").select("id, agent_type").limit(1);
  console.log(JSON.stringify({ 
    workspace_id: workspaces?.[0]?.id, 
    agent: agents?.[0]
  }));
}

getIds();
