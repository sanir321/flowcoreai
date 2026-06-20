import { ToolDefinition } from "../lib/types.ts";

export const ALL_TOOLS: Record<string, ToolDefinition> = {
  manage_appointment: {
    name: "manage_appointment",
    description: "Book, check availability, update, or cancel an appointment. Use 'check' action to find free slots, 'create' to book, 'update' to reschedule, 'cancel' to cancel.",
    parameters: {
      type: "object",
      properties: {
        action: { type: "string", enum: ["check", "create", "update", "cancel"], description: "What to do." },
        appointment_id: { type: "string", description: "Required for update/cancel. Use get_contact_history to find it." },
        service: { type: "string", description: "For create: the service being booked." },
        date: { type: "string", description: "For check/create/update: date (e.g. '2026-06-20' or 'tomorrow')." },
        time: { type: "string", description: "For create/update: time (e.g. '10:00' or '2pm')." },
        name: { type: "string", description: "For create: customer name." },
        email: { type: "string", description: "For create: customer email." },
        phone: { type: "string", description: "For create: customer phone (optional)." },
        duration: { type: "number", description: "For create: duration in minutes (default 30)." },
        reason: { type: "string", description: "For cancel: reason." }
      },
      required: ["action"],
      additionalProperties: false
    }
  },
  manage_contact: {
    name: "manage_contact",
    description: "Get contact history, update details, capture lead, update pipeline stage, or schedule follow-up.",
    parameters: {
      type: "object",
      properties: {
        action: { type: "string", enum: ["get", "update", "capture-lead", "update-stage", "get-pipeline", "schedule-follow-up"], description: "What to do." },
        name: { type: "string", description: "Customer name (required for capture-lead)." },
        email: { type: "string", description: "Customer email." },
        phone: { type: "string", description: "Customer phone." },
        notes: { type: "string", description: "Context notes or lead details." },
        potential: { type: "string", enum: ["high", "intermediate", "low"], description: "For capture-lead: lead potential assessment." },
        stage: { type: "string", enum: ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"], description: "For update-stage: pipeline stage." },
        hours: { type: "number", description: "For schedule-follow-up: hours from now." },
        message: { type: "string", description: "For schedule-follow-up: follow-up message content." }
      },
      required: ["action"],
      additionalProperties: false
    }
  },
  manage_catalog: {
    name: "manage_catalog",
    description: "Search products/services, check stock, send catalog, or send menu image.",
    parameters: {
      type: "object",
      properties: {
        action: { type: "string", enum: ["search", "check-stock", "send-catalog", "send-media"], description: "What to do." },
        query: { type: "string", description: "For search/check-stock: search term or product name." },
        category: { type: "string", description: "For search/send-catalog: optional category filter." },
        caption: { type: "string", description: "For send-media: optional caption." }
      },
      required: ["action"],
      additionalProperties: false
    }
  },
  search_kb: {
    name: "search_kb",
    description: "Search the business knowledge base for answers about services, policies, and general info.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "The search query based on the user's question." }
      },
      required: ["query"],
      additionalProperties: false
    }
  },
  get_business_info: {
    name: "get_business_info",
    description: "Retrieve the business profile (contact info, hours, policies, pricing, amenities, services) for this workspace.",
    parameters: {
      type: "object",
      properties: {
        sections: { type: "array", items: { type: "string" }, description: "Optional: specific sections to retrieve (e.g. ['contact', 'hours', 'policies']). Omit for full profile." }
      },
      additionalProperties: false
    }
  },
  generate_quote: {
    name: "generate_quote",
    description: "Generate a formal price quote with items, quantities, prices, tax, and 30-day validity.",
    parameters: {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" }, qty: { type: "number" }, price: { type: "number" }
            },
            required: ["name", "qty", "price"],
            additionalProperties: false
          }
        },
        notes: { type: "string" }
      },
      required: ["items"],
      additionalProperties: false
    }
  },
  transfer_agent: {
    name: "transfer_agent",
    description: "Transfer the conversation to a different specialist. Use when the user's request doesn't match your expertise.",
    parameters: {
      type: "object",
      properties: {
        target_agent: { type: "string", enum: ["customer_support", "sales", "appointment_booking"] },
        reason: { type: "string" },
        context: { type: "string", description: "Summary of relevant details for the receiving agent." }
      },
      required: ["target_agent", "reason"],
      additionalProperties: false
    }
  },
  escalate: {
    name: "escalate",
    description: "Create a support ticket for issues needing tracking and follow-up, or check an existing ticket status.",
    parameters: {
      type: "object",
      properties: {
        action: { type: "string", enum: ["create", "status"], description: "Create a new ticket or check status." },
        subject: { type: "string", description: "For create: brief summary of the issue." },
        description: { type: "string", description: "For create: detailed description of the issue." },
        priority: { type: "string", enum: ["low", "normal", "high", "urgent"], description: "For create: priority level (default: normal)." },
        ticket_number: { type: "string", description: "For status: the ticket number (e.g. 'TKT-ABC123')." },
        ticket_id: { type: "string", description: "For status: internal ticket id (alternative to ticket_number)." }
      },
      required: ["action"],
      additionalProperties: false
    }
  },
  end_conversation: {
    name: "end_conversation",
    description: "Gracefully end the conversation when the user indicates they're done. Marks the session complete and sends a closing message.",
    parameters: {
      type: "object",
      properties: {
        reason: { type: "string", description: "Why the conversation is ending." },
        summary: { type: "string", description: "Brief summary of what was accomplished." }
      },
      required: ["reason"],
      additionalProperties: false
    }
  },
  create_support_ticket: {
    name: "create_support_ticket",
    description: "Proactively create a support ticket for issues that need tracking and follow-up by human agents.",
    parameters: {
      type: "object",
      properties: {
        subject: { type: "string", description: "Brief summary of the issue." },
        description: { type: "string", description: "Detailed description of the issue." },
        priority: { type: "string", enum: ["low", "normal", "high", "urgent"], description: "Priority level (default: normal)." }
      },
      required: ["subject"],
      additionalProperties: false
    }
  }
};

