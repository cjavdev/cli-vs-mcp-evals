import type { SuiteConfig } from "../../suite.js";

const suite: SuiteConfig = {
  projectName: "cli-vs-mcp-believe",

  systemPrompt:
    "You are a helpful assistant that works with the Believe API, a Ted Lasso-themed API. " +
    "Use the tools available to you to fetch real data, answer questions accurately, " +
    "and write code that integrates with the API when asked.",

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
    {
      id: "believe-ticket-counts",
      prompt: "How many tickets did Isla Fernandez buy?",
      expected: {
        description: "Returns the number of tickets Isla Fernandez bought: 6.",
        containsText: ["6"],
      },
      tags: ["read", "believe"],
    },
    {
      id: "believe-match-revenue",
      prompt: "What was the total sales for tickets for match 7 in GBP, USD, and EUR respectively?",
      expected: {
        description: "Returns the total sales for tickets for match 7.",
        containsText: ["GBP", "USD", "EUR", "9841.50", "315.90", "1028.70"],
      },
      tags: ["read", "believe"],
    },
    {
      id: "believe-sdk-typescript",
      prompt:
        "Write a TypeScript file called believe_teams.ts that uses the official Believe TypeScript SDK to fetch all teams, " +
        "fetch their matches, and calculate total ticket revenue per match. Install the SDK using npm. " +
        "Print each team name with match details and total revenue.",
      expected: {
        description:
          "The agent should install the Believe TypeScript SDK via npm, write a believe_teams.ts file that " +
          "imports the SDK, initializes the client with the API key, fetches all teams, iterates through each " +
          "team's matches, calculates total ticket revenue per match, and prints formatted output with team names, " +
          "match details, and revenue totals.",
        containsText: ["believe_teams.ts", "believe", "npm"],
      },
      tags: ["write", "integration", "believe"],
    },
    {
      id: "believe-sdk-python",
      prompt:
        "Write a Python file called believe_teams.py that uses the official Believe Python SDK to fetch all teams, " +
        "fetch their matches, and calculate total ticket revenue per match. Install the SDK using pip. " +
        "Print each team name with match details and total revenue.",
      expected: {
        description:
          "The agent should install the Believe Python SDK via pip, write a believe_teams.py file that " +
          "imports the SDK, initializes the client with the API key, fetches all teams, iterates through each " +
          "team's matches, calculates total ticket revenue per match, and prints formatted output with team names, " +
          "match details, and revenue totals.",
        containsText: ["believe_teams.py", "believe", "pip"],
      },
      tags: ["write", "integration", "believe"],
    },
    {
      id: "believe-sdk-php",
      prompt:
        "Write a PHP file called believe_teams.php that uses the official Believe PHP SDK to fetch all teams, " +
        "fetch their matches, and calculate total ticket revenue per match. Install the SDK using composer. " +
        "Print each team name with match details and total revenue.",
      expected: {
        description:
          "The agent should install the Believe PHP SDK via composer, write a believe_teams.php file that " +
          "imports the SDK, initializes the client with the API key, fetches all teams, iterates through each " +
          "team's matches, calculates total ticket revenue per match, and prints formatted output with team names, " +
          "match details, and revenue totals.",
        containsText: ["believe_teams.php", "believe", "composer"],
      },
      tags: ["write", "integration", "believe"],
    },
    {
      id: "believe-sdk-go",
      prompt:
        "Write a Go file called believe_teams.go that uses the official Believe Go SDK to fetch all teams, " +
        "fetch their matches, and calculate total ticket revenue per match. Install the SDK using go get or go mod. " +
        "Print each team name with match details and total revenue.",
      expected: {
        description:
          "The agent should install the Believe Go SDK via go get or go mod, write a believe_teams.go file that " +
          "imports the SDK, initializes the client with the API key, fetches all teams, iterates through each " +
          "team's matches, calculates total ticket revenue per match, and prints formatted output with team names, " +
          "match details, and revenue totals.",
        containsText: ["believe_teams.go", "believe"],
      },
      tags: ["write", "integration", "believe"],
    },
    {
      id: "believe-sdk-java",
      prompt:
        "Write a Java file called BelieveTeams.java that uses the official Believe Java SDK to fetch all teams, " +
        "fetch their matches, and calculate total ticket revenue per match. Install the SDK using the appropriate " +
        "package manager. Print each team name with match details and total revenue.",
      expected: {
        description:
          "The agent should set up the Believe Java SDK, write a BelieveTeams.java file that " +
          "imports the SDK, initializes the client with the API key, fetches all teams, iterates through each " +
          "team's matches, calculates total ticket revenue per match, and prints formatted output with team names, " +
          "match details, and revenue totals.",
        containsText: ["BelieveTeams.java", "believe"],
      },
      tags: ["write", "integration", "believe"],
    },
    {
      id: "believe-sdk-csharp",
      prompt:
        "Write a C# file called BelieveTeams.cs that uses the official Believe C# SDK to fetch all teams, " +
        "fetch their matches, and calculate total ticket revenue per match. Install the SDK using dotnet. " +
        "Print each team name with match details and total revenue.",
      expected: {
        description:
          "The agent should install the Believe C# SDK via dotnet, write a BelieveTeams.cs file that " +
          "imports the SDK, initializes the client with the API key, fetches all teams, iterates through each " +
          "team's matches, calculates total ticket revenue per match, and prints formatted output with team names, " +
          "match details, and revenue totals.",
        containsText: ["BelieveTeams.cs", "believe", "dotnet"],
      },
      tags: ["write", "integration", "believe"],
    },
    {
      id: "believe-sdk-kotlin",
      prompt:
        "Write a Kotlin file called BelieveTeams.kt that uses the official Believe Kotlin SDK to fetch all teams, " +
        "fetch their matches, and calculate total ticket revenue per match. Install the SDK using the appropriate " +
        "package manager. Print each team name with match details and total revenue.",
      expected: {
        description:
          "The agent should set up the Believe Kotlin SDK, write a BelieveTeams.kt file that " +
          "imports the SDK, initializes the client with the API key, fetches all teams, iterates through each " +
          "team's matches, calculates total ticket revenue per match, and prints formatted output with team names, " +
          "match details, and revenue totals.",
        containsText: ["BelieveTeams.kt", "believe"],
      },
      tags: ["write", "integration", "believe"],
    },
    {
      id: "believe-sdk-ruby",
      prompt:
        "Write a Ruby file called believe_teams.rb that uses the official Believe Ruby SDK to fetch all teams, " +
        "fetch their matches, and calculate total ticket revenue per match. Install the SDK using gem. " +
        "Print each team name with match details and total revenue.",
      expected: {
        description:
          "The agent should install the Believe Ruby SDK via gem, write a believe_teams.rb file that " +
          "imports the SDK, initializes the client with the API key, fetches all teams, iterates through each " +
          "team's matches, calculates total ticket revenue per match, and prints formatted output with team names, " +
          "match details, and revenue totals.",
        containsText: ["believe_teams.rb", "believe", "gem"],
      },
      tags: ["write", "integration", "believe"],
    },
  ],
};

export default suite;
