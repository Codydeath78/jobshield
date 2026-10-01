import {
  createAdminClient,
} from "@/lib/supabase/admin";

import {
  hashThreatUrl,
  normalizeThreatUrl,
} from "@/lib/security/url-normalization";

import type {
  AnalysisFinding,
  UrlReputationCheck,
  UrlReputationMatch,
} from "@/lib/analysis/types";


const MAX_URLS = 10;


type IndicatorDatabaseRow = {
  source:
    | "phishing_database"
    | "urlhaus";

  url_hash: string;

  threat_type:
    | "phishing"
    | "malware";

  external_id:
    string | null;

  target:
    string | null;

  active:
    boolean;
};


export async function runUrlReputation(
  urls: string[],
): Promise<{
  checks:
    UrlReputationCheck[];

  findings:
    AnalysisFinding[];
}> {
  const candidates =
    urls
      .slice(
        0,
        MAX_URLS,
      )
      .map((url) => {
        const normalized =
          normalizeThreatUrl(
            url,
          );

        return {
          original:
            url,

          normalized,

          hash:
            normalized
              ? hashThreatUrl(
                  normalized,
                )
              : null,
        };
      });


  const hashes =
    candidates
      .map(
        (candidate) =>
          candidate.hash,
      )
      .filter(
        (
          hash,
        ): hash is string =>
          hash !== null,
      );


  if (
    hashes.length === 0
  ) {
    return {
      checks:
        candidates.map(
          (candidate) => ({
            url:
              candidate.original,

            normalizedUrl:
              candidate.normalized,

            checked:
              false,

            matched:
              false,

            matches: [],
          }),
        ),

      findings: [],
    };
  }


  const supabase =
    createAdminClient();


  const {
    data,
    error,
  } =
    await supabase
      .from(
        "threat_url_indicators",
      )
      .select(
        `
          source,
          url_hash,
          threat_type,
          external_id,
          target,
          active
        `,
      )
      .in(
        "url_hash",
        hashes,
      );


  if (error) {
    throw error;
  }


  const indicators =
    (
      data ?? []
    ) as IndicatorDatabaseRow[];


  const byHash =
    new Map<
      string,
      IndicatorDatabaseRow[]
    >();


  for (
    const indicator
    of indicators
  ) {
    const existing =
      byHash.get(
        indicator.url_hash,
      ) ?? [];

    existing.push(
      indicator,
    );

    byHash.set(
      indicator.url_hash,
      existing,
    );
  }

  const checks:
    UrlReputationCheck[] =
      candidates.map(
        (candidate) => {
          if (
            !candidate.normalized ||
            !candidate.hash
          ) {
            return {
              url:
                candidate.original,

              normalizedUrl:
                null,

              checked:
                false,

              matched:
                false,

              matches:
                [],
            };
          }

          const rows =
            byHash.get(
              candidate.hash,
            ) ?? [];


          const matches:
            UrlReputationMatch[] =
              rows.map(
                (row) => ({
                  provider:
                    row.source,

                  threatType:
                    row.threat_type,

                  target:
                    row.target,

                  externalId:
                    row.external_id,

                  active:
                    row.active,
                }),
              );


          return {
            url:
              candidate.original,

            normalizedUrl:
              candidate.normalized,

            checked:
              true,

            matched:
              matches.length > 0,

            matches,
          };
        },
      );


  return {
    checks,

    findings:
      createReputationFindings(
        checks,
      ),
  };
}


function createReputationFindings(
  checks: UrlReputationCheck[],
): AnalysisFinding[] {
  const findings:
    AnalysisFinding[] = [];


  for (
    const check of checks
  ) {
    if (
      !check.matched ||
      !check.normalizedUrl
    ) {
      continue;
    }


    const urlHash =
      hashThreatUrl(
        check.normalizedUrl,
      );


    const phishingDatabase =
      check.matches.find(
        (match) =>
          match.provider ===
          "phishing_database",
      );


    if (phishingDatabase) {
      findings.push({
        key:
          `url:phishing-database:${urlHash}`,

        category:
          "known_phishing_url",

        source:
          "url_reputation",

        severity:
          "critical",

        title:
          "Known active phishing URL",

        explanation:
          "This exact URL appears in JobShield's locally synchronized active phishing dataset.",

        evidence:
          check.url,

        scoreContribution:
          50,
      });
    }

    const urlhaus =
      check.matches.find(
        (match) =>
          match.provider ===
          "urlhaus",
      );


    if (urlhaus) {
      const isActive =
        urlhaus.active;

      findings.push({
        key:
          `url:urlhaus:${urlHash}`,

        category:
          "known_malware_url",

        source:
          "url_reputation",

        severity:
          isActive
            ? "critical"
            : "high",

        title:
          isActive
            ? "Known active malware-distribution URL"
            : "Known malware-distribution URL",

        explanation:
          isActive
            ? "This exact URL appears as active in JobShield's locally synchronized malware intelligence dataset."
            : "This exact URL appears in JobShield's locally synchronized malware intelligence dataset, although it is not currently marked active.",

        evidence:
          check.url,

        scoreContribution:
          isActive
            ? 55
            : 35,
      });
    }
  }

  return findings;
}