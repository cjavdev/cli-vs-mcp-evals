import { Eval, currentSpan } from "braintrust";
import { Factuality } from "autoevals";

import { createRunner, resolveModel } from "./agent/index.js";
import { scoreCompleteness } from "./scorers/completeness.js";
import { scoreEfficiency } from "./scorers/efficiency.js";
import type { SuiteConfig, TestCase } from "./suite.js";

export interface RunEvalsOptions {
  tags?: string[];
}

// Collect tagging promises so we can ensure they complete before process exit
const tagPromises: Promise<void>[] = [];

async function tagExperiment(experimentId: string, tags: string[]) {
  const apiUrl = process.env.BRAINTRUST_API_URL ?? "https://api.braintrust.dev";
  const res = await fetch(`${apiUrl}/v1/experiment/${experimentId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.BRAINTRUST_API_KEY}`,
    },
    body: JSON.stringify({ tags }),
  });
  if (!res.ok) {
    console.error(
      `Failed to tag experiment ${experimentId}: ${res.status} ${await res.text()}`,
    );
  }
}

process.on("beforeExit", async () => {
  await Promise.allSettled(tagPromises);
});

export function runEvals(suite: SuiteConfig, options?: RunEvalsOptions): void {
  const evalTags: string[] = options?.tags ?? [];

  for (const approach of suite.approaches) {
    const modelAliases = approach.models ?? ["opus"];
    const approachTags: string[] = approach.tags ?? [];

    for (const alias of modelAliases) {
      const modelConfig = resolveModel(alias);
      const runner = createRunner(approach);
      const experimentName = `${approach.id}-${modelConfig.alias}`;
      const experimentTags = [...new Set([...approachTags, ...evalTags])];
      let taggedExperiment = false;

      Eval(suite.projectName, {
        experimentName,
        maxConcurrency: 2,
        metadata: {
          name: experimentName,
          approachId: approach.id,
          approachType: approach.type,
          model: modelConfig.alias,
          provider: modelConfig.provider,
          modelId: modelConfig.modelId,
          approach: "e2e",
          approachTags,
        },
        data: () =>
          suite.testCases.map((tc) => ({
            input: {
              prompt: tc.prompt,
              testCaseId: tc.id,
              tags: tc.tags,
            },
            tags: tc.tags,
            expected: tc.expected.description,
            metadata: {
              testCaseId: tc.id,
              approachId: approach.id,
              approachType: approach.type,
              model: modelConfig.alias,
              tags: tc.tags,
            },
          })),
        task: async (input, { span }) => {
          // Tag the experiment once via REST API on the first task invocation
          if (!taggedExperiment && experimentTags.length > 0) {
            taggedExperiment = true;
            const parentId = await (span as any).parentObjectId?.get?.();
            if (parentId) {
              tagPromises.push(tagExperiment(parentId, experimentTags));
            }
          }

          let result;
          try {
            result = await runner.run(input.prompt, approach, {
              systemPrompt: suite.systemPrompt,
              model: modelConfig,
            });
          } catch (err) {
            console.error(
              `[${approach.id}/${modelConfig.alias}] Task "${input.testCaseId}" failed:`,
              err,
            );
            throw err;
          }

          // Detect tool isolation violations
          const toolNames = result.toolCalls.map((tc) => tc.name);
          const violations: string[] = [];
          if (approach.type === "mcp") {
            const bashCalls = toolNames.filter((n) => n === "Bash");
            if (bashCalls.length > 0) {
              violations.push(`MCP approach used Bash tool ${bashCalls.length} time(s)`);
            }
            const nonMcpCalls = toolNames.filter(
              (n) => n !== "ToolSearch" && !n.startsWith("mcp__"),
            );
            if (nonMcpCalls.length > 0) {
              violations.push(`MCP approach used non-MCP tools: ${[...new Set(nonMcpCalls)].join(", ")}`);
            }
          } else if (approach.type === "cli") {
            const mcpCalls = toolNames.filter(
              (n) => n === "ToolSearch" || n.startsWith("mcp__"),
            );
            if (mcpCalls.length > 0) {
              violations.push(`CLI approach used MCP tools: ${[...new Set(mcpCalls)].join(", ")}`);
            }
            const nonBashCalls = toolNames.filter((n) => n !== "Bash");
            if (nonBashCalls.length > 0) {
              violations.push(`CLI approach used non-Bash tools: ${[...new Set(nonBashCalls)].join(", ")}`);
            }
          } else if (approach.type === "both") {
            const disallowedCalls = toolNames.filter(
              (n) => n !== "Bash" && n !== "ToolSearch" && !n.startsWith("mcp__"),
            );
            if (disallowedCalls.length > 0) {
              violations.push(`Both approach used disallowed tools: ${[...new Set(disallowedCalls)].join(", ")}`);
            }
          }

          // Log raw metrics to Braintrust
          currentSpan().log({
            metrics: {
              inputTokens: result.inputTokens,
              outputTokens: result.outputTokens,
              totalTokens: result.inputTokens + result.outputTokens,
              tool_calls: result.toolCalls.length,
              turnCount: result.turnCount,
              wallClockMs: result.wallClockMs,
              costUsd: result.costUsd,
            },
            metadata: {
              model: modelConfig.alias,
              modelId: result.model,
              provider: modelConfig.provider,
              approachType: approach.type,
              toolViolations: violations,
              toolViolationCount: violations.length,
            },
          });

          // Return structured output for scorers
          return JSON.stringify({
            finalText: result.finalText,
            toolCalls: result.toolCalls,
            turnCount: result.turnCount,
            totalTokens: result.inputTokens + result.outputTokens,
            approachType: approach.type,
          });
        },
        scores: [
          // Factuality (LLM-as-judge)
          async (args: { input: any; output: string; expected?: string }) => {
            let outputText: string;
            try {
              const parsed = JSON.parse(args.output);
              outputText = parsed.finalText ?? args.output;
            } catch {
              outputText = args.output;
            }
            return Factuality({
              input: args.input.prompt,
              output: outputText,
              expected: args.expected,
            });
          },
          // Completeness scorer
          (args: { input: any; output: string; expected?: string }) => {
            const tc = suite.testCases.find(
              (t) => t.id === args.input.testCaseId,
            ) as TestCase;
            const expected = tc.expected;
            let outputText: string;
            try {
              const parsed = JSON.parse(args.output);
              outputText =
                parsed.finalText + "\n" + JSON.stringify(parsed.toolCalls);
            } catch {
              outputText = args.output;
            }
            return {
              name: "Completeness",
              score: scoreCompleteness(outputText, expected),
            };
          },
          // Efficiency scorer
          (args: { input: any; output: string; expected?: string }) => {
            let turnCount = 50;
            let totalTokens = 500_000;
            try {
              const parsed = JSON.parse(args.output);
              turnCount = parsed.turnCount ?? 50;
              totalTokens = parsed.totalTokens ?? 500_000;
            } catch {
              // Use worst-case defaults
            }
            return {
              name: "Efficiency",
              score: scoreEfficiency({ turnCount, totalTokens }),
            };
          },
          // Tool isolation scorer: 1.0 if only permitted tools were used, 0 otherwise
          (args: { input: any; output: string; expected?: string }) => {
            let toolCalls: { name: string }[] = [];
            let approachType = "";
            try {
              const parsed = JSON.parse(args.output);
              toolCalls = parsed.toolCalls ?? [];
              approachType = parsed.approachType ?? "";
            } catch {
              return { name: "ToolIsolation", score: 1 };
            }
            const toolNames = toolCalls.map((tc) => tc.name);
            if (approachType === "mcp") {
              const hasViolation = toolNames.some(
                (n) => n !== "ToolSearch" && !n.startsWith("mcp__"),
              );
              return { name: "ToolIsolation", score: hasViolation ? 0 : 1 };
            }
            if (approachType === "cli") {
              const hasViolation = toolNames.some((n) => n !== "Bash");
              return { name: "ToolIsolation", score: hasViolation ? 0 : 1 };
            }
            if (approachType === "both") {
              const hasViolation = toolNames.some(
                (n) => n !== "Bash" && n !== "ToolSearch" && !n.startsWith("mcp__"),
              );
              return { name: "ToolIsolation", score: hasViolation ? 0 : 1 };
            }
            return { name: "ToolIsolation", score: 1 };
          },
        ],
      });
    }
  }
}
