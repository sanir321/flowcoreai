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
      description: "REQUIRED: When a customer gives you a date and time, you MUST call this immediately to verify the slot. Checks the Google Calendar for free/busy on a specific date or time range.",
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
      description: "Book a new appointment for a customer. Only call AFTER collecting ALL required details (name + email + service + date + time) and getting explicit confirmation.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Customer's full name." },
          phone: { type: "string", description: "Customer's phone number (optional — already known on WhatsApp). Pass null if unknown." },
          email: { type: "string", description: "Customer's email address for sending appointment confirmation. Pass null if unknown. NEVER make up placeholder values." },
          service: { type: "string", description: "The service being booked." },
          date: { type: "string", description: "Date of appointment (e.g. '2026-05-20' or 'tomorrow')." },
          time: { type: "string", description: "Time of appointment (e.g. '10am' or '14:00')." }
        },
        required: ["name", "email", "service", "date", "time"]
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
  },
  {
    type: "function",
    function: {
      name: "update_lead_stage",
      description: "Move a lead through the sales pipeline. Stages: new → contacted → qualified → proposal → negotiation → won/lost.",
      parameters: {
        type: "object",
        properties: {
          stage: {
            type: "string",
            enum: ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"],
            description: "Target pipeline stage."
          },
          notes: { type: "string", description: "Reason or context for the stage change." }
        },
        required: ["stage"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_pipeline",
      description: "Get an overview of all leads in the sales pipeline broken down by stage.",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  },
  {
    type: "function",
    function: {
      name: "schedule_follow_up",
      description: "Schedule an automated WhatsApp follow-up message for a lead after a specified number of hours.",
      parameters: {
        type: "object",
        properties: {
          hours: {
            type: "number",
            description: "Hours from now to send the follow-up (e.g. 24, 48)."
          },
          message: {
            type: "string",
            description: "Content of the follow-up message."
          }
        },
        required: ["hours", "message"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "generate_quote",
      description: "Generate and send a price quote to the customer via WhatsApp.",
      parameters: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string", description: "Item/service name." },
                qty: { type: "number", description: "Quantity." },
                price: { type: "number", description: "Unit price." }
              }
            },
            description: "List of items/services with quantities and prices."
          },
          notes: { type: "string", description: "Optional notes for the quote." }
        },
        required: ["items"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_menu",
      description: "Browse or search available menu items/services. Omit query to see everything, or search by name/category.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Optional search term to filter by item name or category. Leave empty to show all items." },
          category: { type: "string", description: "Optional category filter (e.g. Services, Products)." }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "send_menu_media",
      description: "REQUIRED when the customer asks about the menu, services, pricing, or what's available. Sends the uploaded menu image/PDF via WhatsApp. If no menu is uploaded, call search_menu instead.",
      parameters: {
        type: "object",
        properties: {
          caption: { type: "string", description: "Optional caption to accompany the menu image." }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_order",
      description: "Create a new order with items from the menu. Generates a UPI payment link automatically.",
      parameters: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                menu_item_id: { type: "string", description: "ID of the menu item from search_menu." },
                name: { type: "string", description: "Item name." },
                qty: { type: "number", description: "Quantity." },
                price: { type: "number", description: "Unit price." }
              }
            },
            description: "Items to order."
          },
          notes: { type: "string", description: "Optional notes for the order." }
        },
        required: ["items"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "confirm_payment",
      description: "Mark an order as paid after the customer confirms payment via UPI/cash.",
      parameters: {
        type: "object",
        properties: {
          order_id: { type: "string", description: "The order ID to confirm payment for." },
          payment_method: { type: "string", enum: ["upi", "cash"], description: "How the customer paid." }
        },
        required: ["order_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_order_status",
      description: "Check the status of an order by its ID.",
      parameters: {
        type: "object",
        properties: {
          order_id: { type: "string", description: "The order ID to check." }
        },
        required: ["order_id"]
      }
    }
  }
];
