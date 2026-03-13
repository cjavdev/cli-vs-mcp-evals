import type { ExpectedResult } from "../suite.js";

const CURRENCY_AND_COMMAS = /[$£€,]/g;

function isNumericString(s: string): boolean {
  return /^\d+(\.\d+)?$/.test(s.trim());
}

function normalizeNumeric(s: string): string {
  return s.replace(CURRENCY_AND_COMMAS, "");
}

/**
 * Heuristic scorer: checks whether the output contains expected text strings
 * and JSON fields. Returns a score between 0 and 1.
 */
export function scoreCompleteness(
  output: string,
  expected: ExpectedResult,
): number {
  const checks: boolean[] = [];
  const lower = output.toLowerCase();

  // Check containsText
  if (expected.containsText && expected.containsText.length > 0) {
    for (const text of expected.containsText) {
      if (isNumericString(text)) {
        // Numeric-aware matching: strip currency symbols and commas
        const normalizedOutput = normalizeNumeric(lower);
        checks.push(normalizedOutput.includes(text.trim()));
      } else {
        checks.push(lower.includes(text.toLowerCase()));
      }
    }
  }

  // Check fieldValues
  if (expected.fieldValues) {
    for (const [_key, value] of Object.entries(expected.fieldValues)) {
      const stringValue = String(value).toLowerCase();
      checks.push(lower.includes(stringValue));
    }
  }

  if (checks.length === 0) return 1.0; // No checks = passes
  const passed = checks.filter(Boolean).length;
  return passed / checks.length;
}
