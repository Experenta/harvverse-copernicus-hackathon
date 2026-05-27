export type EudrGateStatus = "verified" | "non_compliant" | "unknown";
export type EudrGateRiskLevel =
  | "low_risk"
  | "review_required"
  | "high_risk"
  | "unknown";
export type EudrGateConfidence = "low" | "medium" | "high";

export interface EudrGateInput {
  post2020DeforestationDetected?: boolean | null;
  evidenceSource?: string | null;
  evidenceDateRange?: {
    from: string;
    to: string;
  } | null;
}

export interface EudrGateResult {
  status: EudrGateStatus;
  eligibleForMarketplace: boolean;
  baseline: "2020-12-31";
  riskLevel: EudrGateRiskLevel;
  post2020DeforestationDetected: boolean;
  requiresManualReview: boolean;
  confidence: EudrGateConfidence;
  reasons: string[];
  limitations: string[];
  evidenceDateRange: {
    from: string;
    to: string;
  };
}

const DEFAULT_EVIDENCE_RANGE = {
  from: "2021-01-01",
  to: new Date().toISOString().slice(0, 10),
};

export function buildEudrGate(input: EudrGateInput = {}): EudrGateResult {
  const evidenceDateRange = input.evidenceDateRange ?? DEFAULT_EVIDENCE_RANGE;

  if (input.post2020DeforestationDetected === true) {
    return {
      status: "non_compliant",
      eligibleForMarketplace: false,
      baseline: "2020-12-31",
      riskLevel: "high_risk",
      post2020DeforestationDetected: true,
      requiresManualReview: true,
      confidence: input.evidenceSource ? "medium" : "low",
      reasons: [
        "Post-2020 deforestation was detected or reported for the lot evidence area.",
        "EUDR gate blocks marketplace eligibility regardless of numeric risk score.",
      ],
      limitations: [
        "This gate should be confirmed with official JRC forest baseline and loss evidence before production enforcement.",
      ],
      evidenceDateRange,
    };
  }

  if (input.post2020DeforestationDetected === false && input.evidenceSource) {
    return {
      status: "verified",
      eligibleForMarketplace: true,
      baseline: "2020-12-31",
      riskLevel: "low_risk",
      post2020DeforestationDetected: false,
      requiresManualReview: false,
      confidence: "medium",
      reasons: [
        `No post-2020 deforestation signal was found in ${input.evidenceSource}.`,
      ],
      limitations: [
        "This hackathon gate is preliminary and should be upgraded to official JRC forest baseline intersection before production use.",
      ],
      evidenceDateRange,
    };
  }

  return {
    status: "unknown",
    eligibleForMarketplace: false,
    baseline: "2020-12-31",
    riskLevel: "review_required",
    post2020DeforestationDetected: false,
    requiresManualReview: true,
    confidence: "low",
    reasons: [
      "Official JRC forest baseline and post-2020 loss evidence are not integrated yet.",
      "The lot remains blocked until EUDR evidence is verified.",
    ],
    limitations: [
      "Unknown is a conservative state, not proof of compliance or non-compliance.",
      "Production EUDR screening must intersect the lot polygon with official forest baseline and post-2020 loss evidence.",
    ],
    evidenceDateRange,
  };
}
