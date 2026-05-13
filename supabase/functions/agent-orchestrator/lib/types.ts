/**
 * /types/agent.ts
 */

export interface RouterResult {
  agent: 'customer_support' | 'sales' | 'appointment_booking';
  intent: string;
  urgency: 'low' | 'medium' | 'high';
  entities: Record<string, any>;
}

export interface AgentPayload {
  messages: { role: string; content: string }[];
  model?: string;
  response_format?: { type: string };
}

export interface AgentResponse {
  response_parts: string[];
  metadata: Record<string, any>;
}
