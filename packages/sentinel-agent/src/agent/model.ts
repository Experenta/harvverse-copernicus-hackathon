import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";
import { agentEnv, hasLlmProvider } from "../config/env.js";

export type AgentModelMode = "anthropic" | "openai" | null;

export function resolveAgentModel(): {
  model: LanguageModel | null;
  modelId: string | null;
  mode: AgentModelMode;
} {
  if (agentEnv.ANTHROPIC_API_KEY) {
    const id = agentEnv.AGENT_MODEL ?? "claude-haiku-4-5";
    return { model: anthropic(id), modelId: id, mode: "anthropic" };
  }

  if (agentEnv.OPENAI_API_KEY) {
    const id = agentEnv.AGENT_MODEL ?? "gpt-4o-mini";
    return { model: openai(id), modelId: id, mode: "openai" };
  }

  return { model: null, modelId: null, mode: null };
}

export function canUseLlm(): boolean {
  return hasLlmProvider() && resolveAgentModel().model !== null;
}
