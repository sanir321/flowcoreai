export interface RouterResult {
  agent: "customer_support" | "sales" | "appointment_booking";
  intent: string;
  urgency: "low" | "medium" | "high";
  entities: Record<string, any>;
}

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
}

export interface PipelineContext {
  supabase: any;
  session: any;
  payload: WebhookPayload;
  workspace?: {
    name?: string;
    description?: string;
    is_ai_enabled?: boolean;
    credits_balance?: number;
    owner_personal_phone?: string;
    owner_id?: string;
    welcome_template?: string;
    guardrail_config?: any;
    services_offered?: string;
    business_profile?: Record<string, any>;
    website_url?: string;
    business_type?: string;
    [key: string]: any;
  };
  contact?: any;
  agentType?: string;
  routingReason?: string;
  _msgCount?: number;
  embedding?: number[];
  kbSearchPromise?: Promise<any>;
  kbHadResults?: boolean;
  pricingBlocked?: boolean;
  salesBlocked?: boolean;
  handoffDepth?: number;
  _toolCalls?: { tool: string; params: any; success: boolean; result: any; duration_ms: number }[];
  _businessProfileCached?: any;
  _toolCallBuffer?: any[];
  _toolFailCounts?: Record<string, number>;
  _sentiment?: string;
  _emotionalTone?: string;
  _escalationLevel?: string;
  _churnRisk?: boolean;
  _maskedComplaint?: boolean;
  _ventVsSolve?: string;
}

export interface AgentPlan {
  response: string;
  actions: { tool: string; params: object; required: boolean; result_key?: string }[];
  fallback: string;
  needs_second_pass: boolean;
}

export interface TierResult {
  handled: boolean;
  response?: string | null;
  reason?: string;
}

export type AgentType = "customer_support" | "appointment_booking" | "sales";

export const AGENT_DESCRIPTIONS: Record<string, { label: string; description: string; skills: string }> = {
  customer_support: {
    label: "Customer Support",
    description: "Answers general questions about the business, services, hours, or policies.",
    skills: "knowledge base search, general Q&A, escalation to human"
  },
  appointment_booking: {
    label: "Appointment Booker",
    description: "Handles scheduling, changing, or cancelling appointments.",
    skills: "Google Calendar availability check, appointment creation, rescheduling, cancellations"
  },
  sales: {
    label: "Sales Assistant",
    description: "Handles pricing inquiries, lead capture, qualification, menu browsing, order taking, and payment.",
    skills: "lead capture, pipeline management, follow-ups, quotes, menu, ordering, UPI payments"
  }
};
