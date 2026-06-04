# Gupshup — Postman, webhook.site y validación de envío

## 1. Servidor local (Postman)

```bash
cd packages/sentinel-agent
cp .env.example .env
pnpm dev:api
```

Base: `http://localhost:3099` (o `SENTINEL_AGENT_PORT`).

Importar: `fixtures/postman/sentinel-agent.postman_collection.json`

## 2. Endpoints

| Método | Ruta | Body |
|--------|------|------|
| GET | `/api/health` | — |
| GET | `/api/scenarios` | Catálogo + lista fixtures |
| POST | `/api/scenarios?dryRun=1` | Ver abajo |
| GET | `/api/context?lotCode=lotetest` | Proxy Harvverse |
| GET | `/api/knowledge?signal=S2_ndvi_drop` | Proxy Harvverse |

Header opcional si `SENTINEL_AGENT_INBOUND_KEY` está en `.env`:

```http
x-sentinel-agent-key: <tu-clave>
```

## 3. Payloads Postman

### Modo inline (recomendado sin Harvverse)

Archivo: `fixtures/agent/ndvi-drop-money-inline.json`

```http
POST http://localhost:3099/api/scenarios?dryRun=1
Content-Type: application/json
```

Pega el JSON del fixture. Respuesta esperada:

- `ok: true`
- `gupshup.params` — array de 7 strings
- `gupshup.requestPreview.form.template` — JSON `{"id":"(pending)","params":[...]}`
- `gupshup.dryRun: true`

### Modo proxy Harvverse

Archivo: `fixtures/agent/scenario-request-ndvi.json`

Requiere Harvverse en `HARVVERSE_API_BASE_URL` (default `:3001`) con el endpoint scenarios activo.

## 4. ¿El envío está bien armado?

Sí, siguiendo la API de templates de Gupshup:

| Campo form | Origen |
|------------|--------|
| `channel` | `whatsapp` |
| `source` | `GUPSHUP_SOURCE` |
| `destination` | teléfono sin `+` |
| `src.name` | `GUPSHUP_APP_NAME` |
| `template` | `{"id":"<templateId>","params":["...", ...]}` (7 params) |

Orden de `params` (debe coincidir con template Meta):

1. Nombre farmer  
2. Nombre finca  
3. Código lote  
4. Risk score  
5. Yield range  
6. URL pública  
7. Mensaje completo (`message.body`)

Compara en Postman `gupshup.requestPreview` con la doc Gupshup antes del primer envío live.

## 5. webhook.site / Vercel

1. Deploy rama → Vercel Root `packages/sentinel-agent`
2. `POST https://<app>.vercel.app/api/scenarios?dryRun=1`
3. Body = mismo JSON inline
4. Opcional: configurar URL de webhook.site como destino de prueba manual copiando `requestPreview`

## 6. Pasar a envío real

```bash
GUPSHUP_API_KEY=...
GUPSHUP_SOURCE=...
GUPSHUP_APP_NAME=...
GUPSHUP_TEMPLATE_HARVVERSE_SENTINEL_ALERT=<id-aprobado>
```

`POST /api/scenarios` sin `?dryRun=1` (si hay credenciales y template ID).

## 7. Referencias Harvverse

- `docs/sheylla_endpoints.txt`
- `docs/SHEYLA - Payloads listos para AI SD.txt`
