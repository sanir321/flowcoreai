import { z } from "zod"

export const CreateWorkspaceSchema = z.object({
  name: z.string().min(1, "Workspace name is required"),
  business_type: z.string().min(1, "Business type is required"),
  website_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  contact_phone: z.string().optional().default(""),
  employee_count: z.string().min(1, "Employee count is required"),
  accept_terms: z.boolean().refine(val => val === true, "You must accept the Privacy Policy and Terms & Conditions"),
})

export const UpdateWorkspaceConfigSchema = z.object({
  name: z.string().min(1).optional(),
  business_type: z.string().optional(),
  website_url: z.string().url().optional().or(z.literal("")),
  description: z.string().optional(),
  employee_count: z.string().optional(),
  timezone: z.string().optional(),
  owner_personal_phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number").optional().or(z.literal("")),
})
