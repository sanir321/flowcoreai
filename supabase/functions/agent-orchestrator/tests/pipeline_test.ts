import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  makeContext, makeMockSupabase, makePayload, makeSession,
  TEST_WORKSPACE_ID,
} from "./mocks.ts";
import { runT0 } from "../pipeline/t0-instant.ts";
import { runT1 } from "../pipeline/t1-cache.ts";
import { runT3 } from "../pipeline/t3-context.ts";
import { dispatch } from "../lib/dispatch.ts";
import { runAllGuards } from "../guards/index.ts";
import { checkNonText } from "../guards/non-text.ts";
import { checkGreeting } from "../guards/greeting.ts";
import { checkBlockedTopics } from "../guards/blocked-topics.ts";
import { checkWhatsAppWindow } from "../guards/window.ts";
import { checkTokenBudget } from "../guards/token-budget.ts";
import { checkSales } from "../guards/sales.ts";
import { checkPricing } from "../guards/pricing.ts";

// ─────────────────────────────────────────────────────
// T0 — Guards (9 guards total)
// ─────────────────────────────────────────────────────

// 1. Non-text guard
Deno.test("t0: nonText — blocks image messages", () => {
  const ctx = makeContext({ payload: makePayload({ message_type: "image" }) });
  const result = checkNonText(ctx);
  assert(result !== null, "should block non-text messages");
  assert(result!.includes("I can only read text"));
});

Deno.test("t0: nonText — blocks audio messages", () => {
  const ctx = makeContext({ payload: makePayload({ message_type: "audio" }) });
  assert(checkNonText(ctx) !== null);
});

Deno.test("t0: nonText — blocks sticker messages", () => {
  const ctx = makeContext({ payload: makePayload({ message_type: "sticker" }) });
  assert(checkNonText(ctx) !== null);
});

Deno.test("t0: nonText — blocks document messages", () => {
  const ctx = makeContext({ payload: makePayload({ message_type: "document" }) });
  assert(checkNonText(ctx) !== null);
});

Deno.test("t0: nonText — blocks reaction messages", () => {
  const ctx = makeContext({ payload: makePayload({ message_type: "reaction" }) });
  assert(checkNonText(ctx) !== null);
});

Deno.test("t0: nonText — blocks video messages", () => {
  const ctx = makeContext({ payload: makePayload({ message_type: "video" }) });
  assert(checkNonText(ctx) !== null);
});

Deno.test("t0: nonText — passes text messages", () => {
  const ctx = makeContext({ payload: makePayload({ message_type: "text" }) });
  assertEquals(checkNonText(ctx), null);
});

// 2. Greeting guard
Deno.test("t0: greeting — responds to hello on first message", () => {
  const ctx = makeContext({
    payload: makePayload({ message: "hello" }),
    session: makeSession({ message_count: 0 }),
  });
  const result = checkGreeting(ctx, ctx.workspace);
  assert(result !== null, "should greet on first message");
  assert(result!.includes("Test Business"));
});

Deno.test("t0: greeting — responds to hi", () => {
  const ctx = makeContext({
    payload: makePayload({ message: "hi" }),
    session: makeSession({ message_count: 0 }),
  });
  assert(checkGreeting(ctx, ctx.workspace) !== null);
});

Deno.test("t0: greeting — responds to good morning", () => {
  const ctx = makeContext({
    payload: makePayload({ message: "good morning" }),
    session: makeSession({ message_count: 0 }),
  });
  assert(checkGreeting(ctx, ctx.workspace) !== null);
});

Deno.test("t0: greeting — responds to namaste", () => {
  const ctx = makeContext({
    payload: makePayload({ message: "namaste" }),
    session: makeSession({ message_count: 0 }),
  });
  assert(checkGreeting(ctx, ctx.workspace) !== null);
});

Deno.test("t0: greeting — uses welcome_template if configured", () => {
  const ctx = makeContext({
    payload: makePayload({ message: "hello" }),
    session: makeSession({
      message_count: 0,
      workspaces: { name: "TestCo", welcome_template: "Welcome to TestCo! How can I assist?" },
    }),
  });
  const result = checkGreeting(ctx, ctx.session.workspaces);
  assertEquals(result, "Welcome to TestCo! How can I assist?");
});

