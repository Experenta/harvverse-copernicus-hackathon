import type { AgentScenarioResponse } from "../types/agent-scenario.js";

/** Etiquetas documentadas en la respuesta Harvverse (`whatsapp.variables`). */
export const GUPSHUP_TEMPLATE_PARAM_LABELS = [
  "Nombre farmer",
  "Nombre finca",
  "Código lote",
  "Risk score",
  "Yield range",
  "URL pública QR",
  "Mensaje completo",
] as const;

/**
 * Orden de params para template `harvverse_sentinel_alert` (docs/SHEYLA - Payloads).
 * Debe coincidir con los slots aprobados en Meta/Gupshup.
 */
export function buildGupshupTemplateParams(
  data: AgentScenarioResponse,
  messageBodyOverride?: string,
): string[] {
  const ctx = data.context;
  const farmerName = ctx.farmer?.name ?? "caficultor";
  const farmName = ctx.lot.farmName ?? "tu finca";
  const lotCode = ctx.lot.code;
  const riskScore =
    ctx.snapshot?.riskScore != null ? String(ctx.snapshot.riskScore) : "—";
  const signals = ctx.signals as Record<string, unknown> | undefined;
  const yieldRange =
    signals?.yieldRange != null ? String(signals.yieldRange) : "—";
  const publicUrl = ctx.publicUrl ?? "";
  const messageBody = messageBodyOverride ?? data.message.body;

  return [
    farmerName,
    farmName,
    lotCode,
    riskScore,
    yieldRange,
    publicUrl,
    messageBody,
  ];
}
