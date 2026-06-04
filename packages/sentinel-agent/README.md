# Sentinel Agent (Gupshup + Harvverse)

Microservicio HTTP para alertas Sentinel: consume escenarios del backend Harvverse y envía **templates WhatsApp vía Gupshup**.

No modifica `apps/web`. Despliegue: Vercel con Root Directory `packages/sentinel-agent`.

## Documentación

| Doc | Contenido |
|-----|-----------|
| [docs/00-bitacora.md](./docs/00-bitacora.md) | Historial y decisiones |
| [docs/01-arquitectura.md](./docs/01-arquitectura.md) | Diagrama y módulos |
| [docs/04-gupshup-y-webhook.md](./docs/04-gupshup-y-webhook.md) | Cómo funcionan templates, Postman, env |
| [docs/gupshup-template-brief.md](./docs/gupshup-template-brief.md) | Brief para crear template en Gupshup (compartir externo) |
| [docs/sheylla_endpoints.txt](./docs/sheylla_endpoints.txt) | Contrato Harvverse |
| [fixtures/postman/](./fixtures/postman/) | Colección Postman |

## Prueba rápida (Postman / CLI)

```bash
cp packages/sentinel-agent/.env.example packages/sentinel-agent/.env
pnpm --filter @harvverse-copernicus-hackathon/sentinel-agent dev:api
```

- **GET** `http://localhost:3099/api/health`
- **POST** `http://localhost:3099/api/scenarios?dryRun=1&fixture=ndvi` (sin body)
- Opcional: `&notify=1` si tienes `WEBHOOK_NOTIFY_URL` en `.env`

Importar colección: `fixtures/postman/sentinel-agent.postman_collection.json`

### ¿Qué es `dryRun=1`?

Simula el envío a Gupshup: arma `gupshup.params` y `requestPreview` pero **no** llama a la API de WhatsApp. Útil sin template ID ni credenciales.

CLI sin servidor:

```bash
pnpm --filter @harvverse-copernicus-hackathon/sentinel-agent agent:scenario:dry
```

## API pública (npm)

```typescript
import { processScenarioAlert } from "@harvverse-copernicus-hackathon/sentinel-agent";

const result = await processScenarioAlert(payload, { inline: true });
// result.gupshup.params — 7 variables para el template
// result.gupshup.requestPreview — body form-urlencoded para Gupshup
```
