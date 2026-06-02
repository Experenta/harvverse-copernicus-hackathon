export const sentinelAgentSignals = [
  "S1_roya",
  "S2_ndvi_drop",
  "S3_water_stress",
  "S4_eudr",
  "S5_rainfall",
  "S6_flowering_positive",
] as const;

export const sentinelAgentScenarios = [
  "lot_approved",
  "eudr_blocked",
  "water_stress",
  "fungal_risk",
  "ndvi_drop_money",
  "roya_risk",
  "explain_roya",
  "flowering_positive",
] as const;

export type SentinelAgentSignal = (typeof sentinelAgentSignals)[number];
export type SentinelAgentScenario = (typeof sentinelAgentScenarios)[number];

export type SentinelAgentKbEntry = {
  signal: SentinelAgentSignal;
  title: string;
  threshold: string;
  meaning: string;
  context: string;
  impact: string;
  action: string;
  risk: "INFO" | "ATENCION" | "ALTO" | "URGENTE";
  guardrails: string[];
  template: string;
};

export type SentinelAgentContext = {
  lot: {
    id: number;
    code: string;
    farmName: string;
    region: string;
    country: string;
    variety: string | null;
    altitudeMasl: number | null;
    areaManzanas: number | null;
  };
  farmer: {
    name: string;
    phone: string | null;
  };
  snapshot: {
    id: number | null;
    createdAt: string | null;
    sourceMode: "fixture" | "live" | "none";
    riskScore: number | null;
    riskTier: string | null;
    eudrStatus: "verified" | "non_compliant" | "unknown" | null;
    eligibleForInvestment: boolean;
    scoreHash: string | null;
    sentinel2: unknown;
    sentinel1: unknown;
    era5: unknown;
    eudr: unknown;
    yieldPredict: unknown;
    chain: unknown;
  };
  publicUrl: string;
  signals: {
    currentNdvi: number | null;
    previousNdvi: number | null;
    ndviDropPct: number | null;
    annualRainfallMm: number | null;
    meanTemperatureC: number | null;
    waterStress: string | null;
    yieldRange: string;
    projectedQuintales: number | null;
    partnerReturnTotalUsd: number | null;
    partnerProfitUsd: number | null;
    farmerProfitUsd: number | null;
    metadataStatus: string | null;
  };
};

export type SentinelAgentDemoOverrides = {
  previousNdvi?: number;
  currentNdvi?: number;
  temperatureC?: number;
  humidityPct?: number;
  variety?: string;
  phenologyStage?: string;
};

export type SentinelAgentScenarioResponse = {
  scenario: SentinelAgentScenario;
  signal: SentinelAgentSignal;
  sourceMode: "fixture" | "live" | "demo_seeded" | "none";
  demoData: boolean;
  context: SentinelAgentContext;
  knowledge: SentinelAgentKbEntry;
  message: {
    templateKey: string;
    title: string;
    body: string;
    guardrails: string[];
  };
  whatsapp: {
    templateKey: string;
    variables: string[];
  };
};

