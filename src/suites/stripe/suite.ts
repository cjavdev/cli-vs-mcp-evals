import type { SuiteConfig } from "../../suite.js";

const suite: SuiteConfig = {
  projectName: "cli-vs-mcp-stripe",

  systemPrompt:
    "You are a helpful assistant that works with Stripe's payment platform. " +
    "Use the tools available to you to interact with Stripe and answer accurately.",

  approaches: [
    {
      type: "cli",
      id: "stripe-cli",
      displayName: "Stripe CLI",
      command: "stripe",
      description:
        "Stripe CLI for managing payments, customers, and more.",
      installCheck: "stripe --version",
      authEnvVars: ["STRIPE_API_KEY"],
      models: ["opus"],
    },
    {
      type: "mcp",
      id: "stripe-official-mcp",
      displayName: "Stripe Official MCP Server",
      transport: "stdio",
      command: "npx",
      args: ["-y", "@stripe/mcp"],
      env: {
        STRIPE_API_KEY: "STRIPE_API_KEY",
      },
      models: ["opus"],
    },
    {
      type: "mcp",
      id: "stripe-stainless-mcp",
      displayName: "Stainless generated Stripe MCP Server",
      transport: "stdio",
      command: "node",
      args: [
        "/Users/cjav_dev/commons/stripe/stripe-typescript/packages/mcp-server/dist/index.js",
      ],
      env: {
        STRIPE_API_KEY: "STRIPE_API_KEY",
        STAINLESS_API_KEY: "STAINLESS_API_KEY",
      },
      models: ["opus"],
    },
  ],

  testCases: [
    {
      id: "stripe-list-customers",
      prompt: "List the most recent 5 customers.",
      expected: {
        description:
          "Returns a list of the 5 most recent customers from Stripe.",
        containsText: [],
      },
      tags: ["read", "stripe"],
    },
    {
      id: "stripe-list-charges",
      prompt: "List the most recent charges.",
      expected: {
        description:
          "Returns a list of the most recent charges from Stripe.",
        containsText: [],
      },
      tags: ["read", "stripe"],
    },
  ],
};

export default suite;
