#!/usr/bin/env node
// Manual smoke-test harness for the local dist build.
// Usage: node scripts/manual-test.mjs <tool_name> '<json_params>'
//        node scripts/manual-test.mjs --list

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { LoggingMessageNotificationSchema } from "@modelcontextprotocol/sdk/types.js";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverPath = resolve(__dirname, "../dist/index.js");

const [, , toolName, paramsJson] = process.argv;
const listMode = toolName === "--list" || !toolName;

const transport = new StdioClientTransport({
  command: "node",
  args: [serverPath],
});

const client = new Client(
  { name: "manual-test", version: "0.0.0" },
  { capabilities: { logging: {} } },
);

client.setNotificationHandler(LoggingMessageNotificationSchema, async (n) => {
  console.error("[log]", JSON.stringify(n.params, null, 2));
});

client.fallbackNotificationHandler = async (notification) => {
  console.error("[notification]", JSON.stringify(notification, null, 2));
};

await client.connect(transport);
console.error("[connected]");

if (listMode) {
  const tools = await client.listTools();
  console.log(JSON.stringify(tools, null, 2));
  await client.close();
  process.exit(0);
}

const args = paramsJson ? JSON.parse(paramsJson) : {};
console.error(`[calling] ${toolName} ${JSON.stringify(args)}`);
const result = await client.callTool({ name: toolName, arguments: args });
console.log(JSON.stringify(result, null, 2));
await client.close();
