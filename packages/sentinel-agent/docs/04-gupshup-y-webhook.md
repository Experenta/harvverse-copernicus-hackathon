# Gupshup — cómo funciona, Postman y envío

## 0. Templates WhatsApp (concepto)

WhatsApp Business **no permite** texto arbitrario en el primer mensaje saliente: hace falta un template **aprobado en Meta**, creado en la consola Gupshup.

| Parte | Quién la define | Qué cambia en cada alerta |
|-------|-----------------|---------------------------|
| Marco del mensaje | Gupshup/Meta (texto con `{{1}}`…`{{7}}`) | Solo si se registra un template nuevo |
| Valores de los huecos | `sentinel-agent` al enviar | Sí — 7 strings en orden fijo |

Flujo en este paquete:

1. Harvverse devuelve contexto + `message.body`.
2. Opcional: IA refina el cuerpo (`refineScenarioMessage` → `ai.finalBody`).
3. `buildGupshupTemplateParams` arma 7 strings; el **7.º** es el mensaje (Harvverse o IA).
4. `sendGupshupTemplate` POST con `template={"id":"...","params":[...]}`.

**Brief para quien crea el template en Gupshup:** [gupshup-template-brief.md](./gupshup-template-brief.md) (compartir con Partner/Meta, sin detalle de código).

Variables de entorno (Partner API — activas):

| Variable | Uso |
|----------|-----|
| `GUPSHUP_APP_ID` | UUID de la app (va en la URL del endpoint) |
| `GUPSHUP_PARTNER_TOKEN` | `sk_...` — header `Authorization` (prioridad) |
| `GUPSHUP_APP_TOKEN` | App Token — fallback si Partner Token no funciona |
| `GUPSHUP_SOURCE` | Número origen (sin `+`, ej. `19063794460`) |
| `GUPSHUP_APP_NAME` | `src.name` en el form (default: `Harvverse`) |
| `GUPSHUP_TEMPLATE_HARVVERSE_SENTINEL_ALERT_V2` | Template ID aprobado |

Código del orden de params: `src/agent/build-gupshup-params.ts`.

Payload JSON en el campo form `template`:

```json
{
  "id": "867d698d-9e34-43c6-ba67-f2c179c822d7",
  "params": [
    "Javier Puerto",
    "Finca Test",
    "lotetest",
    "90",
    "14.0-21.0 qq",
    "https://harvverse.com/lot/lotetest",
    "Hola Javier, detectamos una caída de NDVI..."
  ]
}
```

Envío producción: `POST https://partner.gupshup.io/partner/app/{appId}/template/msg` (form-urlencoded).  
Ref: [Partner API docs](https://partner-docs.gupshup.io/reference/post_partner-app-appid-template-msg).

---

## 1. Servidor local (Postman)

```bash
cd packages/sentinel-agent
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
- `gupshup.requestPreview.form.template` — JSON `{"id":"867d698d-...","params":[...]}`
- `gupshup.dryRun: true`

### Modo proxy Harvverse

Archivo: `fixtures/agent/scenario-request-ndvi.json`

Requiere Harvverse en `HARVVERSE_API_BASE_URL` (default `:3001`) con el endpoint scenarios activo.

## 4. ¿El envío está bien armado?

Sí, siguiendo la Partner API de Gupshup:

| Campo / Header | Origen |
|----------------|--------|
| Header `Authorization` | `GUPSHUP_PARTNER_TOKEN` (o `GUPSHUP_APP_TOKEN`) |
| URL path `{appId}` | `GUPSHUP_APP_ID` |
| `source` | `GUPSHUP_SOURCE` |
| `destination` | teléfono sin `+` |
| `src.name` | `GUPSHUP_APP_NAME` (default `Harvverse`) |
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

Las credenciales ya están en `.env`:

```
GUPSHUP_APP_ID=b4bbd73d-50dd-4709-9593-4198518afa22
GUPSHUP_PARTNER_TOKEN=sk_2ff5f2cf61794b289ae47b133e276a49
GUPSHUP_SOURCE=19063794460
GUPSHUP_APP_NAME=Harvverse
GUPSHUP_TEMPLATE_HARVVERSE_SENTINEL_ALERT_V2=867d698d-9e34-43c6-ba67-f2c179c822d7
```

`POST /api/scenarios` sin `?dryRun=1` para envío real.

## 7. Referencias Harvverse

- `docs/sheylla_endpoints.txt`
- `docs/SHEYLA - Payloads listos para AI SD.txt`
