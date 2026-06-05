# Vercel deployment checklist

This hackathon demo deploys as two Vercel projects from the same monorepo.

## Project 1: Web app

Vercel settings:

- Root Directory: `apps/web`
- Framework Preset: Next.js
- Install Command: from `apps/web/vercel.json`
- Build Command: from `apps/web/vercel.json`
- Node.js: `>=20.9.0`

Required envs:

```env
DATABASE_URL=
CORS_ORIGIN=https://<web-vercel-domain>
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
SENTINEL_HUB_CLIENT_ID=
SENTINEL_HUB_CLIENT_SECRET=
WHATSAPP_PUBLIC_APP_URL=https://<web-vercel-domain>
SENTINEL_AGENT_BASE_URL=https://<sentinel-agent-vercel-domain>
SENTINEL_AGENT_INBOUND_KEY=
SENTINEL_AGENT_API_KEY=
```

Optional demo envs:

```env
NEXT_PUBLIC_USE_LOCAL_CONTRACTS=false
NEXT_PUBLIC_DEMO_WHATSAPP_NUMBER=
CDS_API_KEY=
N8N_WEBHOOK_URL=
```

Notes:

- Use a hosted Postgres database for `DATABASE_URL`.
- Run migrations against that database before demo use: `DATABASE_URL=<url> pnpm db:migrate`.
- Seed/demo data should be created after migrations. Use the app flow or `DATABASE_URL=<url> pnpm db:seed` if the seed is safe for the target database.
- Add the deployed web domain to Clerk allowed redirect/origin settings.
- Local Hardhat proof generation should be treated as local-only. Deployed pages can display proof already stored in the database, but a Vercel function should not be expected to run a persistent local Hardhat chain.

## Project 2: Sentinel Agent / WhatsApp

Vercel settings:

- Root Directory: `packages/sentinel-agent`
- Framework Preset: Other
- Install Command: from `packages/sentinel-agent/vercel.json`
- Build Command: from `packages/sentinel-agent/vercel.json`
- Node.js: `>=20.9.0`

Required envs for real WhatsApp send:

```env
HARVVERSE_API_BASE_URL=https://<web-vercel-domain>
SENTINEL_AGENT_API_KEY=
SENTINEL_AGENT_INBOUND_KEY=
GUPSHUP_APP_ID=
GUPSHUP_PARTNER_TOKEN=
GUPSHUP_APP_TOKEN=
GUPSHUP_SOURCE=
GUPSHUP_APP_NAME=Harvverse
GUPSHUP_DEFAULT_TEMPLATE_KEY=harvverse_sentinel_alert_v2
GUPSHUP_TEMPLATE_HARVVERSE_SENTINEL_ALERT_V2=
NEXT_PUBLIC_APP_URL=https://<web-vercel-domain>
```

Optional AI envs:

```env
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
AGENT_MODEL=claude-haiku-4-5
```

Auth wiring:

- `SENTINEL_AGENT_INBOUND_KEY` must match between the web project and Sentinel Agent project.
- `SENTINEL_AGENT_API_KEY` lets Sentinel Agent call protected `/api/sentinel/agent/*` endpoints on the web app.

## Smoke test after deploy

1. Open `/api/health` on the web domain.
2. Sign in through Clerk.
3. Open `/dashboard/admin/sentinel-demo`.
4. Select an available lot and run dry-run first.
5. Switch to real send and verify WhatsApp delivery.
6. Open `/lot/<code>` from a phone and confirm QR proof, map, score, YieldPredict, carbon estimate, and evidence packet render.
