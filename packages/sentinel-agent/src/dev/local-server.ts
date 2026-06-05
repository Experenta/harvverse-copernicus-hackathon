/**
 * Servidor HTTP local para Postman / pruebas sin desplegar en Vercel.
 * pnpm dev:api → http://localhost:3099
 */
import { createServer } from "node:http";
import { agentEnv } from "../config/env.js";
import contextHandler from "../../api/context.js";
import healthHandler from "../../api/health.js";
import knowledgeHandler from "../../api/knowledge.js";
import scenariosHandler from "../../api/scenarios.js";

const port = agentEnv.SENTINEL_AGENT_PORT;

const routes: Array<{
  method: string;
  match: (pathname: string) => boolean;
  handler: (req: Request) => Promise<Response> | Response;
}> = [
  {
    method: "GET",
    match: (p) => p === "/api/health",
    handler: healthHandler,
  },
  {
    method: "GET",
    match: (p) => p === "/api/scenarios",
    handler: scenariosHandler,
  },
  {
    method: "POST",
    match: (p) => p === "/api/scenarios",
    handler: scenariosHandler,
  },
  {
    method: "GET",
    match: (p) => p === "/api/context",
    handler: contextHandler,
  },
  {
    method: "GET",
    match: (p) => p === "/api/knowledge",
    handler: knowledgeHandler,
  },
];

createServer(async (nodeReq, nodeRes) => {
  const host = nodeReq.headers.host ?? `localhost:${port}`;
  const url = new URL(nodeReq.url ?? "/", `http://${host}`);
  const method = nodeReq.method ?? "GET";

  const route = routes.find((r) => r.method === method && r.match(url.pathname));

  if (!route) {
    const help =
      url.pathname === "/"
        ? {
            ok: true,
            service: "sentinel-agent",
            hint: "El navegador usa GET. Para probar el flujo completo usa Postman con POST.",
            tryInBrowser: [
              `http://localhost:${port}/api/health`,
              `http://localhost:${port}/api/scenarios`,
            ],
            tryInPostman: `POST http://localhost:${port}/api/scenarios?dryRun=1&fixture=ndvi`,
          }
        : {
            ok: false,
            error: "Not found",
            method,
            path: url.pathname,
            routes: [
              "GET /",
              "GET /api/health",
              "GET /api/scenarios (catálogo)",
              "POST /api/scenarios?dryRun=1&fixture=ndvi",
              "GET /api/context?lotCode=lotetest",
              "GET /api/knowledge?signal=S2_ndvi_drop",
            ],
          };

    nodeRes.writeHead(url.pathname === "/" ? 200 : 404, {
      "Content-Type": "application/json",
    });
    nodeRes.end(JSON.stringify(help, null, 2));
    return;
  }

  const chunks: Buffer[] = [];
  for await (const chunk of nodeReq) {
    chunks.push(chunk as Buffer);
  }
  const body = Buffer.concat(chunks);

  const headers = new Headers();
  for (const [key, value] of Object.entries(nodeReq.headers)) {
    const v = Array.isArray(value) ? value[0] : value;
    if (v) headers.set(key, v);
  }

  const request = new Request(url, {
    method,
    headers,
    body: method === "GET" || method === "HEAD" ? undefined : body,
  });

  try {
    const response = await route.handler(request);
    const text = await response.text();
    nodeRes.writeHead(response.status, {
      "Content-Type": "application/json",
    });
    nodeRes.end(text);
  } catch (error) {
    nodeRes.writeHead(500, { "Content-Type": "application/json" });
    nodeRes.end(
      JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : "Server error",
      }),
    );
  }
}).listen(port, () => {
  console.info(`[sentinel-agent] API local http://localhost:${port}`);
  console.info(
    "[sentinel-agent] POST http://localhost:%s/api/scenarios?dryRun=1&fixture=ndvi",
    port,
  );
});
