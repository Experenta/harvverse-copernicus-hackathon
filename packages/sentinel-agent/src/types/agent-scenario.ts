import { z } from "zod";

export const scenarioNames = [
  "lot_approved",
  "eudr_blocked",
  "water_stress",
  "fungal_risk",
  "ndvi_drop_money",
  "roya_risk",
  "explain_roya",
  "flowering_positive",
] as const;

export type ScenarioName = (typeof scenarioNames)[number];

export const knowledgeSignals = [
  "S1_roya",
  "S2_ndvi_drop",
  "S3_water_stress",
  "S4_eudr",
  "S5_rainfall",
  "S6_flowering_positive",
] as const;

export type KnowledgeSignal = (typeof knowledgeSignals)[number];

export const scenarioRequestSchema = z.object({
  lotCode: z.string().min(1),
  scenario: z.enum(scenarioNames),
  demoOverrides: z.record(z.string(), z.unknown()).optional(),
});

export type ScenarioRequest = z.infer<typeof scenarioRequestSchema>;

const lotContextSchema = z.object({
  id: z.number().optional(),
  code: z.string(),
  farmName: z.string().optional(),
  region: z.string().optional(),
  country: z.string().optional(),
  variety: z.string().optional(),
  altitudeMasl: z.number().optional(),
  areaManzanas: z.number().optional(),
});

const farmerContextSchema = z.object({
  name: z.string().optional(),
  phone: z.string().nullable().optional(),
});

const snapshotSchema = z
  .object({
    sourceMode: z.string().optional(),
    riskScore: z.number().optional(),
    riskTier: z.string().optional(),
    eudrStatus: z.string().optional(),
    eligibleForInvestment: z.boolean().optional(),
    scoreHash: z.string().optional(),
  })
  .optional();

const signalsSchema = z.record(z.string(), z.unknown()).optional();

export const agentScenarioResponseSchema = z.object({
  ok: z.boolean(),
  scenario: z.string(),
  signal: z.string().optional(),
  sourceMode: z.string().optional(),
  demoData: z.boolean().optional(),
  context: z.object({
    lot: lotContextSchema,
    farmer: farmerContextSchema.optional(),
    snapshot: snapshotSchema,
    publicUrl: z.string().optional(),
    signals: signalsSchema,
  }),
  knowledge: z
    .object({
      title: z.string().optional(),
      threshold: z.string().optional(),
      meaning: z.string().optional(),
      impact: z.string().optional(),
      action: z.string().optional(),
      guardrails: z.array(z.string()).optional(),
    })
    .optional(),
  message: z.object({
    templateKey: z.string().optional(),
    title: z.string().optional(),
    body: z.string(),
    guardrails: z.array(z.string()).optional(),
  }),
  whatsapp: z.object({
    templateKey: z.string(),
    variables: z.array(z.string()),
  }),
});

export type AgentScenarioResponse = z.infer<typeof agentScenarioResponseSchema>;

export function isInlineScenarioPayload(
  input: unknown,
): input is AgentScenarioResponse {
  const parsed = agentScenarioResponseSchema.safeParse(input);
  return parsed.success && parsed.data.ok === true;
}
