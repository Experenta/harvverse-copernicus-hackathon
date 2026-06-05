"use client";

import { useTranslations } from "next-intl";
import { ChartNoAxesColumn, Leaf, Satellite, Sprout } from "lucide-react";

import { GlassCard } from "@harvverse-copernicus-hackathon/ui/components/glass-card";

import { CopernicusMetric, CopernicusSectionHeader } from "./copernicus-ui";
import { metricValue, numberValue, type CopernicusSnapshotView } from "@/lib/copernicus-snapshot";

function toneForPct(pct: number | null): "poor" | "moderate" | "good" | "excellent" {
  if (pct == null) return "moderate";
  if (pct >= 80) return "excellent";
  if (pct >= 60) return "good";
  if (pct >= 40) return "moderate";
  return "poor";
}

function bandLabel(
  value: number | null | undefined,
  bands: Array<{ min: number; label: string; tone: "poor" | "moderate" | "good" | "excellent" }>,
) {
  if (value == null || !Number.isFinite(value)) return { label: "pending", tone: "moderate" as const };
  return [...bands].reverse().find((band) => value >= band.min) ?? bands[0];
}

export function CopernicusSignalsGrid({ snapshot }: { snapshot: CopernicusSnapshotView | null }) {
  const t = useTranslations("lot_proof");
  const ndvi = snapshot?.sentinel2.currentNdvi ?? null;
  const ndre = snapshot?.sentinel2.currentNdre ?? null;
  const ndwi = snapshot?.sentinel2.currentNdwi ?? null;
  const rvi = snapshot?.sentinel1.radarVegetationIndex ?? null;
  const rainfall = snapshot?.era5.annualRainfallMm ?? null;
  const altitude = snapshot?.dem.altitudeMasl ?? null;
  const ndviBand = bandLabel(ndvi, [
    { min: 0, label: "poor", tone: "poor" },
    { min: 0.45, label: "moderate", tone: "moderate" },
    { min: 0.65, label: "good", tone: "good" },
    { min: 0.78, label: "excellent", tone: "excellent" },
  ]);
  const ndreBand = bandLabel(ndre, [
    { min: 0, label: "low", tone: "poor" },
    { min: 0.28, label: "moderate", tone: "moderate" },
    { min: 0.42, label: "good", tone: "good" },
    { min: 0.55, label: "excellent", tone: "excellent" },
  ]);
  const ndwiBand = bandLabel(ndwi, [
    { min: -0.2, label: "dry", tone: "poor" },
    { min: 0.05, label: "moderate", tone: "moderate" },
    { min: 0.2, label: "good", tone: "good" },
    { min: 0.35, label: "wet", tone: "excellent" },
  ]);
  const rainfallBand =
    rainfall == null
      ? { label: "pending", tone: "moderate" as const }
      : rainfall < 900
        ? { label: "dry", tone: "poor" as const }
        : rainfall < 1200
          ? { label: "moderate", tone: "moderate" as const }
          : rainfall <= 2400
            ? { label: "optimal", tone: "excellent" as const }
            : rainfall <= 3000
              ? { label: "wet risk", tone: "moderate" as const }
              : { label: "fungal risk", tone: "poor" as const };
  const altitudeBand =
    altitude == null
      ? { label: "pending", tone: "moderate" as const }
      : altitude < 900
        ? { label: "low", tone: "moderate" as const }
        : altitude <= 1800
          ? { label: "coffee range", tone: "excellent" as const }
          : altitude <= 2200
            ? { label: "high", tone: "good" as const }
            : { label: "very high", tone: "moderate" as const };

  return (
    <GlassCard className="border-primary/20 bg-[#001020]/40 p-4">
      <CopernicusSectionHeader
        title={t("satellite_signals")}
        description={t("section_help.satellite_signals")}
      />
      <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
        <CopernicusMetric
          icon={Leaf}
          label={t("metrics.s2_ndvi")}
          value={snapshot ? metricValue(snapshot.sentinel2.currentNdvi, 2) : "--"}
          description={t("metric_help.s2_ndvi")}
          scale={{ value: ndvi, min: 0, max: 1, label: ndviBand.label, tone: ndviBand.tone }}
        />
        <CopernicusMetric
          icon={Leaf}
          label={t("metrics.s2_ndre")}
          value={
            snapshot?.sentinel2.currentNdre == null
              ? "--"
              : numberValue(snapshot.sentinel2.currentNdre).toFixed(2)
          }
          description={t("metric_help.s2_ndre")}
          scale={{ value: ndre, min: 0, max: 0.8, label: ndreBand.label, tone: ndreBand.tone }}
        />
        <CopernicusMetric
          icon={Sprout}
          label={t("metrics.s2_ndwi")}
          value={
            snapshot?.sentinel2.currentNdwi == null
              ? "--"
              : numberValue(snapshot.sentinel2.currentNdwi).toFixed(2)
          }
          description={t("metric_help.s2_ndwi")}
          scale={{ value: ndwi, min: -0.2, max: 0.6, label: ndwiBand.label, tone: ndwiBand.tone }}
        />
        <CopernicusMetric
          icon={Satellite}
          label={t("metrics.s1_sar")}
          value={snapshot?.sentinel1.moistureProxy ?? "--"}
          description={t("metric_help.s1_sar")}
        />
        <CopernicusMetric
          icon={Satellite}
          label={t("metrics.s1_vh_vv_rvi")}
          value={
            snapshot?.sentinel1.vhVvRatio == null || snapshot.sentinel1.radarVegetationIndex == null
              ? "--"
              : `${numberValue(snapshot.sentinel1.vhVvRatio).toFixed(2)} · ${numberValue(snapshot.sentinel1.radarVegetationIndex).toFixed(2)}`
          }
          description={t("metric_help.s1_vh_vv_rvi")}
          scale={{
            value: rvi,
            min: 0,
            max: 1,
            label: rvi == null ? "pending" : rvi >= 0.6 ? "strong" : rvi >= 0.4 ? "stable" : "low",
            tone: toneForPct(rvi == null ? null : rvi * 100),
          }}
        />
        <CopernicusMetric
          icon={Sprout}
          label={t("metrics.era5_rainfall")}
          value={snapshot ? `${metricValue(snapshot.era5.annualRainfallMm)} ${t("unit_mm")}` : "--"}
          description={t("metric_help.era5_rainfall")}
          scale={{ value: rainfall, min: 600, max: 3500, label: rainfallBand.label, tone: rainfallBand.tone }}
        />
        <CopernicusMetric
          icon={ChartNoAxesColumn}
          label={t("metrics.dem_altitude")}
          value={
            snapshot
              ? `${metricValue(snapshot.dem.altitudeMasl)} ${t("unit_masl")}`
              : "--"
          }
          description={t("metric_help.dem_altitude")}
          scale={{ value: altitude, min: 600, max: 2400, label: altitudeBand.label, tone: altitudeBand.tone }}
        />
      </div>
    </GlassCard>
  );
}
