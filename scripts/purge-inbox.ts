import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function purgeData() {
  console.log("🔥 Purging all messages, sessions, and contacts...");

  try {
    // 1. Delete messages
    const { error: err1 } = await supabase.from("messages").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (err1) console.error("Error deleting messages:", err1);
    else console.log("✅ Messages purged.");

    // 2. Delete sessions
    const { error: err2 } = await supabase.from("conversation_sessions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (err2) console.error("Error deleting sessions:", err2);
    else console.log("✅ Sessions purged.");

    // 3. Delete contacts
    const { error: err3 } = await supabase.from("contacts").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (err3) console.error("Error deleting contacts:", err3);
    else console.log("✅ Contacts purged.");

    console.log("✨ Purge complete.");
  } catch (error) {
    console.error("Unexpected error during purge:", error);
  }
}

purgeData();
