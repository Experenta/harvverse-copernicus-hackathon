"use client";

import { useTranslations } from "next-intl";
import { Fingerprint } from "lucide-react";

import { Badge } from "@harvverse-copernicus-hackathon/ui/components/badge";
import { GlassCard } from "@harvverse-copernicus-hackathon/ui/components/glass-card";
import { chainLabel, transactionExplorerUrl } from "@/lib/chainProof";
import { shortHash, type CopernicusSnapshotView } from "@/lib/copernicus-snapshot";

import { CopernicusProofRow, CopernicusSectionHeader } from "./copernicus-ui";

export function CopernicusProofCard({ snapshot }: { snapshot: CopernicusSnapshotView }) {
  const t = useTranslations("lot_proof");

  function confidenceLabel(conf: string) {
    if (conf === "low") return t("low");
    if (conf === "medium") return t("medium");
    if (conf === "high") return t("high");
    return conf;
  }

  function metadataLabel(status: "pending" | "written") {
    return status === "written" ? t("local_proof_verified") : t("local_proof_pending");
  }

  return (
    <GlassCard className="border-primary/20 bg-[#001020]/40 p-5">
      <div className="flex items-center gap-2">
        <Fingerprint className="size-5 text-primary" />
        <CopernicusSectionHeader
          title={t("evidence_packet")}
          description={t("section_help.evidence_packet")}
        />
      </div>
      <div className="mt-4 space-y-2">
        <CopernicusProofRow
          label={t("score_hash")}
          value={shortHash(snapshot.scoreHash)}
          description={t("proof_help.score_hash")}
          mono
          copyValue={snapshot.scoreHash}
        />
        <CopernicusProofRow
          label={t("chain")}
          value={`${chainLabel(snapshot.chain.chainId)} · ${snapshot.chain.chainId}`}
          description={t("proof_help.chain")}
        />
        <CopernicusProofRow
          label={t("local_proof")}
          value={metadataLabel(snapshot.chain.metadataStatus)}
          description={t("proof_help.local_proof")}
        />
        <CopernicusProofRow
          label={t("transaction")}
          value={
            snapshot.chain.transactionHash
              ? shortHash(snapshot.chain.transactionHash)
              : t("pending")
          }
          description={t("proof_help.transaction")}
          mono={Boolean(snapshot.chain.transactionHash)}
          copyValue={snapshot.chain.transactionHash}
          externalUrl={transactionExplorerUrl(
            snapshot.chain.chainId,
            snapshot.chain.transactionHash,
          )}
        />
        <CopernicusProofRow
          label={t("confidence")}
          value={confidenceLabel(snapshot.dataQuality.confidence)}
          description={t("proof_help.confidence")}
        />
      </div>
      {snapshot.sources.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {snapshot.sources.map((source) => (
            <Badge
              key={`${source.key}-${source.dataset}`}
              className="rounded-full border-white/10 bg-white/[0.04] text-[10px] text-white/50"
            >
              {source.dataset}
            </Badge>
          ))}
        </div>
      ) : null}
    </GlassCard>
  );
}
