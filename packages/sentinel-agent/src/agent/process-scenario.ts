import {
  buildGupshupRequestPreview,
  sendGupshupTemplate,
} from "../channels/gupshup/client.js";
import type { GupshupRequestPreview } from "../channels/gupshup/types.js";
import { resolveGupshupTemplateId } from "../channels/gupshup/templates.js";
import { fetchScenario } from "../clients/harvverse-agent.js";
import {
  agentScenarioResponseSchema,
  isInlineScenarioPayload,
  scenarioRequestSchema,
  type AgentScenarioResponse,
  type ScenarioRequest,
} from "../types/agent-scenario.js";
import {
  buildGupshupTemplateParams,
  GUPSHUP_TEMPLATE_PARAM_LABELS,
} from "./build-gupshup-params.js";
import {
  refineScenarioMessage,
  type MessageRefineResult,
} from "./refine-message.js";

export type ScenarioProcessOptions = {
  inline?: boolean;
  forceGupshupDryRun?: boolean;
  skipSend?: boolean;
  /** auto = LLM si hay API key; true = fuerza; false = solo Harvverse */
  llm?: boolean | "auto";
};

export type ScenarioProcessResult = {
  ok: boolean;
  source: "harvverse" | "inline";
  scenario: string;
  signal: string | null;
  harvverse: AgentScenarioResponse;
  ai: MessageRefineResult;
  gupshup: {
    attempted: boolean;
    delivered: boolean;
    dryRun: boolean;
    templateKey: string;
    templateId: string | null;
    variableLabels: string[];
    params: string[];
    destination: string | null;
    messageId: string | null;
    requestPreview: GupshupRequestPreview | null;
    error: string | null;
  };
  outbound: {
    channel: "gupshup";
    template: {
      key: string;
      id: string | null;
      paramLabels: readonly string[];
      params: string[];
    };
    messagePreview: string;
  };
  error?: string;
};

async function resolveScenarioPayload(
  input: unknown,
  options: ScenarioProcessOptions,
): Promise<{ data: AgentScenarioResponse; source: "harvverse" | "inline" }> {
  if (options.inline || isInlineScenarioPayload(input)) {
    const parsed = agentScenarioResponseSchema.safeParse(input);
    if (!parsed.success) {
      throw new Error(
        `Invalid inline scenario payload: ${JSON.stringify(parsed.error.flatten())}`,
      );
    }
    return { data: parsed.data, source: "inline" };
  }

  const req = scenarioRequestSchema.safeParse(input);
  if (!req.success) {
    throw new Error(
      `Invalid scenario request. Use { lotCode, scenario } or full Harvverse response: ${JSON.stringify(req.error.flatten())}`,
    );
  }

  const data = await fetchScenario(req.data as ScenarioRequest);
  return { data, source: "harvverse" };
}

export async function processScenarioAlert(
  input: unknown,
  options: ScenarioProcessOptions = {},
): Promise<ScenarioProcessResult> {
  const { data, source } = await resolveScenarioPayload(input, options);

  const ai = await refineScenarioMessage(data, { llm: options.llm });

  const templateKey = data.whatsapp.templateKey;
  const templateId = resolveGupshupTemplateId(templateKey);
  const params = buildGupshupTemplateParams(data, ai.finalBody);
  const phone = data.context.farmer?.phone ?? null;

  const outbound = {
    channel: "gupshup" as const,
    template: {
      key: templateKey,
      id: templateId,
      paramLabels: GUPSHUP_TEMPLATE_PARAM_LABELS,
      params,
    },
    messagePreview: ai.finalBody,
  };

  if (options.skipSend || !phone) {
    return {
      ok: true,
      source,
      scenario: data.scenario,
      signal: data.signal ?? null,
      harvverse: data,
      ai,
      gupshup: {
        attempted: false,
        delivered: false,
        dryRun: true,
        templateKey,
        templateId,
        variableLabels: data.whatsapp.variables,
        params,
        destination: phone,
        messageId: null,
        requestPreview: phone
          ? buildGupshupRequestPreview(phone, templateId ?? "", params)
          : null,
        error: phone ? null : "Sin context.farmer.phone en el payload",
      },
      outbound,
    };
  }

  const sendResult = await sendGupshupTemplate({
    destination: phone,
    templateId: templateId ?? "",
    params,
    dryRun: options.forceGupshupDryRun,
  });

  return {
    ok: sendResult.ok || sendResult.dryRun,
    source,
    scenario: data.scenario,
    signal: data.signal ?? null,
    harvverse: data,
    ai,
    gupshup: {
      attempted: true,
      delivered: sendResult.ok && !sendResult.dryRun,
      dryRun: sendResult.dryRun,
      templateKey,
      templateId,
      variableLabels: data.whatsapp.variables,
      params,
      destination: sendResult.destination,
      messageId: sendResult.messageId,
      requestPreview: sendResult.requestPreview,
      error: sendResult.error,
    },
    outbound,
  };
}
