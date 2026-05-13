import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export function useWorkspace() {
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function getWorkspace() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.app_metadata?.workspace_id) {
        setWorkspaceId(user.app_metadata.workspace_id)
      }
      setIsLoading(false)
    }
    getWorkspace()
  }, [])

  return { workspaceId, isLoading }
}
