import { PipelineContext, WebhookPayload } from "../lib/types.ts";

export const TEST_WORKSPACE_ID = "53ae24d7-33ea-4af8-a414-5b6635cd2e1c";

export function makeMockSupabase(overrides: Record<string, any> = {}) {
  const defaultResponse = { data: null, error: null };

  function buildQueryResponse(result: any, error: any = null) {
    const chain: Record<string, any> = {
      data: result,
      error,
      select: () => chain,
      eq: () => chain,
      neq: () => chain,
      is: () => chain,
      not: () => chain,
      in: () => chain,
      order: () => chain,
      limit: () => chain,
      range: () => chain,
      maybeSingle: () => Promise.resolve({ data: result, error }),
      single: () => Promise.resolve({ data: result, error }),
      insert: () => chain,
      update: () => chain,
      upsert: () => chain,
      then: (fn: any) => fn({ data: result, error }),
      _response: { data: result, error },
    };
    return chain;
  }

  return {
    from: (table: string) => {
      const tableOverrides = overrides[table];
      return {
        select: (cols: string) => {
          if (tableOverrides?.select) return buildQueryResponse(tableOverrides.select(cols));
          return buildQueryResponse(null);
        },
        insert: (data: any) => {
          if (tableOverrides?.insert) return buildQueryResponse(tableOverrides.insert(data));
          return buildQueryResponse({ id: crypto.randomUUID(), ...data });
        },
        update: (data: any) => {
          if (tableOverrides?.update) return buildQueryResponse(tableOverrides.update(data));
          return buildQueryResponse({ id: crypto.randomUUID(), ...data });
        },
        upsert: (data: any, _opts?: any) => {
          if (tableOverrides?.upsert) return buildQueryResponse(tableOverrides.upsert(data));
          return buildQueryResponse({ id: crypto.randomUUID(), ...data });
        },
        rpc: (name: string, params: any) => {
          if (tableOverrides?.rpc) return Promise.resolve(tableOverrides.rpc(name, params));
          return Promise.resolve({ data: null, error: null });
        },
        delete: () => buildQueryResponse(null),
        _table: table,
      };
    },
    rpc: (name: string, params: any) => {
      if (overrides.rpc) return Promise.resolve(overrides.rpc(name, params));
      return Promise.resolve({ data: null, error: null });
    },
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    },
    ...overrides._client,
  };
}

export function makePayload(overrides: Partial<WebhookPayload> = {}): WebhookPayload {
  return {
    workspace_id: TEST_WORKSPACE_ID,
    customer_jid: "test_user_001@s.whatsapp.net",
    customer_phone: "9876543210",
    customer_name: "Test User",
    message: "hello",
    message_type: "text",
    gowa_message_id: "test_msg_001",
    timestamp: Date.now(),
    source: "api",
    is_test: true,
    ...overrides,
  };
}

export function makeSession(overrides: Record<string, any> = {}) {
  return {
    id: crypto.randomUUID(),
    workspace_id: TEST_WORKSPACE_ID,
    customer_jid: "test_user_001@s.whatsapp.net",
    agent_type: "customer_support",
    status: "active",
    message_count: 0,
    total_tokens_used: 0,
    failed_attempts: 0,
    channel: "widget",
    working_context: {
      intent: null,
      collected_data: {},
      customer_name: null,
      pending_action: null,
      agent_type: "customer_support",
      handoff_count: 0,
      sentiment: null,
    },
    workspaces: {
      name: "Test Business",
      is_ai_enabled: true,
      credits_balance: 100,
      guardrail_config: {
        fallback_message: "I'm not sure about that. Please contact us directly for more information.",
      },
      kb_config: {
        match_count: 3,
        match_threshold: 0.35,
        chunk_truncation: 800,
        noise_stripping: true,
      },
      business_profile: {
        name: "Test Business",
        description: "A test business for automated testing",
        contact: { phone: "9876543210", email: "test@example.com", address: "123 Test St" },
        hours: {
          daily: {
            monday: { open: "09:00", close: "18:00", closed: false },
            tuesday: { open: "09:00", close: "18:00", closed: false },
            wednesday: { open: "09:00", close: "18:00", closed: false },
            thursday: { open: "09:00", close: "18:00", closed: false },
            friday: { open: "09:00", close: "18:00", closed: false },
            saturday: { open: "10:00", close: "16:00", closed: false },
            sunday: { open: "00:00", close: "00:00", closed: true },
          },
        },
        services: ["Consultation", "Site Visit", "Architectural Design", "Project Management"],
      },
      review_url: "https://maps.google.com/?q=Test+Business",
    },
    workspace_agents: {
      config: { traits: {} },
    },
    ...overrides,
  };
}

export function makeContext(overrides: Record<string, any> = {}): PipelineContext {
  const payload = overrides.payload || makePayload();
  const session = overrides.session || makeSession();

  const ctx: PipelineContext = {
    supabase: overrides.supabase || makeMockSupabase(),
    session,
    payload,
    workspace: session.workspaces,
    ...overrides,
  };

  return ctx;
}

export function mockLLMResponse(overrides: Record<string, any> = {}) {
  return {
    choices: [{
      message: {
        content: overrides.content || "This is a mock response for testing purposes.",
        role: "assistant",
        ...(overrides.tool_calls ? { tool_calls: overrides.tool_calls } : {}),
      },
      finish_reason: overrides.finish_reason || "stop",
    }],
    usage: { total_tokens: overrides.tokens || 50 },
    model: overrides.model || "mock-model",
  };
}

export function mockLLMToolCall(name: string, args: Record<string, any>) {
  return [{
    id: `call_${crypto.randomUUID()}`,
    type: "function",
    function: {
      name,
      arguments: JSON.stringify(args),
    },
  }];
}

export const ACTIVE_AGENTS_ROWS = [
  { agent_type: "customer_support" },
  { agent_type: "appointment_booking" },
  { agent_type: "sales" },
];

export const ACTIVE_AGENTS_SALES_ONLY = [
  { agent_type: "customer_support" },
  { agent_type: "sales" },
];
