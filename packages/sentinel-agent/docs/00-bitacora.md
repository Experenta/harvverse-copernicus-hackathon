# Bitácora — Sentinel Agent

Registro cronológico: qué existe, qué se eliminó y cómo probar.

---

## 2026-05-31 — Fase 0 (deprecada)

Primer esqueleto con Vercel AI SDK + **Meta WhatsApp Cloud API** + eventos `SentinelEvent` (`fixtures/n8n/`).

| Componente | Estado hoy |
|------------|------------|
| `processSentinelAlert` | **Eliminado** |
| `src/channels/whatsapp/` (Meta Graph API) | **Eliminado** |
| `src/types/sentinel-event.ts` | **Eliminado** |
| `src/tools/`, `src/prompts/`, `src/agent/model.ts` | **Eliminado** |
| `src/cli/run-fixture.ts`, scripts `agent:fixture` | **Eliminado** |
| Deps `@ai-sdk/*`, `ai` | **Eliminado** del package |
| Vars `WHATSAPP_*`, `OPENAI_API_KEY` | **Eliminado** de env |

**Motivo:** El canal acordado es **Gupshup con template IDs**, no WhatsApp beta / Meta texto libre.

---

## 2026-06-03 — Pivot Gupshup + handoff Sheylla

### Objetivo actual

1. Probar payloads en **Postman** y **webhook.site** sin templates aprobados (dry-run).
2. Mapear respuesta Harvverse → **7 variables** del template `harvverse_sentinel_alert`.
3. Cuando exista template ID → mismo código envía a Gupshup live.

### Qué se queda (inventario)

| Ruta / archivo | Función |
|----------------|---------|
| `api/health.ts` | Health check |
| `api/scenarios.ts` | GET catálogo + POST procesar escenario |
| `api/context.ts` | Proxy GET Harvverse context |
| `api/knowledge.ts` | Proxy GET Harvverse knowledge |
| `api/_lib/http.ts` | Auth inbound opcional |
| `api/_lib/catalog.ts` | Metadata para Postman |
| `src/agent/process-scenario.ts` | Orquestador principal |
| `src/agent/build-gupshup-params.ts` | 7 params en orden fijo |
| `src/channels/gupshup/client.ts` | Envío + `requestPreview` dry-run |
| `src/channels/gupshup/templates.ts` | `GUPSHUP_TEMPLATE_*` → ID |
| `src/clients/harvverse-agent.ts` | HTTP a Harvverse |
| `src/types/agent-scenario.ts` | Zod request/response |
| `src/config/env.ts` | Harvverse + Gupshup + puerto local |
| `src/dev/local-server.ts` | `pnpm dev:api` puerto 3099 |
| `src/cli/run-scenario-fixture.ts` | Prueba CLI con fixtures |
| `fixtures/agent/*.json` | Payloads inline y request |
| `fixtures/postman/*.json` | Colección Postman |
| `docs/sheylla_endpoints.txt` | Contrato backend (referencia) |
| `docs/SHEYLA - Payloads listos para AI SD.txt` | Ejemplo response |
| `docs/04-gupshup-y-webhook.md` | Guía pruebas |
| `vercel.json` | Deploy Vercel |

### Flujo de envío (¿está bien hecho?)

```text
POST /api/scenarios
  → (opcional) POST Harvverse /api/sentinel/agent/scenarios
  → buildGupshupTemplateParams() — 7 strings ordenados
  → resolveGupshupTemplateId(whatsapp.templateKey)
  → sendGupshupTemplate()
       si falta API key / template ID → dry-run + gupshup.requestPreview
       si hay credenciales → POST api.gupshup.io/wa/api/v1/template/msg
            (form: channel, source, destination, src.name, template JSON)
```

**Validar en Postman:** en la respuesta revisar:

- `outbound.template.params` — valores por slot
- `gupshup.requestPreview.form` — exactamente lo que iría a Gupshup
- `gupshup.dryRun: true` hasta configurar `GUPSHUP_TEMPLATE_HARVVERSE_SENTINEL_ALERT`

### Cómo probar

**Local (Postman):**

```bash
pnpm --filter @harvverse-copernicus-hackathon/sentinel-agent dev:api
```

| Request | URL |
|---------|-----|
| Health | `GET http://localhost:3099/api/health` |
| Catálogo | `GET http://localhost:3099/api/scenarios` |
| Inline dry-run | `POST http://localhost:3099/api/scenarios?dryRun=1&fixture=ndvi` (sin body) |
| Proxy Harvverse | `POST .../api/scenarios?dryRun=1` + `fixtures/agent/scenario-request-ndvi.json` (requiere Harvverse :3001) |

**CLI:**

```bash
pnpm --filter @harvverse-copernicus-hackathon/sentinel-agent agent:scenario:dry
```

**webhook.site / Vercel:** misma URL `POST /api/scenarios?dryRun=1` con el JSON inline.

### Variables de entorno

Ver `.env.example`. Críticas:

- `HARVVERSE_API_BASE_URL` — backend datos
- `SENTINEL_AGENT_API_KEY` — saliente a Harvverse
- `GUPSHUP_APP_ID`, `GUPSHUP_PARTNER_TOKEN`, `GUPSHUP_SOURCE`, `GUPSHUP_APP_NAME` — envío live por Partner API
- `GUPSHUP_TEMPLATE_HARVVERSE_SENTINEL_ALERT_V2` — cuando el template esté aprobado

### 2026-06-04 — AI SDK reintegrado (sin depender de template)

| Archivo | Rol |
|---------|-----|
| `src/agent/refine-message.ts` | `generateText` — refina solo el texto del mensaje |
| `src/agent/model.ts` | Anthropic u OpenAI vía env |
| `src/prompts/` | System + prompt con `knowledge` y `guardrails` |

Flujo: Harvverse → **AI SDK** (param 7) → `buildGupshupParams` → Gupshup dry-run/live.

Postman: `POST ?dryRun=1&fixture=ndvi` — con `ANTHROPIC_API_KEY` en `.env` usa LLM automático (`llm=auto`). Ver bloque `ai` en la respuesta: `used`, `source`, `finalBody`.

Query: `llm=1` fuerza, `llm=0` solo mensaje Harvverse.

### Listo para subir rama (revisión 2026-06-04)

- [x] Flujo alertas reactivas: escenario → IA → params Gupshup
- [x] `dryRun` para probar sin template
- [x] Postman + webhook.site (`notify=1`)
- [x] `pnpm check-types` OK

### Pendiente (equipo / después)

- [ ] **Gupshup:** template ID + credenciales → envío live (sin `dryRun=1`)
- [ ] **Harvverse:** trigger que POSTee a tu URL en Vercel
- [ ] Deploy Vercel (Root `packages/sentinel-agent`)
- [ ] Webhook entrante Gupshup (fase 2)

---

## Convenciones

- No editar `apps/web/src/app/api/sentinel/alerts/route.ts` sin acuerdo.
- Cambios del agente solo en `packages/sentinel-agent/`.
- Actualizar esta bitácora al cerrar cada sesión.
