import { fetchLotContext } from "../src/clients/harvverse-agent.js";
import { assertInboundAuth } from "./_lib/http.js";

export const config = { runtime: "nodejs" };

/** GET /api/context?lotCode=lotetest — proxy a Harvverse */
export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "GET") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const authError = assertInboundAuth(request.headers);
  if (authError) return authError;

  const lotCode = new URL(request.url).searchParams.get("lotCode");
  if (!lotCode) {
    return Response.json({ ok: false, error: "lotCode required" }, { status: 400 });
  }

  try {
    const data = await fetchLotContext(lotCode);
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
