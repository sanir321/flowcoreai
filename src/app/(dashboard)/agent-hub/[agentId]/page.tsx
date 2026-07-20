"use client"

import { useParams, useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { UpdateAgentConfigSchema } from "@/lib/schemas"
import { updateAgentConfig, deleteAgent } from "@/app/actions/agents"
import { addUrlSource, deleteSource } from "@/app/actions/knowledge"
import { createSkill, updateSkill, deleteSkill, assignSkill, unassignSkill } from "@/app/actions/skills"
import { Card } from "@/components/ui/card"
import { 
  ArrowLeft, 
  Loader2, 
  Globe, 
  Trash2, 
  Shield,
  Database,
  CheckCircle2,
  Wand2,
  Plus,
  Pencil,
  Brain,
  Lightbulb
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { PageTransition } from "@/components/ui/page-transition"
import { motion, AnimatePresence } from "framer-motion"
import { useCallback, useState, useEffect } from "react"
import { z } from "zod"
import { AssistantsSidebar } from "@/components/nav/assistants-sidebar"
/* eslint-disable @typescript-eslint/no-explicit-any */

const TRAIT_OPTIONS = {
  tone: ['professional', 'friendly', 'enthusiastic'],
  formality: ['formal', 'casual'],
  brevity: ['concise', 'standard', 'detailed'],
  proactivity: ['passive', 'standard', 'assertive'],
}

interface Skill {
  id: string
  name: string
  description: string | null
  condition: string | null
  instructions: string
  is_active: boolean
}

interface Agent {
  id: string
  workspace_id: string
  agent_type: string
  status: 'active' | 'inactive'
  config: Record<string, any>
}

interface Source {
  id: string
  label: string
  source_type: string
  status: string
  created_at: string
}

export default function AgentConfigurePage() {
  const { agentId } = useParams()
  const router = useRouter()
  const [agent, setAgent] = useState<Agent | null>(null)
  const [sources, setSources] = useState<Source[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [newUrl, setNewUrl] = useState("")
  const [skills, setSkills] = useState<Skill[]>([])
  const [assignedSkillIds, setAssignedSkillIds] = useState<Set<string>>(new Set())
  const [showSkillDialog, setShowSkillDialog] = useState(false)
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null)
  const [skillForm, setSkillForm] = useState({ name: "", description: "", condition: "", instructions: "" })
  const [isSavingSkill, setIsSavingSkill] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    const result = await deleteAgent({ agent_id: agentId as string })
    if (result.error) {
      toast.error(result.error)
      setIsDeleting(false)
    } else {
      toast.success("Agent removed")
      router.push("/agent-hub")
    }
  }
  
  const supabase = createClient()

  const form = useForm<z.infer<typeof UpdateAgentConfigSchema>>({
    resolver: zodResolver(UpdateAgentConfigSchema),
    defaultValues: {
      agent_id: agentId as string,
      config: {}
    }
  })

  const fetchData = useCallback(async () => {
    const { data: agentData } = await supabase
      .from("workspace_agents")
      .select("*")
      .eq("id", agentId as string)
      .single()

    if (agentData) {
      const data = agentData as unknown as Agent
      setAgent(data)
      form.reset({
        agent_id: agentId as string,
        config: data.config || {}
      })

      const { data: sourcesData } = await supabase
        .from("kb_sources")
        .select("*")
        .eq("workspace_id", data.workspace_id)
        .order("created_at", { ascending: false })
      
      setSources((sourcesData as unknown as Source[]) || [])

      const { data: skillsData } = await (supabase as any)
        .from("agent_skills")
        .select("*")
        .eq("workspace_id", data.workspace_id)
        .order("created_at", { ascending: true })
      setSkills((skillsData as unknown as Skill[]) || [])

      const { data: assignmentData } = await (supabase as any)
        .from("agent_skill_assignments")
        .select("skill_id")
        .eq("agent_id", agentId as string)
      if (assignmentData) {
        setAssignedSkillIds(new Set(assignmentData.map((a: any) => a.skill_id)))
      }
    }
    setIsLoading(false)
  }, [agentId, supabase, form])

  useEffect(() => {
    const init = async () => {
      await fetchData()
    }
    init()
  }, [fetchData])

  const onSubmit = async (values: z.infer<typeof UpdateAgentConfigSchema>) => {
    setIsSaving(true)
    const result = await updateAgentConfig(values)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Configuration synchronized")
      await fetchData()
    }
    setIsSaving(false)
  }

  const handleAddUrl = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUrl.trim() || !agent) return
    
    const result = await addUrlSource({
      workspace_id: agent.workspace_id,
      url: newUrl,
      label: new URL(newUrl).hostname,
      source_type: 'url'
    })

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("URL added to knowledge base")
      setNewUrl("")
      fetchData()
    }
  }

  const handleDeleteSource = async (id: string) => {
    const result = await deleteSource(id)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Source removed")
      fetchData()
    }
  }

  const handleAssign = async (skillId: string) => {
    const result = await assignSkill({ agent_id: agentId as string, skill_id: skillId })
    if (result.error) { toast.error(result.error); return }
    toast.success("Skill assigned")
    fetchData()
  }

  const handleUnassign = async (skillId: string) => {
    const result = await unassignSkill({ agent_id: agentId as string, skill_id: skillId })
    if (result.error) { toast.error(result.error); return }
    toast.success("Skill unassigned")
    fetchData()
  }

  const handleEditSkill = (skill: Skill) => {
    setEditingSkill(skill)
    setSkillForm({
      name: skill.name,
      description: skill.description || "",
      condition: skill.condition || "",
      instructions: skill.instructions
    })
    setShowSkillDialog(true)
  }

  const handleDeleteSkill = async (skillId: string) => {
    const result = await deleteSkill({ skill_id: skillId })
    if (result.error) { toast.error(result.error); return }
    toast.success("Skill deleted")
    fetchData()
  }

  const handleSaveSkill = async () => {
    if (!skillForm.name.trim() || !skillForm.instructions.trim()) {
      toast.error("Name and instructions are required")
      return
    }
    setIsSavingSkill(true)
    if (editingSkill) {
      const result = await updateSkill({
        skill_id: editingSkill.id,
        name: skillForm.name,
        description: skillForm.description || null,
        condition: skillForm.condition || null,
        instructions: skillForm.instructions,
      })
      if (result.error) { toast.error(result.error); setIsSavingSkill(false); return }
      toast.success("Skill updated")
    } else {
      if (!agent) { setIsSavingSkill(false); return }
      const result = await createSkill({
        workspace_id: agent.workspace_id,
        name: skillForm.name,
        description: skillForm.description || null,
        condition: skillForm.condition || null,
        instructions: skillForm.instructions,
      })
      if (result.error) { toast.error(result.error); setIsSavingSkill(false); return }
      toast.success("Skill created")
    }
    setIsSavingSkill(false)
    setShowSkillDialog(false)
    fetchData()
  }

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-[500px] space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      <p className="text-sm text-gray-500 font-medium">Synchronizing workforce data...</p>
    </div>
  )

  return (
    <div className="flex h-screen bg-white font-sans">
      <AssistantsSidebar />

      <div className="flex-1 flex flex-col border-l border-gray-50 min-h-0">
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1 min-h-0">
            <PageTransition>
              <div className="space-y-10 p-12 pb-32">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-100 pb-8">
                  <div className="flex items-center gap-6">
                    <button 
                      onClick={() => router.back()} 
                      className="h-10 w-10 rounded-xl border border-gray-100 bg-white hover:bg-gray-50 transition-all flex items-center justify-center shadow-sm"
                    >
                      <ArrowLeft className="h-4 w-4 text-gray-600" />
                    </button>
                    <div>
                      <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-gray-900 capitalize tracking-tight">
                            {agent?.agent_type.replace(/_/g, ' ')}
                        </h1>
                        <Badge variant="outline" className="text-[10px] font-semibold h-5 px-1.5 border-gray-100 text-gray-500">
                            ID: {agent?.id.split('-')[0]}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                         <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                         <span className="text-[10px] font-semibold text-gray-500 capitalize">{agent?.status}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                     <Button 
                       variant="outline"
                       onClick={() => setShowDeleteConfirm(true)}
                       className="border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 rounded-xl px-6 py-2 text-[11px] font-semibold transition-all active:scale-95"
                     >
                       <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                       Delete
                     </Button>
                     <Button 
                       type="submit"
                       disabled={isSaving}
                       className="bg-black text-white hover:bg-gray-800 rounded-xl px-8 py-2 text-[11px] font-semibold transition-all active:scale-95 shadow-lg"
                     >
                       {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                       Save Changes
                     </Button>
                  </div>
                </div>

              <Tabs defaultValue="skills" className="w-full">
                <TabsList className="bg-gray-100/50 p-1 rounded-xl mb-8 inline-flex border border-gray-200/60 shadow-sm">
                  <TabsTrigger value="skills" className="px-8 py-2 rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm text-gray-500 transition-all">
                    Skills Canvas
                  </TabsTrigger>
                  <TabsTrigger value="configure" className="px-8 py-2 rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm text-gray-500 transition-all">
                    Persona
                  </TabsTrigger>
                  <TabsTrigger value="knowledge" className="px-8 py-2 rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm text-gray-500 transition-all">
                    Knowledge
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="skills" className="mt-0">
                   <div className="space-y-8">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h2 className="text-lg font-semibold text-gray-900 tracking-tight">Assigned Skills</h2>
                          <p className="text-xs text-gray-500 font-medium">Skills injected into this agent's system prompt at runtime.</p>
                        </div>
                        <Button
                          onClick={() => {
                            setEditingSkill(null)
                            setSkillForm({ name: "", description: "", condition: "", instructions: "" })
                            setShowSkillDialog(true)
                          }}
                          className="bg-black text-white hover:bg-gray-800 rounded-xl px-5 py-2 text-[11px] font-semibold transition-all active:scale-95 shadow-lg"
                        >
                          <Plus className="h-3.5 w-3.5 mr-1.5" />
                          New Skill
                        </Button>
                      </div>

                      {skills.filter(s => assignedSkillIds.has(s.id)).length === 0 ? (
                        <div className="py-16 flex flex-col items-center justify-center text-center space-y-4 border-2 border-dashed border-gray-100 rounded-2xl">
                          <div className="h-16 w-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-200">
                            <Brain className="h-6 w-6" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-gray-900">No Skills Assigned</p>
                            <p className="text-[10px] text-gray-400 font-medium max-w-[260px] mx-auto">Assign skills from the available list below to extend this agent's capabilities.</p>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {skills.filter(s => assignedSkillIds.has(s.id)).map(skill => (
                            <SkillCard
                              key={skill.id}
                              skill={skill}
                              isAssigned={true}
                              onToggle={() => handleUnassign(skill.id)}
                              onEdit={() => handleEditSkill(skill)}
                              onDelete={() => handleDeleteSkill(skill.id)}
                            />
                          ))}
                        </div>
                      )}

                      <div className="pt-6 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                          <div className="space-y-1">
                            <h3 className="text-sm font-semibold text-gray-900 tracking-tight">Available Skills</h3>
                            <p className="text-[10px] text-gray-400 font-medium">Click to assign additional skills.</p>
                          </div>
                        </div>
                        {skills.filter(s => !assignedSkillIds.has(s.id)).length === 0 ? (
                          <p className="text-xs text-gray-400 font-medium text-center py-8">All skills are assigned, or no skills created yet.</p>
                        ) : (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {skills.filter(s => !assignedSkillIds.has(s.id)).map(skill => (
                              <SkillCard
                                key={skill.id}
                                skill={skill}
                                isAssigned={false}
                                onToggle={() => handleAssign(skill.id)}
                                onEdit={() => handleEditSkill(skill)}
                                onDelete={() => handleDeleteSkill(skill.id)}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                   </div>
                </TabsContent>

                <TabsContent value="configure" className="mt-0">
                  <div className="space-y-6 max-w-3xl">
                    <div className="bg-white rounded-2xl border border-gray-200/60 overflow-hidden shadow-sm p-8 space-y-8">
                      <div className="space-y-1">
                         <h2 className="text-lg font-semibold text-gray-900 tracking-tight">Identity Profile</h2>
                         <p className="text-xs text-gray-500 font-medium">Define how the agent communicates and behaves across all channels.</p>
                      </div>
                      
                      <div className="space-y-6">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-gray-900 ml-0.5">Agent Name</Label>
                          <Input 
                            {...form.register("config.name")} 
                            placeholder="e.g. Support Bot"
                            className="h-11 rounded-xl bg-gray-50/30 border-gray-200 focus:bg-white focus:border-[#f9510b] focus:ring-1 focus:ring-[#f9510b]/10 transition-all text-sm font-medium"
                          />
                        </div>
                        
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {(Object.entries(TRAIT_OPTIONS) as [keyof typeof TRAIT_OPTIONS, string[]][]).map(([key, options]) => (
                              <div key={key} className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-900 ml-0.5 capitalize">{key}</Label>
                                <Select 
                                  value={form.watch(`config.traits.${key}` as any)} 
                                  onValueChange={(val) => form.setValue(`config.traits.${key}` as any, val)}
                                >
                                  <SelectTrigger className="h-11 rounded-xl bg-gray-50/30 border-gray-200 focus:bg-white focus:border-[#f9510b] focus:ring-1 focus:ring-[#f9510b]/10 transition-all text-sm font-medium capitalize text-left">
                                    <SelectValue placeholder={`Select ${key}`} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {options.map((option) => (
                                      <SelectItem key={option} value={option} className="capitalize">
                                        {option}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            ))}
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-900 ml-0.5">Custom Directives</Label>
                            <Textarea 
                              {...form.register("config.traits.custom_directives")}
                              placeholder="Special instructions for the agent's behavior..."
                              className="min-h-[120px] rounded-xl bg-gray-50/30 border-gray-200 focus:bg-white focus:border-[#f9510b] focus:ring-1 focus:ring-[#f9510b]/10 transition-all text-sm p-5 resize-none font-medium leading-relaxed"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200/60 overflow-hidden shadow-sm p-8 space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-rose-50/50 flex items-center justify-center text-rose-500 border border-rose-100/50">
                          <Shield className="h-5 w-5" />
                        </div>
                        <div>
                           <h3 className="text-lg font-semibold text-gray-900 tracking-tight">Security Guardrails</h3>
                           <p className="text-xs text-gray-500 font-medium">Define prohibited topics or phrases to maintain compliance.</p>
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-2">
                         <Label className="text-[10px] font-bold text-gray-900 ml-0.5">Restricted Content</Label>
                         <Textarea 
                          {...form.register("config.guardrails_text")}
                          placeholder="Enter comma-separated restricted phrases..."
                          className="h-24 bg-gray-50/30 border-gray-200 rounded-xl text-xs p-4 focus:bg-white focus:border-[#f9510b] focus:ring-1 focus:ring-[#f9510b]/10 transition-all font-medium"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="knowledge" className="mt-0">
                  <div className="bg-white rounded-2xl border border-gray-200/60 overflow-hidden shadow-sm p-8 space-y-8 max-w-4xl">
                    <div className="space-y-1">
                       <h2 className="text-lg font-semibold text-gray-900 tracking-tight">Grounding Data</h2>
                       <p className="text-xs text-gray-500 font-medium">Connect URLs or upload documents to train your agent on real business data.</p>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex-1 relative group">
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 group-focus-within:text-black transition-colors" />
                        <Input 
                          placeholder="https://docs.yourcompany.com" 
                          value={newUrl}
                          onChange={(e) => setNewUrl(e.target.value)}
                          className="h-11 pl-10 rounded-xl border-gray-200 bg-gray-50/30 focus:bg-white focus:border-[#f9510b] focus:ring-1 focus:ring-[#f9510b]/10 transition-all text-sm font-medium"
                        />
                      </div>
                      <Button onClick={handleAddUrl} className="bg-gray-100 text-gray-900 hover:bg-gray-200 rounded-xl px-8 h-11 text-xs font-bold uppercase tracking-widest active:scale-95 transition-all">
                        Add Source
                      </Button>
                    </div>

                    <div className="space-y-4 pt-6 border-t border-gray-100/80">
                      {sources.length === 0 ? (
                        <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
                           <div className="h-16 w-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-200">
                              <Database className="h-6 w-6" />
                           </div>
                           <div className="space-y-1">
                              <p className="text-sm font-semibold text-gray-900">Zero Documentation Detected</p>
                              <p className="text-[10px] text-gray-400 font-medium max-w-[200px] mx-auto">Add a website URL or PDF document to begin the training sequence.</p>
                           </div>
                        </div>
                      ) : (
                        <div className="border border-gray-100 rounded-xl overflow-x-auto shadow-sm">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-gray-50/50 border-b border-gray-100">
                              <tr>
                                <th className="px-6 py-3 text-[10px] font-bold text-gray-400">Source Identity</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-gray-400">Status</th>
                                <th className="px-6 py-3 text-right text-[10px] font-bold text-gray-400">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 bg-white">
                              {sources.map((s) => (
                                <tr key={s.id} className="hover:bg-gray-50/50 transition-colors group">
                                  <td className="px-6 py-4 font-semibold text-gray-900 tracking-tight">{s.label}</td>
                                  <td className="px-6 py-4 text-gray-900">
                                     <div className="flex items-center gap-2">
                                        <div className={cn("h-1.5 w-1.5 rounded-full", s.status === 'active' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" : "bg-gray-300")} />
                                        <span className="text-[9px] font-bold text-gray-500">{s.status === 'active' ? 'Operational' : 'Processing'}</span>
                                     </div>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <button 
                                      onClick={() => handleDeleteSource(s.id)}
                                      className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-300 hover:text-rose-500 hover:bg-rose-50 transition-all ml-auto"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </PageTransition>
          </ScrollArea>
        </form>
      </div>

      <Dialog open={showSkillDialog} onOpenChange={setShowSkillDialog}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl border-gray-100 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900 tracking-tight">
              {editingSkill ? "Edit Skill" : "Create Skill"}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500 font-medium">
              {editingSkill ? "Update the skill definition." : "Define a new capability for your agent."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-gray-900 ml-0.5">Name *</Label>
              <Input
                value={skillForm.name}
                onChange={(e) => setSkillForm(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Order Status Lookup"
                className="h-10 rounded-xl bg-gray-50/30 border-gray-200 focus:bg-white focus:border-[#f9510b] focus:ring-1 focus:ring-[#f9510b]/10 transition-all text-sm font-medium"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-gray-900 ml-0.5">Description</Label>
              <Input
                value={skillForm.description}
                onChange={(e) => setSkillForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Briefly describe what this skill does"
                className="h-10 rounded-xl bg-gray-50/30 border-gray-200 focus:bg-white focus:border-[#f9510b] focus:ring-1 focus:ring-[#f9510b]/10 transition-all text-sm font-medium"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-gray-900 ml-0.5">Trigger Condition</Label>
              <Input
                value={skillForm.condition}
                onChange={(e) => setSkillForm(p => ({ ...p, condition: e.target.value }))}
                placeholder="e.g. When customer asks about order status"
                className="h-10 rounded-xl bg-gray-50/30 border-gray-200 focus:bg-white focus:border-[#f9510b] focus:ring-1 focus:ring-[#f9510b]/10 transition-all text-sm font-medium"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-gray-900 ml-0.5">Instructions *</Label>
              <Textarea
                value={skillForm.instructions}
                onChange={(e) => setSkillForm(p => ({ ...p, instructions: e.target.value }))}
                placeholder="Step-by-step instructions for the agent to follow..."
                className="min-h-[120px] rounded-xl bg-gray-50/30 border-gray-200 focus:bg-white focus:border-[#f9510b] focus:ring-1 focus:ring-[#f9510b]/10 transition-all text-sm p-4 resize-none font-medium leading-relaxed"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSkillDialog(false)}
              className="rounded-xl text-xs font-semibold border-gray-200"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveSkill}
              disabled={isSavingSkill}
              className="bg-black text-white hover:bg-gray-800 rounded-xl text-xs font-semibold shadow-lg"
            >
              {isSavingSkill ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
              {editingSkill ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white border border-gray-100 rounded-[2rem] shadow-xl max-w-sm w-full p-8 text-center space-y-6"
            >
              <div className="mx-auto h-14 w-14 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                <Trash2 className="h-7 w-7" />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-gray-900 tracking-tight">Delete Agent?</h2>
                <p className="text-sm text-gray-500 leading-relaxed">
                  This will permanently remove this agent and its configuration. This action cannot be undone.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <Button 
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 rounded-xl h-11 text-xs font-semibold border-gray-200"
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 rounded-xl h-11 text-xs font-semibold bg-red-500 hover:bg-red-600 text-white shadow-lg"
                >
                  {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SkillCard({ skill, isAssigned, onToggle, onEdit, onDelete }: {
  skill: Skill
  isAssigned: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <Card className="p-5 border-[#f9510b]/20 transition-all duration-300 relative overflow-hidden group rounded-2xl bg-white shadow-md ring-1 ring-[#f9510b]/5 hover:shadow-lg">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Wand2 className="h-14 w-14 text-[#f9510b]" />
      </div>

      <div className="flex items-start justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center shadow-sm border bg-[#f9510b] border-[#f9510b] text-white">
            <Lightbulb className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-tight">{skill.name}</h3>
            {skill.description && (
              <p className="text-[10px] text-gray-500 font-medium mt-0.5">{skill.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onEdit} className="h-7 w-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition-all">
            <Pencil className="h-3 w-3" />
          </button>
          <button onClick={onDelete} className="h-7 w-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-rose-500 hover:bg-rose-50 transition-all">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      <div className="mt-3 space-y-2 relative z-10">
        {skill.condition && (
          <p className="text-[10px] text-gray-400 font-medium">
            <span className="font-semibold text-gray-500">Trigger:</span> {skill.condition}
          </p>
        )}
        <p className="text-[10px] text-gray-500 font-medium leading-relaxed line-clamp-2">
          {skill.instructions}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between relative z-10">
        <button
          onClick={onToggle}
          className={cn(
            "text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 rounded-lg px-4 py-1.5",
            isAssigned
              ? "bg-red-50 text-red-500 hover:bg-red-100"
              : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
          )}
        >
          {isAssigned ? "Remove" : "Assign"}
        </button>
        {isAssigned && (
          <div className="flex items-center gap-1.5 text-[9px] font-semibold text-emerald-600">
            <CheckCircle2 className="h-3 w-3" /> Active
          </div>
        )}
      </div>
    </Card>
  )
}
