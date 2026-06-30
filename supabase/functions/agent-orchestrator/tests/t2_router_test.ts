import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { runT2 } from "../pipeline/t2-router.ts";
import { makeContext, makeMockSupabase, makeSession, makePayload, ACTIVE_AGENTS_ROWS, ACTIVE_AGENTS_SALES_ONLY } from "./mocks.ts";

async function assertRouting(
  message: string,
  expectedAgent: string,
  expectedReason: string,
  sessionOverrides: Record<string, any> = {},
  supabaseOverrides: Record<string, any> = {},
) {
  const supabase = makeMockSupabase({
    workspace_agents: {
      select: () => ACTIVE_AGENTS_ROWS,
    },
    messages: {
      select: () => [],
    },
    ...supabaseOverrides,
  });

  const payload = makePayload({ message });
  const session = makeSession(sessionOverrides);

  const ctx = makeContext({ supabase, payload, session });

  const result = await runT2(ctx);
  assertEquals(result.handled, false);

  const msg = `"${message}" should route to ${expectedAgent}`;
  assertEquals(ctx.agentType, expectedAgent, msg);
  if (expectedReason) {
    assert(ctx.routingReason!.startsWith(expectedReason), `"${message}" reason "${ctx.routingReason}" should start with "${expectedReason}"`);
  }
}

// ── Booking Intent Tests ──────────────────────────────────

Deno.test("unit: T2 — 'book an appointment' routes to appointment_booking", async () => {
  await assertRouting("I want to book an appointment", "appointment_booking", "keyword_pre_check_booking");
});

Deno.test("unit: T2 — 'schedule a consultation' routes to appointment_booking", async () => {
  await assertRouting("I need to schedule a consultation", "appointment_booking", "keyword_pre_check_booking");
});

Deno.test("unit: T2 — 'reschedule' routes to appointment_booking", async () => {
  await assertRouting("Can I reschedule my appointment", "appointment_booking", "keyword_pre_check_booking");
});

Deno.test("unit: T2 — 'cancel appointment' routes to appointment_booking", async () => {
  await assertRouting("I need to cancel my appointment", "appointment_booking", "keyword_pre_check_booking");
});

Deno.test("unit: T2 — 'rebook' routes to appointment_booking", async () => {
  await assertRouting("I want to rebook for next week", "appointment_booking", "keyword_pre_check_booking");
});

Deno.test("unit: T2 — booking phrase in middle of sentence", async () => {
  await assertRouting("Hi, I was wondering if I could book a service with you", "appointment_booking", "keyword_pre_check_booking");
});

// ── Sales Intent Tests ──────────────────────────────────

Deno.test("unit: T2 — 'what are your prices' routes to sales", async () => {
  await assertRouting("what are your prices", "sales", "keyword_pre_check_sales");
});

Deno.test("unit: T2 — 'how much does it cost' routes to sales", async () => {
  await assertRouting("how much does a consultation cost", "sales", "keyword_pre_check_sales");
});

Deno.test("unit: T2 — 'I want to buy' routes to sales", async () => {
  await assertRouting("I want to buy something from your menu", "sales", "keyword_pre_check_sales");
});

Deno.test("unit: T2 — 'give me a quote' routes to sales", async () => {
  await assertRouting("can you give me a quote", "sales", "keyword_pre_check_sales");
});

Deno.test("unit: T2 — 'ordering' routes to sales", async () => {
  await assertRouting("I want to place an order", "sales", "keyword_pre_check_sales");
});

Deno.test("unit: T2 — 'rates' routes to sales", async () => {
  await assertRouting("what are your rates for design", "sales", "keyword_pre_check_sales");
});

// ── Multi-Intent Tests ──────────────────────────────────

Deno.test("unit: T2 — booking + pricing → appointment_booking (booking takes priority)", async () => {
  await assertRouting("I want to book a consultation and know your pricing", "appointment_booking", "keyword_pre_check_booking");
});

Deno.test("unit: T2 — 'book appointment + check prices' → appointment_booking", async () => {
  await assertRouting("Book an appointment and tell me the prices", "appointment_booking", "keyword_pre_check_booking");
});

// ── Follow-up Tests ──────────────────────────────────

Deno.test("unit: T2 — 'yes' follow-up keeps working context", async () => {
  const mockMessages = [{ role: "agent", content: "How can I help you today?" }];
  await assertRouting("yes", "appointment_booking", "working_context_follow_up", {
    message_count: 3,
    working_context: { agent_type: "appointment_booking", intent: "booking", collected_data: { service: "Consultation" }, pending_action: "collect_time" },
  }, { messages: { select: () => mockMessages } });
});

