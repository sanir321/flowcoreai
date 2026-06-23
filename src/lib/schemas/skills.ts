import { z } from "zod"

export const CreateSkillSchema = z.object({
  workspace_id: z.string().uuid(),
  name: z.string().min(1, "Skill name is required"),
  description: z.string().optional(),
  category: z.string().default("custom"),
  condition: z.string().default(""),
  instructions: z.string().min(1, "Instructions are required"),
  icon: z.string().default("BookOpen"),
})

export const UpdateSkillSchema = z.object({
  skill_id: z.string().uuid(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  condition: z.string().optional(),
  instructions: z.string().min(1).optional(),
  icon: z.string().optional(),
  is_active: z.boolean().optional(),
})

export const DeleteSkillSchema = z.object({
  skill_id: z.string().uuid(),
})

export const AssignSkillSchema = z.object({
  agent_id: z.string().uuid(),
  skill_id: z.string().uuid(),
})

export const UnassignSkillSchema = z.object({
  agent_id: z.string().uuid(),
  skill_id: z.string().uuid(),
})
