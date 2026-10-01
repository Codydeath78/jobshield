import Link from "next/link";

import {
  notFound,
  redirect,
} from "next/navigation";

import {
  createClient,
} from "@/lib/supabase/server";

import {
  ShareReportControls,
} from "@/components/reports/share-report-controls";

import {
  AddAnalysisToCase,
} from "@/components/cases/add-analysis-to-case";

import {
  ReportScamControls,
} from "@/components/community/report-scam-controls";

import {
  buildCommunityReportCandidates,
} from "@/lib/community/report-candidates";

import type {
  ExtractedEntities,
} from "@/lib/analysis/types";

import {
  ArrowLeft,
  Download,
  History,
} from "lucide-react";

import {
  AnalysisTitleEditor,
} from "@/components/analysis/analysis-title-editor";

import {
  BrowserCaptureDetails,
} from "@/components/analysis/browser-capture-details";


type PageProps = {
  params: Promise<{
    id: string;
  }>;
};


type SignalBreakdown = {
  ruleScore?: number;
  aiSignal?: number;
  domainSignal?: number;
  urlSignal?: number;
  emailSignal?: number;
  communitySignal?: number;
};


function formatStatus(
  value: string | null,
) {
  if (!value) {
    return "Unknown";
  }

  return value
    .replace(
      /_/g,
      " ",
    )
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase(),
    );
}


function yesNoUnknown(
  value:
    | boolean
    | null,
) {
  if (value === true) {
    return "Yes";
  }

  if (value === false) {
    return "No";
  }

  return "Unavailable";
}


export default async function AnalysisPage({
  params,
}: PageProps) {
  const {
    id,
  } =
    await params;


  const supabase =
    await createClient();


  const {
    data:
      claimsData,

    error:
      claimsError,
  } =
    await supabase
      .auth
      .getClaims();


  const userId =
    claimsData
      ?.claims
      ?.sub;


  if (
    claimsError ||
    !userId
  ) {
    redirect(
      "/auth/login",
    );
  }


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
          title,
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
        id,
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
    notFound();
  }


  const {
  data:
    existingCommunityReport,
} =
  await supabase
    .from(
      "scam_reports",
    )
    .select(
      `
        id,
        status
      `,
    )
    .eq(
      "analysis_id",
      analysis.id,
    )
    .eq(
      "user_id",
      userId,
    )
    .maybeSingle();

  const {
  data:
    openCases,
} =
  await supabase
    .from(
      "cases",
    )
    .select(
      `
        id,
        title
      `,
    )
    .eq(
      "user_id",
      userId,
    )
    .eq(
      "status",
      "open",
    )
    .order(
      "updated_at",
      {
        ascending:
          false,
      },
    );

  const [
    findingsResult,
    domainResult,
    urlResult,
    companyResult,
    shareResult,
    communityResult, //hmm?
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


        supabase
          .from(
            "shared_reports",
          )
          .select(
            `
              expires_at,
              revoked_at
            `,
          )
          .eq(
            "analysis_id",
            analysis.id,
          )
          .maybeSingle(),


        supabase
  .from(
    "community_checks",
  )
  .select(
    `
      id,
      indicator_key,
      indicator_type,
      display_value,
      distinct_reporters,
      lookback_days
    `,
  )
  .eq(
    "analysis_id",
    analysis.id,
  ),

    ]);
  const shareRecord =
  shareResult.data;


  const shareActive =
    Boolean(
      shareRecord &&
      !shareRecord.revoked_at &&
      new Date(
        shareRecord.expires_at,
      ).getTime() >
        Date.now(),
    );


  const findings =
    findingsResult.data ??
    [];

  const domainChecks =
    domainResult.data ??
    [];

  const urlChecks =
    urlResult.data ??
    [];

  const companyVerifications =
    companyResult.data ??
    [];

  const communityChecks =
    communityResult.data ??
    [];


  const signals =
    (
      analysis.signal_breakdown ??
      {}
    ) as SignalBreakdown;


  const isLegacy =
    analysis.pipeline_version ===
    "legacy";

  
  const extractedEntities =
  analysis
    .extracted_entities as
    ExtractedEntities;


