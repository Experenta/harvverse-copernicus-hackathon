"use client";

import dynamic from "next/dynamic";
import type { Polygon } from "geojson";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { Skeleton } from "@harvverse-copernicus-hackathon/ui/components/skeleton";

import type { CopernicusSnapshotView } from "@/lib/copernicus-snapshot";
import { farmBoundaryForLotMap } from "@/lib/geo-polygon";

const LotProofTerrainMap = dynamic(() => import("./lot-proof-terrain-map"), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-none" />,
});

const PolygonDisplayMap = dynamic(() => import("@/components/polygon-display-map"), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-none" />,
});

interface Props {
  lotPolygon: Polygon;
  farmPolygon?: unknown;
  snapshot: CopernicusSnapshotView | null;
  color?: string;
  fillOpacity?: number;
  className?: string;
}

export default function LotProofMap({
  lotPolygon,
  farmPolygon,
  snapshot,
  color = "#67E8F9",
  fillOpacity = 0.22,
  className,
}: Props) {
  const t = useTranslations("lot_proof");
  const [useFallback2d, setUseFallback2d] = useState(false);
  const farmContext = farmBoundaryForLotMap(farmPolygon, lotPolygon) ?? undefined;

  const shared = {
    polygon: lotPolygon,
    contextPolygon: farmContext,
    contextColor: "#4a9eff",
    className: "absolute inset-0",
    color,
    fillOpacity,
    mapLabel: useFallback2d ? t("satellite_map") : t("terrain_map_label"),
    invalidPolygonMessage: t("invalid_polygon"),
    tileErrorMessage: t("tile_error"),
  };

  if (useFallback2d) {
    return (
      <div className={className} style={{ position: "relative", height: "100%", width: "100%" }}>
        <PolygonDisplayMap {...shared} />
        <div className="pointer-events-none absolute bottom-4 left-4 right-4 z-[500] rounded-lg border border-yellow-300/25 bg-[#001120]/85 px-3 py-2 text-xs text-yellow-100/85 shadow-lg backdrop-blur">
          {t("terrain_fallback_notice")}
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={{ position: "relative", height: "100%", width: "100%" }}>
      <LotProofTerrainMap
        lotPolygon={lotPolygon}
        farmPolygon={farmPolygon}
        color={color}
        fillOpacity={fillOpacity}
        className="absolute inset-0"
        mapLabel={t("terrain_map_label")}
        rotateHint={t("terrain_rotate_hint")}
        snapshotOverlay={
          snapshot
            ? {
                riskScore: snapshot.riskScore,
                ndvi: snapshot.sentinel2.currentNdvi,
                altitudeMasl: snapshot.dem.altitudeMasl,
              }
            : undefined
        }
        onFallback={() => setUseFallback2d(true)}
      />
    </div>
  );
}
