import type { SuiteConfig } from "../../suite.js";

const suite: SuiteConfig = {
  projectName: "cli-vs-mcp-github",

  systemPrompt:
    "You are a helpful assistant that answers questions about GitHub repositories. " +
    "Use the tools available to you to fetch real data and answer accurately.",

  approaches: [
    {
      type: "cli",
      id: "gh-cli",
      displayName: "GitHub CLI",
      command: "gh",
      description:
        "GitHub CLI for managing repos, issues, PRs, and more. " +
        "Authenticate with GH_TOKEN or `gh auth login`.",
      installCheck: "gh --version",
      authEnvVars: ["GH_TOKEN"],
      models: ["opus"],
    },
    {
      type: "mcp",
      id: "gh-mcp",
      displayName: "GitHub MCP Server",
      transport: "sse",
      url: "https://api.githubcopilot.com/mcp/",
      headers: {
        "Authorization": "Bearer ${GITHUB_PERSONAL_ACCESS_TOKEN}",
      },
      models: ["opus"],
    },
    // {
    //   type: "mcp",
    //   id: "gh-mcp",
    //   displayName: "GitHub MCP Server",
    //   transport: "stdio",
    //   command: "npx",
    //   args: ["-y", "@modelcontextprotocol/server-github"],
    //   env: {
    //     GITHUB_PERSONAL_ACCESS_TOKEN: "GITHUB_PERSONAL_ACCESS_TOKEN",
    //   },
    //   models: ["opus"],
    // },
  ],

  testCases: [
    {
      id: "gh-list-issues",
      prompt:
        "List the 5 most recent open issues in the cli/cli repo. Return the issue number, title, and author for each.",
      expected: {
        description:
          "Returns 5 open issues from the cli/cli repo with issue numbers (prefixed with #), titles, and authors.",
        containsText: ["#"],
      },
      tags: ["read", "github"],
    },
    {
      id: "gh-repo-info",
      prompt:
        "Get info about the anthropics/anthropic-sdk-python repo: its description, star count, and primary language.",
      expected: {
        description:
          "Returns the anthropics/anthropic-sdk-python repo info including description (mentions 'anthropic'), star count, and primary language (Python).",
        containsText: ["anthropic", "Python"],
      },
      tags: ["read", "github"],
    },
    {
      id: "gh-search-repos",
      prompt:
        'Search for the top 3 most-starred repos matching "machine learning". Return the repo name and star count.',
      expected: {
        description:
          "Returns 3 repos related to machine learning sorted by stars, with star counts shown.",
        containsText: ["stars"],
      },
      tags: ["read", "github"],
    },
    {
      id: "gh-issue-comments",
      prompt:
        "Get all comments on issue #1 in the cli/cli repo. Return the comment author and body for each.",
      expected: {
        description:
          "Returns comments from issue #1 in cli/cli with authors and comment text.",
        containsText: ["cli/cli"],
      },
      tags: ["read", "github"],
    },
    {
      id: "gh-latest-release",
      prompt:
        "What is the latest release of vercel/next.js? Return the tag name, release date, and title.",
      expected: {
        description:
          "Returns the latest release of vercel/next.js with tag name, date, and title.",
        containsText: ["next"],
      },
      tags: ["read", "github"],
    },
    {
      id: "gh-recent-prs",
      prompt:
        "List the 5 most recently merged pull requests in the facebook/react repo. Return the PR number, title, and author.",
      expected: {
        description:
          "Returns 5 recently merged PRs from facebook/react with PR numbers (prefixed with #), titles, and authors.",
        containsText: ["#"],
      },
      tags: ["read", "github"],
    },
    {
      id: "gh-readme",
      prompt:
        "Fetch the README.md from the anthropics/anthropic-cookbook repo and summarize its contents.",
      expected: {
        description:
          "Returns content from the anthropics/anthropic-cookbook README mentioning 'anthropic'.",
        containsText: ["anthropic"],
      },
      tags: ["read", "github"],
    },
    {
      id: "gh-list-branches",
      prompt:
        "List all branches in the cli/cli repo.",
      expected: {
        description:
          "Returns a list of branches from cli/cli including the 'trunk' branch.",
        containsText: ["trunk"],
      },
      tags: ["read", "github"],
    },
  ],
};

export default suite;
