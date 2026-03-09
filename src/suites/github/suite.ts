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
      id: "gh-official-mcp",
      displayName: "GitHub MCP Server",
      transport: "sse",
      url: "https://api.githubcopilot.com/mcp/",
      headers: {
        "Authorization": "Bearer ${GITHUB_PERSONAL_ACCESS_TOKEN}",
      },
      models: ["opus"],
    },
    {
      type: "mcp",
      id: "gh-stainless-mcp",
      displayName: "Stainless generated GitHub MCP Server",
      transport: "stdio",
      command: "npx",
      args: ["-y", "@stainless-api/github-internal-mcp"],
      env: {
        GITHUB_AUTH_TOKEN: "GH_TOKEN",
      },
      models: ["opus"],
    },
    {
      type: "mcp",
      id: "gh-modelcontextprotocol-mcp",
      displayName: "@modelcontextprotocol GitHub MCP Server",
      transport: "stdio",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-github"],
      env: {
        GITHUB_PERSONAL_ACCESS_TOKEN: "GITHUB_PERSONAL_ACCESS_TOKEN",
      },
      models: ["opus"],
    },
    {
      type: "both",
      id: "gh-both",
      displayName: "GitHub CLI + official MCP",
      command: "gh",
      description:
        "GitHub CLI for managing repos, issues, PRs, and more. Also has MCP API tools.",
      installCheck: "gh --version",
      authEnvVars: ["GH_TOKEN"],
      mcpServer: {
        transport: "sse",
        url: "https://api.githubcopilot.com/mcp/",
        headers: {
          "Authorization": "Bearer ${GITHUB_PERSONAL_ACCESS_TOKEN}",
        },
      },
      models: ["opus"],
    },
  ],
  testCases: [
    {
      id: "gh-list-issues",
      prompt:
        "List the 5 oldest open issues in the rails/rails repo. Return the issue number, title, and author for each.",
      expected: {
        description:
          "List the 5 oldest open issues in the rails/rails repo. Return the issue number, title, and author for each.",
        containsText: ["3508", "7047", "7218", "12940", "13873", "Railties::Engine.isolate_namespace"],
      },
      tags: ["read", "github"],
    },
    {
      id: "gh-repo-info",
      prompt:
        "Get info about the openai/symphony repo: its description, star count, and primary language.",
      expected: {
        description:
          "Returns the openai/symphony repo info including description which is something like (Symphony turns project work into isolated, autonomous implementation runs, allowing teams to manage work instead of supervising coding agents), star count, and primary language (Elixir).",
        containsText: ["openai", "Elixir"],
      },
      tags: ["read", "github"],
    },
    {
      id: "gh-search-repos",
      prompt:
        'Search for the top 3 most-starred repos matching "machine learning". Return the repo name and star count.',
      expected: {
        description:
          "Returns 3 repos related to machine learning sorted by stars, with star count which are all over 80,000.",
        containsText: ["tensorflow/tensorflow", "huggingface/transformers", "microsoft/ML-For-Beginners"],
      },
      tags: ["read", "github"],
    },
  //   {
  //     id: "gh-issue-comments",
  //     prompt:
  //       "Get all comments on issue #1 in the cli/cli repo. Return the comment author and body for each.",
  //     expected: {
  //       description:
  //         "Returns comments from issue #1 in cli/cli with authors and comment text.",
  //       containsText: ["Vadim0695"],
  //     },
  //     tags: ["read", "github"],
  //   },
  //   {
  //     id: "gh-file-deleted-pr",
  //     prompt:
  //       "Find the PR in kubernetes/kubernetes that deleted test/integration/scheduler_perf/create.go",
  //     expected: {
  //       description:
  //         "Returns information about the PR in kubernetes/kubernetes that deleted test/integration/scheduler_perf/create.go including the PR number which is 136980.",
  //       containsText: ["136980"],
  //     },
  //     tags: ["read", "github"],
  //   },
  //   {
  //     id: "gh-find-org-member",
  //     prompt:
  //       "Find the member of the microsoft org who's bio says they build Linux Apps for @elementary OS",
  //     expected: {
  //       description:
  //         "Returns information about Felipe Escoto who's github handle is Philip-Scott, the member of the microsoft org, who's bio says 'Senior Software Engineer @microsoft - Linux App Developer for @elementary OS'.",
  //       containsText: ["Philip-Scott"],
  //     },
  //     tags: ["read", "github"],
  //   },
  //   {
  //     id: "gh-readme",
  //     prompt:
  //       "Fetch the README.md from the anthropics/anthropic-cookbook repo and summarize its contents.",
  //     expected: {
  //       description:
  //         `Returns a summary from the anthropics/anthropic-cookbook README mentioning 'anthropic'. Example summary:   Purpose: A collection of code snippets and guides to help developers build with Claude, primarily in Python.                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                        
  // Prerequisites: A Claude API key (free signup). Recommends the https://github.com/anthropics/courses/tree/master/anthropic_api_fundamentals for beginners.                                                                                                                                                             
                                                                                                                                                                                                                                                                                                                        
  // Recipe categories:                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                        
  // ┌──────────────────────────┬────────────────────────────────────────────────────────────────────────────────────────┐                                                                                                                                                                                                 
  // │         Category         │                                         Topics                                         │
  // ├──────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────┤
  // │ Capabilities             │ Classification, RAG, Summarization                                                     │
  // ├──────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────┤
  // │ Tool Use                 │ Customer service agent, calculator integration, SQL queries                            │
  // ├──────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────┤
  // │ Third-Party Integrations │ Pinecone, Wikipedia, web pages, Voyage AI embeddings                                   │
  // ├──────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────┤
  // │ Multimodal               │ Vision (images, charts, forms), image generation with Stable Diffusion                 │
  // ├──────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────┤
  // │ Advanced Techniques      │ Sub-agents, PDF upload, automated evals, JSON mode, moderation filters, prompt caching │
  // └──────────────────────────┴────────────────────────────────────────────────────────────────────────────────────────┘

  // Community: Open to contributions via issues and PRs. Links to Anthropic docs, support, and Discord for further resources. Also references https://github.com/aws-samples/anthropic-on-aws for AWS-specific examples.`,
  //       containsText: ["Claude"],
  //     },
  //     tags: ["read", "github"],
  //   },
  //   {
  //     id: "gh-list-branches",
  //     prompt:
  //       "List all branches in the cli/cli repo.",
  //     expected: {
  //       description:
  //         "Returns a list of branches from cli/cli including the 'trunk' branch.",
  //       containsText: ["trunk", "3521-use-current-branch-as-ref-for-gh-workflow-run"],
  //     },
  //     tags: ["read", "github"],
  //   },
  ],
};

export default suite;
