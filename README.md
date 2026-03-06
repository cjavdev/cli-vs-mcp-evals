# CLI vs MCP Evaluation Harness

Head-to-head evaluation harness that runs the **same test cases** against both CLI (Bash tool) and MCP (MCP server tools) approaches, with results tracked in [Braintrust](https://braintrust.dev) for direct comparison.

## Why

There's active debate about whether AI agents perform better with CLIs or MCP servers. This harness answers that question empirically by running identical prompts through both approaches and comparing Factuality, Completeness, Efficiency, token usage, and cost.

## Setup

### Prerequisites

- Node.js 18+
- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) installed
- A Braintrust account

### Install

```bash
npm install
```

### Environment Variables

Copy the example and fill in your keys:

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `BRAINTRUST_API_KEY` | Your Braintrust API key |
| `ANTHROPIC_API_KEY` | Your Anthropic API key |
| `GH_TOKEN` | GitHub token for `gh` CLI |
| `GITHUB_PERSONAL_ACCESS_TOKEN` | GitHub token for MCP server (can be the same token) |

## Running Evals

### GitHub Suite

Runs 8 test cases against both `gh` CLI and GitHub MCP server:

```bash
npm run eval:github
```

This creates two experiments in Braintrust project `cli-vs-mcp-github`:
- `gh-cli-opus` (CLI approach)
- `gh-mcp-opus` (MCP approach)

### All Suites

```bash
npm run eval:all
```

### Custom Suite

```bash
EVAL_SUITE=github npm run eval
```

### Adding Tags

```bash
EVAL_TAGS=baseline,v1 npm run eval:github
```

## Comparing Results

1. Open the `cli-vs-mcp-github` project in Braintrust
2. Select both experiments (`gh-cli-opus` and `gh-mcp-opus`)
3. Use the **Compare** view to see row-by-row differences
4. Filter by `metadata.approachType` (`cli` or `mcp`) in dashboards

### Scored Metrics

| Scorer | Description |
|--------|-------------|
| **Factuality** | LLM-as-judge (autoevals) comparing output against expected description |
| **Completeness** | Heuristic check for expected text strings and field values |
| **Efficiency** | 50/50 weighted: turn count (1.0 at <=3, decay to 0 at 50) + token usage (1.0 at <=5K, decay to 0 at 500K) |

### Logged Metrics

`inputTokens`, `outputTokens`, `totalTokens`, `tool_calls`, `turnCount`, `wallClockMs`, `costUsd`

## Project Structure

```
src/
  suite.ts                      # Zod schemas, types, suite loader
  eval.ts                       # Braintrust Eval() loop over approaches
  agent/
    types.ts                    # AgentResult, ToolCallRecord, ModelConfig, AgentRunner
    models.ts                   # Model registry (opus, sonnet, haiku)
    cli-runner.ts               # CLI approach: Claude Agent SDK + Bash tool
    mcp-runner.ts               # MCP approach: Claude Agent SDK + MCP server tools
    span-utils.ts               # Braintrust child span logging
    index.ts                    # createRunner() factory
  scorers/
    completeness.ts             # Heuristic containsText/fieldValues
    correctness.ts              # Factuality LLM-as-judge (autoevals)
    efficiency.ts               # Turn count + token usage thresholds
  suites/
    index.ts                    # Auto-generated suite registry
    github/
      suite.ts                  # GitHub suite: 8 test cases, 2 approaches
  evals/
    e2e.eval.ts                 # Entry point: load suite, run evals
    run-all.ts                  # Orchestrator for all suites
scripts/
  generate-suite-index.ts       # Auto-generates src/suites/index.ts barrel
```

## Adding a New Suite

1. Create `src/suites/<name>/suite.ts` exporting a default `SuiteConfig`:

```ts
import type { SuiteConfig } from "../../suite.js";

const suite: SuiteConfig = {
  projectName: "cli-vs-mcp-<name>",
  systemPrompt: "...",
  approaches: [
    { type: "cli", id: "my-cli", command: "mytool", ... },
    { type: "mcp", id: "my-mcp", command: "npx", args: ["-y", "my-mcp-server"], ... },
  ],
  testCases: [ ... ],
};

export default suite;
```

2. Regenerate the suite barrel:

```bash
npm run generate:suites
```

3. Add a convenience script to `package.json`:

```json
"eval:<name>": "EVAL_SUITE=<name> npm run eval"
```

4. Run it:

```bash
npm run eval:<name>
```

## Other Commands

| Command | Description |
|---------|-------------|
| `npm run build` | Type-check and compile |
| `npm run lint` | Type-check only |
| `npm test` | Run tests (vitest) |
| `npm run format` | Format with Prettier |
| `npm run generate:suites` | Regenerate suite barrel file |
