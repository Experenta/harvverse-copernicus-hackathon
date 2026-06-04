# Despliegue del agente, KB y esquema de arquitectura

Documento para explicar al equipo (Copernicus / Experenta) **qué se despliega, dónde, por qué** y **dónde vive el Knowledge Base (KB)**.

> **Contexto:** El agente se desarrolla en `packages/sentinel-agent` dentro del monorepo Harvverse para tener contexto y fixtures, pero **en producción se despliega como servicio HTTP aislado**. No se modifica `apps/web` ni la base de datos de Harvverse.

---

## Resumen en una línea

Despliego un **servicio HTTP propio en Vercel** que consume escenarios del backend Harvverse (`POST /api/sentinel/agent/scenarios`) y envía alertas por **WhatsApp templates vía Gupshup**. El **KB de datos** viene en la respuesta del scenario (`context`, `knowledge`, `message`, `guardrails`).

---

## 1. ¿Qué despliego?

No despliego la app Harvverse ni modifico `apps/web`. Despliego **un servicio HTTP propio y aislado** con la lógica del agente (`packages/sentinel-agent`), que incluye:

| Componente | Tecnología |
|------------|------------|
| Orquestación | `processScenarioAlert` (TypeScript) |
| Canal salida | **Gupshup** template `harvverse_sentinel_alert` (7 variables) |
| Contrato de entrada | Escenarios Harvverse (`docs/sheylla_endpoints.txt`) |
| LLM | Opcional fase 2 (refinar `message.body`) |

El servicio expone endpoints que el backend de Harvverse llamará por HTTP:

| Endpoint | Función |
|----------|---------|
| `POST /api/scenarios` | Escenario (inline o proxy Harvverse) → params Gupshup → envío |
| `GET /api/scenarios` | Catálogo para Postman |
| `GET /api/context` | Proxy contexto lote |
| `GET /api/knowledge` | Proxy KB por señal |
| `GET /api/health` | Health check |

**Nota:** Vercel AI SDK es una librería npm, no un servicio que se despliega aparte. Corre **dentro** de este microservicio.

---

## 2. ¿Dónde y cómo lo despliego?

| Aspecto | Decisión |
|---------|----------|
| **Dónde** | **Vercel**, en un **proyecto separado** del frontend Harvverse |
| **URL ejemplo** | `https://sentinel-agent-harvverse.vercel.app` |
| **Cómo** | Deploy automático desde git; variables de entorno en Vercel Dashboard |
| **Integración** | El equipo Copernicus hace `POST` a mi URL cuando hay alerta |
| **Lo que NO hago** | No modifico `apps/web`, no accedo a PostgreSQL de Harvverse |

### ¿Por qué Vercel y proyecto aparte?

1. **Restricción de scope:** no puedo tocar el código de la app principal.
2. **Separación de responsabilidades:** el agente es un microservicio con contrato HTTP (JSON).
3. **Compatibilidad:** Vercel encaja con AI SDK, serverless, HTTPS para webhooks y gestión de secrets.
4. **Integración simple:** Harvverse solo necesita mi URL; no importa mi paquete dentro de su código.

### Rol de Gupshup

```text
Mi servicio (Vercel)
    → POST api.gupshup.io/wa/api/v1/template/msg
    → Template aprobado (harvverse_sentinel_alert)
    → WhatsApp del agricultor
```

Variables en Vercel (ver `.env.example`):

```bash
HARVVERSE_API_BASE_URL=https://...
SENTINEL_AGENT_API_KEY=...
GUPSHUP_API_KEY=...
GUPSHUP_SOURCE=...
GUPSHUP_APP_NAME=...
GUPSHUP_TEMPLATE_HARVVERSE_SENTINEL_ALERT=...
```

Harvverse **no necesita** mi `ANTHROPIC_API_KEY`. Solo la URL de alertas.


## 3. ¿Dónde estaría el KB (Knowledge Base)?

No hay un KB único tipo “carpeta de PDFs + vector DB”. Hay **tres capas**:

| Capa | Dónde vive | Quién lo alimenta | Para qué |
|------|------------|-------------------|----------|
| **① KB de datos (satélite)** | JSON del evento + endpoints API del backend Copernicus | Equipo Copernicus | Score, EUDR, lote, teléfono, URL pública |
| **② KB de reglas / comportamiento** | `message.guardrails` + `knowledge` en response Harvverse | Backend Copernicus | Tono y límites (sin inventar diagnóstico) |
| **③ KB conversacional** (futuro) | En mi servicio vía webhook WhatsApp | Historial farmer ↔ agente | Respuestas cuando el agricultor escribe |

