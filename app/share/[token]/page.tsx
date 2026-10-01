import type {
  Metadata,
} from "next";

import {
  notFound,
} from "next/navigation";

import {
  getPublicSharedReport,
} from "@/lib/reports/public-report";


export const metadata:
  Metadata = {
  title:
    "Shared JobShield Report",

  robots: {
    index:
      false,

    follow:
      false,

    nocache:
      true,
  },
};

type PageProps = {
  params: Promise<{
    token: string;
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
  value:
    string | null,
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


export default async function SharedReportPage({
  params,
}: PageProps) {
  const {
    token,
  } =
    await params;


  const report =
    await getPublicSharedReport(
      token,
    );


  if (!report) {
    notFound();
  }


  const {
    analysis,
    findings,
    domainChecks,
    urlChecks,
    companyVerifications,
    expiresAt,
  } =
    report;


  const signals =
    (
      analysis
        .signal_breakdown ??
      {}
    ) as SignalBreakdown;

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
      <div className="js-page-enter relative mx-auto max-w-5xl">
        <div className="mb-5 js-card rounded-2xl bg-white p-4 text-sm dark:bg-neutral-950">
          <p className="font-semibold">
            Shared JobShield report
          </p>

          <p className="mt-1 text-neutral-500">
            This public version is redacted.
            Original analyzed content, screenshot
            text, exact evidence excerpts, and
            account information are hidden.
          </p>

          <p className="mt-2 text-xs text-neutral-500">
            Link expires{" "}
            {new Date(
              expiresAt,
            ).toLocaleString()}
          </p>
        </div>


        <section className="js-glass overflow-hidden js-page-enter rounded-3xl p-6 shadow-sm">
          {/* HEADER */}

          <div className={`js-risk-glow ${riskClass} rounded-3xl p-7`}>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-neutral-500">
                  JobShield Evidence Report
                </p>

                <h1 className="mt-2 text-3xl font-bold capitalize">
                  {analysis.risk_level}{" "}
                  risk
                </h1>

                <p className="mt-2 text-sm text-neutral-500">
                  {formatStatus(
                    analysis.analysis_type,
                  )}
                  {" · "}
                  {new Date(
                    analysis.created_at,
                  ).toLocaleString()}
                </p>
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


          {/* SIGNALS */}

          <div className="border-t p-7">
            <h2 className="text-lg font-semibold">
              Detection signals
            </h2>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Metric
                label="Rules"
                value={`${signals.ruleScore ?? 0}/100`}
              />

              <Metric
                label="AI"
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
          </div>


          {/* SUMMARY */}

          <div className="border-t p-7">
            <h2 className="text-lg font-semibold">
              Summary
            </h2>

            <p className="mt-3 leading-7 text-neutral-600 dark:text-neutral-300">
              {analysis.summary}
            </p>
          </div>


          {/* FINDINGS */}

          <div className="border-t p-7">
            <h2 className="text-lg font-semibold">
              Findings
            </h2>

            {findings.length ===
            0 ? (
              <p className="mt-3 text-sm text-neutral-500">
                No warning findings were recorded.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {findings.map(
                  (
                    finding,
                  ) => (
                    <article
                      key={
                        finding.id
                      }
                      className="js-card rounded-2xl p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="font-semibold">
                          {finding.severity !==
                            "info" &&
                            "⚠ "}
                          {
                            finding.title
                          }
                        </h3>

                        <span className="rounded-full border px-2 py-1 text-xs uppercase">
                          {
                            finding.source
                          }
                        </span>
                      </div>

                      <p className="mt-3 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                        {
                          finding.explanation
                        }
                      </p>
                    </article>
                  ),
                )}
              </div>
            )}

            <p className="mt-4 text-xs text-neutral-500">
              Exact evidence excerpts are hidden
              from shared reports.
            </p>
          </div>


          {/* DOMAIN INTELLIGENCE */}

          {domainChecks.length >
            0 && (
            <div className="border-t p-7">
              <h2 className="text-lg font-semibold">
                Domain intelligence
              </h2>

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

                      <p className="mt-2 text-sm text-neutral-500">
                        DNS:{" "}
                        {check.has_dns
                          ? "Active"
                          : "No active records"}
                        {" · "}
                        Age:{" "}
                        {check.domain_age_days ??
                          "Unavailable"}{" "}
                        days
                      </p>
                    </div>
                  ),
                )}
              </div>
            </div>
          )}


          {/* URL REPUTATION */}

          {urlChecks.length >
            0 && (
            <div className="border-t p-7">
              <h2 className="text-lg font-semibold">
                URL reputation
              </h2>

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
                      <p className="font-semibold">
                        {
                          check.hostname
                        }
                      </p>

                      <p className="mt-2 text-sm text-neutral-500">
                        {check.matched
                          ? "Threat intelligence match"
                          : check.checked
                            ? "No exact local threat match"
                            : "Reputation check unavailable"}
                      </p>
                    </div>
                  ),
                )}
              </div>

              <p className="mt-3 text-xs text-neutral-500">
                No exact reputation match does not
                guarantee that a URL is safe.
              </p>
            </div>
          )}


          {/* COMPANY */}

          {companyVerifications.length >
            0 && (
            <div className="border-t p-7">
              <h2 className="text-lg font-semibold">
                Company verification
              </h2>

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
                      <p className="font-semibold">
                        {
                          company.claimed_name
                        }
                      </p>

                      <p className="mt-1 text-sm text-neutral-500">
                        {formatStatus(
                          company.status,
                        )}
                      </p>

                      {company.registry_matched && (
                        <p className="mt-2 text-sm">
                          Public registry:{" "}
                          {
                            company.registry_company_name
                          }
                          {company.registry_ticker &&
                            ` (${company.registry_ticker})`}
                        </p>
                      )}
                    </div>
                  ),
                )}
              </div>
            </div>
          )}


          {/* PRIVACY */}

          <div className="border-t bg-neutral-50 p-7 dark:bg-neutral-950">
            <h2 className="font-semibold">
              Privacy
            </h2>

            <p className="mt-2 text-sm leading-6 text-neutral-500">
              The original recruiter message,
              uploaded screenshot, extracted
              screenshot text, email addresses,
              and exact evidence excerpts are not
              included in this shared report.
            </p>
          </div>


          <div className="border-t p-7 text-xs leading-5 text-neutral-500">
            JobShield provides risk indicators and
            corroborating evidence. A low risk
            score does not establish that an
            employer, recruiter, website, or job
            opportunity is legitimate.
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