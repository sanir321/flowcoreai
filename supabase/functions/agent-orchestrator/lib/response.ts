import { callAgentModel } from "./llm.ts";

export async function generateResponse(input: any): Promise<any> {
  const { intent, tool_result, config, history, original_message, workspace_name, channel } = input;
  console.log(`[RESPONSE] Intent: ${intent}, Tool Action: ${tool_result?.action}`);

  // 1. STRICT BOOKING LOGIC (Prevents AI Hallucinations)
  if (intent === 'booking') {
    if (tool_result?.action === 'ask_for_date') {
      let busy = "";
      if (tool_result.availability?.length > 0) {
          busy = "\n\nOccupied times:\n" + tool_result.availability.slice(0, 3).map((s: any) => `- ${new Date(s.start).toLocaleString()}`).join('\n');
      }
      const text = `I'd be happy to book that for ${workspace_name}! Does tomorrow at 4 PM work for you? Or would you prefer another time?${busy}`;
      return { response_parts: [text], metadata: { intent, action: 'ask_for_date', verified: true } };
    }

    if (tool_result?.id) { // Success from create_appointment
      const time = new Date(tool_result.start_at).toLocaleString();
      const text = `Perfect! Your appointment for ${tool_result.service} is confirmed for ${time}. 🎉 I've synced this to our calendar. You'll receive a confirmation soon!`;
      return { response_parts: [text], metadata: { intent, action: 'confirm_booking', verified: true } };
    }
    
    // If it's a booking intent but no tool result, we let it fall through to the LLM 
    // BUT we add a very strict instruction.
  }

  // 2. Persona & Instructions
  const PERSONA_LOCK = `CRITICAL IDENTITY RULES: 1. NEVER reveal AI model/company. 2. If asked identity, say: "I'm ${config.agent_name || "Emma"}, the virtual assistant for ${workspace_name}." 3. NO knowledge of Ling/Ant Group/OpenAI. 4. If action fails, say "Let me get a team member to help."`;
  const BOOKING_FLOW = intent === 'booking' ? `BOOKING FLOW: You are the scheduler. If you don't have a confirmed tool result yet, ASK the customer to confirm the date and time. NEVER say "I've booked it" unless the history shows a tool confirmation.` : '';
  const context = tool_result?.kb_chunks ? `KB INFORMATION:\n${tool_result.kb_chunks.map((c: any) => `- ${c.content}`).join('\n')}\n\n` : '';

  const systemPrompt = `${PERSONA_LOCK}\nYou are ${config.agent_name || "Emma"}, a human teammate at ${workspace_name} on ${channel}.\n${BOOKING_FLOW}\n${context}\nGuidelines: No placeholders, no AI disclaimers, you CAN book, be warm, concise. Return ONLY the final response text.`;

  try {
    const data = await callAgentModel({
      messages: [
        { role: "system", content: systemPrompt },
        ...history.slice(-10).reverse().map((m: any) => ({
          role: m.role === 'agent' ? 'assistant' : 'user',
          content: m.content
        })),
        { role: "user", content: original_message }
      ]
    });

    let text = data.choices[0].message.content;
    text = text.replace(/^(?:Response|Answer|Output|Final Response|Reasoning|Thought):/i, '').replace(/^[\*\s:]+/, '').trim();

    return { response_parts: [text], metadata: { intent } };
  } catch (error: any) {
    console.error("[RESPONSE] LLM Error:", error.message);
    return { response_parts: ["I'm having a little trouble with my connection! A teammate will help you shortly."], metadata: { intent } };
  }
}