### Detalle por capa

**① KB de datos — fuente de verdad factual**

- Viene en la respuesta de `POST /api/sentinel/agent/scenarios` (o proxy `POST /api/scenarios`).
- Si se necesita más contexto, un **tool del agente** llamará **endpoints de API** que me indiquen (sin acceder a Postgres directamente).
- Ejemplo de campos: `lotCode`, `copernicus.riskScore`, `copernicus.eudrStatus`, `yieldPredict`, `recipient.phone`.

**② KB de reglas — cómo habla el agente**

| Archivo | Contenido |
|---------|-----------|
| `src/agent/build-gupshup-params.ts` | Mapeo 7 variables template |
| `docs/SHEYLA - Payloads listos para AI SD.txt` | Ejemplo response scenario |

**③ KB conversacional — fase 2**

- Webhook entrante `POST /api/whatsapp` recibe mensajes del farmer.
- Historial en memoria o storage propio del agente (no DB Harvverse por ahora).


## 4. Diagrama de despliegue

### Vista general

```text
┌─────────────────────────────────────────────────────────────────┐
│  HARVVERSE (no lo modifico)                                     │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │ apps/web     │───▶│ packages/api │───▶│ PostgreSQL   │       │
│  │ (Next.js)    │    │ Copernicus   │    │              │       │
│  └──────────────┘    └──────┬───────┘    └──────────────┘       │
│                             │                                   │
│                             │ ① POST evento JSON (alerta)       │
└─────────────────────────────┼───────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  MI SERVICIO — Agente Sentinel (Vercel, proyecto propio)        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  POST /api/alerts  →  packages/sentinel-agent            │   │
│  │                      • Vercel AI SDK + Anthropic          │   │
│  │                      • Prompts (KB reglas)                │   │
│  │                      • Tools (contexto del evento)        │   │
│  └──────────────────────────┬───────────────────────────────┘   │
└─────────────────────────────┼───────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
     ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
     │  Harvverse  │  │  Gupshup    │  │  Farmer     │
     │  scenarios  │  │  templates  │  │  WhatsApp   │
     └─────────────┘  └──────┬──────┘  └─────────────┘
                             │
                             └── ② Mensaje al agricultor
```


### Flujo en 4 pasos

1. Motor Copernicus detecta alerta → **POST a mi URL** con JSON del evento.
2. Mi agente mapea `message.body` + contexto a **7 params** del template.
3. Envío por **Gupshup** (o dry-run con `requestPreview`).
4. Respuesta `{ ok, gupshup, outbound }` para Postman / webhook.

---

## 5. Contrato de integración con Harvverse

Yo **no entro** al repo Harvverse en producción. Entrego:

| Entregable | Descripción |
|------------|-------------|
| **URL del agente** | `https://sentinel-agent-harvverse.vercel.app/api/scenarios` |
| **Formato JSON** | `docs/SHEYLA - Payloads` + `fixtures/agent/` |
| **Postman local** | `pnpm dev:api` → `:3099` |
| **Documentación** | Este doc + `docs/01-arquitectura.md` |

Ellos hacen **una cosa**: cuando hay alerta Copernicus, **POST a mi URL** con el JSON acordado.

---

## 6. Desarrollo vs producción

| | Desarrollo (hoy) | Producción |
|---|------------------|------------|
| **Ubicación código** | `packages/sentinel-agent` en monorepo | Mismo código + capa HTTP mínima |
| **Prueba local** | `pnpm dev:api` + Postman | — |
| **Deploy** | — | Vercel proyecto propio |
| **Integración** | Fixtures JSON | POST desde backend Harvverse |
| **WhatsApp** | dry-run (`requestPreview`) | Gupshup template ID en Vercel |

Opciones de repo para producción:

- **Opción A:** Mismo monorepo, Vercel con Root Directory = `packages/sentinel-agent` + capa `api/`.
- **Opción B:** Repo propio `sentinel-agent-harvverse` con el paquete + capa HTTP.

---

## 7. Estado actual y pendientes

### Hecho

- [x] Código del agente en `packages/sentinel-agent`
- [x] Cliente Gupshup + mapeo 7 params + dry-run
- [x] Rutas HTTP + servidor local Postman
- [x] Contrato escenarios Harvverse (handoff Sheylla)
- [x] Documentación interna (bitácora, arquitectura, este doc)

### Pendiente

- [x] Capa HTTP (`/api/scenarios`, health, proxies)
- [ ] Proyecto Vercel propio conectado al repo (rama)
- [ ] Template ID Gupshup en producción
- [ ] LLM opcional sobre `message.body`

