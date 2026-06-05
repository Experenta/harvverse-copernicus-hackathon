import { asRecord } from "@/lib/chainProof";
import {
  carbonLedgerAnnualEstimate,
  carbonLedgerStorageKey,
  parseCarbonLedger,
  roundCarbon,
  type CarbonLedgerState,
} from "@/lib/carbon-ledger";
import { parseCopernicusSnapshot, type CopernicusSnapshotView } from "@/lib/copernicus-snapshot";

export type CarbonCreditRow = {
  lotId: number;
  lotCode: string;
  lotName: string;
  farmName: string;
  annualEstimate: number;
  ledger: CarbonLedgerState;
  snapshot: CopernicusSnapshotView;
  carbonHash: string | null;
  transactionHash: string | null;
  state: string | null;
  storageKey: string;
};

export type CarbonCreditPortfolio = {
  rows: CarbonCreditRow[];
  availableTCo2e: number;
  hcBalance: number;
  tokenCount: number;
  annualEstimate: number;
};

function latestSnapshotFromLot(lot: Record<string, unknown>) {
  const snapshots = lot.copernicusSnapshots;
  if (Array.isArray(snapshots) && snapshots.length > 0) return snapshots[0];
  return lot.copernicusSnapshot;
}

export function buildCarbonCreditPortfolio(
  farms: unknown[] | undefined,
  readLedgerRaw: (storageKey: string) => string | null,
): CarbonCreditPortfolio {
  const rows: CarbonCreditRow[] = [];

  for (const farmValue of farms ?? []) {
    const farm = asRecord(farmValue);
    if (!farm || !Array.isArray(farm.lots)) continue;

    for (const lotValue of farm.lots) {
      const lot = asRecord(lotValue);
      if (!lot) continue;

      const snapshot = parseCopernicusSnapshot(latestSnapshotFromLot(lot));
      if (!snapshot?.carbonCapture) continue;

      const annualEstimate = carbonLedgerAnnualEstimate(snapshot);
      const carbonRegistry = snapshot.chain.carbonRegistry;
      const storageKey = carbonLedgerStorageKey(snapshot.scoreHash, carbonRegistry?.carbonHash);
      const ledger = parseCarbonLedger(readLedgerRaw(storageKey), annualEstimate);

      rows.push({
        lotId: Number(lot.id),
        lotCode: String(lot.code ?? `Lot ${lot.id ?? ""}`).trim(),
        lotName: String(lot.descriptiveName ?? lot.code ?? `Lot ${lot.id ?? ""}`).trim(),
        farmName: String(farm.name ?? lot.farmName ?? "Farm").trim(),
        annualEstimate,
        ledger,
        snapshot,
        carbonHash: carbonRegistry?.carbonHash ?? null,
        transactionHash: carbonRegistry?.transactionHash ?? null,
        state: carbonRegistry?.state ?? null,
        storageKey,
      });
    }
  }

  return {
    rows,
    annualEstimate: roundCarbon(rows.reduce((sum, row) => sum + row.annualEstimate, 0)),
    availableTCo2e: roundCarbon(
      rows.reduce((sum, row) => sum + row.ledger.availableTCo2e, 0),
    ),
    hcBalance: roundCarbon(rows.reduce((sum, row) => sum + row.ledger.hcBalance, 0)),
    tokenCount: rows.reduce((sum, row) => sum + row.ledger.tokenCount, 0),
  };
}