export const sentinelAgentKnowledge: Record<SentinelAgentSignal, SentinelAgentKbEntry> = {
  S1_roya: {
    signal: "S1_roya",
    title: "Riesgo de roya",
    threshold: "20-25 C + humedad >80% + hoja mojada >6h sostenido.",
    meaning: "Condiciones ideales para que el hongo de la roya infecte.",
    context:
      "Peor en variedades susceptibles como Geisha, Bourbon y Typica. Parainema, Lempira e IHCAFE-90 tienen mayor resistencia, pero no son inmunes.",
    impact:
      "Sin manejo, puede causar defoliacion y perdida de 30-50% de cosecha; baja projected_qq y retorno del partner.",
    action:
      "Revisar el enves de las hojas en 3 dias, mejorar drenaje/sombra y validar manejo con tecnico.",
    risk: "ATENCION",
    guardrails: [
      "No recomendar fungicida especifico sin confirmacion de tecnico o IHCAFE.",
      "Presentar la alerta como riesgo preventivo, no diagnostico confirmado.",
    ],
    template:
      "Detectamos condiciones de alto riesgo de roya esta semana. Revise el enves de las hojas en los proximos 3 dias.",
  },
  S2_ndvi_drop: {
    signal: "S2_ndvi_drop",
    title: "Caida de NDVI",
    threshold: "Caida significativa vs. linea base de 2 anos.",
    meaning: "El cafetal perdio verdor o vigor, lo que suele indicar estres.",
    context:
      "Puede ser estres hidrico, enfermedad, deficiencia nutricional o defoliacion normal post-cosecha si ocurre entre octubre y diciembre.",
    impact:
      "Recalcula projected_qq con nuevo NDVI AUC y comunica el nuevo rango con banda +/-20%.",
    action:
      "Preguntar primero si hay hojas marchitas por la tarde, manchas o dano en fruto antes de concluir causa.",
    risk: "ATENCION",
    guardrails: [
      "No asumir causa solo por NDVI.",
      "Si es octubre-diciembre, mencionar que la baja puede ser normal por post-cosecha.",
    ],
    template:
      "El satelite muestra que el verdor de su lote bajo. Suele indicar estres. ?Ha visto hojas marchitas por la tarde o algun dano en el fruto?",
  },
  S3_water_stress: {
    signal: "S3_water_stress",
    title: "Estres hidrico",
    threshold: "NDWI/MSI bajo o humedad de suelo <20% VWC por 48h.",
    meaning: "La planta esta pasando sed.",
    context:
      "En llenado de fruto puede reducir tamano y peso del grano; en floracion puede causar aborto de flor.",
    impact: "Reduce projected_qq y puede bajar el retorno proyectado.",
    action: "Riego si hay acceso, sombra y mulch para retener humedad.",
    risk: "ATENCION",
    guardrails: [
      "Considerar si el productor realmente tiene acceso a riego.",
      "Comunicar como recomendacion practica, no como orden tecnica.",
    ],
    template:
      "Su lote esta pasando sed justo cuando se llena el grano. Si puede regar esta semana, ayuda a que el grano no salga pequeno.",
  },
  S4_eudr: {
    signal: "S4_eudr",
    title: "Cambio EUDR / deforestacion",
    threshold: "Perdida de vegetacion post-2020 en o cerca del poligono.",
    meaning: "Posible incumplimiento EUDR.",
    context:
      "Sin cumplimiento EUDR, el cafe puede perder acceso al mercado europeo.",
    impact: "Bloquea marketplace y afecta precio/venta del lote.",
    action: "Verificar poligono, fecha del cambio y evidencia con revision humana.",
    risk: "ALTO",
    guardrails: [
      "Revision humana obligatoria.",
      "El agente no declara elegibilidad legal final.",
    ],
    template:
      "Detectamos un cambio de cobertura cerca de su lote que afecta cumplimiento EUDR. Un miembro del equipo lo contactara para revisarlo.",
  },
  S5_rainfall: {
    signal: "S5_rainfall",
    title: "Anomalia de lluvia",
    threshold: "Lluvia fuera de rango; optimo del engine 1,500-2,400 mm/ano.",
    meaning: "Puede ser deficit o exceso de lluvia.",
    context:
      "Exceso mayor a 3,000 mm aumenta riesgo de hongos, deslaves y floracion irregular.",
    impact: "Ajusta el componente de precipitacion del Risk Score y rendimiento.",
    action: "Drenaje si hay exceso; riego si hay deficit; ajustar expectativa de floracion.",
    risk: "ATENCION",
    guardrails: ["No confundir lluvia anual con diagnostico de enfermedad."],
    template:
      "Este ano la lluvia va fuera de lo ideal para el cafe. Eso puede afectar floracion o sanidad.",
  },
  S6_flowering_positive: {
    signal: "S6_flowering_positive",
    title: "Floracion sana",
    threshold: "Pico de floracion Mar-Abr detectado y NDVI sano, o NDVI recuperandose.",
    meaning: "Buen rumbo productivo.",
    context: "La trayectoria vegetativa se mantiene positiva para la etapa.",
    impact: "Projected_qq se mantiene o mejora.",
    action: "Seguir el plan y avisar del siguiente hito.",
    risk: "INFO",
    guardrails: ["No prometer cosecha final; mantenerlo como senal positiva."],
    template:
      "Buenas noticias: el satelite detecto una floracion fuerte y pareja. Vamos por buen camino.",
  },
};

const scenarioSignal: Record<SentinelAgentScenario, SentinelAgentSignal> = {
  lot_approved: "S6_flowering_positive",
  eudr_blocked: "S4_eudr",
  water_stress: "S3_water_stress",
  fungal_risk: "S5_rainfall",
  ndvi_drop_money: "S2_ndvi_drop",
  roya_risk: "S1_roya",
  explain_roya: "S1_roya",
  flowering_positive: "S6_flowering_positive",
};

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

