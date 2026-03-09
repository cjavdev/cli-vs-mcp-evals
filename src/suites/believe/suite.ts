import type { SuiteConfig } from "../../suite.js";

const suite: SuiteConfig = {
  projectName: "cli-vs-mcp-believe",

  systemPrompt:
    "You are a helpful assistant that answers questions about the Ted Lasso universe using the Believe API. " +
    "Use the tools available to you to fetch real data and answer accurately.",

  approaches: [
    {
      type: "cli",
      id: "believe-cli",
      displayName: "Believe CLI",
      command: "believe",
      description:
        "Believe CLI for querying the Ted Lasso API. " +
        "Authenticate with BELIEVE_API_KEY env var.",
      installCheck: "believe --version",
      authEnvVars: ["BELIEVE_API_KEY"],
      models: ["opus"],
    },
    {
      type: "mcp",
      id: "believe-stainless-mcp",
      displayName: "Stainless generated Believe MCP Server",
      transport: "stdio",
      command: "npx",
      args: ["-y", "@cjavdev/believe-mcp@latest"],
      env: {
        BELIEVE_API_KEY: "BELIEVE_API_KEY",
        STAINLESS_API_KEY: "BELIEVE_STAINLESS_API_KEY",
      },
      models: ["opus"],
    },
  ],

  testCases: [
    {
      id: "believe-list-characters",
      prompt:
        "List all Ted Lasso characters and return their names and roles.",
      expected: {
        description:
          "Returns a list of Ted Lasso characters including their names and roles.",
        containsText: ["Ted Lasso", "Rebecca"],
      },
      tags: ["read", "believe"],
    },
    {
      id: "believe-list-teams",
      prompt:
        "List all teams in the league and return their names.",
      expected: {
        description:
          "Returns a list of teams in the league including their names.",
        containsText: ["AFC Richmond"],
      },
      tags: ["read", "believe"],
    },
    {
      id: "believe-list-episodes",
      prompt:
        "List all episodes from season 1 of Ted Lasso. Return the episode title and number for each.",
      expected: {
        description:
          "Returns a list of season 1 episodes with episode numbers and titles.",
        containsText: ["Pilot"],
      },
      tags: ["read", "believe"],
    },
    {
      id: "believe-get-random-quote",
      prompt:
        "Get a random Ted Lasso quote. Return the quote text and which character said it.",
      expected: {
        description:
          "Returns a quote with the text and the character who said it.",
        containsText: [],
      },
      tags: ["read", "believe"],
    },
    {
      id: "believe-list-biscuits",
      prompt:
        "List Ted's famous biscuits. Return the biscuit name and message for each.",
      expected: {
        description:
          "Returns a list of biscuits with names and heartwarming messages.",
        containsText: [],
      },
      tags: ["read", "believe"],
    },
    {
      id: "believe-list-coaching-principles",
      prompt: "List Ted Lasso's coaching principles.",
      expected: {
        description: "Returns a list of coaching principles.",
        containsText: [],
      },
      tags: ["read", "believe"],
    },
    {
      id: "believe-biscuit-pairing",
      prompt: "According to Rebecca, what does an Oatmeal Rasin biscuit go well with?",
      expected: {
        description: "Returns something about Earl Gray tea and quiet reflection.",
        containsText: ["Earl Gray Tea"],
      },
      tags: ["read", "believe"],
    },
    {
      id: "believe-salary",
      prompt: "What's the salary of the player who brings poutine to team events? Name the player and their salary.",
      expected: {
        description: "Returns the salary of Thierry Zoreaux which is 1200000.00 GBP.",
        containsText: ["Zoreaux"],
      },
      tags: ["read", "believe"],
    },
  ],
};

export default suite;
