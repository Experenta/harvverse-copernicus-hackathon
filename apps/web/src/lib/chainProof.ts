export type SnapshotChainProof = {
  chainId: number;
  contractAddress: string | null;
  metadataStatus: "pending" | "written";
  transactionHash: string | null;
  carbonRegistry: {
    ok: boolean;
    contractAddress: string | null;
    transactionHash: string | null;
    carbonHash: string | null;
    state: string | null;
    methodVersion: string | null;
  } | null;
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
  const carbonRegistry = asRecord(chain?.carbonRegistry);

  return {
    chainId: typeof chain?.chainId === "number" ? chain.chainId : 31337,
    contractAddress:
      typeof chain?.contractAddress === "string" ? chain.contractAddress : null,
    metadataStatus: chain?.metadataStatus === "written" ? "written" : "pending",
    transactionHash:
      typeof chain?.transactionHash === "string" ? chain.transactionHash : null,
    carbonRegistry: carbonRegistry
      ? {
          ok: Boolean(carbonRegistry.ok),
          contractAddress:
            typeof carbonRegistry.contractAddress === "string"
              ? carbonRegistry.contractAddress
              : null,
          transactionHash:
            typeof carbonRegistry.transactionHash === "string"
              ? carbonRegistry.transactionHash
              : null,
          carbonHash:
            typeof carbonRegistry.carbonHash === "string" ? carbonRegistry.carbonHash : null,
          state: typeof carbonRegistry.state === "string" ? carbonRegistry.state : null,
          methodVersion:
            typeof carbonRegistry.methodVersion === "string"
              ? carbonRegistry.methodVersion
              : null,
        }
      : null,
  };
}

export function chainLabel(chainId: number) {
  if (chainId === 31337) return "Hardhat local";
  if (chainId === 84532) return "Base Sepolia";
  return `Chain ${chainId}`;
}

export function isCurrentDeploymentProof(
  proof: SnapshotChainProof,
  expectedChainId = process.env.NEXT_PUBLIC_USE_LOCAL_CONTRACTS === "true"
    ? Number(process.env.NEXT_PUBLIC_HARDHAT_CHAIN_ID ?? 31337)
    : 84532,
  expectedContractAddress = process.env.NEXT_PUBLIC_LOT_ADDRESS,
) {
  if (proof.metadataStatus !== "written") return false;
  if (proof.chainId !== expectedChainId) return false;
  if (!expectedContractAddress) return true;
  return proof.contractAddress?.toLowerCase() === expectedContractAddress.toLowerCase();
}

export function transactionExplorerUrl(chainId: number, txHash: string | null | undefined) {
  if (!txHash) return null;
  if (chainId === 84532) return `https://sepolia.basescan.org/tx/${txHash}`;
  return null;
}
