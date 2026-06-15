import { ToolDefinition } from "../lib/types.ts";

export const ALL_TOOLS: Record<string, ToolDefinition> = {
  match_kb_chunks: {
    name: "match_kb_chunks",
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
  check_availability: {
    name: "check_availability",
    description: "Check Google Calendar for free/busy on a specific date or time range.",
    parameters: {
      type: "object",
      properties: {
        date: { type: "string", description: "The date to check (e.g. '2026-05-12' or 'tomorrow')." },
        time: { type: "string", description: "Optional specific time to check." }
      },
      required: ["date"],
      additionalProperties: false
    }
  },
  create_appointment: {
    name: "create_appointment",
    description: "Book a new appointment. Only call AFTER collecting ALL required details and getting explicit confirmation.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Customer's actual name from conversation." },
        phone: { type: "string", description: "Customer's phone (optional, known on WhatsApp)." },
        email: { type: "string", description: "Customer's actual email from conversation." },
        service: { type: "string", description: "The service being booked." },
        date: { type: "string", description: "Date of appointment (e.g. '2026-05-20')." },
        time: { type: "string", description: "Time of appointment (e.g. '10am' or '14:00')." }
      },
      required: ["name", "service", "date", "time"],
      additionalProperties: false
    }
  },
  update_appointment: {
    name: "update_appointment",
    description: "Reschedule or modify an existing appointment.",
    parameters: {
      type: "object",
      properties: {
        appointment_id: { type: "string" },
        name: { type: "string" },
        service: { type: "string" },
        date: { type: "string" },
        time: { type: "string" },
        duration: { type: "number", description: "Duration in minutes (default 30)." }
      },
      required: ["appointment_id"],
      additionalProperties: false
    }
  },
  cancel_appointment: {
    name: "cancel_appointment",
    description: "Cancel an existing appointment.",
    parameters: {
      type: "object",
      properties: {
        appointment_id: { type: "string" },
        reason: { type: "string" }
      },
      required: ["appointment_id"],
      additionalProperties: false
    }
  },
  capture_lead: {
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
      required: ["name"],
      additionalProperties: false
    }
  },
  request_handoff: {
    name: "request_handoff",
    description: "Transfer the conversation to a different specialist teammate.",
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
  get_contact_history: {
    name: "get_contact_history",
    description: "Retrieve full contact details and past appointment history.",
    parameters: {
      type: "object",
      properties: {},
      additionalProperties: false
    }
  },
  update_contact: {
    name: "update_contact",
    description: "Update customer contact information during conversation.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
        notes: { type: "string" }
      },
      additionalProperties: false
    }
  },
  update_lead_stage: {
    name: "update_lead_stage",
    description: "Move the current contact through the sales pipeline. Stages: new → contacted → qualified → proposal → negotiation → won/lost.",
    parameters: {
      type: "object",
      properties: {
        stage: { type: "string", enum: ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"] },
        notes: { type: "string" }
      },
      required: ["stage"],
      additionalProperties: false
    }
  },
  get_pipeline: {
    name: "get_pipeline",
    description: "Get an overview of all leads in the sales pipeline broken down by stage.",
    parameters: { type: "object", properties: {}, additionalProperties: false }
  },
  schedule_follow_up: {
    name: "schedule_follow_up",
    description: "Schedule an automated WhatsApp follow-up message.",
    parameters: {
      type: "object",
      properties: {
        hours: { type: "number", description: "Hours from now." },
        message: { type: "string", description: "Content of the follow-up message." }
      },
      required: ["hours", "message"],
      additionalProperties: false
    }
  },
  generate_quote: {
    name: "generate_quote",
    description: "Generate a price quote for the current contact via WhatsApp.",
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
  search_menu: {
    name: "search_menu",
    description: "Browse or search available menu items/services. Omit query to see everything.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Optional search term." },
        category: { type: "string", description: "Optional category filter." }
      },
      additionalProperties: false
    }
  },
  check_stock: {
    name: "check_stock",
    description: "Check if a specific product is available or in stock. Search by product name.",
    parameters: {
      type: "object",
      properties: {
        product_name: { type: "string", description: "Name of the product to check availability for." }
      },
      required: ["product_name"],
      additionalProperties: false
    }
  },
  send_catalog: {
    name: "send_catalog",
    description: "Send the full product catalog as a formatted text message via WhatsApp.",
    parameters: {
      type: "object",
      properties: {
        category: { type: "string", description: "Optional: only send items from this category." }
      },
      additionalProperties: false
    }
  },
  send_menu_media: {
    name: "send_menu_media",
    description: "Send the uploaded menu image/PDF via WhatsApp. Auto-fallbacks to text menu if no image uploaded.",
    parameters: {
      type: "object",
      properties: {
        caption: { type: "string", description: "Optional caption." }
      },
      additionalProperties: false
    }
  },
  create_ticket: {
    name: "create_ticket",
    description: "Create a support ticket for issues that need tracking and follow-up.",
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
  },
  get_business_profile: {
    name: "get_business_profile",
    description: "Retrieve the business profile (contact info, hours, policies, pricing, amenities) for this workspace.",
    parameters: {
      type: "object",
      properties: {
        sections: { type: "array", items: { type: "string" }, description: "Optional: specific sections to retrieve (e.g. ['contact', 'hours', 'policies']). Omit for full profile." }
      },
      additionalProperties: false
    }
  },
  get_ticket_status: {
    name: "get_ticket_status",
    description: "Check the status and updates of an existing support ticket by ticket number.",
    parameters: {
      type: "object",
      properties: {
        ticket_number: { type: "string", description: "The ticket number (e.g. 'TKT-ABC123')." },
        ticket_id: { type: "string", description: "The internal ticket id (alternative to ticket_number)." }
      },
      additionalProperties: false
    }
  }
};

export const AGENT_TOOLS: Record<string, string[]> = {
  customer_support: [
    "match_kb_chunks", "get_contact_history", "update_contact", "request_handoff", "create_ticket", "get_ticket_status", "get_business_profile"
  ],
  appointment_booking: [
    "check_availability", "create_appointment", "update_appointment",
    "cancel_appointment", "get_contact_history", "update_contact", "request_handoff", "get_business_profile"
  ],
  sales: [
    "match_kb_chunks", "capture_lead", "schedule_follow_up",
    "generate_quote", "search_menu", "check_stock", "send_catalog", "send_menu_media",
    "request_handoff", "get_business_profile"
  ]
};

export const SUBMIT_PLAN_TOOL = {
  type: "function",
  function: {
    name: "submit_plan",
    description: "Submit your final plan. CRITICAL: Every action you claim to perform (capturing leads, scheduling follow-ups) MUST have a corresponding tool in the 'actions' array. Writing about it in 'response' does NOT execute it.",
    parameters: {
      type: "object",
      properties: {
        response: { type: "string", description: "Natural language response to the user." },
        actions: {
          type: "array",
          description: "List of tools to execute.",
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
          description: "True if tool results are needed to write the natural response."
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
