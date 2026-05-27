import { buildEudrGate } from "../packages/api/src/lib/copernicus/eudr";

const pending = buildEudrGate();
const blocked = buildEudrGate({
  post2020DeforestationDetected: true,
  evidenceSource: "demo post-2020 forest-loss signal",
});

console.log(
  JSON.stringify(
    {
      pending,
      blocked,
      hardBlockWorks:
        blocked.status === "non_compliant" &&
        blocked.eligibleForMarketplace === false &&
        blocked.riskLevel === "high_risk",
    },
    null,
    2,
  ),
);

if (pending.eligibleForMarketplace || !blocked.post2020DeforestationDetected) {
  process.exitCode = 1;
}
