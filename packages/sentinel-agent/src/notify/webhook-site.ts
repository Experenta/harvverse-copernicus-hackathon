import { agentEnv } from "../config/env.js";

export type WebhookNotifyResult = {
  attempted: boolean;
  ok: boolean;
  url: string | null;
  status: number | null;
  error: string | null;
};

export async function notifyWebhookSite(
  payload: unknown,
  overrideUrl?: string,
): Promise<WebhookNotifyResult> {
  const url = overrideUrl ?? agentEnv.WEBHOOK_NOTIFY_URL ?? null;

  if (!url) {
    return {
      attempted: false,
      ok: false,
      url: null,
      status: null,
      error: "Sin WEBHOOK_NOTIFY_URL en .env",
    };
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "sentinel-agent",
        sentAt: new Date().toISOString(),
        result: payload,
      }),
    });

    return {
      attempted: true,
      ok: response.ok,
      url,
      status: response.status,
      error: response.ok ? null : `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      attempted: true,
      ok: false,
      url,
      status: null,
      error: error instanceof Error ? error.message : "Webhook notify failed",
    };
  }
}
