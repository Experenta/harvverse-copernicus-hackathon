import { processScenarioAlert } from "../src/agent/process-scenario.js";
import { notifyWebhookSite } from "../src/notify/webhook-site.js";
import { apiCatalog } from "./_lib/catalog.js";
import { loadAgentFixture, listAgentFixtures } from "./_lib/fixtures.js";
import { assertInboundAuth, readJsonBody } from "./_lib/http.js";

export const config = { runtime: "nodejs" };

/**
 * GET /api/scenarios — catálogo Postman
 * POST /api/scenarios?dryRun=1&fixture=ndvi — sin body (recomendado)
 * POST /api/scenarios?dryRun=1 — body inline o { lotCode, scenario }
 */
export default async function handler(request: Request): Promise<Response> {
  if (request.method === "GET") {
    return Response.json({
      ...apiCatalog,
      fixturesAvailable: listAgentFixtures(),
      postmanTip:
        "POST ?dryRun=1&fixture=ndvi sin body — no pegues JSON a mano",
    });
  }

  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const authError = assertInboundAuth(request.headers);
  if (authError) return authError;

  try {
    const url = new URL(request.url);
    const forceDryRun = url.searchParams.get("dryRun") === "1";
    const fixtureName = url.searchParams.get("fixture");
    const llmParam = url.searchParams.get("llm");
    const llm: boolean | "auto" =
      llmParam === "1" || llmParam === "true"
        ? true
        : llmParam === "0" || llmParam === "false"
          ? false
          : "auto";

    let body: unknown;

    if (fixtureName) {
      body = loadAgentFixture(fixtureName);
    } else {
      const { payload, raw } = await readJsonBody(request);
      if (!raw) {
        return Response.json(
          {
            ok: false,
            error:
              "Body vacío. Usa ?fixture=ndvi (sin body) o pega JSON válido. Fixtures: " +
              listAgentFixtures().join(", "),
          },
          { status: 400 },
        );
      }
      body = payload;
    }

    const inline =
      url.searchParams.get("inline") === "1" ||
      (typeof body === "object" &&
        body !== null &&
        "context" in body &&
        "whatsapp" in body);

    const result = await processScenarioAlert(body, {
      inline,
      forceGupshupDryRun: forceDryRun,
      llm,
    });

    const notifyParam = url.searchParams.get("notify");
    const shouldNotify =
      notifyParam === "1" ||
      notifyParam === "true" ||
      notifyParam === "webhook";

    const webhookNotify = shouldNotify
      ? await notifyWebhookSite(
          result,
          url.searchParams.get("webhookUrl") ?? undefined,
        )
      : { attempted: false, ok: false, url: null, status: null, error: null };

    return Response.json({ ...result, webhookNotify });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 },
    );
  }
}
