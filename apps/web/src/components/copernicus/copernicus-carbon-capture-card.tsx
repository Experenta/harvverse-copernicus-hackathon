"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRightLeft, RefreshCw, Sprout } from "lucide-react";

import { Badge } from "@harvverse-copernicus-hackathon/ui/components/badge";
import { Button } from "@harvverse-copernicus-hackathon/ui/components/button";
import { GlassCard } from "@harvverse-copernicus-hackathon/ui/components/glass-card";

import {
  buildDefaultCarbonLedger,
  carbonLedgerStorageKey,
  formatCarbon,
  issueCarbonLedgerCredit,
  parseCarbonLedger,
  positiveNumber,
  roundCarbon,
  type CarbonLedgerState,
} from "@/lib/carbon-ledger";
import { transactionExplorerUrl } from "@/lib/chainProof";
import { shortHash, metricValue, type CopernicusSnapshotView } from "@/lib/copernicus-snapshot";
import { CopernicusMetric, CopernicusProofRow, CopernicusSectionHeader } from "./copernicus-ui";

type CarbonCapture = NonNullable<CopernicusSnapshotView["carbonCapture"]>;

export function CopernicusCarbonCaptureCard({
  snapshot,
  interactive = false,
}: {
  snapshot: CopernicusSnapshotView;
  interactive?: boolean;
}) {
  const carbon = snapshot.carbonCapture;
  if (!carbon) return null;

  return <CarbonCaptureCardContent snapshot={snapshot} carbon={carbon} interactive={interactive} />;
}

function CarbonCaptureCardContent({
  snapshot,
  carbon,
  interactive,
}: {
  snapshot: CopernicusSnapshotView;
  carbon: CarbonCapture;
  interactive: boolean;
}) {
  const carbonRegistry = snapshot.chain.carbonRegistry;

  return (
    <GlassCard className="min-w-0 overflow-hidden border-emerald-400/20 bg-[#001020]/40 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sprout className="size-5 text-emerald-300" />
          <CopernicusSectionHeader
            title="Carbon Capture"
            description="Screening estimate from Copernicus canopy and radar structure proxies. This is not a certified carbon credit."
          />
        </div>
        <Badge className="rounded-full border-yellow-400/30 bg-yellow-400/10 px-2 py-0.5 text-[10px] font-black uppercase text-yellow-200">
          estimate only
        </Badge>
      </div>

      {interactive ? (
        <CarbonCreditSimulation
          annualEstimate={roundCarbon(positiveNumber(carbon.totalTCo2ePerYear))}
          carbonHash={carbonRegistry?.carbonHash}
          scoreHash={snapshot.scoreHash}
        />
      ) : null}

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <CopernicusMetric
          label="tCO2e / ha / yr"
          value={metricValue(carbon.tCo2ePerHaYear, 2)}
          description="Estimated annual capture per hectare from shade canopy structure."
          size="sm"
        />
        <CopernicusMetric
          label="lot total / yr"
          value={`${metricValue(carbon.totalTCo2ePerYear, 2)} tCO2e`}
          description="Estimated annual capture for the full lot area."
          size="sm"
        />
        <CopernicusMetric
          label="canopy cover"
          value={`${metricValue(carbon.canopyCoverPct, 0)}%`}
          description="Estimated from Sentinel-2 NDVI/NDRE/NDWI and Sentinel-1 structure."
          size="sm"
        />
        <CopernicusMetric
          label="shade density"
          value={`${metricValue(carbon.shadeTreeDensityPerHa, 0)} trees/ha`}
          description="Proxy estimate until field inventory confirms shade tree count."
          size="sm"
        />
      </div>

      <div className="mt-3 rounded-xl border border-emerald-400/15 bg-transparent p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
            On-chain carbon evidence
          </p>
          <Badge className="rounded-full border-emerald-400/25 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-200">
            {carbonRegistry?.ok ? "recorded" : "pending"}
          </Badge>
        </div>
        <div className="mt-2">
          <CopernicusProofRow
            label="Carbon hash"
            value={carbonRegistry?.carbonHash ? shortHash(carbonRegistry.carbonHash) : "--"}
            mono
            copyValue={carbonRegistry?.carbonHash}
          />
        </div>
        {carbonRegistry?.transactionHash ? (
          <div className="mt-2">
            <CopernicusProofRow
              label="Registry tx"
              value={shortHash(carbonRegistry.transactionHash)}
              mono
              copyValue={carbonRegistry.transactionHash}
              externalUrl={transactionExplorerUrl(
                snapshot.chain.chainId,
                carbonRegistry.transactionHash,
              )}
            />
          </div>
        ) : null}
        <p className="mt-1 text-[11px] leading-relaxed text-white/40">
          Carbon estimate hash stored in CarbonEstimateRegistry.
        </p>
      </div>
    </GlassCard>
  );
}

