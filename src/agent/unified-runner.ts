import os from "os";
import path from "path";
import { query } from "@anthropic-ai/claude-agent-sdk";
import type {
  SDKAssistantMessage,
  SDKResultSuccess,
  SDKResultError,
} from "@anthropic-ai/claude-agent-sdk";
import { logToolCallSpan } from "./span-utils.js";
import type { Approach, MCPApproach, BothApproach, MCPServerConfig } from "../suite.js";
import type { ModelConfig } from "./types.js";
import type {
  AgentResult,
  AgentRunner,
  AgentRunnerOptions,
  ToolCallRecord,
} from "./types.js";

const DEFAULT_MODEL: ModelConfig = {
  alias: "opus",
  modelId: "claude-opus-4-6",
  provider: "anthropic",
  displayName: "Claude Opus 4.6",
};

const DEFAULT_MAX_TURNS = 30;

function buildSystemPrompt(approach: Approach, base?: string): string {
  if (approach.type === "cli") {
    const basePrompt =
      base ??
      "You are a helpful assistant with access to a CLI tool via the Bash tool. " +
        "Use the Bash tool to run CLI commands and answer questions accurately based on actual data.";
    return (
      `${basePrompt}\n\n` +
      `You have access to the "${approach.command}" CLI tool. ${approach.description}\n` +
      `Only run commands using "${approach.command}". Do not use any other CLI tools or MCP tools.\n` +
      `If the command fails, report the failure instead of trying alternative approaches.`
    );
  }

  if (approach.type === "mcp") {
    return (
      base ??
      "You are a helpful assistant with access to API tools via MCP. " +
        "IMPORTANT: MCP tools are deferred and must be discovered before use. " +
        "Before answering, use the ToolSearch tool to find available MCP tools " +
        "(e.g., search with a keyword like 'github' or 'mcp'). " +
        "Once discovered, use those MCP tools to answer questions accurately based on actual data. " +
        "CRITICAL: You must ONLY use MCP tools (prefixed with mcp__) and ToolSearch. " +
        "Do NOT use the Bash tool, CLI commands, or any non-MCP tools. " +
        "If MCP tools fail or are unavailable, report the failure instead of falling back to other tools."
    );
  }

  // "both" approach
  const bothApproach = approach as BothApproach;
  const basePrompt =
    base ??
    "You are a helpful assistant with access to both CLI tools and MCP API tools.";
  return (
    `${basePrompt}\n\n` +
    `You have access to the "${bothApproach.command}" CLI tool via Bash. ${bothApproach.description}\n` +
    `You also have access to MCP API tools. Use ToolSearch to discover available MCP tools.\n` +
    `Use whichever approach (CLI, MCP, or both) is most effective for the task.`
  );
}

function buildToolConfig(approach: Approach): {
  tools?: string[];
  allowedTools: string[];
  disallowedTools: string[];
} {
  if (approach.type === "cli") {
    return {
      tools: ["Bash"],
      allowedTools: ["Bash"],
      disallowedTools: [
        "ToolSearch", "mcp__*", "Read", "Grep", "Glob", "Edit", "Write",
        "WebFetch", "WebSearch", "Agent",
      ],
    };
  }

  if (approach.type === "mcp") {
    return {
      allowedTools: ["ToolSearch", "mcp__*"],
      disallowedTools: [
        "Bash", "Read", "Grep", "Glob", "Edit", "Write", "NotebookEdit",
        "WebFetch", "WebSearch", "Agent",
      ],
    };
  }

  // "both" approach
  return {
    tools: ["Bash"],
    allowedTools: ["Bash", "ToolSearch", "mcp__*"],
    disallowedTools: [
      "Read", "Grep", "Glob", "Edit", "Write", "NotebookEdit",
      "WebFetch", "WebSearch", "Agent",
    ],
  };
}

function buildMcpServerConfig(
  serverConfig: MCPServerConfig,
  serverId: string,
): Record<string, unknown> {
  if (serverConfig.transport === "sse" && serverConfig.url) {
    const resolvedHeaders: Record<string, string> = {};
    if (serverConfig.headers) {
      for (const [key, value] of Object.entries(serverConfig.headers)) {
        resolvedHeaders[key] = value.replace(
          /\$\{(\w+)\}/g,
          (_match, varName) => process.env[varName] ?? "",
        );
      }
    }
    return {
      type: "sse",
      url: serverConfig.url,
      headers: resolvedHeaders,
    };
  }

  // stdio server
  const mcpEnv: Record<string, string> = {};
  if (serverConfig.env) {
    for (const [key, envVarName] of Object.entries(serverConfig.env)) {
      mcpEnv[key] = process.env[envVarName] ?? envVarName;
    }
  }
  return {
    type: serverConfig.transport,
    command: serverConfig.command!,
    args: serverConfig.args ?? [],
    env: mcpEnv,
  };
}