Deno.test("t0: greeting — returns null if message_count > 0", () => {
  const ctx = makeContext({
    payload: makePayload({ message: "hello" }),
    session: makeSession({ message_count: 5 }),
  });
  assertEquals(checkGreeting(ctx, ctx.workspace), null);
});

Deno.test("t0: greeting — returns null if message is not a greeting", () => {
  const ctx = makeContext({
    payload: makePayload({ message: "what services do you offer" }),
    session: makeSession({ message_count: 0 }),
  });
  assertEquals(checkGreeting(ctx, ctx.workspace), null);
});

// 3. Blocked topics guard
Deno.test("t0: blockedTopics — blocks configured topic", () => {
  const workspace = {
    guardrail_config: { blocked_topics: ["politics", "religion"] },
  };
  const ctx = makeContext({ payload: makePayload({ message: "let us talk about politics" }) });
  const result = checkBlockedTopics(ctx, workspace);
  assert(result !== null, "should block politics");
  assert(result!.includes("I'm sorry"));
});

Deno.test("t0: blockedTopics — returns null if no blocked topics configured", () => {
  const workspace = { guardrail_config: {} };
  const ctx = makeContext({ payload: makePayload({ message: "politics" }) });
  assertEquals(checkBlockedTopics(ctx, workspace), null);
});

Deno.test("t0: blockedTopics — returns null if message does not match", () => {
  const workspace = {
    guardrail_config: { blocked_topics: ["politics"] },
  };
  const ctx = makeContext({ payload: makePayload({ message: "hello" }) });
  assertEquals(checkBlockedTopics(ctx, workspace), null);
});

// 4. WhatsApp window guard
Deno.test("t0: window — returns null for widget source", () => {
  const ctx = makeContext({ payload: makePayload({ source: "widget" }) });
  assertEquals(checkWhatsAppWindow(ctx, {}), null);
});

Deno.test("t0: window — returns null if last_customer_message_at is null", () => {
  const ctx = makeContext({
    payload: makePayload({ source: "whatsapp" }),
    session: makeSession({ last_customer_message_at: undefined }),
  });
  assertEquals(checkWhatsAppWindow(ctx, {}), null);
});

Deno.test("t0: window — blocks if 24 hours past last message", () => {
  const oldTime = new Date(Date.now() - 25 * 3600 * 1000).toISOString();
  const ctx = makeContext({
    payload: makePayload({ source: "whatsapp" }),
    session: makeSession({ last_customer_message_at: oldTime }),
  });
  const result = checkWhatsAppWindow(ctx, {});
  assert(result !== null, "should block expired window");
  assert(result!.includes("response window has closed"));
});

Deno.test("t0: window — returns null if within 24 hours", () => {
  const recentTime = new Date(Date.now() - 1 * 3600 * 1000).toISOString();
  const ctx = makeContext({
    payload: makePayload({ source: "whatsapp" }),
    session: makeSession({ last_customer_message_at: recentTime }),
  });
  assertEquals(checkWhatsAppWindow(ctx, {}), null);
});

// 5. Token budget guard
Deno.test("t0: tokenBudget — blocks if session exceeded limit", () => {
  const workspace = { guardrail_config: { session_token_limit: 1000 } };
  const ctx = makeContext({
    session: makeSession({ total_tokens_used: 1500 }),
  });
  const result = checkTokenBudget(ctx, workspace);
  assert(result !== null, "should block when over limit");
  assert(result!.includes("reached its limit"));
});

Deno.test("t0: tokenBudget — passes if under limit", () => {
  const workspace = { guardrail_config: { session_token_limit: 50000 } };
  const ctx = makeContext({
    session: makeSession({ total_tokens_used: 100 }),
  });
  assertEquals(checkTokenBudget(ctx, workspace), null);
});

