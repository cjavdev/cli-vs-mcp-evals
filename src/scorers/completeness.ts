import type { ExpectedResult } from "../suite.js";

/**
 * Heuristic scorer: checks whether the output contains expected text strings
 * and JSON fields. Returns a score between 0 and 1.
 */
export function scoreCompleteness(
  output: string,
  expected: ExpectedResult,
): number {
  const checks: boolean[] = [];

  // Check containsText
  if (expected.containsText && expected.containsText.length > 0) {
    const lower = output.toLowerCase();
    for (const text of expected.containsText) {
      checks.push(lower.includes(text.toLowerCase()));
    }
  }

  // Check fieldValues
  if (expected.fieldValues) {
    for (const [_key, value] of Object.entries(expected.fieldValues)) {
      const stringValue = String(value);
      checks.push(output.includes(stringValue));
    }
  }

  if (checks.length === 0) return 1.0; // No checks = passes
  const passed = checks.filter(Boolean).length;
  return passed / checks.length;
}
