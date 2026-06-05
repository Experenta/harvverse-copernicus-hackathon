import { z } from "zod";

import {
  buildSentinelAgentScenario,
  sentinelAgentScenarios,
} from "@harvverse-copernicus-hackathon/api/lib/sentinel-agent";

import { jsonError, loadSentinelAgentContext } from "../../../../sentinel/agent/_lib";

const demoOverridesSchema = z
  .object({
    previousNdvi: z.number().min(0).max(1).optional(),
    currentNdvi: z.number().min(0).max(1).optional(),
    temperatureC: z.number().min(-10).max(50).optional(),
    humidityPct: z.number().min(0).max(100).optional(),
    variety: z.string().trim().min(1).optional(),
    phenologyStage: z.string().trim().min(1).optional(),
  })
  .optional();

const sendBodySchema = z
  .object({
    lotCode: z.string().trim().min(1).optional(),
    lotId: z.number().int().positive().optional(),
    scenario: z.enum(sentinelAgentScenarios),
    demoOverrides: demoOverridesSchema,
    farmerPhone: z.string().trim().min(6).optional(),
    dryRun: z.boolean().default(true),
    llm: z.enum(["auto", "true", "false"]).default("auto"),
  })
  .refine((value) => value.lotCode != null || value.lotId != null, {
    message: "Provide lotCode or lotId.",
    path: ["lotCode"],
  });

function sentinelAgentBaseUrl() {
  return (
    process.env.SENTINEL_AGENT_BASE_URL ??
    process.env.SENTINEL_AGENT_URL ??
    "http://localhost:3099"
  ).replace(/\/$/, "");
}

function sentinelAgentHeaders() {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const key =
    process.env.SENTINEL_AGENT_INBOUND_KEY ??
    process.env.SENTINEL_AGENT_API_KEY;
  if (key) {
    headers["x-sentinel-agent-key"] = key;
  }
  return headers;
}

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  const body: unknown = await request.json().catch(() => null);
  const parsed = sendBodySchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("Invalid Sentinel Agent send payload.", 400, {
      issues: parsed.error.flatten(),
      availableScenarios: sentinelAgentScenarios,
    });
  }

  const context = await loadSentinelAgentContext({
    lotCode: parsed.data.lotCode,
    lotId: parsed.data.lotId,
    requestUrl,
  });

  if (!context) {
    return jsonError("Lot not found.", 404);
  }

  const scenario = buildSentinelAgentScenario({
    scenario: parsed.data.scenario,
    context,
    demoOverrides: parsed.data.demoOverrides,
  });
  const phone =
    parsed.data.farmerPhone?.replace(/\s+/g, "") ??
    scenario.context.farmer.phone;

  if (!phone) {
    return jsonError(
      "A farmerPhone is required to send or preview the WhatsApp request.",
      400,
    );
  }

  const scenarioPayload = {
    ok: true,
    ...scenario,
    context: {
      ...scenario.context,
      farmer: {
        ...scenario.context.farmer,
        phone,
      },
    },
  };
  const url = new URL(`${sentinelAgentBaseUrl()}/api/scenarios`);
  url.searchParams.set("inline", "1");
  url.searchParams.set("llm", parsed.data.llm);
  if (parsed.data.dryRun) {
    url.searchParams.set("dryRun", "1");
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: sentinelAgentHeaders(),
      body: JSON.stringify(scenarioPayload),
    });
  } catch (error) {
    return jsonError(
      error instanceof Error
        ? `Sentinel Agent request failed: ${error.message}`
        : "Sentinel Agent request failed.",
      502,
      { sentinelAgentUrl: url.origin },
    );
  }

  const sentinelAgent = await response.json().catch(() => null);
  if (!response.ok) {
    return jsonError("Sentinel Agent returned an error.", response.status, {
      sentinelAgent,
    });
  }

  return Response.json({
    ok: true,
    scenario: scenarioPayload,
    sentinelAgent,
  });
}
