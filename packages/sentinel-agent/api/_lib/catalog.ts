import { knowledgeSignals, scenarioNames } from "../../src/types/agent-scenario.js";

export const apiCatalog = {
  service: "sentinel-agent",
  channel: "gupshup",
  baseUrlLocal: "http://localhost:3099",
  endpoints: [
    {
      method: "GET",
      path: "/api/health",
      description: "Health check",
    },
    {
      method: "GET",
      path: "/api/scenarios",
      description: "Catálogo de escenarios y fixtures para Postman",
    },
    {
      method: "POST",
      path: "/api/scenarios?dryRun=1&fixture=ndvi&notify=1",
      description:
        "Sin body. notify=1 envía el resultado a WEBHOOK_NOTIFY_URL (webhook.site). llm=auto|1|0",
    },
    {
      method: "POST",
      path: "/api/scenarios?dryRun=1",
      description:
        "Con body: inline Harvverse completo o proxy { lotCode, scenario }",
      fixtures: {
        inline: "fixtures/agent/ndvi-drop-money-inline.json",
        request: "fixtures/agent/scenario-request-ndvi.json",
      },
    },
    {
      method: "GET",
      path: "/api/context?lotCode=lotetest",
      description: "Proxy → Harvverse GET /api/sentinel/agent/context",
    },
    {
      method: "GET",
      path: "/api/knowledge?signal=S2_ndvi_drop",
      description: "Proxy → Harvverse GET /api/sentinel/agent/knowledge",
      signals: knowledgeSignals,
    },
  ],
  scenarios: scenarioNames,
  gupshupTemplateParams: [
    "1 Nombre farmer",
    "2 Nombre finca",
    "3 Código lote",
    "4 Risk score",
    "5 Yield range",
    "6 URL pública",
    "7 Mensaje completo (message.body)",
  ],
};
