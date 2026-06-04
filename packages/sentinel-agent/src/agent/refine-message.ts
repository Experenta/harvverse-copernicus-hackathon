import { generateText } from "ai";
import { canUseLlm, resolveAgentModel } from "./model.js";
import { buildScenarioRefinePrompt } from "../prompts/build-scenario-prompt.js";
import { SCENARIO_REFINE_SYSTEM_PROMPT } from "../prompts/system.js";
import type { AgentScenarioResponse } from "../types/agent-scenario.js";

export type MessageRefineResult = {
  enabled: boolean;
  used: boolean;
  model: string | null;
  originalBody: string;
  finalBody: string;
  source: "harvverse" | "llm";
  error: string | null;
};

export type RefineMessageOptions = {
  /** auto = usa LLM si hay API key; true = fuerza; false = omite */
  llm?: boolean | "auto";
};

export async function refineScenarioMessage(
  data: AgentScenarioResponse,
  options: RefineMessageOptions = {},
): Promise<MessageRefineResult> {
  const originalBody = data.message.body;
  const llmMode = options.llm ?? "auto";
  const forceLlm = llmMode === true;
  const shouldRun = forceLlm || (llmMode === "auto" && canUseLlm());

  if (!shouldRun) {
    return {
      enabled: llmMode !== false,
      used: false,
      model: null,
      originalBody,
      finalBody: originalBody,
      source: "harvverse",
      error:
        forceLlm && !canUseLlm()
          ? "Sin ANTHROPIC_API_KEY ni OPENAI_API_KEY"
          : null,
    };
  }

  const { model, modelId } = resolveAgentModel();
  if (!model || !modelId) {
    return {
      enabled: true,
      used: false,
      model: null,
      originalBody,
      finalBody: originalBody,
      source: "harvverse",
      error: "Modelo LLM no configurado",
    };
  }

  try {
    const result = await generateText({
      model,
      system: SCENARIO_REFINE_SYSTEM_PROMPT,
      prompt: buildScenarioRefinePrompt(data),
      maxOutputTokens: 500,
    });

    const text = result.text.trim();
    return {
      enabled: true,
      used: Boolean(text),
      model: modelId,
      originalBody,
      finalBody: text || originalBody,
      source: text ? "llm" : "harvverse",
      error: null,
    };
  } catch (error) {
    return {
      enabled: true,
      used: false,
      model: modelId,
      originalBody,
      finalBody: originalBody,
      source: "harvverse",
      error: error instanceof Error ? error.message : "LLM refine failed",
    };
  }
}
