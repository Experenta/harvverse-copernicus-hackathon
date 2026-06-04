import { agentEnv } from "../../config/env.js";

/** Convierte `harvverse_sentinel_alert` → `GUPSHUP_TEMPLATE_HARVVERSE_SENTINEL_ALERT` */
function templateEnvKey(templateKey: string): string {
  return `GUPSHUP_TEMPLATE_${templateKey.toUpperCase().replace(/-/g, "_")}`;
}

/**
 * ID real del template en Gupshup (cuando Meta lo apruebe).
 * Mientras no exista, devuelve null y el cliente entra en dry-run.
 */
export function resolveGupshupTemplateId(templateKey: string): string | null {
  const fromEnv = process.env[templateEnvKey(templateKey)];
  if (fromEnv) return fromEnv;

  if (templateKey === agentEnv.GUPSHUP_DEFAULT_TEMPLATE_KEY) {
    return agentEnv.GUPSHUP_DEFAULT_TEMPLATE_ID ?? null;
  }

  return null;
}

export function listConfiguredTemplateKeys(): string[] {
  return Object.keys(process.env)
    .filter((k) => k.startsWith("GUPSHUP_TEMPLATE_"))
    .map((k) => k.replace("GUPSHUP_TEMPLATE_", "").toLowerCase());
}