Deno.test("t0: tokenBudget — uses default 50000 if not configured", () => {
  const ctx = makeContext({
    session: makeSession({ total_tokens_used: 100 }),
  });
  assertEquals(checkTokenBudget(ctx, { guardrail_config: {} }), null);
});

Deno.test("t0: tokenBudget — blocks at default 50000 limit", () => {
  const ctx = makeContext({
    session: makeSession({ total_tokens_used: 50000 }),
  });
  const result = checkTokenBudget(ctx, { guardrail_config: {} });
  assert(result !== null, "should block at 50000");
});

// 6. Sales guard (sets flag, returns null)
Deno.test("t0: sales — sets flag when blocked and keyword matches", () => {
  const workspace = { guardrail_config: { allow_sales: false } };
  const ctx = makeContext({ payload: makePayload({ message: "I want to order" }) });
  const result = checkSales(ctx, workspace);
  assertEquals(result, null);
  assertEquals(ctx.salesBlocked, true);
});

Deno.test("t0: sales — does not set flag if sales allowed", () => {
  const workspace = { guardrail_config: { allow_sales: true } };
  const ctx = makeContext({ payload: makePayload({ message: "I want to order" }) });
  checkSales(ctx, workspace);
  assertEquals(ctx.salesBlocked, undefined);
});

Deno.test("t0: sales — does not set flag if no keyword match", () => {
  const workspace = { guardrail_config: { allow_sales: false } };
  const ctx = makeContext({ payload: makePayload({ message: "hello" }) });
  checkSales(ctx, workspace);
  assertEquals(ctx.salesBlocked, undefined);
});

// 7. Pricing guard (sets flag, returns null)
Deno.test("t0: pricing — sets flag when blocked and keyword matches", () => {
  const workspace = { guardrail_config: { allow_pricing: false } };
  const ctx = makeContext({ payload: makePayload({ message: "what is the price" }) });
  const result = checkPricing(ctx, workspace);
  assertEquals(result, null);
  assertEquals(ctx.pricingBlocked, true);
});

Deno.test("t0: pricing — does not set flag if pricing allowed", () => {
  const workspace = { guardrail_config: { allow_pricing: true } };
  const ctx = makeContext({ payload: makePayload({ message: "what is the price" }) });
  checkPricing(ctx, workspace);
  assertEquals(ctx.pricingBlocked, undefined);
});

// 8. runAllGuards — returns first matching guard
Deno.test("t0: runAllGuards — returns first matching guard (non-text before others)", async () => {
  const ctx = makeContext({
    payload: makePayload({ message_type: "image", message: "hello" }),
    session: makeSession({ message_count: 0 }),
  });
  const result = await runAllGuards(ctx, ctx.workspace);
  assert(result !== null);
  assertEquals(result.reason, "guardrail_non_text");
});

Deno.test("t0: runAllGuards — greeting guard fires for hello on first message", async () => {
  const ctx = makeContext({
    payload: makePayload({ message: "hello" }),
    session: makeSession({ message_count: 0 }),
  });
  const result = await runAllGuards(ctx, ctx.workspace);
  assert(result !== null);
  assertEquals(result.reason, "guardrail_greeting");
});

// 9. runT0 — empty message skipped immediately
Deno.test("t0: runT0 — skips empty messages", async () => {
  const ctx = makeContext({
    payload: makePayload({ message: "" }),
    supabase: makeMockSupabase(),
  });
  const result = await runT0(ctx);
  assertEquals(result.handled, true);
  assertEquals(result.reason, "empty_message_skipped");
});

Deno.test("t0: runT0 — skips whitespace-only messages", async () => {
  const ctx = makeContext({
    payload: makePayload({ message: "   " }),
    supabase: makeMockSupabase(),
  });
  const result = await runT0(ctx);
  assertEquals(result.handled, true);
  assertEquals(result.reason, "empty_message_skipped");
});

Deno.test("t0: runT0 — greeting guard fires via runT0", async () => {
  const ctx = makeContext({
    payload: makePayload({ message: "hello" }),
    session: makeSession({ message_count: 0 }),
    supabase: makeMockSupabase({
      messages: { select: () => null },
    }),
  });
  const result = await runT0(ctx);
  assert(result.handled, "T0 should handle greeting");
  assertEquals(result.reason, "guardrail_greeting");
});

