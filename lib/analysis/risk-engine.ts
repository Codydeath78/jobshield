import type {
  AIAssessment,
  AnalysisFinding,
  FindingSource,
  RiskLevel,
  RiskResult,
} from "@/lib/analysis/types";

function getRiskLevel(
  score: number,
): RiskLevel {
  if (score >= 70) {
    return "critical";
  }

  if (score >= 45) {
    return "high";
  }

  if (score >= 20) {
    return "medium";
  }

  return "low";
}

function calculateSourceScore(
  findings: AnalysisFinding[],
  source: FindingSource,
  cap: number,
): number {
  const score =
    findings
      .filter(
        (finding) =>
          finding.source ===
          source,
      )
      .reduce(
        (total, finding) =>
          total +
          finding.scoreContribution,
        0,
      );

  return Math.min(
    cap,
    score,
  );
}

function calculateAISignal(
  assessment: AIAssessment | null,
): number {
  if (!assessment) {
    return 0;
  }

  const weightedSignal =
    assessment.scamLikelihood *
    assessment.confidence *
    0.65;

  return Math.min(
    60,
    Math.round(
      weightedSignal,
    ),
  );
}

export function calculateHybridRisk(
  findings: AnalysisFinding[],
  aiAssessment: AIAssessment | null,
): RiskResult {
  const ruleScore =
    calculateSourceScore(
      findings,
      "rules",
      100,
    );

  const aiSignal =
    calculateAISignal(
      aiAssessment,
    );

  const domainSignal =
    calculateSourceScore(
      findings,
      "domain",
      60,
    );

  
  const urlSignal =
    calculateSourceScore(
      findings,
      "url_reputation",
      80,
   );

  const emailSignal =
  calculateSourceScore(
    findings,
    "email_header",
    50,
  );

  const communitySignal =
  calculateSourceScore(
    findings,
    "community",
    30,
  );

  /* Combine independent signals without simply adding them together. */

const combined =
  1 -
  (1 - ruleScore / 100) *
    (1 - aiSignal / 100) *
    (1 - domainSignal / 100) *
    (1 - urlSignal / 100) *
    (1 - emailSignal / 100) *
    (1 - communitySignal / 100);

  const riskScore =
    Math.min(
      100,
      Math.round(
        combined * 100,
      ),
    );

  return {
    riskScore,

    riskLevel:
      getRiskLevel(
        riskScore,
      ),

    ruleScore,
    aiSignal,
    domainSignal,
    urlSignal,
    emailSignal,
    communitySignal,
  };
}