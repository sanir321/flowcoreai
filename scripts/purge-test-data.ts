import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

dotenv.config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function purgeTestData() {
  console.log("🚀 Starting test data purge...")

  // 1. Delete messages from test sessions
  const { error: msgError } = await supabase
    .from("messages")
    .delete()
    .eq("is_test", true)
  
  if (msgError) console.error("❌ Error deleting test messages:", msgError.message)
  else console.log("✅ Deleted test messages")

  // 2. Delete test conversation sessions
  const { error: sessionError } = await supabase
    .from("conversation_sessions")
    .delete()
    .eq("is_test", true)
    
  if (sessionError) console.error("❌ Error deleting test sessions:", sessionError.message)
  else console.log("✅ Deleted test sessions")

  // 3. Delete contacts with placeholder data
  const placeholders = ["test", "lorem", "example.com", "dummy"]
  for (const p of placeholders) {
    const { error: contactError } = await supabase
      .from("contacts")
      .delete()
      .or(`name.ilike.%${p}%,email.ilike.%${p}%`)
    
    if (contactError) console.error(`❌ Error deleting contacts with '${p}':`, contactError.message)
    else console.log(`✅ Deleted contacts containing '${p}'`)
  }

  // 4. Delete knowledge sources with placeholder data
  const { error: kbError } = await supabase
    .from("kb_sources")
    .delete()
    .or("label.ilike.%test%,label.ilike.%lorem%")
    
  if (kbError) console.error("❌ Error deleting test KB sources:", kbError.message)
  else console.log("✅ Deleted test KB sources")

  console.log("🏁 Purge complete.")
}

purgeTestData()
