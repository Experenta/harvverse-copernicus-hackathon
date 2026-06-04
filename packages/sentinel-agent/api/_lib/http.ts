import { agentEnv } from "../../src/config/env.js";

export function assertInboundAuth(
  headers: Headers | Record<string, string | string[] | undefined>,
): Response | null {
  const expected = agentEnv.SENTINEL_AGENT_INBOUND_KEY;
  if (!expected) return null;

  const provided =
    headers instanceof Headers
      ? headers.get("x-sentinel-agent-key")
      : (headers["x-sentinel-agent-key"] ??
        headers["X-Sentinel-Agent-Key"]);

  const value = Array.isArray(provided) ? provided[0] : provided;

  if (value !== expected) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

export async function readJsonBody(request: Request): Promise<{
  payload: unknown;
  raw: string;
}> {
  const text = (await request.text()).replace(/^\uFEFF/, "").trim();
  if (!text) return { payload: {}, raw: "" };

  try {
    return { payload: JSON.parse(text) as unknown, raw: text };
  } catch (error) {
    const hint =
      error instanceof SyntaxError
        ? `${error.message}. Usa ?fixture=ndvi sin body, o Body → raw → JSON sin comas extra.`
        : "Invalid JSON";
    throw new Error(hint);
  }
}