const communityReportCandidates =
  buildCommunityReportCandidates(
    extractedEntities,
  ).map(
    (candidate) => ({
      key:
        candidate.key,

      type:
        candidate.type,

      label:
        candidate.label,
    }),
  );


  const extensionMetadata =
  analysis.input_metadata &&
  typeof analysis.input_metadata ===
    "object" &&
  "extension" in
    analysis.input_metadata
    ? (
        analysis.input_metadata as {
          extension?: {
            sourceHost?: string | null;
            selectionLength?: number;
            fullPageUrlStored?: boolean;
            fullPageContentStored?: boolean;
          };
        }
      ).extension
    : undefined;


  const documentMetadata =
  analysis.input_metadata &&
  typeof analysis.input_metadata ===
    "object" &&
  "document" in
    analysis.input_metadata
    ? (
        analysis.input_metadata as {
          document?: {
            kind?: string;
            mimeType?: string;
            sizeBytes?: number;
            pageCount?: number | null;
            parser?: string;
            truncated?: boolean;
            warnings?: string[];
            rawFileStored?: boolean;
          };
        }
      ).document
    : undefined;


  const screenshotMetadata =
    analysis.input_metadata &&
    typeof analysis.input_metadata ===
      "object" &&
    "screenshot" in
      analysis.input_metadata
      ? (
          analysis.input_metadata as {
            screenshot?: {
              mimeType?: string;
              sizeBytes?: number;
              extractionConfidence?: number;
              warnings?: string[];
              rawImageStored?: boolean;
            };
          }
        ).screenshot
      : undefined;

  

  const emailMetadata =
  analysis.input_metadata &&
  typeof analysis.input_metadata ===
    "object" &&
  "emailFile" in
    analysis.input_metadata
    ? (
        analysis.input_metadata as {
          emailFile?: {
            subject?: string;

            from?: Array<{
              name?: string;
              address?: string;
              domain?: string | null;
            }>;

            replyTo?: Array<{
              name?: string;
              address?: string;
              domain?: string | null;
            }>;

            returnPath?: string | null;

            messageId?: string | null;

            messageIdDomain?: string | null;

            date?: string | null;

            receivedCount?: number;

            dkimSignaturePresent?: boolean;

            authenticationResults?: Array<{
              authservId?: string | null;
              method?: string;
              result?: string;
            }>;

            attachments?: Array<{
              filename?: string | null;
              mimeType?: string;
              sizeBytes?: number;
            }>;

            truncated?: boolean;

            warnings?: string[];

            rawFileStored?: boolean;
          };
        }
      ).emailFile
    : undefined;

