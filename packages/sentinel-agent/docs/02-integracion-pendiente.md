# Integración pendiente

## Hecho en este paquete

- [x] Cliente Harvverse (context, knowledge, scenarios)
- [x] Mapeo 7 params Gupshup
- [x] Rutas HTTP Vercel + servidor local Postman
- [x] Dry-run + `requestPreview` para validar envío
- [x] Fixtures y colección Postman

## Pendiente

1. **Templates Gupshup** — Partner crea template ([brief](./gupshup-template-brief.md)); dev pone ID en `GUPSHUP_TEMPLATE_HARVVERSE_SENTINEL_ALERT` ([04](./04-gupshup-y-webhook.md))
2. **Vercel** — proyecto propio, Root Directory `packages/sentinel-agent`, env de producción
3. **Harvverse en prod** — `HARVVERSE_API_BASE_URL` apuntando al backend real
4. **LLM (opcional)** — refinar `message.body` con guardrails sin tocar slots 1–6
5. **Webhook entrante Gupshup** — conversación farmer (fase 2)

## No hacer aquí

- Routes bajo `apps/web` (salvo acuerdo explícito)
- Meta `WHATSAPP_*` / DIGEX Graph API — reemplazado por Gupshup
- Relay n8n

## Orden sugerido

1. Probar inline en Postman (`pnpm dev:api`)
2. Probar proxy con Harvverse local
3. Deploy Vercel + webhook.site
4. Credenciales Gupshup + template ID → quitar `dryRun=1`
