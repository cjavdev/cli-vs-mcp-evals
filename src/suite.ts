import path from "path";
import { pathToFileURL } from "url";
import { z } from "zod";
import { MODEL_ALIASES } from "./agent/models.js";
import type { ModelAlias } from "./agent/models.js";
import suiteModules from "./suites/index.js";

// -- Zod schemas --

const ModelAliasSchema = z.enum(MODEL_ALIASES);

const BaseApproachSchema = z.object({
  displayName: z.string(),
  models: z.array(ModelAliasSchema).optional(),
  tags: z.array(z.string()).optional(),
});

export const CLIApproachSchema = BaseApproachSchema.extend({
  type: z.literal("cli"),
  id: z.string(),
  command: z.string(),
  description: z.string(),
  installCheck: z.string(),
  authEnvVars: z.array(z.string()),
});

export const MCPApproachSchema = BaseApproachSchema.extend({
  type: z.literal("mcp"),
  id: z.string(),
  transport: z.enum(["stdio", "sse"]).default("stdio"),
  // stdio fields
  command: z.string().optional(),
  args: z.array(z.string()).optional(),
  env: z.record(z.string(), z.string()).optional(),
  // sse/remote fields
  url: z.string().optional(),
  headers: z.record(z.string(), z.string()).optional(),
});

export const ApproachSchema = z.discriminatedUnion("type", [
  CLIApproachSchema,
  MCPApproachSchema,
]);

export const ExpectedResultSchema = z.object({
  description: z.string(),
  containsText: z.array(z.string()).optional(),
  fieldValues: z.record(z.string(), z.unknown()).optional(),
});

export const TestCaseSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  expected: ExpectedResultSchema,
  tags: z.array(z.string()),
});

export const SuiteConfigSchema = z.object({
  projectName: z.string(),
  systemPrompt: z.string(),
  approaches: z.array(ApproachSchema),
  testCases: z.array(TestCaseSchema),
});

// -- TypeScript types --

export interface CLIApproach {
  type: "cli";
  id: string;
  displayName: string;
  command: string;
  description: string;
  installCheck: string;
  authEnvVars: string[];
  models?: ModelAlias[];
  tags?: string[];
}

export interface MCPApproach {
  type: "mcp";
  id: string;
  displayName: string;
  transport: "stdio" | "sse";
  // stdio fields
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  // sse/remote fields
  url?: string;
  headers?: Record<string, string>;
  models?: ModelAlias[];
  tags?: string[];
}

export type Approach = CLIApproach | MCPApproach;
export type ExpectedResult = z.infer<typeof ExpectedResultSchema>;
export type TestCase = z.infer<typeof TestCaseSchema>;

export interface SuiteConfig {
  projectName: string;
  systemPrompt: string;
  approaches: Approach[];
  testCases: TestCase[];
}

// -- Loader --

export async function loadSuite(name?: string): Promise<SuiteConfig> {
  const suiteName = name ?? process.env.EVAL_SUITE ?? "github";

  // If the name contains path separators, treat it as a file path
  if (path.basename(suiteName) !== suiteName) {
    const resolved = path.resolve(suiteName);
    const mod = await import(pathToFileURL(resolved).href);
    return SuiteConfigSchema.parse(mod.default);
  }

  const raw = suiteModules[suiteName];
  if (!raw) {
    throw new Error(
      `Unknown suite "${suiteName}". Available: ${Object.keys(suiteModules).join(", ")}`,
    );
  }
  return SuiteConfigSchema.parse(raw);
}
