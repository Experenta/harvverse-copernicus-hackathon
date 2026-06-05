import { agentEnv } from "../config/env.js";
import type { AgentScenarioResponse } from "../types/agent-scenario.js";
import {
  agentScenarioResponseSchema,
  type KnowledgeSignal,
  type ScenarioRequest,
} from "../types/agent-scenario.js";

function baseUrl(): string {
  return agentEnv.HARVVERSE_API_BASE_URL.replace(/\/$/, "");
}

function agentHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (agentEnv.SENTINEL_AGENT_API_KEY) {
    headers["x-sentinel-agent-key"] = agentEnv.SENTINEL_AGENT_API_KEY;
  }

  return headers;
}

async function parseJsonResponse<T>(
  response: Response,
  label: string,
): Promise<T> {
  const payload = (await response.json()) as T & { error?: string };

  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof payload.error === "string"
        ? payload.error
        : `HTTP ${response.status}`;
    throw new Error(`[harvverse-agent] ${label}: ${message}`);
  }

  return payload;
}

export async function fetchLotContext(
  lotCode: string,
): Promise<Record<string, unknown>> {
  const url = `${baseUrl()}/api/sentinel/agent/context?lotCode=${encodeURIComponent(lotCode)}`;
  const response = await fetch(url, { headers: agentHeaders() });
  return parseJsonResponse(response, "GET context");
}

export async function fetchKnowledge(
  signal: KnowledgeSignal,
): Promise<Record<string, unknown>> {
  const url = `${baseUrl()}/api/sentinel/agent/knowledge?signal=${encodeURIComponent(signal)}`;
  const response = await fetch(url, { headers: agentHeaders() });
  return parseJsonResponse(response, "GET knowledge");
}

export async function fetchScenario(
  request: ScenarioRequest,
): Promise<AgentScenarioResponse> {
  const url = `${baseUrl()}/api/sentinel/agent/scenarios`;
  const response = await fetch(url, {
    method: "POST",
    headers: agentHeaders(),
    body: JSON.stringify(request),
  });

  const payload = await parseJsonResponse<unknown>(response, "POST scenarios");
  const parsed = agentScenarioResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error(
      `[harvverse-agent] Invalid scenario response: ${JSON.stringify(parsed.error.flatten())}`,
    );
  }

  return parsed.data;
}