Deno.test("t0: runT0 — returns not handled for non-guard message", async () => {
  const ctx = makeContext({
    payload: makePayload({ message: "what services do you offer" }),
    session: makeSession({ message_count: 1 }),
    supabase: makeMockSupabase({
      messages: { select: () => null },
    }),
  });
  const result = await runT0(ctx);
  assertEquals(result.handled, false);
});

// ─────────────────────────────────────────────────────
// T1 — Cache Tests
// ─────────────────────────────────────────────────────

Deno.test("t1: cache — exact hash hit returns cached response", async () => {
  const cachedResponse = "We offer Consultation, Site Visit, and Architectural Design.";
  const supabase = makeMockSupabase({
    kb_response_cache: {
      select: () => ({
        id: "cache-001",
        response_text: cachedResponse,
        access_count: 5,
      }),
    },
  });
  const ctx = makeContext({
    payload: makePayload({ message: "what services do you offer" }),
    supabase,
  });
  const result = await runT1(ctx);
  assertEquals(result.handled, true);
  assertEquals(result.reason, "cache_hit_exact");
  assertEquals(result.response, cachedResponse);
});

Deno.test("t1: cache — miss returns handled=false", async () => {
  const supabase = makeMockSupabase({
    kb_response_cache: {
      select: () => null,
    },
  });
  const ctx = makeContext({
    payload: makePayload({ message: "unique message not in cache" }),
    supabase,
  });
  const result = await runT1(ctx);
  assertEquals(result.handled, false);
});

Deno.test("t1: cache — stores cacheKeyHex on ctx", async () => {
  const supabase = makeMockSupabase({
    kb_response_cache: {
      select: () => null,
    },
  });
  const ctx = makeContext({
    payload: makePayload({ message: "test" }),
    supabase,
  });
  await runT1(ctx);
  assert(ctx._cacheKeyHex !== undefined, "cacheKeyHex should be set");
  assert(ctx._cacheKeyHex!.length > 0, "cacheKeyHex should not be empty");
});

Deno.test("t1: cache — same message produces same hash", async () => {
  const supabase1 = makeMockSupabase({
    kb_response_cache: { select: () => null },
  });
  const supabase2 = makeMockSupabase({
    kb_response_cache: { select: () => null },
  });
  const ctx1 = makeContext({ payload: makePayload({ message: "hello there" }), supabase: supabase1 });
  const ctx2 = makeContext({ payload: makePayload({ message: "hello there" }), supabase: supabase2 });
  await runT1(ctx1);
  await runT1(ctx2);
  assertEquals(ctx1._cacheKeyHex, ctx2._cacheKeyHex,
    "same message should produce same hash");
});

Deno.test("t1: cache — different messages produce different hashes", async () => {
  const supabase1 = makeMockSupabase({
    kb_response_cache: { select: () => null },
  });
  const supabase2 = makeMockSupabase({
    kb_response_cache: { select: () => null },
  });
  const ctx1 = makeContext({ payload: makePayload({ message: "hello" }), supabase: supabase1 });
  const ctx2 = makeContext({ payload: makePayload({ message: "bye" }), supabase: supabase2 });
  await runT1(ctx1);
  await runT1(ctx2);
  assert(ctx1._cacheKeyHex !== ctx2._cacheKeyHex,
    "different messages should produce different hashes");
});

Deno.test("t1: cache — hash is case-insensitive", async () => {
  const supabase1 = makeMockSupabase({
    kb_response_cache: { select: () => null },
  });
  const supabase2 = makeMockSupabase({
    kb_response_cache: { select: () => null },
  });
  const ctx1 = makeContext({ payload: makePayload({ message: "Hello World" }), supabase: supabase1 });
  const ctx2 = makeContext({ payload: makePayload({ message: "hello world" }), supabase: supabase2 });
  await runT1(ctx1);
  await runT1(ctx2);
  assertEquals(ctx1._cacheKeyHex, ctx2._cacheKeyHex,
    "hash should be case-insensitive");
});