Deno.test("unit: T2 — 'tomorrow at 2pm' follow-up keeps booking", async () => {
  const mockMessages = [{ role: "agent", content: "How can I help you today?" }];
  await assertRouting("tomorrow at 2pm works for me", "appointment_booking", "working_context_follow_up", {
    message_count: 2,
    working_context: { agent_type: "appointment_booking", intent: "booking" },
  }, { messages: { select: () => mockMessages } });
});

Deno.test("unit: T2 — 'my name is John' follow-up keeps booking", async () => {
  const mockMessages = [{ role: "agent", content: "How can I help you today?" }];
  await assertRouting("my name is John and my email is john@test.com", "appointment_booking", "working_context_follow_up", {
    message_count: 2,
    working_context: { agent_type: "appointment_booking", intent: "booking" },
  }, { messages: { select: () => mockMessages } });
});

Deno.test("unit: T2 — 'next monday' follow-up keeps booking", async () => {
  const mockMessages = [{ role: "agent", content: "How can I help you today?" }];
  await assertRouting("next monday works", "appointment_booking", "working_context_follow_up", {
    message_count: 2,
    working_context: { agent_type: "appointment_booking", intent: "booking" },
  }, { messages: { select: () => mockMessages } });
});

// ── No Follow-up on First Message ──────────────────

Deno.test("unit: T2 — first message 'yes' does NOT follow-up (message_count = 0)", async () => {
  const supabase = makeMockSupabase({
    workspace_agents: { select: () => ACTIVE_AGENTS_ROWS },
    messages: { select: () => [] },
  });
  const payload = makePayload({ message: "yes" });
  const session = makeSession({ message_count: 0, working_context: { agent_type: "customer_support" } });
  const ctx = makeContext({ supabase, payload, session });
  const result = await runT2(ctx);
  assertEquals(result.handled, false);
  assert(ctx.routingReason!.startsWith("llm_classified") || ctx.routingReason!.startsWith("keyword"), "first-message 'yes' should go to LLM or no-op");
});

// ── Sales Fallback Tests ──────────────────

Deno.test("unit: T2 — pricing routes to sales when booking not active", async () => {
  const supabase = makeMockSupabase({
    workspace_agents: { select: () => ACTIVE_AGENTS_SALES_ONLY },
    messages: { select: () => [] },
  });
  const payload = makePayload({ message: "what are your prices" });
  const session = makeSession();
  const ctx = makeContext({ supabase, payload, session });
  const result = await runT2(ctx);
  assertEquals(result.handled, false);
  assertEquals(ctx.agentType, "sales", "pricing should route to sales even with limited agents");
});

// ── General Inquiry Tests ──────────────────

Deno.test("unit: T2 — general greeting routes to LLM (not keyword)", async () => {
  const supabase = makeMockSupabase({
    workspace_agents: { select: () => ACTIVE_AGENTS_ROWS },
    messages: { select: () => [] },
  });
  const payload = makePayload({ message: "Hi there! How are you?" });
  const session = makeSession({ message_count: 0 });
  const ctx = makeContext({ supabase, payload, session });
  const result = await runT2(ctx);
  assertEquals(result.handled, false);
  assert(
    ctx.routingReason!.startsWith("llm_classified") || ctx.routingReason!.startsWith("keyword_pre_check") === false,
    `greeting should not use keyword pre-check, got: ${ctx.routingReason}`,
  );
});

Deno.test("unit: T2 — business hours goes to LLM", async () => {
  const supabase = makeMockSupabase({
    workspace_agents: { select: () => ACTIVE_AGENTS_ROWS },
    messages: { select: () => [] },
  });
  const payload = makePayload({ message: "What are your business hours?" });
  const session = makeSession({ message_count: 0 });
  const ctx = makeContext({ supabase, payload, session });
  const result = await runT2(ctx);
  assertEquals(result.handled, false);
});

// ── Edge Cases ──────────────────

Deno.test("unit: T2 — explicit test agent override", async () => {
  const supabase = makeMockSupabase({
    workspace_agents: { select: () => ACTIVE_AGENTS_ROWS },
    messages: { select: () => [] },
  });
  const payload = makePayload({ message: "test message", agent_type: "sales", is_test: true });
  const session = makeSession();
  const ctx = makeContext({ supabase, payload, session });
  const result = await runT2(ctx);
  assertEquals(result.handled, false);
  assertEquals(ctx.agentType, "sales");
});

Deno.test("unit: T2 — widget channel always routes to customer_support", async () => {
  const supabase = makeMockSupabase({
    workspace_agents: { select: () => ACTIVE_AGENTS_ROWS },
    messages: { select: () => [] },
  });
  const payload = makePayload({ message: "I want to book", source: "widget" });
  const session = makeSession();
  const ctx = makeContext({ supabase, payload, session });
  const result = await runT2(ctx);
  assertEquals(result.handled, false);
  assertEquals(ctx.agentType, "customer_support");
  assertEquals(ctx.routingReason, "widget_channel");
});
