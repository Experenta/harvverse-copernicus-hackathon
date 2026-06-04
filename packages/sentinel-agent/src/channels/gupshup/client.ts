import { agentEnv, hasGupshupCredentials } from "../../config/env.js";
import type {
  GupshupSendTemplateInput,
  GupshupSendTemplateResult,
} from "./types.js";

export const GUPSHUP_TEMPLATE_MSG_URL =
  "https://api.gupshup.io/wa/api/v1/template/msg";

function normalizePhoneE164(phone: string): string {
  return phone.replace(/\s+/g, "").replace(/^00/, "+");
}

export function buildGupshupRequestPreview(
  destination: string,
  templateId: string,
  params: string[],
): GupshupSendTemplateResult["requestPreview"] {
  const to = normalizePhoneE164(destination).replace(/^\+/, "");
  const templatePayload = JSON.stringify({
    id: templateId || "(pending)",
    params,
  });

  return {
    url: GUPSHUP_TEMPLATE_MSG_URL,
    method: "POST",
    contentType: "application/x-www-form-urlencoded",
    form: {
      channel: "whatsapp",
      source: agentEnv.GUPSHUP_SOURCE ?? "(set GUPSHUP_SOURCE)",
      destination: to,
      "src.name": agentEnv.GUPSHUP_APP_NAME ?? "(set GUPSHUP_APP_NAME)",
      template: templatePayload,
    },
  };
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
        : "Template ID pendiente (GUPSHUP_TEMPLATE_HARVVERSE_SENTINEL_ALERT)",
    };
  }

  const body = new URLSearchParams(requestPreview.form);

  try {
    const response = await fetch(GUPSHUP_TEMPLATE_MSG_URL, {
      method: "POST",
      headers: {
        apikey: agentEnv.GUPSHUP_API_KEY!,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    const payload = (await response.json()) as {
      messageId?: string;
      status?: string;
      message?: string;
    };

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
