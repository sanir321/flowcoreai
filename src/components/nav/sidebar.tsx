"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { 
  Inbox, 
  Settings, 
  Bot,
  LogOut,
  ChevronDown,
  BookOpen,
  BarChart2,
  Users,
  Puzzle,
  Bell,
  Zap,
  LayoutDashboard,
  Search,
  Command,
  PanelLeftClose,
  PanelLeftOpen,
  Wrench
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { NavItem } from "./nav-item"
import { motion, AnimatePresence } from "framer-motion"

interface SidebarWorkspace {
  name: string
}

interface SidebarUser {
  id: string
  app_metadata: {
    workspace_id?: string
  }
}

const springTransition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
  mass: 1
};

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [workspace, setWorkspace] = useState<SidebarWorkspace | null>(null)
  const [user, setUser] = useState<SidebarUser | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUser(user as unknown as SidebarUser)
      const workspaceId = user.app_metadata.workspace_id as string | undefined
      if (!workspaceId) return

      const { data } = await supabase
        .from("workspaces")
        .select("name")
        .eq("id", workspaceId)
        .single()
      
      setWorkspace(data)
    }
    fetchData()
  }, [])

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      // Force a hard redirect and window reload to clear all client state
      window.location.href = "/login"
    } catch (error) {
      console.error("Sign out failed:", error)
      router.push("/login")
    }
  }

  // Determine current module to show relevant links
  const moduleName = pathname.split('/')[1] || 'dashboard'
  
  return (
    <motion.div
      initial={false}
      animate={{ width: isCollapsed ? 64 : 240 }}
      transition={springTransition as any}
      className="hidden lg:flex border-r border-gray-100 bg-transparent flex-col h-full overflow-hidden font-sans shrink-0 relative z-50"
    >      {/* Workspace Header */}
      <div className="p-6">
        <div className="flex items-center gap-3 group cursor-pointer">
           <div className="h-8 w-8 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-900 shadow-sm group-hover:border-[#c65f39]/50 transition-all duration-500">
              <span className="font-black text-xs tracking-tighter">{workspace?.name?.charAt(0) || 'F'}</span>
           </div>
           <AnimatePresence>
             {!isCollapsed && (
               <motion.div 
                 initial={{ opacity: 0, x: -10 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -10 }}
                 className="flex-1 min-w-0"
               >
                  <h3 className="text-sm font-semibold text-gray-900 truncate tracking-tight">{workspace?.name || 'Flowcore'}</h3>
                  <p className="text-[9px] font-medium text-gray-500">Active Workspace</p>
                </motion.div>
             )}
           </AnimatePresence>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-10 py-2">
        {/* Context Navigation */}
        <div className="space-y-1">
           <div className="px-2 mb-4 flex items-center justify-between">
              {!isCollapsed && <span className="text-[10px] font-bold text-gray-400">Navigation</span>}
           </div>
           <NavItem icon={Inbox} label="Inbox" href="/inbox" isCollapsed={isCollapsed} />
           <NavItem icon={Bot} label="Agent Hub" href="/agent-hub" isCollapsed={isCollapsed} />
            <NavItem icon={Zap} label="CEO Analyst" href="/ceo" isCollapsed={isCollapsed} />
            <NavItem icon={Wrench} label="Agent Tools" href="/agent-hub/tools" isCollapsed={isCollapsed} />
           <NavItem icon={BarChart2} label="Insights" href="/insights" isCollapsed={isCollapsed} />
           <NavItem icon={Users} label="Contacts" href="/contacts" isCollapsed={isCollapsed} />
           <NavItem icon={BookOpen} label="Knowledge Base" href="/knowledge" isCollapsed={isCollapsed} />
        </div>

        {/* System Section */}
        <div className="space-y-4">
           {!isCollapsed && <div className="px-2 text-[10px] font-bold text-gray-400">System</div>}
           <div className="space-y-1">
              <NavItem icon={Settings} label="Workspace" href="/settings" isCollapsed={isCollapsed} />
              <NavItem icon={Puzzle} label="Integrations" href="/settings/integrations" isCollapsed={isCollapsed} />
              <NavItem icon={Bell} label="Notifications" href="/settings/notifications" isCollapsed={isCollapsed} />
           </div>
        </div>


      </div>

      {/* Footer / Sign Out */}
      <div className="p-6 border-t border-gray-100 mt-auto">
        <button 
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full p-2 rounded-xl text-gray-500 hover:text-rose-600 hover:bg-rose-50 transition-all group"
        >
           <LogOut className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
           {!isCollapsed && <span className="text-[13px] font-semibold tracking-tight">Sign out</span>}
        </button>
      </div>

      {/* Collapse Toggle Handle */}
      <div className="absolute top-1/2 -right-3 -translate-y-1/2 z-[70]">
         <button 
           onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-10 w-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-[#c65f39] hover:scale-110 transition-all shadow-md"
         >
            {isCollapsed ? <PanelLeftOpen className="h-3 w-3" /> : <PanelLeftClose className="h-3 w-3" />}
         </button>
      </div>
    </motion.div>
  )
}
