import type { AgentScenarioResponse } from "../types/agent-scenario.js";

export function buildScenarioRefinePrompt(data: AgentScenarioResponse): string {
  const ctx = data.context;
  const guardrails = [
    ...(data.knowledge?.guardrails ?? []),
    ...(data.message.guardrails ?? []),
  ];

  const lines = [
    `Escenario: ${data.scenario}`,
    data.signal ? `Señal: ${data.signal}` : null,
    `Agricultor: ${ctx.farmer?.name ?? "—"}`,
    `Finca: ${ctx.lot.farmName ?? "—"} · Lote: ${ctx.lot.code}`,
    ctx.snapshot?.riskScore != null
      ? `Risk Score: ${ctx.snapshot.riskScore}/100 · EUDR: ${ctx.snapshot.eudrStatus ?? "—"}`
      : null,
    ctx.publicUrl ? `URL pública: ${ctx.publicUrl}` : null,
    data.knowledge?.title ? `KB: ${data.knowledge.title}` : null,
    data.knowledge?.meaning ? `Significado: ${data.knowledge.meaning}` : null,
    data.knowledge?.action ? `Acción sugerida: ${data.knowledge.action}` : null,
    guardrails.length
      ? `Guardrails:\n${guardrails.map((g) => `- ${g}`).join("\n")}`
      : null,
    "",
    "Mensaje base (mejóralo, no lo alargues innecesariamente):",
    data.message.body,
  ];

  return lines.filter((l) => l != null).join("\n");
}
