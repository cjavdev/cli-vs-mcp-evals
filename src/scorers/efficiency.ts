const TURN_THRESHOLD_GOOD = 3;
const TURN_THRESHOLD_MAX = 50;
const TOKEN_THRESHOLD_GOOD = 5_000;
const TOKEN_THRESHOLD_MAX = 500_000;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Scores agent efficiency based on turn count and token usage.
 *
 * Turn efficiency (50% weight): 1.0 at <=3 turns, linear decay to 0 at 50.
 * Token efficiency (50% weight): 1.0 at <=5K tokens, linear decay to 0 at 500K.
 */
export function scoreEfficiency(input: {
  turnCount: number;
  totalTokens: number;
}): number {
  const turnScore =
    input.turnCount <= TURN_THRESHOLD_GOOD
      ? 1.0
      : 1.0 -
        clamp(
          (input.turnCount - TURN_THRESHOLD_GOOD) /
            (TURN_THRESHOLD_MAX - TURN_THRESHOLD_GOOD),
          0,
          1,
        );

  const tokenScore =
    input.totalTokens <= TOKEN_THRESHOLD_GOOD
      ? 1.0
      : 1.0 -
        clamp(
          (input.totalTokens - TOKEN_THRESHOLD_GOOD) /
            (TOKEN_THRESHOLD_MAX - TOKEN_THRESHOLD_GOOD),
          0,
          1,
        );

  return 0.5 * turnScore + 0.5 * tokenScore;
}
