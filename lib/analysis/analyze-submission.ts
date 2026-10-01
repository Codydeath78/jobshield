import type {
  SupabaseClient,
} from "@supabase/supabase-js";

import {
  aiAssessmentToFindings,
  getAIModel,
  runAIAnalysis,
} from "@/lib/analysis/ai-analyzer";

import {
  ANALYSIS_PIPELINE_VERSION,
} from "@/lib/analysis/version";

import {
  hashThreatUrl,
  hostnameFromUrl,
} from "@/lib/security/url-normalization";

import {
  runCompanyVerification,
} from "@/lib/analysis/company-verification";

import {
  runDomainIntelligence,
} from "@/lib/analysis/domain-intelligence";

import {
  buildDomainTargets,
  extractEntities,
} from "@/lib/analysis/entities";

import {
  calculateHybridRisk,
} from "@/lib/analysis/risk-engine";

import {
  runRules,
} from "@/lib/analysis/rules";

import {
  generateSummary,
} from "@/lib/analysis/summary";

import {
  runUrlReputation,
} from "@/lib/analysis/url-reputation";

import {
  runCommunityIntelligence,
} from "@/lib/analysis/community-intelligence";

import type {
  AIAssessment,
  AnalysisFinding,
  AnalysisPipelineResult,
  AnalysisType,
  CommunityCheck,
  CompanyVerification,
  DomainCheck,
  UrlReputationCheck,
} from "@/lib/analysis/types";


type AnalyzeSubmissionOptions = {
  supabase:
    SupabaseClient;

  userId:
    string;

  analysisType:
    AnalysisType;

  input:
    string;

  inputMetadata?:
    Record<
      string,
      unknown
    >;

  inputFindings?:
    AnalysisFinding[];

};