// ─────────────────────────────────────────────────────
// T3 — Context (KB + Appointment Lookup)
// ─────────────────────────────────────────────────────

Deno.test("t3: context — customer_support fetches KB chunks", async () => {
  const supabase = makeMockSupabase({
    rpc: (_name: string, _params: any) => {
      return { data: [{ id: "chunk-1", content: "We offer Consultation services.", similarity: 0.85 }], error: null };
    },
  });
  const ctx = makeContext({
    payload: makePayload({ message: "what services do you offer" }),
    supabase,
    agentType: "customer_support",
    embedding: [0.1, 0.2, 0.3],
    session: makeSession({ message_count: 1 }),
  });
  const result = await runT3(ctx);
  assertEquals(result.handled, false, "T3 should not handle by itself");
  assert(ctx._kbChunks !== undefined, "kbChunks should be set");
  assertEquals(ctx._kbChunks.length, 1);
  assertEquals(ctx._kbChunks[0].content, "We offer Consultation services.");
});

Deno.test("t3: context — sales fetches KB chunks", async () => {
  const supabase = makeMockSupabase({
    rpc: () => {
      return { data: [{ id: "chunk-1", content: "Pricing: Consultation Rs.500", similarity: 0.82 }], error: null };
    },
  });
  const ctx = makeContext({
    payload: makePayload({ message: "pricing" }),
    supabase,
    agentType: "sales",
    embedding: [0.1, 0.2, 0.3],
    session: makeSession({ message_count: 1 }),
  });
  const result = await runT3(ctx);
  assertEquals(result.handled, false);
  assert(ctx._kbChunks !== undefined, "kbChunks should be set");
});

Deno.test("t3: context — appointment_booking does not fetch KB", async () => {
  const supabase = makeMockSupabase({
    rpc: () => { throw new Error("should not be called"); },
    appointments: {
      select: () => null,
    },
  });
  const ctx = makeContext({
    payload: makePayload({ message: "book appointment" }),
    supabase,
    agentType: "appointment_booking",
    session: makeSession({ message_count: 1 }),
  });
  // The db query uses .not() which our mock doesn't have, so catch handles it
  // But T3 should NOT have called the rpc (kb search) for booking agent
  await runT3(ctx);
  assertEquals(ctx._kbChunks, undefined, "booking should not fetch KB");
});

Deno.test("t3: context — appointment_booking looks up existing appointment", async () => {
  const apptData = {
    id: "appt-001",
    start_at: new Date(Date.now() + 86400000).toISOString(),
    service: "Consultation",
    status: "confirmed",
    customer_name: "Test User",
  };
  const supabase = makeMockSupabase({
    appointments: {
      select: () => apptData,
    },
  });
  const ctx = makeContext({
    payload: makePayload({ message: "cancel appointment" }),
    supabase,
    agentType: "appointment_booking",
    session: makeSession({ message_count: 1 }),
  });
  await runT3(ctx);
  assert(ctx._existingAppointment !== null, "should find existing appointment");
  assertEquals(ctx._existingAppointment.id, "appt-001");
  assertEquals(ctx._existingAppointment.service, "Consultation");
});

Deno.test("t3: context — appointment_booking handles no existing appointment", async () => {
  const supabase = makeMockSupabase({
    rpc: () => { return { data: null, error: null }; },
    appointments: {
      select: () => null,
    },
  });
  const ctx = makeContext({
    payload: makePayload({ message: "book a consultation" }),
    supabase,
    agentType: "appointment_booking",
    session: makeSession({ message_count: 1 }),
  });
  await runT3(ctx);
  assertEquals(ctx._existingAppointment, null);
});

Deno.test("t3: context — customer_support handles empty KB gracefully", async () => {
  const supabase = makeMockSupabase({
    rpc: () => {
      return { data: [], error: null };
    },
  });
  const ctx = makeContext({
    payload: makePayload({ message: "something obscure" }),
    supabase,
    agentType: "customer_support",
    embedding: [0.1, 0.2, 0.3],
    session: makeSession({ message_count: 1 }),
  });
  await runT3(ctx);
  assert(ctx._kbChunks !== undefined, "kbChunks should be set (empty array)");
  assertEquals(ctx._kbChunks.length, 0);
});

