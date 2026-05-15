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
          email: { type: "string", description: "Customer's email address for sending appointment confirmation." },
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
  },
  {
    type: "function",
    function: {
      name: "escalation_request",
      description: "Escalate the conversation to a human agent. Use this when the user is frustrated, asking for a manager, or needs human intervention.",
      parameters: {
        type: "object",
        properties: {
          reason: {
            type: "string",
            description: "Reason for escalation."
          }
        },
        required: ["reason"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_appointment",
      description: "Reschedule or modify an existing appointment.",
      parameters: {
        type: "object",
        properties: {
          appointment_id: { type: "string", description: "The appointment ID to update." },
          name: { type: "string", description: "Updated customer name." },
          phone: { type: "string", description: "Updated phone number." },
          service: { type: "string", description: "Updated service name." },
          date: { type: "string", description: "New date (e.g. '2026-05-15' or 'tomorrow')." },
          time: { type: "string", description: "New time (e.g. '2pm' or '14:00')." },
          duration: { type: "number", description: "Duration in minutes (default 30)." }
        },
        required: ["appointment_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "cancel_appointment",
      description: "Cancel an existing appointment.",
      parameters: {
        type: "object",
        properties: {
          appointment_id: { type: "string", description: "The appointment ID to cancel." },
          reason: { type: "string", description: "Reason for cancellation." }
        },
        required: ["appointment_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_contact_history",
      description: "Retrieve full contact details and past appointment history for the current customer.",
      parameters: {
        type: "object",
        properties: {
          detail: {
            type: "string",
            description: "Optional specific detail to look up."
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_contact",
      description: "Update customer contact information (name, email, phone, notes) during conversation.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Customer's name." },
          email: { type: "string", description: "Customer's email address." },
          phone: { type: "string", description: "Customer's phone number." },
          notes: { type: "string", description: "Additional notes about the customer." }
        }
      }
    }
  }
];