function numberValue(value: unknown): number | null {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function moneyValue(value: number | null): string {
  if (value == null) return "pendiente";
  return `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function yieldRange(yieldPredict: unknown): string {
  const record = asRecord(yieldPredict);
  const low = numberValue(record.lowBandQuintales);
  const high = numberValue(record.highBandQuintales);
  if (low == null || high == null) return "pendiente";
  return `${low.toFixed(1)}-${high.toFixed(1)} qq`;
}

function latestHistoricalNdvi(sentinel2: unknown) {
  const record = asRecord(sentinel2);
  const series = Array.isArray(record.historicalSeries)
    ? record.historicalSeries.map(asRecord)
    : [];
  const values = series
    .map((point) => numberValue(point.ndvi))
    .filter((value): value is number => value != null);
  const current = numberValue(record.currentNdvi) ?? values.at(-1) ?? null;
  const previous = values.length >= 2 ? values.at(-2) ?? null : null;
  return { current, previous };
}

function ndviDropPct(previous: number | null, current: number | null): number | null {
  if (previous == null || current == null || previous <= 0) return null;
  const drop = ((previous - current) / previous) * 100;
  return Number(drop.toFixed(1));
}

export function buildSentinelAgentContext(input: {
  lot: SentinelAgentContext["lot"];
  farmer: SentinelAgentContext["farmer"];
  snapshot: Omit<SentinelAgentContext["snapshot"], "sourceMode"> & {
    sourceMode: "fixture" | "live" | string | null;
  };
  publicUrl: string;
}): SentinelAgentContext {
  const yieldPredict = input.snapshot.yieldPredict;
  const sentinel2Ndvi = latestHistoricalNdvi(input.snapshot.sentinel2);
  const era5 = asRecord(input.snapshot.era5);
  const chain = asRecord(input.snapshot.chain);
  const yieldPredictRecord = asRecord(yieldPredict);

  return {
    lot: input.lot,
    farmer: input.farmer,
    snapshot: {
      ...input.snapshot,
      sourceMode:
        input.snapshot.sourceMode === "live" || input.snapshot.sourceMode === "fixture"
          ? input.snapshot.sourceMode
          : "none",
    },
    publicUrl: input.publicUrl,
    signals: {
      currentNdvi: sentinel2Ndvi.current,
      previousNdvi: sentinel2Ndvi.previous,
      ndviDropPct: ndviDropPct(sentinel2Ndvi.previous, sentinel2Ndvi.current),
      annualRainfallMm: numberValue(era5.annualRainfallMm),
      meanTemperatureC: numberValue(era5.meanTemperatureC),
      waterStress: era5.waterStress == null ? null : String(era5.waterStress),
      yieldRange: yieldRange(yieldPredict),
      projectedQuintales: numberValue(yieldPredictRecord.projectedQuintales),
      partnerReturnTotalUsd: numberValue(yieldPredictRecord.partnerReturnTotalUsd),
      partnerProfitUsd: numberValue(yieldPredictRecord.partnerProfitUsd),
      farmerProfitUsd: numberValue(yieldPredictRecord.farmerProfitUsd),
      metadataStatus: chain.metadataStatus == null ? null : String(chain.metadataStatus),
    },
  };
}

export function getSentinelAgentKnowledge(signal: SentinelAgentSignal) {
  return sentinelAgentKnowledge[signal];
}

export function signalForScenario(scenario: SentinelAgentScenario) {
  return scenarioSignal[scenario];
}

function scenarioMatchesLiveContext(
  scenario: SentinelAgentScenario,
  context: SentinelAgentContext,
  dropPct: number | null,
) {
  switch (scenario) {
    case "lot_approved":
      return (
        context.snapshot.eligibleForInvestment &&
        (context.snapshot.riskScore ?? 0) >= 60 &&
        context.snapshot.eudrStatus === "verified"
      );
    case "eudr_blocked":
      return context.snapshot.eudrStatus === "non_compliant";
    case "water_stress":
      return context.signals.waterStress === "high";
    case "fungal_risk":
      return (context.signals.annualRainfallMm ?? 0) > 3000;
    case "ndvi_drop_money":
      return dropPct != null && dropPct > 0;
    case "flowering_positive":
      return context.snapshot.sourceMode === "live" || context.snapshot.sourceMode === "fixture";
    case "roya_risk":
    case "explain_roya":
      return false;
  }
}

export function buildSentinelAgentScenario(input: {
  scenario: SentinelAgentScenario;
  context: SentinelAgentContext;
  demoOverrides?: SentinelAgentDemoOverrides;
  templateKey?: string;
}): SentinelAgentScenarioResponse {
  const signal = signalForScenario(input.scenario);
  const knowledge = getSentinelAgentKnowledge(signal);
  const overrides = input.demoOverrides ?? {};
  const previousNdvi = overrides.previousNdvi ?? input.context.signals.previousNdvi;
  const currentNdvi = overrides.currentNdvi ?? input.context.signals.currentNdvi;
  const dropPct = ndviDropPct(previousNdvi ?? null, currentNdvi ?? null);
  const temperatureC = overrides.temperatureC ?? input.context.signals.meanTemperatureC;
  const humidityPct = overrides.humidityPct;
  const variety = overrides.variety ?? input.context.lot.variety ?? "cafe";
  const phenologyStage = overrides.phenologyStage ?? "etapa productiva";
  const farmerName = input.context.farmer.name || "productor";
  const lotCode = input.context.lot.code;
  const yieldText = input.context.signals.yieldRange;
  const partnerReturn = moneyValue(input.context.signals.partnerReturnTotalUsd);
  const farmerProfit = moneyValue(input.context.signals.farmerProfitUsd);
  const partnerProfit = moneyValue(input.context.signals.partnerProfitUsd);
  const hasDemoOverrides = Object.keys(overrides).length > 0;

  const bodyByScenario: Record<SentinelAgentScenario, string> = {
    lot_approved:
      `Don ${farmerName}, su lote ${lotCode} quedo aprobado por Copernicus: score ${input.context.snapshot.riskScore ?? "pendiente"}/100 y EUDR verificado. YieldPredict estima ${yieldText}. QR publico: ${input.context.publicUrl}`,
    eudr_blocked:
      `Don ${farmerName}, detectamos una senal que puede afectar cumplimiento EUDR en ${lotCode}. Sin cumplimiento, este cafe no podria venderse a Europa. El equipo debe revisar poligono y fecha del cambio antes de tomar una decision final.`,
    water_stress:
      `Don ${farmerName}, su lote ${lotCode} muestra senales de estres hidrico. En llenado de fruto esto puede reducir tamano y peso del grano. Si tiene acceso a riego esta semana, puede ayudar a proteger la cosecha proyectada de ${yieldText}.`,
    fungal_risk:
      `Don ${farmerName}, la lluvia anual de ${input.context.signals.annualRainfallMm ?? "pendiente"} mm esta por encima de lo ideal. Esto aumenta riesgo de hongos y problemas de acceso/secado. Revise drenaje y sanidad del lote ${lotCode}.`,
    ndvi_drop_money:
      `Don ${farmerName}, el satelite muestra que el verdor de ${lotCode} bajo${dropPct == null ? "" : ` cerca de ${dropPct}%`} en las ultimas semanas. Como estamos en etapa productiva, esto puede afectar cosecha y retorno. Proyeccion actual: ${yieldText}; utilidad farmer: ${farmerProfit}; utilidad partner: ${partnerProfit}; retorno partner total: ${partnerReturn}. ?Ha visto hojas marchitas por la tarde o dano en el fruto?`,
    roya_risk:
      `Don ${farmerName}, en ${lotCode} simulamos condiciones de alto riesgo de roya para demo: ${temperatureC ?? "22"} C y humedad ${humidityPct ?? "85"}% en ${phenologyStage}, variedad ${variety}. Revise el enves de las hojas en los proximos 3 dias. Si ve manchas amarillo-naranja, confirme manejo con tecnico o IHCAFE.`,
    explain_roya:
      "La roya es un hongo que ataca las hojas del cafe. Aparece como polvo amarillo-naranja en el enves. Hace que la hoja se caiga, y con menos hojas la planta produce menos. Avanza rapido con calor y humedad. ?Quiere que le diga como revisarla paso a paso?",
    flowering_positive:
      `Buenas noticias, Don ${farmerName}. El satelite detecto una trayectoria positiva en ${lotCode}. Su cosecha proyectada se mantiene en ${yieldText}. Siga el plan de manejo y revise el siguiente hito.`,
  };

  const sourceMode =
    input.scenario === "explain_roya"
      ? "none"
      : input.scenario === "roya_risk" ||
          hasDemoOverrides ||
          !scenarioMatchesLiveContext(input.scenario, input.context, dropPct)
        ? "demo_seeded"
        : input.context.snapshot.sourceMode;

  return {
    scenario: input.scenario,
    signal,
    sourceMode,
    demoData: sourceMode === "demo_seeded",
    context: input.context,
    knowledge,
    message: {
      templateKey: input.templateKey ?? `sentinel_${input.scenario}`,
      title: knowledge.title,
      body: bodyByScenario[input.scenario],
      guardrails: knowledge.guardrails,
    },
    whatsapp: {
      templateKey: input.templateKey ?? "harvverse_sentinel_alert",
      variables: [
        farmerName,
        input.context.lot.farmName,
        lotCode,
        String(input.context.snapshot.riskScore ?? "pendiente"),
        yieldText,
        input.context.publicUrl,
        bodyByScenario[input.scenario],
      ],
    },
  };
}