Deno.test("t3: context — re-query uses lower match_threshold", async () => {
  let capturedParams: any = null;
  const supabase = makeMockSupabase({
    rpc: (_name: string, params: any) => {
      capturedParams = params;
      return { data: [], error: null };
    },
    kb_response_cache: { select: () => null },
  });
  const ctx = makeContext({
    payload: makePayload({ message: "fallback query" }),
    supabase,
    agentType: "customer_support",
    session: makeSession({ message_count: 1 }),
  });
  // Pre-set embedding so matchChunks skips generateEmbedding
  ctx.embedding = [0.1, 0.2, 0.3];
  await runT3(ctx, { previous_empty: true, previous_query: "fallback query" });
  assert(capturedParams !== null, "RPC should have been called");
  assertEquals(capturedParams.match_threshold, 0.25, "re-query should use 0.25 threshold");
});

// ─────────────────────────────────────────────────────
// Dispatch — Test Mode
// ─────────────────────────────────────────────────────

Deno.test("dispatch: test — stores outbound message", async () => {
  const messages: any[] = [];
  const supabase = makeMockSupabase({
    messages: {
      insert: (data: any) => {
        messages.push(data);
        return { id: "msg-001", ...data };
      },
    },
    conversation_sessions: {
      update: () => ({ id: "session-001" }),
    },
  });
  const ctx = makeContext({
    payload: makePayload({ is_test: true }),
    supabase,
    agentType: "customer_support",
  });
  ctx.session.id = "session-001";
  await dispatch(ctx, "Hello! How can I help you?");
  assertEquals(messages.length, 1, "should store one outbound message");
  assertEquals(messages[0].content, "Hello! How can I help you?");
  assertEquals(messages[0].direction, "outbound");
  assertEquals(messages[0].role, "agent");
  assertEquals(messages[0].is_test, true);
});

Deno.test("dispatch: test — splits long messages at sentence boundary", async () => {
  const messages: any[] = [];
  const supabase = makeMockSupabase({
    messages: {
      insert: (data: any) => {
        messages.push(data);
        return { id: crypto.randomUUID(), ...data };
      },
    },
    conversation_sessions: {
      update: () => ({ id: "session-001" }),
    },
  });
  const ctx = makeContext({
    payload: makePayload({ is_test: true }),
    supabase,
    agentType: "customer_support",
  });
  ctx.session.id = "session-001";
  const longMsg = "A. ".repeat(600);
  await dispatch(ctx, longMsg);
  assert(messages.length > 1, "long message should be split");
});

Deno.test("dispatch: test — handles empty response gracefully", async () => {
  let insertCalled = false;
  const supabase = makeMockSupabase({
    messages: {
      insert: () => { insertCalled = true; return {}; },
    },
    conversation_sessions: {
      update: () => ({}),
    },
  });
  const ctx = makeContext({
    payload: makePayload({ is_test: true }),
    supabase,
  });
  await dispatch(ctx, null);
  assertEquals(insertCalled, false, "no insert for null response");
});

Deno.test("dispatch: test — handles short response without splitting", async () => {
  const messages: any[] = [];
  const supabase = makeMockSupabase({
    messages: {
      insert: (data: any) => {
        messages.push(data);
        return { id: crypto.randomUUID(), ...data };
      },
    },
    conversation_sessions: {
      update: () => ({}),
    },
  });
  const ctx = makeContext({
    payload: makePayload({ is_test: true }),
    supabase,
    agentType: "customer_support",
  });
  ctx.session.id = "session-001";
  await dispatch(ctx, "Short reply.");
  assertEquals(messages.length, 1);
});

