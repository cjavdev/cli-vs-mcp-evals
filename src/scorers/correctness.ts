import { Factuality } from "autoevals";

/**
 * LLM-as-judge scorer using Factuality from autoevals.
 * Compares agent's final text answer against expected description.
 */
export const CorrectnessScorer = Factuality;
