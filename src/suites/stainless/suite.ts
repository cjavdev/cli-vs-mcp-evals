import type { SuiteConfig } from "../../suite.js";

const suite: SuiteConfig = {
  projectName: "cli-vs-mcp-stainless",

  systemPrompt:
    "You are a helpful assistant that works with the Stainless SDK generation platform. " +
    "Use the tools available to you to interact with Stainless and answer accurately.",

  approaches: [
    {
      type: "cli",
      id: "stl-cli",
      displayName: "Stainless CLI",
      command: "stl",
      description:
        "Stainless CLI for managing SDK generation, diagnostics, and builds.",
      installCheck: "stl --version",
      authEnvVars: ["STAINLESS_API_KEY"],
      models: ["opus"],
    },
    {
      type: "mcp",
      id: "stl-stainless-mcp",
      displayName: "Stainless MCP Server",
      transport: "stdio",
      command: "npx",
      args: ["-y", "@stainless-api/sdk-mcp"],
      env: {
        STAINLESS_API_KEY: "STAINLESS_API_KEY",
      },
      models: ["opus"],
    },
  ],

  testCases: [
    {
      id: "stl-list-diagnostics",
      prompt: "List the diagnostics for the stripe-minimal Stainless project in /Users/cjav_dev/commons/stripe.",
      expected: {
        description:
          "Returns a list of diagnostics for the Stainless project.",
        containsText: [],
      },
      tags: ["read", "stainless"],
    },
    {
      id: "stl-preview-build",
      prompt: "Run a preview build for the stripe-minimal Stainless project in /Users/cjav_dev/commons/stripe.",
      expected: {
        description:
          "Runs a preview build for the Stainless project and returns the result.",
        containsText: [],
      },
      tags: ["write", "stainless"],
    },
  ],
};

export default suite;
