import { currentSpan, withCurrent } from "braintrust";
import type { Span } from "braintrust";

/**
 * Log a completed tool call as a child span with correct Duration.
 */
export function logToolCallSpan(opts: {
  name: string;
  input: unknown;
  output: string;
  startTimeMs: number;
  endTimeMs: number;
  metadata?: Record<string, unknown>;
  metrics?: Record<string, unknown>;
}): void {
  const child = currentSpan().startSpan({
    name: `tool:${opts.name}`,
    startTime: opts.startTimeMs / 1000,
    event: {
      input: opts.input,
      output: opts.output,
      metadata: { toolName: opts.name, ...opts.metadata },
      metrics: {
        end: opts.endTimeMs / 1000,
        ...opts.metrics,
      },
    },
  });
  child.end();
}

/**
 * Run an async callback inside a named span with correct Duration.
 */
export async function withTurnSpan(
  name: string,
  fn: () => Promise<Record<string, unknown> | void>,
): Promise<void> {
  const startMs = Date.now();
  let turnSpan: Span | undefined;
  try {
    turnSpan = currentSpan().startSpan({ name, startTime: startMs / 1000 });
  } catch {
    // No active span context
  }

  let extraMetrics: Record<string, unknown> | void = undefined;
  try {
    if (turnSpan) {
      extraMetrics = await withCurrent(turnSpan, () => fn());
    } else {
      extraMetrics = await fn();
    }
  } finally {
    if (turnSpan) {
      turnSpan.log({
        metrics: {
          start: startMs / 1000,
          end: Date.now() / 1000,
          ...(extraMetrics || {}),
        },
      });
      turnSpan.end();
    }
  }
}
