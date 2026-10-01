import {
  createAdminClient,
} from "@/lib/supabase/admin";

import {
  hashShareToken,
  isValidShareToken,
} from "@/lib/reports/share-token";


export async function getPublicSharedReport(
  token: string,
) {
  if (
    !isValidShareToken(
      token,
    )
  ) {
    return null;
  }


  const supabase =
    createAdminClient();


  const tokenHash =
    hashShareToken(
      token,
    );


  const {
    data:
      share,
    error:
      shareError,
  } =
    await supabase
      .from(
        "shared_reports",
      )
      .select(
        `
          analysis_id,
          expires_at,
          revoked_at
        `,
      )
      .eq(
        "token_hash",
        tokenHash,
      )
      .maybeSingle();


  if (
    shareError ||
    !share
  ) {
    return null;
  }


  if (
    share.revoked_at
  ) {
    return null;
  }


  if (
    new Date(
      share.expires_at,
    ).getTime() <=
    Date.now()
  ) {
    return null;
  }


  /*
   * IMPORTANT:
   *
   * Select only fields we explicitly want
   * to make public.
   *
   * NO user_id
   * NO input_text
   * NO input_metadata
   * NO extracted_entities
   */
  const {
    data:
      analysis,
  } =
    await supabase
      .from(
        "analyses",
      )
      .select(
        `
          id,
          analysis_type,
          risk_score,
          risk_level,
          summary,
          signal_breakdown,
          pipeline_version,
          created_at
        `,
      )
      .eq(
        "id",
        share.analysis_id,
      )
      .maybeSingle();


  if (!analysis) {
    return null;
  }

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
            severity,
            source,
            title,
            explanation,
            score_contribution
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
            has_dns,
            has_mx,
            domain_age_days,
            registrar
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
            hostname,
            checked,
            matched
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
            registry_matched,
            registry_company_name,
            registry_ticker,
            registry_exchange,
            aligned_domains
          `,
        )
        .eq(
          "analysis_id",
          analysis.id,
        ),
    ]);


  return {
    expiresAt:
      share.expires_at,

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