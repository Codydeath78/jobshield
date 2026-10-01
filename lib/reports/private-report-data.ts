import type {
  SupabaseClient,
} from "@supabase/supabase-js";

export async function getPrivateReportData({
  supabase,
  userId,
  analysisId,
}: {
  supabase:
    SupabaseClient;

  userId:
    string;

  analysisId:
    string;
}) {
  // ANALYSIS
  const {
    data:
      analysis,

    error:
      analysisError,
  } =
    await supabase
      .from(
        "analyses",
      )
      .select(
        `
          id,
          analysis_type,
          input_text,
          input_metadata,
          extracted_entities,
          risk_score,
          risk_level,
          summary,
          status,
          ai_confidence,
          ai_scam_likelihood,
          signal_breakdown,
          pipeline_version,
          created_at,
          completed_at
        `,
      )
      .eq(
        "id",
        analysisId,
      )
      .eq(
        "user_id",
        userId,
      )
      .maybeSingle();


  if (
    analysisError ||
    !analysis
  ) {
    return null;
  }

  // RELATED EVIDENCE
  const [
    findingsResult,
    domainsResult,
    urlsResult,
    companiesResult,
  ] =
    await Promise.all([
      supabase
        .from(
          "findings",
        )
        .select(
          `
            id,
            category,
            source,
            severity,
            title,
            explanation,
            evidence,
            score_contribution,
            created_at
          `,
        )
        .eq(
          "analysis_id",
          analysis.id,
        )
        .order(
          "score_contribution",
          {
            ascending:
              false,
          },
        ),

      supabase
        .from(
          "domain_checks",
        )
        .select(
          `
            id,
            domain,
            source_types,
            dns_checked,
            has_dns,
            has_mx,
            rdap_checked,
            rdap_found,
            domain_created_at,
            domain_age_days,
            registrar,
            rdap_statuses
          `,
        )
        .eq(
          "analysis_id",
          analysis.id,
        ),

      supabase
        .from(
          "url_reputation_checks",
        )
        .select(
          `
            id,
            url_hash,
            hostname,
            checked,
            matched,
            matches,
            created_at
          `,
        )
        .eq(
          "analysis_id",
          analysis.id,
        ),

      supabase
        .from(
          "company_verifications",
        )
        .select(
          `
            id,
            claimed_name,
            status,
            registry_source,
            registry_matched,
            registry_company_name,
            registry_cik,
            registry_ticker,
            registry_exchange,
            registry_match_score,
            recruiter_domains,
            communication_domains,
            aligned_domains
          `,
        )
        .eq(
          "analysis_id",
          analysis.id,
        ),
    ]);

  return {
    analysis,

    findings:
      findingsResult.data ??
      [],

    domainChecks:
      domainsResult.data ??
      [],

    urlChecks:
      urlsResult.data ??
      [],

    companyVerifications:
      companiesResult.data ??
      [],
  };
}

export type PrivateReportData =
  NonNullable<
    Awaited<
      ReturnType<
        typeof getPrivateReportData
      >
    >
  >;