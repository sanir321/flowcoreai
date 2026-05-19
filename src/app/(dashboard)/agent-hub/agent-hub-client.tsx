"use client"

import { useState } from "react"
import { Plus, CheckCircle2, MessageSquare, X, Target, Zap, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AssistantsSidebar } from "@/components/nav/assistants-sidebar"
import { addAgent } from "@/app/actions/agents"

export interface Agent {
  id: string
  workspace_id: string
  agent_type: string
  status: 'active' | 'inactive'
  config: Record<string, any>
  created_at: string
}

interface AgentHubClientProps {
  initialAgents: Agent[]
  workspaceId: string
}

export function AgentHubClient({ initialAgents: agents, workspaceId }: AgentHubClientProps) {
  const [showTypeSelect, setShowTypeSelect] = useState(false)
  const [isCreating, setIsCreating] = useState<string | null>(null)
  
  const router = useRouter()

  const handleAddAgent = async (typeId: string, typeName: string) => {
    setIsCreating(typeId)
    const result = await addAgent({ workspace_id: workspaceId, agent_type: typeId as any })
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`${typeName} added`)
      // Refresh the page to get updated data from the server
      router.refresh()
      // Also update local state for immediate feedback if needed, 
      // but router.refresh() is cleaner for RSC architecture.
      // For now, let's just refresh.
    }
    setIsCreating(null)
    setShowTypeSelect(false)
  }

  return (
    <div className="h-full flex overflow-hidden bg-white font-sans">
      <AssistantsSidebar onAddAssistant={() => setShowTypeSelect(true)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden h-full border-l border-gray-50">
           <ScrollArea className="flex-1 bg-white h-full overflow-hidden">
              <div className="p-12">
                 <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
                      <>
                        {agents.map((agent, i) => (
                          <motion.div 
                            key={agent.id} 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            onClick={() => router.push(`/agent-hub/${agent.id}`)}
                            className="group cursor-pointer relative"
                          >
                             <div className="min-h-[420px] w-full max-w-[340px] rounded-[2.5rem] border border-white/5 bg-[#1A1818] shadow-2xl relative overflow-hidden flex flex-col items-center p-6 md:p-10 text-center transition-all duration-700 hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.4)] hover:-translate-y-3">
                               <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #fff 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                               <div className="h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-8 shadow-[0_0_40px_-5px_rgba(16,185,129,0.2)] group-hover:scale-110 transition-transform duration-700">
                                  <CheckCircle2 className="h-8 w-8" />
                               </div>
                               <div className="space-y-3">
                                  <h3 className="text-2xl font-bold text-white tracking-tight">{agent.agent_type.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</h3>
                                  <p className="text-white/60 font-medium text-[13px] leading-relaxed max-w-[200px] mx-auto">Assistant is active and handling interactions.</p>
                               </div>
                               <div className="mt-auto pt-8 border-t border-white/5 w-full flex flex-col items-start text-left gap-2">
                                  <span className="text-[10px] font-semibold text-[#c65f39]">Connection Status</span>
                                  <div className="flex items-center gap-3">
                                     <div className={cn("h-2 w-2 rounded-full shadow-[0_0_8px]", agent.status === 'active' ? "bg-emerald-500 shadow-emerald-500/50" : "bg-gray-500 shadow-gray-500/50")} />
                                     <span className="text-[12px] font-semibold text-white/70 tracking-tight">{agent.status === 'active' ? 'Active' : 'Inactive'}</span>
                                   </div>
                                </div>
                             </div>
                          </motion.div>
                        ))}

                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: agents.length * 0.1 }}
                            onClick={() => setShowTypeSelect(true)}
                            className="h-[420px] w-full max-w-[340px] rounded-[2.5rem] border-2 border-dashed border-gray-100 bg-white hover:bg-gray-50/30 hover:border-black/20 transition-all flex flex-col items-center justify-center cursor-pointer group shadow-sm hover:shadow-xl"
                        >
                           <div className="h-14 w-14 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-300 group-hover:text-black group-hover:border-black/10 shadow-sm mb-6 transition-all duration-700 group-hover:scale-110">
                              <Plus className="h-6 w-6" />
                           </div>
                           <span className="text-[10px] font-semibold text-gray-500 group-hover:text-black transition-colors">Add Assistant</span>
                        </motion.div>
                      </>
                 </div>
              </div>
           </ScrollArea>
      </div>

      <AnimatePresence>
        {showTypeSelect && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
              <motion.div 
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="bg-white border border-gray-100 rounded-[2rem] shadow-[0_30px_70px_-20px_rgba(0,0,0,0.3)] max-w-md w-full overflow-hidden"
              >
                   <div className="p-8 space-y-8 text-gray-900">
                       <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">Select Template</h2>
                                  <p className="text-[10px] font-semibold text-gray-500">Assistant Templates</p>
                              </div>
                              <button onClick={() => setShowTypeSelect(false)} className="h-8 w-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-all group active:scale-90">
                                  <X className="h-4 w-4 text-gray-300 group-hover:text-black" />
                              </button>
                          </div>

                          <div className="grid grid-cols-1 gap-3">
                              {[
                                  { id: 'customer_support', name: 'Customer Support', desc: 'Automated inquiry handling', icon: MessageSquare },
                                  { id: 'appointment_booking', name: 'Appointment Booker', desc: 'Schedule management & sync', icon: Target },
                                  { id: 'sales', name: 'Sales Assistant', desc: 'Lead qualification & meeting', icon: Zap }
                              ].map(type => {
                                  const isInstalled = agents.some(a => a.agent_type === type.id);
                                  return (
                                  <button 
                                      key={type.id}
                                      onClick={() => !isInstalled && !isCreating && handleAddAgent(type.id, type.name)}
                                       disabled={isInstalled || isCreating === type.id}
                                       className={cn(
                                           "flex items-center gap-5 p-5 border rounded-2xl text-left relative",
                                           isInstalled || isCreating === type.id ? "bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed" : "border-gray-100 hover:bg-gray-50/50 hover:border-black/10 transition-all group"
                                       )}
                                  >
                                      <div className={cn(
                                          "h-10 w-10 rounded-xl flex items-center justify-center shadow-sm",
                                          isInstalled ? "bg-gray-200 text-gray-400" : "bg-white border border-gray-100 text-gray-400 group-hover:bg-black group-hover:text-white transition-all duration-500"
                                      )}>
                                          <type.icon className="h-5 w-5" />
                                      </div>
                                      <div className="flex-1">
                                          <span className="text-sm font-semibold text-gray-900 tracking-tight block">{type.name}</span>
                                          <span className="text-[10px] font-semibold text-gray-500 mt-1 block">{type.desc}</span>
                                      </div>
                                       {isInstalled ? (
                                           <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                                               <CheckCircle2 className="h-3 w-3" /> Active
                                           </div>
                                       ) : isCreating === type.id ? (
                                           <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[9px] font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                                               <Loader2 className="h-3 w-3 animate-spin" /> Deploying
                                           </div>
                                       ) : null}
                                  </button>
                                  )
                              })}
                          </div>
                        </div>
                </motion.div>
           </div>
        )}
      </AnimatePresence>
    </div>
  )
}
