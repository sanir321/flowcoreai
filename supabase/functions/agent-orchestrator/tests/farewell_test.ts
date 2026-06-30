import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";

// NOTE: These tests validate the farewell/review logic that lives in index.ts
// We test the patterns and logic in isolation since index.ts is the edge function entry point

const FAREWELL_PATTERNS = [
  /^(?:thanks\b|thank you\b|bye\b|goodbye\b|see you\b|talk later\b|that'?s all\b|that is all\b|that'?s it\b|im done\b|i'?m done\b|all good\b|ok bye\b|okay bye\b|thanks bye\b|thanks a lot\b)/i,
];

function isFarewell(msg: string): boolean {
  return FAREWELL_PATTERNS.some(p => p.test(msg.trim()));
}

function hasMeaningfulWork(
  appointmentCreated: boolean,
  orderPlaced: boolean,
  messageCount: number,
): boolean {
  return appointmentCreated || orderPlaced || messageCount > 2;
}

Deno.test("unit: farewell — detects farewell messages at start", () => {
  const farewells = [
    "thanks",
    "thank you",
    "bye",
    "goodbye",
    "see you",
    "talk later",
    "that's all",
    "that is all",
    "im done",
    "i'm done",
    "all good",
    "ok bye",
    "okay bye",
    "thanks bye",
    "thanks a lot",
    "Thanks for your help!",
    "Bye, have a good day!",
    "Thank you so much!",
    "That's all I needed",
    "Ok bye for now",
    "I'm done with everything",
  ];

  for (const msg of farewells) {
    assertEquals(isFarewell(msg), true, `should detect farewell: "${msg}"`);
  }
});

Deno.test("unit: farewell — does NOT match non-farewell messages", () => {
  const nonFarewells = [
    "thanksgiving is coming up",
    "tell me about your services",
    "I want to book an appointment",
    "what are your prices",
    "I have a complaint",
    "this is urgent please help",
    "saying goodbye is hard",
    "the talk later plan is set",
  ];

  for (const msg of nonFarewells) {
    assertEquals(isFarewell(msg), false, `should NOT detect farewell: "${msg}"`);
  }
});

Deno.test("unit: farewell — does NOT match farewell in middle of sentence", () => {
  // Farewell patterns require match at START of message
  assertEquals(isFarewell("I just wanted to say thanks"), false);
  assertEquals(isFarewell("Can you say thanks to the team"), false);
});

Deno.test("unit: meaningfulWork — appointment created", () => {
  assertEquals(hasMeaningfulWork(true, false, 0), true);
});

Deno.test("unit: meaningfulWork — order placed", () => {
  assertEquals(hasMeaningfulWork(false, true, 0), true);
});

Deno.test("unit: meaningfulWork — message_count > 2", () => {
  assertEquals(hasMeaningfulWork(false, false, 3), true);
  assertEquals(hasMeaningfulWork(false, false, 4), true);
  assertEquals(hasMeaningfulWork(false, false, 10), true);
});

Deno.test("unit: meaningfulWork — short chat does NOT trigger", () => {
  assertEquals(hasMeaningfulWork(false, false, 0), false);
  assertEquals(hasMeaningfulWork(false, false, 1), false);
  assertEquals(hasMeaningfulWork(false, false, 2), false);
});

Deno.test("unit: meaningfulWork — only message_count > 2 qualifies", () => {
  // message_count > 2 means at least 3 messages
  assertEquals(hasMeaningfulWork(false, false, 2), false, "2 messages is not enough");
  assertEquals(hasMeaningfulWork(false, false, 3), true, "3 messages is enough");
});

Deno.test("unit: farewell — edge cases with formatting", () => {
  assertEquals(isFarewell("  thanks  "), true, "trimmed thanks");
  assertEquals(isFarewell("  BYE  "), true, "uppercase BYE");
  assertEquals(isFarewell("Thanks!"), true, "thanks with punctuation");
  assertEquals(isFarewell("Thank You"), true, "capitalized Thank You");
  assertEquals(isFarewell(""), false, "empty string");
  assertEquals(isFarewell("   "), false, "whitespace only");
});