const riskClass =
  analysis.risk_level ===
  "critical"
    ? "js-risk-critical"
    : analysis.risk_level ===
        "high"
      ? "js-risk-high"
      : analysis.risk_level ===
          "medium"
        ? "js-risk-medium"
        : "js-risk-low";


  return (
      <main className="relative min-h-screen overflow-hidden bg-[#06070a]">
    {/* Ambient background glow */}
    <div className="js-orb -left-32 top-20 h-80 w-80 bg-violet-600/10" />

    <div className="js-orb -right-40 top-72 h-96 w-96 bg-blue-600/10 [animation-delay:-4s]" />
      <div className="js-page-enter relative mx-auto max-w-5xl px-5 py-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
  {/* NAVIGATION */}
  <div className="flex flex-wrap items-center gap-2">
    <Link
      href="/dashboard"
      className="js-secondary-button group inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
    >
      <ArrowLeft
        className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1"
      />

      Dashboard
    </Link>


    <Link
      href="/dashboard/history"
      className="js-secondary-button group inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
    >
      <History
        className="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
      />

      Analysis History
    </Link>
  </div>


  {/* REPORT ACTIONS */}
  <div className="flex flex-wrap items-center gap-2">
    <AddAnalysisToCase
      analysisId={
        analysis.id
      }
      cases={
        openCases ??
        []
      }
    />
    <a
      href={`/api/reports/${analysis.id}/pdf`}
      className="js-primary-button group inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
    >
      <Download
        className="h-4 w-4 transition-transform duration-200 group-hover:translate-y-0.5"
      />

      Download PDF
    </a>
  </div>
</div>
        <section className="js-glass mt-8 overflow-hidden js-page-enter rounded-3xl p-6">
          {/* HEADER */}

          <div className={`js-risk-glow ${riskClass} rounded-3xl p-7`}>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-neutral-500">
                  JobShield Evidence Report
                </p>

                <AnalysisTitleEditor
                  analysisId={
                    analysis.id
                  }
                  initialTitle={
                    analysis.title
                  }
                  fallbackTitle={
                    formatAnalysisType(
                      analysis.analysis_type,
                    )
                  }
                />

                <h1 className="mt-2 text-3xl font-bold capitalize">
                  {analysis.risk_level ??
                    analysis.status}{" "}
                  risk
                </h1>

                <div className="mt-3 flex flex-wrap gap-2 text-xs text-neutral-500">
                  <span>
                    {formatStatus(
                      analysis.analysis_type,
                    )}
                  </span>

                  <span>
                    •
                  </span>

                  <span>
                    {new Date(
                      analysis.created_at,
                    ).toLocaleString()}
                  </span>

                  <span>
                    •
                  </span>

                  <span>
                    Pipeline{" "}
                    {analysis.pipeline_version}
                  </span>
                </div>
              </div>


              <div>
                <span className="text-6xl font-bold">
                  {analysis.risk_score ??
                    0}
                </span>

                <span className="text-xl text-neutral-500">
                  /100
                </span>
              </div>
            </div>
          </div>


          {/* SIGNAL BREAKDOWN */}

          <div className="border-t p-7">
            <h2 className="text-lg font-semibold">
              Detection signals
            </h2>

            {isLegacy ? (
              <p className="mt-3 js-card rounded-2xl p-4 text-sm text-neutral-500">
                Signal breakdown was not stored for
                this earlier analysis.
              </p>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Metric
                  label="Rules"
                  value={`${signals.ruleScore ?? 0}/100`}
                />

                <Metric
                  label="AI signal"
                  value={`${signals.aiSignal ?? 0}/60`}
                />

                <Metric
                  label="Domain"
                  value={`${signals.domainSignal ?? 0}/60`}
                />

                <Metric
                  label="URL reputation"
                  value={`${signals.urlSignal ?? 0}/80`}
                />
                {analysis.analysis_type ===
                  "email_file" && (
                <Metric
                  label="Email headers"
                  value={`${signals.emailSignal ?? 0}/50`}
                />
            )}

                <Metric
                  label="Community"
                value={`${signals.communitySignal ?? 0}/30`}
                />

              </div>
            )}

            {analysis.ai_confidence !==
              null && (
              <p className="mt-4 text-sm text-neutral-500">
                AI contextual likelihood:{" "}
                {analysis.ai_scam_likelihood ??
                  "Unavailable"}
                /100 · confidence{" "}
                {Math.round(
                  Number(
                    analysis.ai_confidence,
                  ) * 100,
                )}
                %
              </p>
            )}
          </div>


          {/* SUMMARY */}

          <div className="border-t p-7">
            <h2 className="text-lg font-semibold">
              Summary
            </h2>

            <p className="mt-3 leading-7 text-neutral-600 dark:text-neutral-300">
              {analysis.summary ||
                "No summary is available."}
            </p>
          </div>

          <BrowserCaptureDetails
            inputMetadata={
              analysis.input_metadata
            }
          />


          {/* FINDINGS */}

          <div className="border-t p-7">
            <h2 className="text-lg font-semibold">
              Evidence findings
            </h2>

            {findings.length ===
            0 ? (
              <div className="mt-4 js-card rounded-2xl p-4 text-sm">
                No warning findings were produced
                by the available detection systems.
                This does not establish that the
                opportunity is legitimate.
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                {findings.map(
                  (
                    finding,
                  ) => (
                    <article
                      key={
                        finding.id
                      }
                      className="js-card rounded-2xl p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold">
                            {finding.severity !==
                              "info" &&
                              "⚠ "}
                            {
                              finding.title
                            }
                          </h3>

                          <div className="mt-2 flex flex-wrap gap-2 text-xs text-neutral-500">
                            <span className="rounded-full border px-2 py-1 uppercase">
                              {
                                finding.severity
                              }
                            </span>

                            <span className="rounded-full border px-2 py-1">
                              Source:{" "}
                              {
                                finding.source
                              }
                            </span>
                          </div>
                        </div>

                        {Number(
                          finding.score_contribution,
                        ) > 0 && (
                          <span className="text-sm font-semibold">
                            +
                            {
                              finding.score_contribution
                            }
                          </span>
                        )}
                      </div>

                      <p className="mt-4 leading-6 text-neutral-600 dark:text-neutral-300">
                        {
                          finding.explanation
                        }
                      </p>

                      {finding.evidence && (
                        <blockquote className="mt-4 rounded-lg bg-neutral-100 p-4 text-sm italic dark:bg-neutral-900">
                          "
                          {
                            finding.evidence
                          }
                          "
                        </blockquote>
                      )}
                    </article>
                  ),
                )}
              </div>
            )}
          </div>


          {/* DOMAIN INTELLIGENCE */}

          <div className="border-t p-7">
            <h2 className="text-lg font-semibold">
              Domain intelligence
            </h2>

            {domainChecks.length ===
            0 ? (
              <p className="mt-3 text-sm text-neutral-500">
                No domains were available for
                verification.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {domainChecks.map(
                  (
                    check,
                  ) => (
                    <div
                      key={
                        check.id
                      }
                      className="js-card rounded-2xl p-4"
                    >
                      <p className="font-semibold">
                        {
                          check.domain
                        }
                      </p>

                      <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                        <Detail
                          label="DNS active"
                          value={yesNoUnknown(
                            check.has_dns,
                          )}
                        />

                        <Detail
                          label="Mail records"
                          value={yesNoUnknown(
                            check.has_mx,
                          )}
                        />

                        <Detail
                          label="Domain age"
                          value={
                            check.domain_age_days !==
                            null
                              ? `${check.domain_age_days.toLocaleString()} days`
                              : "Unavailable"
                          }
                        />

                        <Detail
                          label="Registrar"
                          value={
                            check.registrar ||
                            "Unavailable"
                          }
                        />
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>


          {/* URL REPUTATION */}

          <div className="border-t p-7">
            <h2 className="text-lg font-semibold">
              URL reputation
            </h2>

            {urlChecks.length ===
            0 ? (
              <p className="mt-3 text-sm text-neutral-500">
                No URL reputation checks were
                recorded for this analysis.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {urlChecks.map(
                  (
                    check,
                  ) => (
                    <div
                      key={
                        check.id
                      }
                      className="js-card rounded-2xl p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="font-semibold">
                          {
                            check.hostname
                          }
                        </p>

                        <span className="rounded-full border px-2.5 py-1 text-xs font-medium uppercase">
                          {check.matched
                            ? "Threat match"
                            : check.checked
                              ? "No exact match"
                              : "Unavailable"}
                        </span>
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}

            <p className="mt-3 text-xs text-neutral-500">
              No exact reputation match does not
              guarantee that a URL is safe.
            </p>
          </div>


          {/* COMPANY VERIFICATION */}

          <div className="border-t p-7">
            <h2 className="text-lg font-semibold">
              Company verification
            </h2>

            {companyVerifications.length ===
            0 ? (
              <p className="mt-3 text-sm text-neutral-500">
                No claimed company was available
                for verification.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {companyVerifications.map(
                  (
                    company,
                  ) => (
                    <div
                      key={
                        company.id
                      }
                      className="js-card rounded-2xl p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">
                            {
                              company.claimed_name
                            }
                          </p>

                          <p className="mt-1 text-xs text-neutral-500">
                            {formatStatus(
                              company.status,
                            )}
                          </p>
                        </div>

                        {company.registry_matched && (
                          <span className="rounded-full border px-2.5 py-1 text-xs">
                            SEC registry match
                          </span>
                        )}
                      </div>

                      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                        <Detail
                          label="Registry company"
                          value={
                            company.registry_company_name ||
                            "No public registry match"
                          }
                        />

                        <Detail
                          label="Ticker"
                          value={
                            company.registry_ticker ||
                            "—"
                          }
                        />

                        <Detail
                          label="Exchange"
                          value={
                            company.registry_exchange ||
                            "—"
                          }
                        />

                        <Detail
                          label="Aligned domains"
                          value={
                            company.aligned_domains?.length
                              ? company.aligned_domains.join(
                                  ", ",
                                )
                              : "None"
                          }
                        />
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>


          {/* SCREENSHOT METADATA */}

          {analysis.analysis_type ===
            "screenshot" &&
            screenshotMetadata && (
              <div className="border-t p-7">
                <h2 className="text-lg font-semibold">
                  Screenshot extraction
                </h2>

                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                  <Detail
                    label="File type"
                    value={
                      screenshotMetadata.mimeType ||
                      "Unknown"
                    }
                  />

                  <Detail
                    label="Extraction confidence"
                    value={
                      screenshotMetadata.extractionConfidence !==
                      undefined
                        ? `${Math.round(
                            screenshotMetadata.extractionConfidence *
                              100,
                          )}%`
                        : "Unavailable"
                    }
                  />

                  <Detail
                    label="Raw image stored"
                    value={
                      screenshotMetadata.rawImageStored
                        ? "Yes"
                        : "No"
                    }
                  />
                </div>

                {screenshotMetadata.warnings &&
                  screenshotMetadata.warnings.length >
                    0 && (
                    <div className="mt-4 js-card rounded-2xl p-4">
                      <p className="text-sm font-semibold">
                        Extraction warnings
                      </p>

                      <p className="mt-2 text-sm text-neutral-500">
                        {screenshotMetadata.warnings.join(
                          " · ",
                        )}
                      </p>
                    </div>
                  )}
              </div>
          )}

{analysis.analysis_type ===
"job_offer" &&
  documentMetadata && (
    <div className="border-t p-7">
      <h2 className="text-lg font-semibold">
        Document extraction
      </h2>

      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <Detail
          label="Format"
          value={
            documentMetadata.kind
              ?.toUpperCase() ||
            "Unknown"
          }
        />

        <Detail
          label="Pages"
          value={
            documentMetadata.pageCount !==
              null &&
            documentMetadata.pageCount !==
              undefined
              ? String(
                  documentMetadata.pageCount,
                )
              : "N/A"
          }
        />

        <Detail
          label="Parser"
          value={
            documentMetadata.parser ||
            "Unknown"
          }
        />

        <Detail
          label="Raw file stored"
          value={
            documentMetadata.rawFileStored
              ? "Yes"
              : "No"
          }
        />
      </div>

      {documentMetadata.truncated && (
        <div className="mt-4 js-card rounded-2xl p-4 text-sm">
          The extracted document exceeded
          JobShield's analysis limit and was
          truncated before analysis.
        </div>
      )}

      {documentMetadata.warnings &&
        documentMetadata.warnings.length >
          0 && (
          <div className="mt-4 js-card rounded-2xl p-4">
            <p className="text-sm font-semibold">
              Extraction warnings
            </p>

            <p className="mt-2 text-sm text-neutral-500">
              {documentMetadata.warnings.join(
                " · ",
              )}
            </p>
          </div>
        )}
    </div>
  )}


{analysis.analysis_type ===
  "email_file" &&
  emailMetadata && (
    <div className="border-t p-7">
      <h2 className="text-lg font-semibold">
        Email header forensics
      </h2>

      <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
        <Detail
          label="From"
          value={
            emailMetadata.from
              ?.map(
                (item) =>
                  item.address ??
                  "",
              )
              .filter(
                Boolean,
              )
              .join(
                ", ",
              ) ||
            "Unavailable"
          }
        />

        <Detail
          label="Reply-To"
          value={
            emailMetadata.replyTo
              ?.map(
                (item) =>
                  item.address ??
                  "",
              )
              .filter(
                Boolean,
              )
              .join(
                ", ",
              ) ||
            "Not specified"
          }
        />

        <Detail
          label="Return-Path"
          value={
            emailMetadata.returnPath ||
            "Unavailable"
          }
        />

        <Detail
          label="Message-ID"
          value={
            emailMetadata.messageId ||
            "Unavailable"
          }
        />

        <Detail
          label="Received hops"
          value={String(
            emailMetadata.receivedCount ??
            0,
          )}
        />

        <Detail
          label="DKIM signature present"
          value={
            emailMetadata.dkimSignaturePresent
              ? "Yes"
              : "No"
          }
        />

        <Detail
          label="Attachments"
          value={String(
            emailMetadata.attachments
              ?.length ??
            0,
          )}
        />

        <Detail
          label="Raw EML stored"
          value={
            emailMetadata.rawFileStored
              ? "Yes"
              : "No"
          }
        />
      </div>


      {emailMetadata
        .authenticationResults &&
        emailMetadata
          .authenticationResults
          .length > 0 && (
          <div className="mt-5 js-card rounded-2xl p-4">
            <p className="text-sm font-semibold">
              Reported authentication
            </p>

            <p className="mt-2 text-sm text-neutral-500">
              {emailMetadata
                .authenticationResults
                .map(
                  (item) =>
                    `${item.method}=${item.result}`,
                )
                .join(
                  " · ",
                )}
            </p>

            <p className="mt-2 text-xs text-neutral-500">
              These values came from the
              uploaded email and have not
              been independently verified
              by JobShield.
            </p>
          </div>
        )}
    </div>
  )}


  <div className="border-t p-7">
  <ReportScamControls
    analysisId={
      analysis.id
    }
    candidates={
      communityReportCandidates
    }
    initialActive={
      existingCommunityReport
        ?.status ===
      "active"
    }
  />
</div>


{analysis.analysis_type ===
  "browser_selection" &&
  extensionMetadata && (
    <div className="border-t p-7">
      <h2 className="text-lg font-semibold">
        Browser extension
      </h2>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Detail
          label="Source website"
          value={
            extensionMetadata.sourceHost ||
            "Unavailable"
          }
        />

        <Detail
          label="Selected characters"
          value={String(
            extensionMetadata.selectionLength ??
            0,
          )}
        />

        <Detail
          label="Full page stored"
          value="No"
        />
      </div>
    </div>
  )}

<div className="border-t p-7">
  <h2 className="text-lg font-semibold">
    Community intelligence
  </h2>

  {communityChecks.length ===
  0 ? (
    <p className="mt-3 text-sm text-neutral-500">
      No matching community reports were
      recorded when this analysis was run.
    </p>
  ) : (
    <div className="mt-4 space-y-3">
      {communityChecks.map(
        (
          check,
        ) => (
          <div
            key={
              check.id
            }
            className="js-card rounded-2xl p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">
                  {
                    check.display_value
                  }
                </p>

                <p className="mt-1 text-xs uppercase text-neutral-500">
                  {
                    check.indicator_type
                  }
                </p>
              </div>

              <span className="rounded-full border px-2.5 py-1 text-xs">
                {
                  check.distinct_reporters
                }{" "}
                independent{" "}
                {check.distinct_reporters ===
                1
                  ? "reporter"
                  : "reporters"}
              </span>
            </div>

            <p className="mt-3 text-xs text-neutral-500">
              Community observations from the
              preceding{" "}
              {
                check.lookback_days
              }{" "}
              days. Reports are user-submitted
              and are not independently verified
              claims.
            </p>
          </div>
        ),
      )}
    </div>
  )}
</div>

          {/* ORIGINAL CONTENT */}

          <div className="border-t p-7">
            <h2 className="text-lg font-semibold">
              {analysis.analysis_type ===
              "screenshot"
              ? "Extracted screenshot text"
              : analysis.analysis_type ===
              "job_offer"
              ? "Extracted job offer text"
              : analysis.analysis_type ===
              "email_file"
              ? "Extracted email content and headers"
              : analysis.analysis_type ===
              "browser_selection"
              ? "Selected browser text"
              : "Analyzed content"}
            </h2>

            <pre className="mt-4 whitespace-pre-wrap break-words rounded-xl bg-neutral-100 p-5 font-sans text-sm leading-6 dark:bg-neutral-900">
              {
                analysis.input_text
              }
            </pre>
          </div>


                    <div className="border-t p-7">
                      <ShareReportControls
                        analysisId={
                          analysis.id
                        }
                        initialActive={
                          shareActive
                        }
                        initialExpiresAt={
                          shareActive
                          ? shareRecord
                          ?.expires_at ??
                          null
                          : null
                        }
                      />
                    </div>


          {/* DISCLAIMER */}

          <div className="border-t bg-neutral-50 p-7 text-xs leading-5 text-neutral-500 dark:bg-neutral-950">
            JobShield provides risk indicators and
            corroborating evidence. A low score or
            absence of detected indicators does not
            establish that an employer, recruiter,
            website, or opportunity is legitimate.
          </div>
        </section>
      </div>
    </main>
  );
}


function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-neutral-100 p-4 dark:bg-neutral-900">
      <p className="text-xs uppercase tracking-wide text-neutral-500">
        {label}
      </p>

      <p className="mt-1 text-xl font-semibold">
        {value}
      </p>
    </div>
  );
}


function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-neutral-500">
        {label}
      </p>

      <p className="mt-1 break-words font-medium">
        {value}
      </p>
    </div>
  );
}

function formatAnalysisType(
  value: string,
) {
  return value
    .replace(
      /_/g,
      " ",
    )
    .replace(
      /\b\w/g,
      (
        letter,
      ) =>
        letter.toUpperCase(),
    );
}