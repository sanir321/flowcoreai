"use client"

import { usePathname, useRouter } from "next/navigation"
import { LayoutGrid, Zap, Plus, Bot, MessageSquare, Target, Terminal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { motion } from "framer-motion"

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

  return (
    <div className="hidden lg:flex w-80 border-r border-gray-100 flex-col bg-white shrink-0 h-full">
      <div className="p-8 space-y-6">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight">Assistants</h2>
          <p className="text-[10px] font-bold text-gray-500">Workspace Resources</p>
        </div>
      </div>

      <div className="px-4 flex-1 space-y-8 overflow-y-auto">
        <div className="space-y-2">
          <button 
            onClick={() => router.push('/agent-hub')}
            className={cn(
              "w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all duration-300 group text-left",
              pathname === '/agent-hub' 
                ? "bg-white text-gray-900 border border-gray-100 shadow-lg shadow-black/5 ring-1 ring-black/5" 
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
            )}
          >
            <LayoutGrid className={cn(
              "h-4 w-4 transition-colors",
              pathname === '/agent-hub' ? "text-black" : "text-gray-400 group-hover:text-black"
            )} />
            <span className="text-[13px] font-bold tracking-tight">All Assistants</span>
            {pathname === '/agent-hub' && (
              <motion.div 
                layoutId="active-dot-hub"
                className="ml-auto h-1.5 w-1.5 rounded-full bg-black shadow-[0_0_8px_rgba(0,0,0,0.2)]" 
              />
            )}
          </button>

          <button 
            onClick={() => router.push('/ceo')}
            className={cn(
              "w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all duration-300 group text-left",
              pathname === '/ceo'
                ? "bg-white text-gray-900 border border-gray-100 shadow-lg shadow-black/5 ring-1 ring-black/5"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
            )}
          >
            <Zap className={cn(
              "h-4 w-4 transition-colors",
              pathname === '/ceo' ? "text-[#c65f39]" : "text-gray-400 group-hover:text-[#c65f39]"
            )} />
            <span className="text-[13px] font-bold tracking-tight">CEO Analyst</span>
            {pathname === '/ceo' && (
              <motion.div 
                layoutId="active-dot-ceo"
                className="ml-auto h-1.5 w-1.5 rounded-full bg-[#c65f39] shadow-[0_0_8px_rgba(198,95,57,0.3)]" 
              />
            )}
          </button>

          <button 
            onClick={() => router.push('/agent-hub/test')}
            className={cn(
              "w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all duration-300 group text-left",
              pathname === '/agent-hub/test'
                ? "bg-white text-gray-900 border border-gray-100 shadow-lg shadow-black/5 ring-1 ring-black/5"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
            )}
          >
            <Terminal className={cn(
              "h-4 w-4 transition-colors",
              pathname === '/agent-hub/test' ? "text-[#c65f39]" : "text-gray-400 group-hover:text-[#c65f39]"
            )} />
            <span className="text-[13px] font-bold tracking-tight">Test Chat</span>
            {pathname === '/agent-hub/test' && (
              <motion.div 
                layoutId="active-dot-test"
                className="ml-auto h-1.5 w-1.5 rounded-full bg-[#c65f39] shadow-[0_0_8px_rgba(198,95,57,0.3)]" 
              />
            )}
          </button>

          {agents.length > 0 && (
            <div className="pt-6 space-y-4">
              <span className="px-5 text-[9px] font-bold text-gray-400">Active Workforce</span>
              <div className="space-y-1">
                {agents.map((agent) => {
                  const isActive = pathname === `/agent-hub/${agent.id}`
                  const Icon = getAgentIcon(agent.agent_type)
                  return (
                    <button 
                      key={agent.id}
                      onClick={() => router.push(`/agent-hub/${agent.id}`)}
                      className={cn(
                        "w-full flex items-center gap-3 px-5 py-3.5 rounded-xl transition-all group text-left",
                        isActive
                          ? "bg-white text-gray-900 border border-gray-100 shadow-sm"
                          : "text-gray-500 hover:text-gray-900 hover:bg-gray-50/50"
                      )}
                    >
                      <Icon className={cn(
                        "h-3.5 w-3.5 transition-colors",
                        isActive ? "text-emerald-500" : "text-gray-400 group-hover:text-emerald-500"
                      )} />
                      <span className="text-[13px] font-semibold tracking-tight capitalize">{agent.agent_type.replace(/_/g, ' ')}</span>
                      {isActive && <div className="ml-auto h-1 w-1 rounded-full bg-emerald-500" />}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {onAddAssistant && (
        <div className="p-8 border-t border-gray-100 pb-12">
          <Button 
            onClick={onAddAssistant}
            className="w-full bg-black text-white hover:bg-gray-800 rounded-xl h-12 text-xs font-semibold shadow-lg transition-all active:scale-95"
          >
            <Plus className="h-4 w-4 mr-2" /> Add Assistant
          </Button>
        </div>
      )}
    </div>
  )
}
