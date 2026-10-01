import {
  createAdminClient,
} from "@/lib/supabase/admin";

import {
  buildCommunityReportCandidates,
} from "@/lib/community/report-candidates";

import type {
  AnalysisFinding,
  CommunityCheck,
  ExtractedEntities,
} from "@/lib/analysis/types";


const LOOKBACK_DAYS =
  180;

const MAX_CANDIDATES =
  20;


type CommunityDatabaseRow = {
  indicator_key: string;

  indicator_type:
    | "domain"
    | "url";

  domain_value:
    string | null;

  hostname:
    string | null;

  user_id: string;
};


function createCommunityFinding(
  check:
    CommunityCheck,
): AnalysisFinding | null {
  const reporters =
    check.distinctReporters;


  // EXACT URL
  // More specific, therefore lower corroboration threshold.
  if (
    check.indicatorType ===
    "url"
  ) {
    if (
      reporters >= 10
    ) {
      return {
        key:
          `community:url:${check.indicatorKey}`,

        category:
          "community_reported_url",

        source:
          "community",

        severity:
          "high",

        title:
          "URL has multiple independent community reports",

        explanation:
          `This exact URL was selected as suspicious in ${reporters} independent JobShield user reports during the last ${LOOKBACK_DAYS} days. Community reports are corroborating evidence and are not independently verified claims.`,

        evidence:
          check.displayValue,

        scoreContribution:
          25,
      };
    }


    if (
      reporters >= 5
    ) {
      return {
        key:
          `community:url:${check.indicatorKey}`,

        category:
          "community_reported_url",

        source:
          "community",

        severity:
          "medium",

        title:
          "URL has repeated community reports",

        explanation:
          `This exact URL was selected as suspicious by ${reporters} independent JobShield users during the last ${LOOKBACK_DAYS} days.`,

        evidence:
          check.displayValue,

        scoreContribution:
          15,
      };
    }


    if (
      reporters >= 3
    ) {
      return {
        key:
          `community:url:${check.indicatorKey}`,

        category:
          "community_reported_url",

        source:
          "community",

        severity:
          "low",

        title:
          "URL has several community reports",

        explanation:
          `This exact URL was selected as suspicious by ${reporters} independent JobShield users during the last ${LOOKBACK_DAYS} days.`,

        evidence:
          check.displayValue,

        scoreContribution:
          8,
      };
    }


    return null;
  }

  // DOMAIN
  //
  // Domain-level reputation is broader than exact URL
  // reputation, so thresholds are intentionally higher.
  if (
    reporters >= 25
  ) {
    return {
      key:
        `community:domain:${check.indicatorKey}`,

      category:
        "community_reported_domain",

      source:
        "community",

      severity:
        "high",

      title:
        "Domain has substantial community reporting",

      explanation:
        `${check.displayValue} was selected as suspicious by ${reporters} independent JobShield users during the last ${LOOKBACK_DAYS} days. This is community corroboration, not proof that every page or sender using the domain is malicious.`,

      evidence:
        check.displayValue,

      scoreContribution:
        18,
    };
  }

  if (
    reporters >= 10
  ) {
    return {
      key:
        `community:domain:${check.indicatorKey}`,

      category:
        "community_reported_domain",

      source:
        "community",

      severity:
        "medium",

      title:
        "Domain has repeated community reports",

      explanation:
        `${check.displayValue} was selected as suspicious by ${reporters} independent JobShield users during the last ${LOOKBACK_DAYS} days.`,

      evidence:
        check.displayValue,

      scoreContribution:
        12,
    };
  }


  if (
    reporters >= 5
  ) {
    return {
      key:
        `community:domain:${check.indicatorKey}`,

      category:
        "community_reported_domain",

      source:
        "community",

      severity:
        "low",

      title:
        "Domain has several community reports",

      explanation:
        `${check.displayValue} was selected as suspicious by ${reporters} independent JobShield users during the last ${LOOKBACK_DAYS} days.`,

      evidence:
        check.displayValue,

      scoreContribution:
        6,
    };
  }


  return null;
}

export async function runCommunityIntelligence(
  entities:
    ExtractedEntities,
): Promise<{
  checks:
    CommunityCheck[];

  findings:
    AnalysisFinding[];
}> {
  const candidates =
    buildCommunityReportCandidates(
      entities,
    ).slice(
      0,
      MAX_CANDIDATES,
    );


  if (
    candidates.length ===
    0
  ) {
    return {
      checks: [],
      findings: [],
    };
  }


  const keys =
    candidates.map(
      (candidate) =>
        candidate.key,
    );


  const cutoff =
    new Date(
      Date.now() -
        LOOKBACK_DAYS *
          24 *
          60 *
          60 *
          1000,
    ).toISOString();


  const supabase =
    createAdminClient();


  const {
    data,
    error,
  } =
    await supabase
      .from(
        "community_indicator_reports",
      )
      .select(
        `
          indicator_key,
          indicator_type,
          domain_value,
          hostname,
          user_id
        `,
      )
      .in(
        "indicator_key",
        keys,
      )
      .gte(
        "created_at",
        cutoff,
      );


  if (error) {
    throw error;
  }


  const rows =
    (
      data ??
      []
    ) as
      CommunityDatabaseRow[];


  const usersByIndicator =
    new Map<
      string,
      Set<string>
    >();


  for (
    const row
    of rows
  ) {
    const set =
      usersByIndicator.get(
        row.indicator_key,
      ) ??
      new Set<string>();


    set.add(
      row.user_id,
    );


    usersByIndicator.set(
      row.indicator_key,
      set,
    );
  }


  const checks:
    CommunityCheck[] = [];


  for (
    const candidate
    of candidates
  ) {
    const reporterCount =
      usersByIndicator.get(
        candidate.key,
      )?.size ??
      0;


    /* No need to persist empty community matches. */
    if (
      reporterCount ===
      0
    ) {
      continue;
    }

    checks.push({
      indicatorKey:
        candidate.key,

      indicatorType:
        candidate.type,

      /* For an exact URL match, expose only the hostname in the community evidence layer. */
      displayValue:
        candidate.type ===
          "url"
          ? candidate.hostname ??
            "URL"
          : candidate.domainValue ??
            candidate.label,

      distinctReporters:
        reporterCount,

      lookbackDays:
        LOOKBACK_DAYS,
    });
  }

  const findings =
    checks
      .map(
        createCommunityFinding,
      )
      .filter(
        (
          finding,
        ): finding is AnalysisFinding =>
          finding !==
          null,
      );


  return {
    checks,
    findings,
  };
}