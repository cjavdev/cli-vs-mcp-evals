import type { ModelConfig } from "./types.js";

export const MODEL_ALIASES = [
  "opus",
  "sonnet",
  "haiku",
] as const;

export type ModelAlias = (typeof MODEL_ALIASES)[number];

const MODEL_REGISTRY: Record<ModelAlias, ModelConfig> = {
  opus: {
    alias: "opus",
    modelId: "claude-opus-4-6",
    provider: "anthropic",
    displayName: "Claude Opus 4.6",
  },
  sonnet: {
    alias: "sonnet",
    modelId: "claude-sonnet-4-6",
    provider: "anthropic",
    displayName: "Claude Sonnet 4.6",
  },
  haiku: {
    alias: "haiku",
    modelId: "claude-haiku-4-5-20251001",
    provider: "anthropic",
    displayName: "Claude Haiku 4.5",
  },
};

export function resolveModel(alias: ModelAlias): ModelConfig {
  return MODEL_REGISTRY[alias];
}