function CarbonCreditSimulation({
  annualEstimate,
  carbonHash,
  scoreHash,
}: {
  annualEstimate: number;
  carbonHash?: string | null;
  scoreHash: string;
}) {
  const storageKey = useMemo(
    () => carbonLedgerStorageKey(scoreHash, carbonHash),
    [carbonHash, scoreHash],
  );
  const [ledger, setLedger] = useState<CarbonLedgerState>(() =>
    buildDefaultCarbonLedger(annualEstimate),
  );
  const [loadedStorageKey, setLoadedStorageKey] = useState<string | null>(null);

  useEffect(() => {
    setLedger(parseCarbonLedger(window.localStorage.getItem(storageKey), annualEstimate));
    setLoadedStorageKey(storageKey);
  }, [annualEstimate, storageKey]);

  useEffect(() => {
    if (loadedStorageKey !== storageKey) return;
    window.localStorage.setItem(storageKey, JSON.stringify(ledger));
  }, [ledger, loadedStorageKey, storageKey]);

  const canIssue = annualEstimate > 0 && ledger.availableTCo2e > 0;
  const lastIssuedAt = ledger.lastIssuedAt
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(ledger.lastIssuedAt))
    : "--";

  const issueCarbonToken = () => {
    if (!canIssue) return;

    setLedger((current) => issueCarbonLedgerCredit(current, scoreHash));
  };

  const addNextCycleEstimate = () => {
    if (annualEstimate <= 0) return;

    setLedger((current) => ({
      ...current,
      availableTCo2e: roundCarbon(current.availableTCo2e + annualEstimate),
    }));
  };

  return (
    <div className="relative mt-5 min-w-0 overflow-hidden rounded-2xl border border-fuchsia-300/20 bg-purple-950/30">
      <Button
        type="button"
        size="icon"
        variant="outline"
        aria-label="Add next credit cycle"
        onClick={addNextCycleEstimate}
        disabled={annualEstimate <= 0}
        className="absolute right-3 top-3 z-10 size-8 rounded-full border-fuchsia-100/20 bg-black/15 text-fuchsia-50/55 hover:border-fuchsia-100/40 hover:bg-black/25 hover:text-fuchsia-50"
      >
        <RefreshCw className="size-3.5" />
      </Button>
      <div className="grid min-w-0 gap-0 2xl:grid-cols-[170px_minmax(0,1fr)]">
        <div className="flex flex-col items-center justify-center gap-3 border-b border-fuchsia-300/10 bg-[radial-gradient(circle_at_35%_25%,rgba(216,180,254,0.95),rgba(147,51,234,0.7)_44%,rgba(49,46,129,0.55)_80%)] p-4 2xl:border-b-0 2xl:border-r">
          <div className="grid size-24 place-items-center rounded-full border border-fuchsia-100/50 bg-white/10 shadow-[0_0_42px_rgba(168,85,247,0.35)]">
            <div className="grid size-16 place-items-center rounded-full border border-fuchsia-50/70 bg-black/25 text-center">
              <img
                src="/figma/landing-harv-icon-1.png"
                alt=""
                aria-hidden="true"
                className="mx-auto size-10 object-contain"
              />
            </div>
          </div>
          <p className="max-w-[150px] text-center text-[10px] font-black uppercase tracking-[0.18em] text-fuchsia-50/80">
            Carbon credit
          </p>
        </div>

        <div className="min-w-0 p-4">
          <div className="grid min-w-0 gap-3 md:grid-cols-3">
            <CopernicusMetric
              label="available credit"
              value={`${formatCarbon(ledger.availableTCo2e)} HC`}
              description="Local POC balance available to convert from the current carbon estimate."
              size="sm"
            />
            <CopernicusMetric
              label="HC balance"
              value={`${formatCarbon(ledger.hcBalance)} HC`}
              description="Browser-local token balance for showing how carbon income could accrue over repeated measurement cycles."
              size="sm"
            />
            <CopernicusMetric
              label="last token"
              value={ledger.lastTokenId ?? "--"}
              description="Local token receipt generated from the carbon evidence hash and score hash."
              size="sm"
            />
          </div>

          <div className="mt-4">
            <Button
              type="button"
              onClick={issueCarbonToken}
              disabled={!canIssue}
              className="h-auto min-h-10 min-w-0 rounded-xl border-emerald-300/25 bg-emerald-300 px-3 py-2 text-center text-emerald-950 whitespace-normal hover:bg-emerald-200"
            >
              <ArrowRightLeft className="size-4" />
              Issue HC
            </Button>
          </div>

          <div className="mt-3 grid min-w-0 gap-2 text-[11px] leading-relaxed text-white/45 xl:grid-cols-2">
            <p>
              Last issuance: <span className="font-semibold text-white/70">{lastIssuedAt}</span>
            </p>
            <p>1 HC represents 1 tCO2e unit in this POC ledger.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