Deno.test("dispatch: test — stores agent_type on outbound message", async () => {
  const messages: any[] = [];
  const supabase = makeMockSupabase({
    messages: {
      insert: (data: any) => {
        messages.push(data);
        return { id: crypto.randomUUID(), ...data };
      },
    },
    conversation_sessions: {
      update: () => ({}),
    },
  });
  const ctx = makeContext({
    payload: makePayload({ is_test: true }),
    supabase,
    agentType: "appointment_booking",
  });
  ctx.session.id = "session-001";
  await dispatch(ctx, "I can help you book an appointment.");
  assertEquals(messages[0].agent_type, "appointment_booking");
});

Deno.test("dispatch: test — updates session last_message_at", async () => {
  let sessionUpdated = false;
  const supabase = makeMockSupabase({
    messages: {
      insert: () => ({ id: crypto.randomUUID() }),
    },
    conversation_sessions: {
      update: (data: any) => {
        sessionUpdated = true;
        assert(data.last_message_at !== undefined, "should set last_message_at");
        return {};
      },
    },
  });
  const ctx = makeContext({
    payload: makePayload({ is_test: true }),
    supabase,
  });
  ctx.session.id = "session-001";
  await dispatch(ctx, "Hello!");
  assertEquals(sessionUpdated, true);
});

// ─────────────────────────────────────────────────────
// Multi-tenant — Workspace Isolation
// ─────────────────────────────────────────────────────

Deno.test("mt: guard — different workspaces have independent configs", () => {
  const ws1 = { guardrail_config: { blocked_topics: ["politics"] } };
  const ws2 = { guardrail_config: { blocked_topics: ["religion"] } };

  const ctx = makeContext({
    payload: makePayload({ message: "what about politics" }),
  });

  assert(checkBlockedTopics(ctx, ws1) !== null, "ws1 should block politics");
  assertEquals(checkBlockedTopics(ctx, ws2), null, "ws2 should pass politics");
});

Deno.test("mt: guard — different greeting templates per workspace", () => {
  const ws1 = { name: "Acme Corp", welcome_template: "Welcome to Acme!" };
  const ws2 = { name: "Beta Inc", welcome_template: "Hello from Beta!" };

  const ctx1 = makeContext({
    payload: makePayload({ message: "hello" }),
    session: makeSession({ message_count: 0 }),
  });
  const ctx2 = makeContext({
    payload: makePayload({ message: "hello" }),
    session: makeSession({ message_count: 0 }),
  });

  assertEquals(checkGreeting(ctx1, ws1), "Welcome to Acme!");
  assertEquals(checkGreeting(ctx2, ws2), "Hello from Beta!");
});

Deno.test("mt: guard — different token budget limits per workspace", () => {
  const ws1 = { guardrail_config: { session_token_limit: 100 } };
  const ws2 = { guardrail_config: { session_token_limit: 50000 } };

  const ctx1 = makeContext({ session: makeSession({ total_tokens_used: 200 }) });
  const ctx2 = makeContext({ session: makeSession({ total_tokens_used: 200 }) });

  assert(checkTokenBudget(ctx1, ws1) !== null, "ws1 should block at 200");
  assertEquals(checkTokenBudget(ctx2, ws2), null, "ws2 should pass at 200");
});

Deno.test("mt: t1 — different workspaces have independent caches", async () => {
  let ws1Called = false;
  let ws2Called = false;

  const supabase1 = makeMockSupabase({
    kb_response_cache: {
      select: () => { ws1Called = true; return { response_text: "ws1 response", access_count: 1, id: "c1" }; },
    },
  });
  const supabase2 = makeMockSupabase({
    kb_response_cache: {
      select: () => { ws2Called = true; return null; },
    },
  });

  const ctx1 = makeContext({
    payload: makePayload({ message: "hello", workspace_id: "ws-001" }),
    supabase: supabase1,
  });
  const ctx2 = makeContext({
    payload: makePayload({ message: "hello", workspace_id: "ws-002" }),
    supabase: supabase2,
  });

  // Same message, different workspace — ws1 hits cache, ws2 misses
  const r1 = await runT1(ctx1);
  const r2 = await runT1(ctx2);

  assertEquals(r1.handled, true);
  assertEquals(r2.handled, false);
});

