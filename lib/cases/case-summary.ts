import type {
  RiskLevel,
} from "@/lib/analysis/types";


export type CaseArtifactRisk = {
  id: string;

  riskScore:
    number | null;

  riskLevel:
    RiskLevel | null;

  status: string;
};

export type CaseSummary = {
  riskScore:
    number | null;

  riskLevel:
    RiskLevel | null;

  artifactCount:
    number;

  scoredArtifactCount:
    number;

  elevatedArtifactCount:
    number;

  highOrCriticalCount:
    number;
};

export function calculateCaseSummary(
  artifacts:
    CaseArtifactRisk[],
): CaseSummary {
  const scored =
    artifacts.filter(
      (
        artifact,
      ): artifact is CaseArtifactRisk & {
        riskScore: number;
        riskLevel: RiskLevel;
      } =>
        typeof artifact.riskScore ===
          "number" &&
        artifact.riskLevel !==
          null,
    );

  const highest =
    scored.reduce<
      | (
          CaseArtifactRisk & {
            riskScore: number;
            riskLevel: RiskLevel;
          }
        )
      | null
    >(
      (
        current,
        artifact,
      ) => {
        if (
          !current ||
          artifact.riskScore >
            current.riskScore
        ) {
          return artifact;
        }

        return current;
      },
      null,
    );

  const elevatedArtifactCount =
    scored.filter(
      (artifact) =>
        artifact.riskLevel ===
          "medium" ||
        artifact.riskLevel ===
          "high" ||
        artifact.riskLevel ===
          "critical",
    ).length;

  const highOrCriticalCount =
    scored.filter(
      (artifact) =>
        artifact.riskLevel ===
          "high" ||
        artifact.riskLevel ===
          "critical",
    ).length;

  return {
    riskScore:
      highest
        ?.riskScore ??
      null,

    riskLevel:
      highest
        ?.riskLevel ??
      null,

    artifactCount:
      artifacts.length,

    scoredArtifactCount:
      scored.length,

    elevatedArtifactCount,

    highOrCriticalCount,
  };
}