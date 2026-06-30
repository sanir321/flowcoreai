import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { makeContext, makeMockSupabase, makePayload, makeSession, ACTIVE_AGENTS_ROWS } from "./mocks.ts";
import { runT2 } from "../pipeline/t2-router.ts";
import { runT5 } from "../pipeline/t4-reflection.ts";

// ── Integration: T2 Routing End-to-End ──────────────────

async function createRoutingContext(message: string, sessionOverrides: Record<string, any> = {}) {
  const supabase = makeMockSupabase({
    workspace_agents: { select: () => ACTIVE_AGENTS_ROWS },
    messages: { select: () => [{ role: "agent", content: "How can I help you today?" }] },
  });
  const payload = makePayload({ message, is_test: true });
  const session = makeSession(sessionOverrides);
  return makeContext({ supabase, payload, session });
}

Deno.test("int: T2 → booking keyword overrides working context", async () => {
  // Even if working context is customer_support, "book" should route to appointment_booking
  const ctx = await createRoutingContext("I want to book an appointment", {
    message_count: 2,
    working_context: { agent_type: "customer_support", intent: null },
  });

  await runT2(ctx);
  assertEquals(ctx.agentType, "appointment_booking");
  assertEquals(ctx.routingReason, "keyword_pre_check_booking");
});

Deno.test("int: T2 → sales keyword routes correctly with working context", async () => {
  const ctx = await createRoutingContext("what is your pricing", {
    message_count: 1,
    working_context: { agent_type: "customer_support", intent: null },
  });

  await runT2(ctx);
  assertEquals(ctx.agentType, "sales");
  assertEquals(ctx.routingReason, "keyword_pre_check_sales");
});

Deno.test("int: T2 → follow-up when same agent as working context", async () => {
  const ctx = await createRoutingContext("yes please", {
    message_count: 2,
    working_context: { agent_type: "appointment_booking", intent: "booking" },
  });

  await runT2(ctx);
  assertEquals(ctx.agentType, "appointment_booking");
  assertEquals(ctx.routingReason, "working_context_follow_up");
});

Deno.test("int: T2 → follow-up blocked on first message", async () => {
  const ctx = await createRoutingContext("yes", {
    message_count: 0,
    working_context: { agent_type: "customer_support", intent: null },
  });

  await runT2(ctx);
  // Should NOT be a follow-up on message_count=0
  assert(ctx.routingReason !== "working_context_follow_up", "first message should not use follow-up routing");
});

// ── Integration: T2+T5 Combined ──────────────────

Deno.test("int: T5 — booking response with 'book' keyword → T2 booking + T5 passed", async () => {
  const ctx = await createRoutingContext("I want to book a consultation");

  await runT2(ctx);
  assertEquals(ctx.agentType, "appointment_booking");

  const validResponse = "I'd be happy to help you book a consultation. Could you please tell me your preferred date and time?";
  const t5 = await runT5(ctx, validResponse, "appointment_booking");
  assertEquals(t5.reason, "t5_passed");
});

Deno.test("int: T5 — weak response after booking intent triggers retry", async () => {
  const ctx = await createRoutingContext("I want to book an appointment");
  ctx._queryAnalysis = { agent: "appointment_booking", intent: "booking_request", entities: {}, urgency: "low", wants_human: false, emotional_tone: "calm" };

  await runT2(ctx);
  assertEquals(ctx.agentType, "appointment_booking");

  const weakResponse = "I'm not sure how to help you with that.";
  const t5 = await runT5(ctx, weakResponse, "appointment_booking");
  assertEquals(t5.reason, "t5_generic");
  assert(t5.retry_hint !== undefined, "should provide retry hint");
});

// ── Integration: Session Message Flow ──────────────────

Deno.test("int: T2 → routing sets _queryAnalysis correctly", async () => {
  const ctx = await createRoutingContext("I need to book");

  await runT2(ctx);
  assert(ctx._queryAnalysis !== undefined, "_queryAnalysis should be set");
  assertEquals(ctx._queryAnalysis!.agent, "appointment_booking");
});

Deno.test("int: T2 → widget source overrides all routing", async () => {
  const supabase = makeMockSupabase({
    workspace_agents: { select: () => ACTIVE_AGENTS_ROWS },
    messages: { select: () => [] },
  });
  const payload = makePayload({ message: "I need to book", source: "widget", is_test: true });
  const session = makeSession();
  const ctx = makeContext({ supabase, payload, session });

  await runT2(ctx);
  assertEquals(ctx.agentType, "customer_support");
  assertEquals(ctx.routingReason, "widget_channel");
});

// ── Integration: Sub-tasks ──────────────────

Deno.test("int: T2 — booking request sets agent_type correctly", async () => {
  const ctx = await createRoutingContext("book consultation");

  await runT2(ctx);
  assertEquals(ctx.agentType, "appointment_booking");
  assertEquals(ctx.routingReason, "keyword_pre_check_booking");
});

Deno.test("int: T2 — cancel request routes to booking", async () => {
  const ctx = await createRoutingContext("I need to cancel my appointment");

  await runT2(ctx);
  assertEquals(ctx.agentType, "appointment_booking");
  assertEquals(ctx.routingReason, "keyword_pre_check_booking");
});

Deno.test("int: T2 — order request routes to sales", async () => {
  const ctx = await createRoutingContext("I want to place an order");

  await runT2(ctx);
  assertEquals(ctx.agentType, "sales");
  assertEquals(ctx.routingReason, "keyword_pre_check_sales");
});

Deno.test("int: T2 — 'provide name' follow-up with booking context stays on booking", async () => {
  const ctx = await createRoutingContext("my name is Samir", {
    message_count: 3,
    working_context: { agent_type: "appointment_booking", intent: "booking", collected_data: { service: "Consultation", date: "tomorrow", time: "2pm" } },
  });

  await runT2(ctx);
  assertEquals(ctx.agentType, "appointment_booking");
  assertEquals(ctx.routingReason, "working_context_follow_up");
});

Deno.test("int: T2 — 'email' follow-up with booking context stays on booking", async () => {
  const ctx = await createRoutingContext("my email is samir@test.com", {
    message_count: 4,
    working_context: { agent_type: "appointment_booking", intent: "booking" },
  });

  await runT2(ctx);
  assertEquals(ctx.agentType, "appointment_booking");
  assertEquals(ctx.routingReason, "working_context_follow_up");
});
