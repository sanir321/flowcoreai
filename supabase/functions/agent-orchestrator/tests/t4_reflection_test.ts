import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { runT5 } from "../pipeline/t4-reflection.ts";
import { makeContext, mockLLMResponse } from "./mocks.ts";

const EMPTY_CASES = [
  { name: "empty string", response: "" },
  { name: "whitespace only", response: "   " },
  { name: "too short", response: "OK" },
  { name: "14 chars", response: "Hello world 12" },
];

Deno.test("unit: T5 — empty responses fallback", async () => {
  const ctx = makeContext();
  for (const tc of EMPTY_CASES) {
    const result = await runT5(ctx, tc.response, "customer_support");
    assertEquals(result.reason, "t5_empty", `${tc.name}: should be empty`);
    assertEquals(result.response.length > 10, true, `${tc.name}: should have fallback`);
    assert(result.retry_hint !== undefined, `${tc.name}: should have retry_hint`);
  }
});

Deno.test("unit: T5 — generic response patterns trigger t5_generic", async () => {
  const ctx = makeContext({
    _queryAnalysis: { agent: "customer_support", intent: "booking_request", entities: {}, urgency: "low", wants_human: false, emotional_tone: "calm" },
  });

  const genericCases = [
    "I'm not sure about that. Please contact us directly.",
    "I don't know the answer to your question.",
    "I cannot help with that request.",
    "I apologize, but I don't have that information.",
    "Sorry, I can't answer that question.",
    "Please contact the business directly for more info.",
  ];

  for (const response of genericCases) {
    const result = await runT5(ctx, response, "customer_support");
    assertEquals(result.reason, "t5_generic", `should detect generic: "${response.slice(0, 40)}..."`);
  }
});

Deno.test("unit: T5 — JSON tool call detection", async () => {
  const ctx = makeContext();
  const jsonCases = [
    '{"tool": "manage_appointment", "params": {"action": "create"}}',
    '{"function": "search_kb", "arguments": {"query": "pricing"}}',
    '{"name": "get_business_info", "params": {}}',
  ];

  for (const response of jsonCases) {
    const result = await runT5(ctx, response, "customer_support");
    assertEquals(result.reason, "t5_json_tool_call", `should detect JSON: "${response.slice(0, 40)}..."`);
  }
});

Deno.test("unit: T5 — valid responses pass", async () => {
  const ctx = makeContext({
    _queryAnalysis: { agent: "customer_support", intent: "general_question", entities: {}, urgency: "low", wants_human: false, emotional_tone: "calm" },
  });

  const validCases = [
    "We are open Monday to Friday from 9am to 6pm.",
    "Your appointment has been confirmed for June 20th at 2pm.",
    "Our consultation service costs Rs. 500 for a 30-minute session. Would you like to book one?",
    "I've created a ticket for your issue. Our team will follow up within 24 hours.",
  ];

  for (const response of validCases) {
    const result = await runT5(ctx, response, "customer_support");
    assertEquals(result.reason, "t5_passed", `should pass: "${response.slice(0, 40)}..."`);
    assertEquals(result.response, response, "should return original response");
  }
});

Deno.test("unit: T5 — borderline responses pass", async () => {
  const ctx = makeContext();
  const borderline = [
    "I'm not sure about the exact pricing, but let me check our catalog. One moment please.",
    "I apologize for the inconvenience. Let me look into this right away for you.",
  ];

  for (const response of borderline) {
    const result = await runT5(ctx, response, "customer_support");
    assertEquals(result.reason, "t5_passed", `borderline should pass: "${response.slice(0, 50)}..."`);
  }
});

Deno.test("unit: T5 — retry_hint provides specific guidance", async () => {
  const ctx = makeContext({
    _queryAnalysis: { agent: "appointment_booking", intent: "reschedule_request", entities: {}, urgency: "medium", wants_human: false, emotional_tone: "calm" },
  });

  const result = await runT5(ctx, "I don't know how to help you.", "appointment_booking");
  assertEquals(result.reason, "t5_generic");
  assert(result.retry_hint!.includes("reschedule_request"), "retry_hint should reference the intent");
});
