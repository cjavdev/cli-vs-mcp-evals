import type { Approach } from "../suite.js";
import type { ModelAlias } from "./models.js";

export type Provider = "anthropic";

export interface ModelConfig {
  alias: ModelAlias;
  modelId: string;
  provider: Provider;
  displayName: string;
  betas?: string[];
}

export interface ToolCallRecord {
  name: string;
  args: Record<string, unknown>;
  result: string;
  durationMs?: number;
}

export interface AgentResult {
  finalText: string;
  toolCalls: ToolCallRecord[];
  wallClockMs: number;
  inputTokens: number;
  outputTokens: number;
  turnCount: number;
  costUsd: number;
  model: string;
}

export interface AgentRunnerOptions {
  maxTurns?: number;
  model?: ModelConfig;
  systemPrompt?: string;
}

export interface AgentRunner {
  run(
    prompt: string,
    approach: Approach,
    options?: AgentRunnerOptions,
  ): Promise<AgentResult>;
}
