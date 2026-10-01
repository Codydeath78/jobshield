import type {
  AIAssessment,
  AnalysisFinding,
} from "@/lib/analysis/types";

export function generateSummary(
  findings: AnalysisFinding[],
  aiAssessment: AIAssessment | null,
): string {
  if (
    aiAssessment &&
    aiAssessment.summary.trim()
  ) {
    return aiAssessment.summary.trim();
  }

  if (findings.length === 0) {
    return (
      "No known deterministic scam patterns were detected. " +
      "This does not confirm that the opportunity is legitimate."
    );
  }

  const importantFindings =
    [...findings]
      .sort(
        (a, b) =>
          b.scoreContribution -
          a.scoreContribution,
      )
      .slice(0, 3)
      .map(
        (finding) =>
          finding.title,
      );

  return `Detected ${findings.length} warning ${
    findings.length === 1
      ? "signal"
      : "signals"
  }, including: ${importantFindings.join(
    ", ",
  )}.`;
}