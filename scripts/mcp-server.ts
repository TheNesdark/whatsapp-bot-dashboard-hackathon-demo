import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

/**
 * MCP Server for testing the WhatsApp Bot Dashboard.
 * Exposes tools to simulate incoming messages and check bot state.
 */

const server = new Server(
  {
    name: "whatsapp-bot-tester",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const PORT = 3002;
const DEFAULT_PHONE_NUMBER_ID = "1010609672139087";

/**
 * List available tools.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "simulate_whatsapp_message",
        description: "Simulates an incoming WhatsApp message to the bot's webhook.",
        inputSchema: {
          type: "object",
          properties: {
            from: {
              type: "string",
              description: "The sender's WhatsApp number (e.g., '573001234567').",
            },
            body: {
              type: "string",
              description: "The message text.",
            },
            phoneNumberId: {
              type: "string",
              description: "The WhatsApp Business Account phone_number_id. Default is the Hospital one.",
            },
            type: {
              type: "string",
              enum: ["text", "button_reply", "list_reply"],
              description: "The type of message (text, button_reply, list_reply).",
            },
            payloadId: {
              type: "string",
              description: "The button ID or list item ID if type is button_reply or list_reply.",
            }
          },
          required: ["from", "body"],
        },
      },
      {
        name: "get_bot_status",
        description: "Checks if the bot server is reachable.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "operator_decision",
        description: "Simulates an operator's decision (approve/deny) on a registration.",
        inputSchema: {
          type: "object",
          properties: {
            registrationId: {
              type: "number",
              description: "The ID of the registration to decide on.",
            },
            decision: {
              type: "string",
              enum: ["approve", "deny"],
              description: "The decision (approve or deny).",
            },
            event: {
              type: "string",
              description: "Optional event name (default is 'approved' for approve and 'rejected' for deny).",
            }
          },
          required: ["registrationId", "decision"],
        },
      },
    ],
  };
});

/**
 * Handle tool execution.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "operator_decision") {
    const { registrationId, decision, event: customEvent } = args as any;
    const endpoint = decision === "approve" ? "approve" : "deny";
    const event = customEvent || (decision === "approve" ? "approved" : "rejected");

    try {
      const response = await fetch(`http://localhost:${PORT}/api/registrations/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: registrationId, event }),
      });

      if (response.ok) {
        return {
          content: [{ type: "text", text: `Operator ${decision} successful for registration ${registrationId}.` }],
        };
      } else {
        const error = await response.json();
        return {
          content: [{ type: "text", text: `Operator ${decision} failed: ${error.error || response.statusText}` }],
        };
      }
    } catch (err) {
      return {
        content: [{ type: "text", text: `Error calling operator endpoint: ${err instanceof Error ? err.message : String(err)}` }],
      };
    }
  }

  if (name === "get_bot_status") {
    try {
      const res = await fetch(`http://localhost:${PORT}/api/instances`); // Use a public healthcheck endpoint if available
      if (res.ok) {
        return {
          content: [{ type: "text", text: `Bot server is UP on port ${PORT}.` }],
        };
      }
      return {
        content: [{ type: "text", text: `Bot server responded with status ${res.status}.` }],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Bot server is DOWN or unreachable on port ${PORT}. Error: ${err instanceof Error ? err.message : String(err)}` }],
      };
    }
  }

  if (name === "simulate_whatsapp_message") {
    const { from, body, phoneNumberId = DEFAULT_PHONE_NUMBER_ID, type = "text", payloadId } = args as any;

    // Build mock Meta payload
    const mockPayload = {
      object: "whatsapp_business_account",
      entry: [
        {
          id: "WABA_ID",
          changes: [
            {
              value: {
                messaging_product: "whatsapp",
                metadata: {
                  display_phone_number: "573100000000",
                  phone_number_id: phoneNumberId,
                },
                contacts: [{ profile: { name: "Tester" }, wa_id: from }],
                messages: [
                  type === "text"
                    ? {
                        from,
                        id: `msg_${Date.now()}`,
                        timestamp: Math.floor(Date.now() / 1000).toString(),
                        text: { body },
                        type: "text",
                      }
                    : {
                        from,
                        id: `msg_${Date.now()}`,
                        timestamp: Math.floor(Date.now() / 1000).toString(),
                        type: "interactive",
                        interactive: {
                          type: type === "button_reply" ? "button_reply" : "list_reply",
                          [type === "button_reply" ? "button_reply" : "list_reply"]: {
                            id: payloadId || body,
                            title: body,
                          },
                        },
                      },
                ],
              },
              field: "messages",
            },
          ],
        },
      ],
    };

    try {
      const response = await fetch(`http://localhost:${PORT}/webhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mockPayload),
      });

      if (response.ok) {
        return {
          content: [{ type: "text", text: `Simulated message sent successfully to number ${from}. Check logs for bot response.` }],
        };
      } else {
        return {
          content: [{ type: "text", text: `Failed to send simulated message. Server returned ${response.status}.` }],
        };
      }
    } catch (err) {
      return {
        content: [{ type: "text", text: `Error sending simulated message: ${err instanceof Error ? err.message : String(err)}` }],
      };
    }
  }

  throw new Error(`Tool not found: ${name}`);
});

/**
 * Start the server using stdio.
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("WhatsApp Bot Tester MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in MCP server:", error);
  process.exit(1);
});