export const AGENT_TOOLS: Record<string, string[]> = {
  customer_support: [
    "search_kb", "manage_contact", "get_business_info", "transfer_agent", "escalate", "create_support_ticket"
  ],
  appointment_booking: [
    "manage_appointment", "manage_contact", "transfer_agent"
  ],
  sales: [
    "manage_catalog", "manage_contact", "get_business_info",
    "generate_quote", "search_kb", "transfer_agent"
  ]
};

export const SUBMIT_PLAN_TOOL = {
  type: "function",
  function: {
    name: "submit_plan",
    description: "Submit your final plan with response text and any tool actions needed.",
    parameters: {
      type: "object",
      properties: {
        response: { type: "string", description: "Natural language response to the user." },
        actions: {
          type: "array",
          description: "List of tools to execute. Each action you claim to perform must have a corresponding tool call here.",
          items: {
            type: "object",
            properties: {
              tool: { type: "string", description: "Name of the tool to call." },
              params: { type: "object", description: "Arguments for the tool.", additionalProperties: true },
              required: { type: "boolean", description: "If true, failure halts the response." },
              result_key: { type: "string", description: "Key to store the result for templating." }
            },
            required: ["tool", "params"],
            additionalProperties: false
          }
        },
        fallback: { type: "string", description: "Fallback message if tools fail." },
        needs_second_pass: {
          type: "boolean",
          description: "Set to true ONLY if a tool returned a non-final result or error that changes the response. Default false — most responses don't need a second LLM call."
        }
      },
      required: ["response", "actions"],
      additionalProperties: false
    }
  }
};

export function getAgentToolDefinitions(agentType: string) {
  const allowed = AGENT_TOOLS[agentType] || AGENT_TOOLS.customer_support;
  return allowed.map(name => ({
    type: "function",
    function: {
      name: ALL_TOOLS[name].name,
      description: ALL_TOOLS[name].description,
      parameters: ALL_TOOLS[name].parameters
    }
  }));
}