export async function analyzeSubmission({
  supabase,
  userId,
  analysisType,
  input,
  inputMetadata = {},
  inputFindings = [],
}: AnalyzeSubmissionOptions):
  Promise<AnalysisPipelineResult> {

  // CREATE ANALYSIS

  const {
    data: analysis,
    error:
      analysisInsertError,
  } =
    await supabase
      .from(
        "analyses",
      )
      .insert({
        user_id:
          userId,

        analysis_type:
          analysisType,

        input_text:
          input,

        input_metadata:
          inputMetadata,

        status:
          "processing",
      })
      .select(
        "id",
      )
      .single();


  if (
    analysisInsertError ||
    !analysis
  ) {
    throw new Error(
      "Could not create analysis.",
    );
  }


  try {
    // DETERMINISTIC RULES
    const ruleFindings =
      runRules(
        input,
      );

    // AI ANALYSIS
    let aiAssessment:
      AIAssessment | null =
        null;

    let aiAvailable =
      false;


    try {
      aiAssessment =
        await runAIAnalysis(
          input,
          analysisType,
        );

      aiAvailable =
        true;
    } catch (error) {
      console.error(
        "AI analysis failed:",
        error,
      );
    }

    // AI FINDINGS
    const aiFindings =
      aiAssessment
        ? aiAssessmentToFindings(
            aiAssessment,
          )
        : [];

    // ENTITY EXTRACTION
    const extractedEntities =
      extractEntities(
        input,
        aiAssessment,
      );


    // DOMAIN INTELLIGENCE
    const domainTargets =
      buildDomainTargets(
        extractedEntities,
        aiAssessment,
      );


    let domainChecks:
      DomainCheck[] = [];

    let domainFindings:
      AnalysisFinding[] = [];


    try {
      const result =
        await runDomainIntelligence(
          domainTargets,
        );

      domainChecks =
        result.checks;

      domainFindings =
        result.findings;
    } catch (error) {
      console.error(
        "Domain intelligence failed:",
        error,
      );
    }

    // URL REPUTATION
    let urlChecks:
      UrlReputationCheck[] = [];

    let urlFindings:
      AnalysisFinding[] = [];


    try {
      const result =
        await runUrlReputation(
          extractedEntities.urls,
        );

      urlChecks =
        result.checks;

      urlFindings =
        result.findings;
    } catch (error) {
      console.error(
        "URL reputation failed:",
        error,
      );
    }

// COMMUNITY INTELLIGENCE
let communityChecks:
  CommunityCheck[] = [];

let communityFindings:
  AnalysisFinding[] = [];


try {
  const result =
    await runCommunityIntelligence(
      extractedEntities,
    );


  communityChecks =
    result.checks;


  communityFindings =
    result.findings;
} catch (error) {
  console.error(
    "Community intelligence failed:",
    error,
  );
}

    // COMPANY VERIFICATION
    let companyVerifications:
      CompanyVerification[] = [];

    let companyFindings:
      AnalysisFinding[] = [];


    try {
      const result =
        await runCompanyVerification(
          extractedEntities,
          aiAssessment,
          domainChecks,
        );

      companyVerifications =
        result.verifications;

      companyFindings =
        result.findings;
    } catch (error) {
      console.error(
        "Company verification failed:",
        error,
      );
    }

    // COMBINE FINDINGS
    const findings = [
      ...inputFindings,
      ...ruleFindings,
      ...aiFindings,
      ...domainFindings,
      ...urlFindings,
      ...communityFindings,
      ...companyFindings,
    ];

    // RISK
    const {
      riskScore,
      riskLevel,
      ruleScore,
      aiSignal,
      domainSignal,
      urlSignal,
      emailSignal,
      communitySignal,
    } =
      calculateHybridRisk(
        findings,
        aiAssessment,
      );


    const summary =
      generateSummary(
        findings,
        aiAssessment,
      );

    // SAVE FINDINGS
    if (
      findings.length > 0
    ) {
      const rows =
        findings.map(
          (finding) => ({
            analysis_id:
              analysis.id,

            category:
              finding.category,

            source:
              finding.source,

            severity:
              finding.severity,

            title:
              finding.title,

            explanation:
              finding.explanation,

            evidence:
              finding.evidence,

            score_contribution:
              finding.scoreContribution,

            metadata: {
              finding_key:
                finding.key,
            },
          }),
        );


      const {
        error,
      } =
        await supabase
          .from(
            "findings",
          )
          .insert(
            rows,
          );


      if (error) {
        throw error;
      }
    }

    // SAVE DOMAIN CHECKS
    if (
      domainChecks.length >
      0
    ) {
      const rows =
        domainChecks.map(
          (check) => ({
            analysis_id:
              analysis.id,

            domain:
              check.domain,

            source_types:
              check.sourceTypes,

            dns_checked:
              check.dnsChecked,

            has_dns:
              check.hasDns,

            has_mx:
              check.hasMx,

            rdap_checked:
              check.rdapChecked,

            rdap_found:
              check.rdapFound,

            domain_created_at:
              check.domainCreatedAt,

            domain_age_days:
              check.domainAgeDays,

            registrar:
              check.registrar,

            rdap_statuses:
              check.rdapStatuses,
          }),
        );


      const {
        error,
      } =
        await supabase
          .from(
            "domain_checks",
          )
          .insert(
            rows,
          );


      if (error) {
        console.error(
          "Domain check persistence failed:",
          error,
        );
      }
    }

    // SAVE COMPANY VERIFICATIONS

    if (
      companyVerifications.length >
      0
    ) {
      const rows =
        companyVerifications.map(
          (verification) => ({
            analysis_id:
              analysis.id,

            claimed_name:
              verification.claimedName,

            normalized_name:
              verification.normalizedName,

            status:
              verification.status,

            registry_source:
              verification.registryMatched
                ? "sec"
                : null,

            registry_matched:
              verification.registryMatched,

            registry_company_name:
              verification.registryCompanyName,

            registry_cik:
              verification.registryCik,

            registry_ticker:
              verification.registryTicker,

            registry_exchange:
              verification.registryExchange,

            registry_match_score:
              verification.registryMatchScore,

            recruiter_domains:
              verification.recruiterDomains,

            communication_domains:
              verification.communicationDomains,

            aligned_domains:
              verification.alignedDomains,

            metadata: {},
          }),
        );


      const {
        error,
      } =
        await supabase
          .from(
            "company_verifications",
          )
          .insert(
            rows,
          );


      if (error) {
        console.error(
          "Company verification persistence failed:",
          error,
        );
      }
    }

// SAVE URL REPUTATION CHECKS
if (
  urlChecks.length > 0
) {
  const rows =
    urlChecks.flatMap(
      (check) => {
        if (
          !check.normalizedUrl
        ) {
          return [];
        }

        const hostname =
          hostnameFromUrl(
            check.normalizedUrl,
          );

        if (!hostname) {
          return [];
        }

        return [
          {
            analysis_id:
              analysis.id,

            url_hash:
              hashThreatUrl(
                check.normalizedUrl,
              ),

            hostname,

            checked:
              check.checked,

            matched:
              check.matched,

            matches:
              check.matches,
          },
        ];
      },
    );


  if (
    rows.length > 0
  ) {
    const {
      error,
    } =
      await supabase
        .from(
          "url_reputation_checks",
        )
        .insert(
          rows,
        );


    if (error) {
      console.error(
        "URL reputation persistence failed:",
        error,
      );
    }
  }
}

// SAVE COMMUNITY INTELLIGENCE SNAPSHOT

if (
  communityChecks.length >
  0
) {
  const rows =
    communityChecks.map(
      (check) => ({
        analysis_id:
          analysis.id,

        indicator_key:
          check.indicatorKey,

        indicator_type:
          check.indicatorType,

        display_value:
          check.displayValue,

        distinct_reporters:
          check.distinctReporters,

        lookback_days:
          check.lookbackDays,
      }),
    );


  const {
    error,
  } =
    await supabase
      .from(
        "community_checks",
      )
      .insert(
        rows,
      );


  if (error) {
    console.error(
      "Community intelligence persistence failed:",
      error,
    );
  }
}

    // COMPLETE ANALYSIS
    const {
      error:
        analysisUpdateError,
    } =
      await supabase
        .from(
          "analyses",
        )
        .update({
          risk_score:
            riskScore,

          risk_level:
            riskLevel,

          summary,

          extracted_entities:
            extractedEntities,

          ai_confidence:
            aiAssessment
              ?.confidence ??
            null,

          ai_scam_likelihood:
            aiAssessment
              ?.scamLikelihood ??
            null,

          ai_model:
            aiAvailable
              ? getAIModel()
              : null,

          status:
            "completed",

          signal_breakdown: {
            ruleScore,
            aiSignal,
            domainSignal,
            urlSignal,
            emailSignal,
            communitySignal,
          },

          pipeline_version:
            ANALYSIS_PIPELINE_VERSION,

          completed_at:
            new Date()
              .toISOString(),
              
        })
        .eq(
          "id",
          analysis.id,
        );


    if (
      analysisUpdateError
    ) {
      throw (
        analysisUpdateError
      );
    }


    // RESULT
    return {
      analysisId:
        analysis.id,

      riskScore,

      riskLevel,

      summary,

      findings,

      signals: {
        ruleScore,
        aiSignal,
        domainSignal,
        urlSignal,
        emailSignal,
        communitySignal,

        aiAvailable,

        aiScamLikelihood:
          aiAssessment
            ?.scamLikelihood ??
          null,

        aiConfidence:
          aiAssessment
            ?.confidence ??
          null,
      },

      entities:
        extractedEntities,

      domainChecks,

      urlChecks,

      companyVerifications,

      communityChecks,
    };
  } catch (error) {
    /* If the pipeline fails unexpectedly, mark the analysis accordingly. */

    await supabase
      .from(
        "analyses",
      )
      .update({
        status:
          "failed",
      })
      .eq(
        "id",
        analysis.id,
      );

    throw error;
  }
}