function buildMcpServers(
  approach: Approach,
): Record<string, Record<string, unknown>> | undefined {
  if (approach.type === "cli") {
    return undefined;
  }

  if (approach.type === "mcp") {
    const mcp = approach as MCPApproach;
    return {
      [mcp.id]: buildMcpServerConfig(
        {
          transport: mcp.transport,
          command: mcp.command,
          args: mcp.args,
          env: mcp.env,
          url: mcp.url,
          headers: mcp.headers,
        },
        mcp.id,
      ),
    };
  }

  // "both" approach
  const both = approach as BothApproach;
  return {
    [both.id]: buildMcpServerConfig(both.mcpServer, both.id),
  };
}

export class UnifiedRunner implements AgentRunner {
  async run(
    prompt: string,
    approach: Approach,
    options?: AgentRunnerOptions,
  ): Promise<AgentResult> {
    const modelConfig = options?.model ?? DEFAULT_MODEL;
    const maxTurns = options?.maxTurns ?? DEFAULT_MAX_TURNS;
    const startTime = Date.now();

    const systemPrompt = buildSystemPrompt(approach, options?.systemPrompt);
    const toolConfig = buildToolConfig(approach);
    const mcpServers = buildMcpServers(approach);

    const toolCalls: ToolCallRecord[] = [];
    const pendingToolUses = new Map<
      string,
      { name: string; args: Record<string, unknown>; startTime: number }
    >();

    const queryOptions: Record<string, unknown> = {
      model: modelConfig.modelId,
      maxTurns,
      systemPrompt,
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
      persistSession: false,
      pathToClaudeCodeExecutable:
        process.env.CLAUDE_CODE_PATH ??
        path.join(os.homedir(), ".local", "bin", "claude"),
      allowedTools: toolConfig.allowedTools,
      disallowedTools: toolConfig.disallowedTools,
    };

    if (toolConfig.tools) {
      queryOptions.tools = toolConfig.tools;
    }
    if (mcpServers) {
      queryOptions.mcpServers = mcpServers;
    }
    if (modelConfig.betas?.length) {
      queryOptions.betas = modelConfig.betas;
    }

    const result = query({
      prompt,
      options: queryOptions as any,
    });

    for await (const message of result) {
      if (message.type === "assistant") {
        const assistantMsg = message as SDKAssistantMessage;
        const content = assistantMsg.message?.content;
        if (Array.isArray(content)) {
          for (const block of content) {
            if (
              typeof block === "object" &&
              block !== null &&
              "type" in block &&
              block.type === "tool_use" &&
              "id" in block &&
              "name" in block
            ) {
              const toolUseBlock = block as {
                type: "tool_use";
                id: string;
                name: string;
                input: unknown;
              };
              pendingToolUses.set(toolUseBlock.id, {
                name: toolUseBlock.name,
                args: (toolUseBlock.input as Record<string, unknown>) ?? {},
                startTime: Date.now(),
              });
            }
          }
        }
      }

      if (message.type === "user" && !("isReplay" in message)) {
        const content = (message as any).message?.content;
        if (Array.isArray(content)) {
          for (const block of content) {
            if (
              typeof block === "object" &&
              block !== null &&
              "type" in block &&
              block.type === "tool_result" &&
              "tool_use_id" in block
            ) {
              const toolResultBlock = block as {
                type: "tool_result";
                tool_use_id: string;
                content?: unknown;
              };
              const pending = pendingToolUses.get(toolResultBlock.tool_use_id);
              if (pending) {
                const resultText =
                  typeof toolResultBlock.content === "string"
                    ? toolResultBlock.content
                    : JSON.stringify(toolResultBlock.content ?? "");
                const durationMs = Date.now() - pending.startTime;
                const endTime = Date.now();

                const record: ToolCallRecord = {
                  name: pending.name,
                  args: pending.args,
                  result: resultText,
                  durationMs,
                };
                toolCalls.push(record);

                try {
                  logToolCallSpan({
                    name: pending.name,
                    input: pending.args,
                    output: resultText,
                    startTimeMs: pending.startTime,
                    endTimeMs: endTime,
                  });
                } catch {
                  // No active span context
                }

                pendingToolUses.delete(toolResultBlock.tool_use_id);
              }
            }
          }
        }
      }

      if (message.type === "result") {
        if (message.subtype === "success") {
          const success = message as SDKResultSuccess;
          return {
            finalText: success.result,
            toolCalls,
            wallClockMs: success.duration_ms,
            inputTokens: success.usage.input_tokens,
            outputTokens: success.usage.output_tokens,
            turnCount: success.num_turns,
            costUsd: success.total_cost_usd,
            model: modelConfig.modelId,
          };
        } else {
          const error = message as SDKResultError;
          return {
            finalText: `[Agent error: ${error.subtype}] ${error.errors?.join("; ") ?? ""}`,
            toolCalls,
            wallClockMs: error.duration_ms,
            inputTokens: error.usage.input_tokens,
            outputTokens: error.usage.output_tokens,
            turnCount: error.num_turns,
            costUsd: error.total_cost_usd,
            model: modelConfig.modelId,
          };
        }
      }
    }

    return {
      finalText: "[No result received from agent]",
      toolCalls,
      wallClockMs: Date.now() - startTime,
      inputTokens: 0,
      outputTokens: 0,
      turnCount: 0,
      costUsd: 0,
      model: modelConfig.modelId,
    };
  }
}
