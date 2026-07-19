import { useState, useEffect, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"

export function useWorkspace() {
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    async function getWorkspace() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.id) {
        setIsLoading(false)
        return
      }

      // Always query DB for canonical workspace ID (JWT app_metadata can be stale)
      const { data: ws } = await supabase
        .from("workspaces")
        .select("id")
        .eq("owner_id", user.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle()
      
      if (ws) setWorkspaceId(ws.id)
      setIsLoading(false)
    }
    getWorkspace()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          getWorkspace()
        } else if (event === 'SIGNED_OUT') {
          setWorkspaceId(null)
          setIsLoading(false)
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [supabase])

  return { workspaceId, isLoading }
}
