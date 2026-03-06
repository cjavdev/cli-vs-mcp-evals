export type {
  AgentRunner,
  AgentResult,
  AgentRunnerOptions,
  ToolCallRecord,
  ModelConfig,
  Provider,
} from "./types.js";
export type { ModelAlias } from "./models.js";
export { MODEL_ALIASES } from "./models.js";
export { CLIRunner } from "./cli-runner.js";
export { MCPRunner } from "./mcp-runner.js";
export { resolveModel } from "./models.js";

import type { AgentRunner } from "./types.js";
import type { Approach } from "../suite.js";
import { CLIRunner } from "./cli-runner.js";
import { MCPRunner } from "./mcp-runner.js";

export function createRunner(approach: Approach): AgentRunner {
  return approach.type === "cli" ? new CLIRunner() : new MCPRunner();
}
