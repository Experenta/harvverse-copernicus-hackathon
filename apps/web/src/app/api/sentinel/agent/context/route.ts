import { z } from "zod";

import { jsonError, loadSentinelAgentContext } from "../_lib";

const contextQuerySchema = z.object({
  lotCode: z.string().trim().min(1).optional(),
  lotId: z.coerce.number().int().positive().optional(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = contextQuerySchema.safeParse({
    lotCode: url.searchParams.get("lotCode") ?? undefined,
    lotId: url.searchParams.get("lotId") ?? undefined,
  });

  if (!parsed.success) {
    return jsonError("Invalid context query.", 400, parsed.error.flatten());
  }
  if (parsed.data.lotCode == null && parsed.data.lotId == null) {
    return jsonError("Provide lotCode or lotId.");
  }

  const context = await loadSentinelAgentContext({
    lotCode: parsed.data.lotCode,
    lotId: parsed.data.lotId,
    requestUrl: url,
  });

  if (!context) {
    return jsonError("Lot not found.", 404);
  }

  return Response.json({ ok: true, context });
}
