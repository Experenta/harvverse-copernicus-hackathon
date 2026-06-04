import { agentEnv, hasGupshupCredentials } from "../../config/env.js";
import type {
  GupshupSendTemplateInput,
  GupshupSendTemplateResult,
} from "./types.js";

/** Partner API — base partner.gupshup.io, el appId va en la ruta */
export function gupshupPartnerUrl(appId: string): string {
  return `https://partner.gupshup.io/partner/app/${appId}/template/msg`;
}

function normalizePhoneE164(phone: string): string {
  return phone.replace(/\s+/g, "").replace(/^00/, "+");
}

export function buildGupshupRequestPreview(
  destination: string,
  templateId: string,
  params: string[],
): GupshupSendTemplateResult["requestPreview"] {
  const appId = agentEnv.GUPSHUP_APP_ID ?? "(set GUPSHUP_APP_ID)";
  const url = gupshupPartnerUrl(appId);
  const to = normalizePhoneE164(destination).replace(/^\+/, "");
  const templatePayload = JSON.stringify({
    id: templateId || "(pending)",
    params: params.map(sanitizeParam),
  });

  return {
    url,
    method: "POST",
    contentType: "application/x-www-form-urlencoded",
    form: {
      source: agentEnv.GUPSHUP_SOURCE ?? "(set GUPSHUP_SOURCE)",
      destination: to,
      "src.name": agentEnv.GUPSHUP_APP_NAME ?? "Harvverse",
      template: templatePayload,
    },
  };
}

/**
 * WhatsApp rechaza params con \n, \t o más de 4 espacios consecutivos (error 132018).
 * Reemplaza saltos de línea/tabs por espacio y colapsa espacios excesivos.
 */
function sanitizeParam(value: string): string {
  return value
    .replace(/\r\n|\r|\n|\t/g, " ")
    .replace(/ {5,}/g, "    ")
    .trim();
}

/** Devuelve el token que va en el header Authorization (Partner Token tiene prioridad) */
function resolveAuthToken(): string {
  return (
    agentEnv.GUPSHUP_PARTNER_TOKEN ??
    agentEnv.GUPSHUP_APP_TOKEN ??
    "(set GUPSHUP_PARTNER_TOKEN)"
  );
}

export async function sendGupshupTemplate(
  input: GupshupSendTemplateInput,
): Promise<GupshupSendTemplateResult> {
  const destination = normalizePhoneE164(input.destination);
  const requestPreview = buildGupshupRequestPreview(
    destination,
    input.templateId,
    input.params,
  );
  const dryRun =
    input.dryRun === true ||
    !hasGupshupCredentials() ||
    !input.templateId.trim();

  if (dryRun) {
    console.info("[sentinel-agent][gupshup:dry-run]", {
      destination,
      templateId: input.templateId || "(pending)",
      params: input.params,
      requestPreview,
    });
    return {
      ok: true,
      dryRun: true,
      messageId: null,
      destination,
      templateId: input.templateId,
      params: input.params,
      requestPreview,
      error: input.templateId
        ? null
        : "Template ID pendiente (GUPSHUP_TEMPLATE_HARVVERSE_SENTINEL_ALERT_V2)",
    };
  }

  const body = new URLSearchParams(requestPreview.form);

  try {
    const response = await fetch(requestPreview.url, {
      method: "POST",
      headers: {
        Authorization: resolveAuthToken(),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    const rawText = await response.text();
    let payload: { messageId?: string; status?: string; message?: string } = {};
    try {
      payload = JSON.parse(rawText);
    } catch {
      return {
        ok: false,
        dryRun: false,
        messageId: null,
        destination,
        templateId: input.templateId,
        params: input.params,
        requestPreview,
        error: `HTTP ${response.status} — respuesta no-JSON: ${rawText.slice(0, 300)}`,
      };
    }

    if (!response.ok) {
      return {
        ok: false,
        dryRun: false,
        messageId: null,
        destination,
        templateId: input.templateId,
        params: input.params,
        requestPreview,
        error: payload.message ?? `HTTP ${response.status}`,
      };
    }

    return {
      ok: true,
      dryRun: false,
      messageId: payload.messageId ?? null,
      destination,
      templateId: input.templateId,
      params: input.params,
      requestPreview,
      error: null,
    };
  } catch (error) {
    return {
      ok: false,
      dryRun: false,
      messageId: null,
      destination,
      templateId: input.templateId,
      params: input.params,
      requestPreview,
      error: error instanceof Error ? error.message : "Gupshup send failed",
    };
  }
}
