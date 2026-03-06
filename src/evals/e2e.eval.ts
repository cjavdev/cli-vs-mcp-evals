import { config } from "dotenv";
config({ path: "./.env" });

// Prevent "cannot launch inside another Claude Code session" errors
// when running evals from within a Claude Code session.
delete process.env.CLAUDECODE;

import { loadSuite } from "../suite.js";
import { runEvals } from "../eval.js";

(async () => {
  const suite = await loadSuite();
  const tags = (process.env.EVAL_TAGS ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  runEvals(suite, { tags });
})();
