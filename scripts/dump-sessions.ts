import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  const { data, error } = await supabase
    .from("gowa_sessions")
    .select("*")
  
  if (error) {
    console.error("Error fetching gowa_sessions:", error)
    return
  }

  console.log("GOWA Sessions:")
  console.table(data)
}

main()
