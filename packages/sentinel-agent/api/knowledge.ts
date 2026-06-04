import { fetchKnowledge } from "../src/clients/harvverse-agent.js";
import { knowledgeSignals } from "../src/types/agent-scenario.js";
import { assertInboundAuth } from "./_lib/http.js";

export const config = { runtime: "nodejs" };

/** GET /api/knowledge?signal=S2_ndvi_drop — proxy a Harvverse */
export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "GET") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const authError = assertInboundAuth(request.headers);
  if (authError) return authError;

  const signal = new URL(request.url).searchParams.get("signal");
  if (!signal) {
    return Response.json(
      { ok: false, error: "signal required", allowed: knowledgeSignals },
      { status: 400 },
    );
  }

  if (!knowledgeSignals.includes(signal as (typeof knowledgeSignals)[number])) {
    return Response.json(
      { ok: false, error: "Invalid signal", allowed: knowledgeSignals },
      { status: 400 },
    );
  }

  try {
    const data = await fetchKnowledge(
      signal as (typeof knowledgeSignals)[number],
    );
    return Response.json(data);
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 502 },
    );
  }
}
