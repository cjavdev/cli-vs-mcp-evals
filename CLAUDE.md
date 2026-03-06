# CLI vs MCP Evaluation Harness

Head-to-head evaluation harness comparing CLI and MCP approaches for AI agent tasks, with results tracked in Braintrust.

## Structure

- `src/suite.ts` - Zod schemas, types, and suite loader
- `src/eval.ts` - Braintrust Eval() loop over approaches
- `src/agent/` - Agent runners (CLI via Bash tool, MCP via MCP servers)
- `src/scorers/` - Factuality, Completeness, Efficiency scorers
- `src/suites/` - Test suites (e.g., `github/`)
- `src/evals/` - Entry points for running evals
- `scripts/` - Suite index generator

## Commands

- `npm run build` - Type-check and compile
- `npm run eval:github` - Run GitHub suite
- `npm run eval:all` - Run all suites
- `npm run generate:suites` - Regenerate suite barrel file
- `npm test` - Run tests

## Adding a new suite

1. Create `src/suites/<name>/suite.ts` exporting a `SuiteConfig`
2. Run `npm run generate:suites` to update the barrel
3. Add an `eval:<name>` script to package.json