Deno.test("mt: t0 — empty message skip is workspace-agnostic", async () => {
  const ctx1 = makeContext({
    payload: makePayload({ message: "", workspace_id: "ws-001" }),
    supabase: makeMockSupabase(),
  });
  const ctx2 = makeContext({
    payload: makePayload({ message: "", workspace_id: "ws-002" }),
    supabase: makeMockSupabase(),
  });

  const r1 = await runT0(ctx1);
  const r2 = await runT0(ctx2);

  assertEquals(r1.reason, "empty_message_skipped");
  assertEquals(r2.reason, "empty_message_skipped");
});

Deno.test("mt: t3 — different workspaces get different KB chunks", async () => {
  const capturedWorkpsaces: string[] = [];

  const makeSupabase = () => makeMockSupabase({
    rpc: (_name: string, params: any) => {
      capturedWorkpsaces.push(params.p_workspace_id);
      return { data: [], error: null };
    },
  });

  const ctx1 = makeContext({
    payload: makePayload({ message: "services", workspace_id: "ws-001" }),
    supabase: makeSupabase(),
    agentType: "customer_support",
    embedding: [0.1, 0.2, 0.3],
    session: makeSession({ message_count: 1 }),
  });
  const ctx2 = makeContext({
    payload: makePayload({ message: "services", workspace_id: "ws-002" }),
    supabase: makeSupabase(),
    agentType: "customer_support",
    embedding: [0.1, 0.2, 0.3],
    session: makeSession({ message_count: 1 }),
  });

  await runT3(ctx1);
  await runT3(ctx2);

  assertEquals(capturedWorkpsaces[0], "ws-001");
  assertEquals(capturedWorkpsaces[1], "ws-002");
});

// ─────────────────────────────────────────────────────
// Edge Cases — Error Resilience
// ─────────────────────────────────────────────────────

Deno.test("edge: t0 — empty workspace config doesn't crash greeting", () => {
  const ctx = makeContext({
    payload: makePayload({ message: "hello" }),
    session: makeSession({ message_count: 0, workspaces: undefined }),
  });
  const result = checkGreeting(ctx, {});
  // Should still return a greeting with fallback name
  assert(result !== null, "should not crash with empty workspace config");
  assert(result!.includes("our business"));
});

Deno.test("edge: t3 — null KB chunks handled gracefully", async () => {
  const supabase = makeMockSupabase({
    rpc: () => {
      return { data: null, error: null };
    },
  });
  const ctx = makeContext({
    supabase,
    agentType: "customer_support",
    embedding: [0.1, 0.2, 0.3],
    session: makeSession({ message_count: 1 }),
  });
  await runT3(ctx);
  assert(ctx._kbChunks !== undefined, "should set kbChunks even on null RPC");
});

Deno.test("edge: t3 — RPC error handled gracefully", async () => {
  const supabase = makeMockSupabase({
    rpc: () => {
      return { data: null, error: { message: "RPC failed" } };
    },
  });
  const ctx = makeContext({
    supabase,
    agentType: "customer_support",
    embedding: [0.1, 0.2, 0.3],
    session: makeSession({ message_count: 1 }),
  });
  // Should not throw
  await runT3(ctx);
  assert(true, "should not crash on RPC error");
});

Deno.test("edge: dispatch — very long single word doesn't crash", async () => {
  const messages: any[] = [];
  const supabase = makeMockSupabase({
    messages: { insert: (d: any) => { messages.push(d); return {}; } },
    conversation_sessions: { update: () => ({}) },
  });
  const ctx = makeContext({
    payload: makePayload({ is_test: true }),
    supabase,
  });
  ctx.session.id = "sid";
  const longWord = "a".repeat(5000);
  await dispatch(ctx, longWord);
  assert(messages.length >= 1, "should store despite long word");
});

Deno.test("edge: t0 — non-text guard is first in priority", async () => {
  const ctx = makeContext({
    payload: makePayload({ message_type: "image", message: "hello" }),
    session: makeSession({ message_count: 0 }),
  });
  const result = await runAllGuards(ctx, ctx.workspace);
  assertEquals(result.reason, "guardrail_non_text");
});
