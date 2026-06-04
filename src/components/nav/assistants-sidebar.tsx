"use client"

import { usePathname, useRouter } from "next/navigation"
import { LayoutGrid, Zap, Plus, Bot, MessageSquare, Target, Terminal, PanelLeftClose, PanelLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { motion, AnimatePresence } from "framer-motion"

interface Agent {
  id: string
  agent_type: string
}

interface AssistantsSidebarProps {
  onAddAssistant?: () => void
}

export function AssistantsSidebar({ onAddAssistant }: AssistantsSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [agents, setAgents] = useState<Agent[]>([])
  const supabase = createClient()

  const fetchAgents = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const workspaceId = user.app_metadata.workspace_id

    const { data } = await supabase
      .from("workspace_agents")
      .select("id, agent_type")
      .eq("workspace_id", workspaceId)
      .is("deleted_at", null)
    
    setAgents((data as Agent[]) || [])
  }, [supabase])

  useEffect(() => {
    fetchAgents()
  }, [fetchAgents])

  const getAgentIcon = (type: string) => {
    const t = type.toLowerCase()
    if (t.includes('support')) return MessageSquare
    if (t.includes('booking')) return Target
    if (t.includes('sales')) return Zap
    return Bot
  }

  const [collapsed, setCollapsed] = useState(false)

  return (
    <motion.div
      animate={{ width: collapsed ? 64 : 272 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="hidden lg:flex border-r border-gray-100 flex-col bg-white shrink-0 h-full overflow-hidden"
    >
      {/* Header */}
      <div className={cn("flex items-center shrink-0", collapsed ? "justify-center px-2 py-5" : "px-6 py-5")}>
        <AnimatePresence mode="wait">
          {!collapsed ? (
            <motion.div
              key="expanded-header"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 space-y-1"
            >
              <h2 className="text-lg font-semibold text-gray-900 tracking-tight">Assistants</h2>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Workspace</p>
            </motion.div>
          ) : (
            <motion.div
              key="collapsed-header"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Bot size={18} className="text-gray-700" />
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all shrink-0",
            collapsed ? "h-8 w-8" : "h-7 w-7 -mr-1"
          )}
        >
          {collapsed ? <PanelLeft size={14} /> : <PanelLeftClose size={14} />}
        </button>
      </div>

      {/* Nav */}
      <div className={cn("flex-1 overflow-y-auto", collapsed ? "px-2 space-y-1" : "px-3 space-y-1")}>
        <button 
          onClick={() => router.push('/agent-hub')}
          className={cn(
            "w-full flex items-center rounded-xl transition-all duration-300 group text-left",
            collapsed ? "justify-center h-10 gap-0" : "gap-3 px-4 py-3",
            pathname === '/agent-hub' 
              ? "bg-gray-100 text-gray-900" 
              : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
          )}
          title="All Assistants"
        >
          <LayoutGrid className={cn(
            "h-4 w-4 shrink-0 transition-colors",
            pathname === '/agent-hub' ? "text-gray-900" : "text-gray-400 group-hover:text-gray-900"
          )} />
          {!collapsed && (
            <>
              <span className="text-[13px] font-semibold tracking-tight">All Assistants</span>
              {pathname === '/agent-hub' && (
                <motion.div 
                  layoutId="active-dot-hub"
                  className="ml-auto h-1.5 w-1.5 rounded-full bg-gray-900" 
                />
              )}
            </>
          )}
        </button>

        <button 
          onClick={() => router.push('/ceo')}
          className={cn(
            "w-full flex items-center rounded-xl transition-all duration-300 group text-left",
            collapsed ? "justify-center h-10 gap-0" : "gap-3 px-4 py-3",
            pathname === '/ceo'
              ? "bg-amber-50 text-amber-900" 
              : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
          )}
          title="CEO Analyst"
        >
          <Zap className={cn(
            "h-4 w-4 shrink-0 transition-colors",
            pathname === '/ceo' ? "text-amber-600" : "text-gray-400 group-hover:text-amber-600"
          )} />
          {!collapsed && (
            <>
              <span className="text-[13px] font-semibold tracking-tight">CEO Analyst</span>
              {pathname === '/ceo' && (
                <motion.div 
                  layoutId="active-dot-ceo"
                  className="ml-auto h-1.5 w-1.5 rounded-full bg-amber-500" 
                />
              )}
            </>
          )}
        </button>

        <button 
          onClick={() => router.push('/agent-hub/test')}
          className={cn(
            "w-full flex items-center rounded-xl transition-all duration-300 group text-left",
            collapsed ? "justify-center h-10 gap-0" : "gap-3 px-4 py-3",
            pathname === '/agent-hub/test'
              ? "bg-gray-100 text-gray-900"
              : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
          )}
          title="Test Chat"
        >
          <Terminal className={cn(
            "h-4 w-4 shrink-0 transition-colors",
            pathname === '/agent-hub/test' ? "text-gray-900" : "text-gray-400 group-hover:text-gray-900"
          )} />
          {!collapsed && (
            <>
              <span className="text-[13px] font-semibold tracking-tight">Test Chat</span>
              {pathname === '/agent-hub/test' && (
                <motion.div 
                  layoutId="active-dot-test"
                  className="ml-auto h-1.5 w-1.5 rounded-full bg-gray-900" 
                />
              )}
            </>
          )}
        </button>

        {agents.length > 0 && !collapsed && (
          <div className="pt-4 space-y-3">
            <span className="px-4 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Workforce</span>
            <div className="space-y-0.5">
              {agents.map((agent) => {
                const isActive = pathname === `/agent-hub/${agent.id}`
                const Icon = getAgentIcon(agent.agent_type)
                return (
                  <button 
                    key={agent.id}
                    onClick={() => router.push(`/agent-hub/${agent.id}`)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all group text-left",
                      isActive
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                    )}
                    title={agent.agent_type.replace(/_/g, ' ')}
                  >
                    <Icon className={cn(
                      "h-3.5 w-3.5 shrink-0 transition-colors",
                      isActive ? "text-emerald-600" : "text-gray-400 group-hover:text-emerald-600"
                    )} />
                    <span className="text-[13px] font-semibold tracking-tight capitalize">{agent.agent_type.replace(/_/g, ' ')}</span>
                    {isActive && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {collapsed && agents.length > 0 && (
          <div className="pt-3 space-y-0.5 border-t border-gray-100">
            {agents.map((agent) => {
              const isActive = pathname === `/agent-hub/${agent.id}`
              const Icon = getAgentIcon(agent.agent_type)
              return (
                <button 
                  key={agent.id}
                  onClick={() => router.push(`/agent-hub/${agent.id}`)}
                  className={cn(
                    "w-full h-10 flex items-center justify-center rounded-xl transition-all group",
                    isActive
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-400 hover:text-gray-900 hover:bg-gray-50"
                  )}
                  title={agent.agent_type.replace(/_/g, ' ')}
                >
                  <Icon className={cn(
                    "h-4 w-4 shrink-0",
                    isActive ? "text-emerald-600" : ""
                  )} />
                </button>
              )
            })}
          </div>
        )}
      </div>

      {collapsed && (
        <div className="px-2 py-3 border-t border-gray-100">
          {onAddAssistant && (
            <button
              onClick={onAddAssistant}
              className="w-full h-10 flex items-center justify-center rounded-xl bg-gray-900 text-white hover:bg-gray-800 transition-all"
              title="Add Assistant"
            >
              <Plus size={16} />
            </button>
          )}
        </div>
      )}
      
      {!collapsed && onAddAssistant && (
        <div className="px-4 py-4 border-t border-gray-100">
          <Button 
            onClick={onAddAssistant}
            className="w-full bg-gray-900 text-white hover:bg-gray-800 rounded-xl h-10 text-xs font-semibold transition-all active:scale-95"
          >
            <Plus className="h-4 w-4 mr-2" /> Add Assistant
          </Button>
        </div>
      )}
    </motion.div>
  )
}
