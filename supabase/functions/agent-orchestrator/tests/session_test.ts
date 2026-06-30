import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { touchSession } from "../lib/session.ts";
import { makeContext, makeMockSupabase, makePayload, makeSession } from "./mocks.ts";

Deno.test("unit: touchSession — increments message_count in DB and in-memory", async () => {
  let updateData: any = null;
  const supabase = makeMockSupabase({
    conversation_sessions: {
      update: (data: any) => {
        updateData = data;
        return { data, error: null };
      },
    },
  });

  const payload = makePayload({ message: "test" });
  const session = makeSession({ message_count: 5 });

  const ctx = makeContext({ supabase, payload, session });

  await touchSession(ctx, "customer_support", "Test response", 100);

  assertEquals(updateData.message_count, 6, "DB message_count should increment to 6");
  assertEquals(ctx.session.message_count, 6, "in-memory message_count should also be 6");
});

Deno.test("unit: touchSession — sets booking intent in working_context", async () => {
  let updateData: any = null;
  const supabase = makeMockSupabase({
    conversation_sessions: {
      update: (data: any) => {
        updateData = data;
        return { data, error: null };
      },
    },
  });

  const payload = makePayload({ message: "book" });
  const session = makeSession({ message_count: 2 });

  const ctx = makeContext({ supabase, payload, session });

  await touchSession(ctx, "appointment_booking", "I can help you book", 50);

  assertEquals(updateData.working_context.intent, "booking");
  assertEquals(updateData.working_context.pending_action, "collect_email");
  assertEquals(updateData.working_context.agent_type, "appointment_booking");
  assertEquals(ctx.session.message_count, 3);
});

Deno.test("unit: touchSession — increments from 0 correctly", async () => {
  let updateData: any = null;
  const supabase = makeMockSupabase({
    conversation_sessions: {
      update: (data: any) => {
        updateData = data;
        return { data, error: null };
      },
    },
  });

  const payload = makePayload({ message: "hi" });
  const session = makeSession({ message_count: 0 });

  const ctx = makeContext({ supabase, payload, session });

  await touchSession(ctx, "customer_support", "Hello!", 10);

  assertEquals(updateData.message_count, 1, "DB message_count should be 1");
  assertEquals(ctx.session.message_count, 1, "in-memory message_count should be 1");
});

Deno.test("unit: touchSession — preserves sentiment when set", async () => {
  let updateData: any = null;
  const supabase = makeMockSupabase({
    conversation_sessions: {
      update: (data: any) => {
        updateData = data;
        return { data, error: null };
      },
    },
  });

  const payload = makePayload({ message: "this is urgent" });
  const session = makeSession({ message_count: 3, working_context: { sentiment: null, agent_type: "customer_support" } });

  const ctx = makeContext({ supabase, payload, session, _sentiment: "urgent" });

  await touchSession(ctx, "customer_support", "I understand this is urgent", 30);

  assertEquals(updateData.working_context.sentiment, "urgent");
  assertEquals(ctx.session.message_count, 4);
});

Deno.test("unit: touchSession — does not change booking intent for support agent", async () => {
  let updateData: any = null;
  const supabase = makeMockSupabase({
    conversation_sessions: {
      update: (data: any) => {
        updateData = data;
        return { data, error: null };
      },
    },
  });

  const payload = makePayload({ message: "hello" });
  const session = makeSession({
    message_count: 1,
    working_context: { intent: null, agent_type: "customer_support" },
  });

  const ctx = makeContext({ supabase, payload, session });

  await touchSession(ctx, "customer_support", "Hi there!", 5);

  assertEquals(updateData.working_context?.intent ?? null, null);
  assertEquals(ctx.session.message_count, 2);
});

Deno.test("unit: touchSession — updates total_tokens_used", async () => {
  let updateData: any = null;
  const supabase = makeMockSupabase({
    conversation_sessions: {
      update: (data: any) => {
        updateData = data;
        return { data, error: null };
      },
    },
  });

  const payload = makePayload({ message: "test" });
  const session = makeSession({ message_count: 0, total_tokens_used: 500 });

  const ctx = makeContext({ supabase, payload, session });

  await touchSession(ctx, "customer_support", "Response", 150);

  assertEquals(updateData.total_tokens_used, 650);
});
