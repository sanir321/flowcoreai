/**
 * /supabase/functions/agent-orchestrator/lib/tool-definitions.ts
 */

export const TOOL_DEFINITIONS = [
  {
    type: "function",
    function: {
      name: "match_kb_chunks",
      description: "Search the business knowledge base for answers about services, policies, and general info.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query based on the user's question."
          }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "check_availability",
      description: "Check the business calendar for free slots on a specific date or time range.",
      parameters: {
        type: "object",
        properties: {
          date: {
            type: "string",
            description: "The date to check (e.g., '2026-05-12' or 'tomorrow')."
          },
          time: {
            type: "string",
            description: "Optional specific time to check."
          }
        },
        required: ["date"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_appointment",
      description: "Book a new appointment for a customer.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Customer's full name." },
          phone: { type: "string", description: "Customer's phone number." },
          service: { type: "string", description: "The service being booked." },
          date: { type: "string", description: "Date of appointment." },
          time: { type: "string", description: "Time of appointment." }
        },
        required: ["name", "service", "date", "time"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "capture_lead",
      description: "Save customer contact information for sales follow-up.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          email: { type: "string" },
          phone: { type: "string" },
          notes: { type: "string", description: "Context about the lead's interest." }
        },
        required: ["name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "request_handoff",
      description: "Transfer the conversation to a different specialist teammate. Use this when the user's request is outside your expertise and another team member is better suited.",
      parameters: {
        type: "object",
        properties: {
          target_agent: {
            type: "string",
            enum: ["customer_support", "sales", "appointment_booking"],
            description: "Which specialist to hand off to."
          },
          reason: {
            type: "string",
            description: "Brief context explaining why the handoff is needed."
          },
          context: {
            type: "string",
            description: "Summary of relevant details for the receiving agent (e.g. what the user already said, partial booking info, lead details)."
          }
        },
        required: ["target_agent", "reason"]
      }
    }
  }
];
