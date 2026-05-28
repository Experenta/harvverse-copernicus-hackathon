export type SnapshotChainProof = {
  chainId: number;
  metadataStatus: "pending" | "written";
  transactionHash: string | null;
};

export function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

export function getSnapshotChain(
  snapshot: { chain?: unknown } | null | undefined,
): SnapshotChainProof {
  const chain = asRecord(snapshot?.chain);

  return {
    chainId: typeof chain?.chainId === "number" ? chain.chainId : 31337,
    metadataStatus: chain?.metadataStatus === "written" ? "written" : "pending",
    transactionHash:
      typeof chain?.transactionHash === "string" ? chain.transactionHash : null,
  };
}

export function chainLabel(chainId: number) {
  if (chainId === 31337) return "Hardhat local";
  if (chainId === 84532) return "Base Sepolia";
  return `Chain ${chainId}`;
}
