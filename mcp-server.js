const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require("@modelcontextprotocol/sdk/types.js");
const fs = require("fs");
const path = require("path");

const server = new Server(
  {
    name: "editor-pro-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * List available tools.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "list_files",
        description: "List files in the project directory",
        inputSchema: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: "The directory path to list files from (relative to project root)",
              default: ".",
            },
          },
        },
      },
      {
        name: "read_file",
        description: "Read the content of a file",
        inputSchema: {
          type: "object",
          properties: {
            filepath: {
              type: "string",
              description: "The path of the file to read",
            },
          },
          required: ["filepath"],
        },
      },
    ],
  };
});

/**
 * Handle tool calls.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "list_files") {
      const dirPath = path.resolve(process.cwd(), args.path || ".");

      // Basic security: prevent reading outside project root
      if (!dirPath.startsWith(process.cwd())) {
        throw new Error("Access denied: path outside project root");
      }

      const files = fs.readdirSync(dirPath);
      return {
        content: [
          {
            type: "text",
            text: files.join("\n"),
          },
        ],
      };
    } else if (name === "read_file") {
      const filePath = path.resolve(process.cwd(), args.filepath);

      // Basic security: prevent reading outside project root
      if (!filePath.startsWith(process.cwd())) {
        throw new Error("Access denied: path outside project root");
      }

      const content = fs.readFileSync(filePath, "utf-8");
      return {
        content: [
          {
            type: "text",
            text: content,
          },
        ],
      };
    } else {
      throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Editor Pro MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
