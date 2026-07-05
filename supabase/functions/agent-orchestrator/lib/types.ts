export interface AgentPayload {
  model?: string;
  messages: { role: string; content: string }[];
  system?: string;
  response_format?: { type: string };
  tools?: object[];
  tool_choice?: object | string;
  temperature?: number;
  max_tokens?: number;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface WebhookPayload {
  workspace_id: string;
  customer_jid: string;
  customer_phone: string;
  customer_name?: string;
  message: string;
  message_type: "text" | "image" | "audio" | "document" | "sticker" | "reaction";
  gowa_message_id: string;
  timestamp: number;
  source: "whatsapp" | "widget";
  is_test?: boolean;
  agent_type?: string;
}

export interface WorkingContext {
  intent: "booking" | "support" | "sales" | null;
  collected_data: Record<string, string>;
  customer_name: string | null;
  pending_action: string | null;
  agent_type: string;
  handoff_count: number;
  sentiment: "positive" | "neutral" | "negative" | "frustrated" | null;
  transferred?: boolean;
}

export interface WorkspaceRow {
  id?: string;
  name?: string;
  description?: string;
  is_ai_enabled?: boolean;
  credits_balance?: number;
  low_credits_notified?: boolean;
  owner_personal_phone?: string;
  owner_id?: string;
  welcome_template?: string;
  guardrail_config?: Record<string, unknown>;
  services_offered?: string;
  business_profile?: Record<string, unknown>;
  website_url?: string;
  business_type?: string;
  kb_config?: Record<string, unknown>;
  review_url?: string;
  [key: string]: unknown;
}

export interface SessionRow {
  id: string;
  workspace_id: string;
  contact_id?: string;
  customer_jid: string;
  customer_name?: string;
  channel: string;
  agent_type: string;
  status: string;
  message_count?: number;
  total_tokens_used?: number;
  working_context?: WorkingContext;
  last_message_at?: string;
  last_message_preview?: string;
  failed_attempts?: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  workspaces?: WorkspaceRow;
  [key: string]: unknown;
}

export interface ToolCallEntry {
  tool: string;
  params: Record<string, unknown>;
  success: boolean;
  result: unknown;
  duration_ms: number;
}

import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";

export interface PipelineContext {
  supabase: SupabaseClient;
  session: SessionRow;
  payload: WebhookPayload;
  _cacheKeyHex?: string;
  workspace?: WorkspaceRow;
  contact?: Record<string, unknown>;
  agentType?: string;
  routingReason?: string;
  _msgCount?: number;
  embedding?: number[];
  kbSearchPromise?: Promise<unknown>;
  pricingBlocked?: boolean;
  salesBlocked?: boolean;
  handoffDepth?: number;
  _toolCalls?: ToolCallEntry[];
  _businessProfileCached?: unknown;
  _toolCallBuffer?: unknown[];
  _toolFailCounts?: Record<string, number>;
  _sentiment?: string;
  _appointmentCreated?: boolean;
  _transferAgentCalled?: boolean;
  _escalationHandled?: boolean;
  _orderPlaced?: boolean;
  _queryAnalysis?: QueryAnalysis;
  _wantsHuman?: boolean;
  _kbChunks?: unknown[];
  _existingAppointment?: unknown;
  _customerHistory?: unknown[];
  _subTasks?: { agent: string; intent: string }[];
  _retryHint?: string;
  _reviewSent?: boolean;
  _timeoutPerMessage?: number;
  agentConfig?: Record<string, unknown>;
}

export interface AgentPlan {
  response: string;
  actions: { tool: string; params: object; required: boolean; result_key?: string }[];
  fallback: string;
}

export interface TierResult {
  handled: boolean;
  response?: string | null;
  reason?: string;
}

export type AgentType = "customer_support" | "appointment_booking" | "sales";

export interface QueryAnalysis {
  agent: AgentType;
  intent: string;
  entities: Record<string, string>;
  urgency: "low" | "medium" | "high";
  wants_human: boolean;
  emotional_tone: string;
  sub_tasks?: { agent: AgentType; intent: string }[];
}


