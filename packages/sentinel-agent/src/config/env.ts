import { config } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";

const packageRoot = resolve(import.meta.dirname, "../..");
const envPath = resolve(packageRoot, ".env");

if (existsSync(envPath)) {
  config({ path: envPath });
}

/** En .env las variables vacías llegan como "" — las tratamos como no definidas. */
function optionalEnv(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  return value;
}

const optionalString = z.preprocess(
  optionalEnv,
  z.string().min(1).optional(),
);

const agentEnvSchema = z.object({
  ANTHROPIC_API_KEY: optionalString,
  OPENAI_API_KEY: optionalString,
  AGENT_MODEL: optionalString,
  /** Backend Harvverse (handoff Sheylla) */
  HARVVERSE_API_BASE_URL: z.preprocess(
    (value) => optionalEnv(value) ?? "http://localhost:3001",
    z.string().url(),
  ),
  SENTINEL_AGENT_API_KEY: optionalString,
  /** Opcional: protege rutas /api/* del agente (Postman: header x-sentinel-agent-key) */
  SENTINEL_AGENT_INBOUND_KEY: optionalString,
  /** Gupshup WhatsApp — Partner API */
  GUPSHUP_APP_ID: optionalString,
  /** Partner App Token (sk_...) — header Authorization en Partner API */
  GUPSHUP_PARTNER_TOKEN: optionalString,
  /** App Token — alternativa si el endpoint lo requiere en lugar del Partner Token */
  GUPSHUP_APP_TOKEN: optionalString,
  GUPSHUP_SOURCE: optionalString,
  GUPSHUP_APP_NAME: optionalString,
  GUPSHUP_DEFAULT_TEMPLATE_KEY: z.preprocess(
    (value) => optionalEnv(value) ?? "harvverse_sentinel_alert_v2",
    z.string().min(1),
  ),
  GUPSHUP_DEFAULT_TEMPLATE_ID: optionalString,
  /** Puerto servidor local Postman (`pnpm dev:api`) */
  SENTINEL_AGENT_PORT: z.preprocess(
    (value) => {
      const n = Number(optionalEnv(value) ?? 3099);
      return Number.isFinite(n) ? n : 3099;
    },
    z.number().int().positive(),
  ),
  NEXT_PUBLIC_APP_URL: z.preprocess(
    (value) => optionalEnv(value) ?? "http://localhost:3001",
    z.string().url(),
  ),
  /** POST del resultado a webhook.site (pruebas) */
  WEBHOOK_NOTIFY_URL: optionalString,
});

export const agentEnv = agentEnvSchema.parse(process.env);

export function hasLlmProvider(): boolean {
  return Boolean(agentEnv.ANTHROPIC_API_KEY ?? agentEnv.OPENAI_API_KEY);
}

export function hasGupshupCredentials(): boolean {
  return Boolean(
    agentEnv.GUPSHUP_APP_ID &&
      (agentEnv.GUPSHUP_PARTNER_TOKEN ?? agentEnv.GUPSHUP_APP_TOKEN) &&
      agentEnv.GUPSHUP_SOURCE,
  );
}
