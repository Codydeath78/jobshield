import Link from "next/link";

import {
  notFound,
  redirect,
} from "next/navigation";

import {
  CaseArtifactControls,
} from "@/components/cases/case-artifact-controls";

import {
  CaseStatusControls,
} from "@/components/cases/case-status-controls";

import {
  RemoveCaseArtifact,
} from "@/components/cases/remove-case-artifact";

import {
  calculateCaseSummary,
} from "@/lib/cases/case-summary";

import type {
  RiskLevel,
} from "@/lib/analysis/types";

import {
  createClient,
} from "@/lib/supabase/server";

import {
  ArrowLeft,
  LayoutDashboard,
  FileText,
} from "lucide-react";

import {
  DeleteCaseButton,
} from "@/components/cases/delete-case-button";


type PageProps = {
  params: Promise<{
    id: string;
  }>;
};


export default async function CasePage({
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
  } =
    await supabase
      .auth
      .getClaims();


  const userId =
    claimsData
      ?.claims
      ?.sub;


  if (!userId) {
    redirect(
      "/auth/login",
    );
  }

  // CASE
  const {
    data:
      caseRecord,
  } =
    await supabase
      .from(
        "cases",
      )
      .select(
        `
          id,
          title,
          description,
          status,
          created_at,
          updated_at
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


  if (!caseRecord) {
    notFound();
  }


  // MEMBERSHIPS
  const {
    data:
      memberships,
  } =
    await supabase
      .from(
        "case_analyses",
      )
      .select(
        `
          analysis_id,
          added_at
        `,
      )
      .eq(
        "case_id",
        id,
      )
      .order(
        "added_at",
        {
          ascending:
            false,
        },
      );


  const membershipRows =
    memberships ??
    [];


  const analysisIds =
    membershipRows.map(
      (
        membership,
      ) =>
        membership.analysis_id,
    );


  let attachedAnalyses:
    Array<{
      id: string;
      analysis_type: string;
      summary: string | null;
      risk_score: number | null;
      risk_level: RiskLevel | null;
      status: string;
      created_at: string;
    }> = [];


  if (
    analysisIds.length >
    0
  ) {
    const {
      data,
    } =
      await supabase
        .from(
          "analyses",
        )
        .select(
          `
            id,
            analysis_type,
            summary,
            risk_score,
            risk_level,
            status,
            created_at
          `,
        )
        .eq(
          "user_id",
          userId,
        )
        .in(
          "id",
          analysisIds,
        );


    attachedAnalyses =
      (
        data ??
        []
      ) as typeof attachedAnalyses;
  }


  const addedAtById =
    new Map(
      membershipRows.map(
        (
          membership,
        ) => [
          membership.analysis_id,
          membership.added_at,
        ],
      ),
    );


  const artifacts =
    attachedAnalyses
      .map(
        (
          analysis,
        ) => ({
          ...analysis,

          added_at:
            addedAtById.get(
              analysis.id,
            ) ??
            analysis.created_at,
        }),
      )
      .sort(
        (a, b) =>
          new Date(
            b.added_at,
          ).getTime() -
          new Date(
            a.added_at,
          ).getTime(),
      );


  const summary =
    calculateCaseSummary(
      artifacts.map(
        (
          analysis,
        ) => ({
          id:
            analysis.id,

          riskScore:
            analysis.risk_score,

          riskLevel:
            analysis.risk_level,

          status:
            analysis.status,
        }),
      ),
    );


  // AVAILABLE RECENT ANALYSES
  const {
    data:
      recentAnalyses,
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
          created_at
        `,
      )
      .eq(
        "user_id",
        userId,
      )
      .order(
        "created_at",
        {
          ascending:
            false,
        },
      )
      .limit(
        50,
      );


  const attachedSet =
    new Set(
      analysisIds,
    );


  const availableAnalyses =
    (
      recentAnalyses ??
      []
    )
      .filter(
        (
          analysis,
        ) =>
          !attachedSet.has(
            analysis.id,
          ),
      )
      .map(
        (
          analysis,
        ) => ({
          id:
            analysis.id,

          analysisType:
            analysis.analysis_type,

          riskScore:
            analysis.risk_score,

          riskLevel:
            analysis.risk_level,

          createdAt:
            analysis.created_at,
        }),
      );

  const caseRiskClass =
  summary.riskLevel ===
  "critical"
    ? "js-risk-critical"
    : summary.riskLevel ===
        "high"
      ? "js-risk-high"
      : summary.riskLevel ===
          "medium"
        ? "js-risk-medium"
        : "js-risk-low";


  return (
      <main className="relative min-h-screen overflow-hidden bg-[#06070a]">
    {/* Ambient background glow */}
    <div className="js-orb -left-32 top-20 h-80 w-80 bg-violet-600/10" />

    <div className="js-orb -right-40 top-72 h-96 w-96 bg-blue-600/10 [animation-delay:-4s]" />
      <div className="js-page-enter relative mx-auto max-w-6xl px-5 py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
  <div className="flex flex-wrap items-center gap-2">
    <Link
      href="/dashboard/cases"
      className="js-secondary-button group inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
    >
      <ArrowLeft
        className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1"
      />

      Investigations
    </Link>


    <Link
      href="/dashboard"
      className="js-secondary-button group inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
    >
      <LayoutDashboard
        className="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
      />

      Dashboard
    </Link>
  </div>


  <div className="flex flex-wrap items-center gap-2">
  <CaseStatusControls
    caseId={
      caseRecord.id
    }
    status={
      caseRecord.status as
        | "open"
        | "closed"
    }
  />


  {caseRecord.status ===
    "closed" && (
    <DeleteCaseButton
      caseId={
        caseRecord.id
      }
      caseTitle={
        caseRecord.title
      }
    />
  )}
    </div>



    </div>


        {/* CASE HEADER */}

        <section className="mt-7 js-glass js-page-enter rounded-3xl p-6 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border px-2.5 py-1 text-xs uppercase">
                  {
                    caseRecord.status
                  }
                </span>

                <span className="rounded-full border px-2.5 py-1 text-xs">
                  {
                    summary.artifactCount
                  }{" "}
                  artifacts
                </span>
              </div>

              <h1 className="mt-4 text-3xl font-bold">
                {
                  caseRecord.title
                }
              </h1>

              {caseRecord.description && (
                <p className="mt-3 max-w-3xl leading-7 text-neutral-500">
                  {
                    caseRecord.description
                  }
                </p>
              )}

              <p className="mt-4 text-xs text-neutral-500">
                Created{" "}
                {new Date(
                  caseRecord.created_at,
                ).toLocaleString()}
              </p>
            </div>
          </div>
        </section>


        {/* CASE RISK */}

        <section className={`js-risk-glow ${caseRiskClass} mt-5 js-glass js-page-enter rounded-3xl p-6 shadow-sm`}>
          <h2 className="text-lg font-semibold">
            Investigation Summary
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Metric
              label="Highest observed risk"
              value={
                summary.riskScore !==
                null
                  ? `${summary.riskScore}/100`
                  : "Unrated"
              }
            />

            <Metric
              label="Risk level"
              value={
                summary.riskLevel
                  ?.toUpperCase() ??
                "UNRATED"
              }
            />

            <Metric
              label="Evidence artifacts"
              value={String(
                summary.artifactCount,
              )}
            />

            <Metric
              label="High / critical artifacts"
              value={String(
                summary.highOrCriticalCount,
              )}
            />
          </div>

          <p className="mt-4 text-xs leading-5 text-neutral-500">
            The case score represents the
            highest observed artifact risk.
            JobShield does not add individual
            analysis scores because multiple
            artifacts can contain duplicate
            evidence.
          </p>
        </section>


        {/* ADD EVIDENCE */}

        {caseRecord.status ===
          "open" && (
          <section className="mt-5 js-glass js-page-enter rounded-3xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold">
              Add Existing Evidence
            </h2>

            <p className="mt-1 text-sm text-neutral-500">
              Attach one of your recent
              JobShield analyses to this
              investigation.
            </p>

            <div className="mt-4">
              <CaseArtifactControls
                caseId={
                  caseRecord.id
                }
                availableAnalyses={
                  availableAnalyses
                }
              />
            </div>
          </section>
        )}


        {/* TIMELINE */}

        <section className="mt-5 js-glass js-page-enter rounded-3xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold">
            Investigation Timeline
          </h2>

          {artifacts.length ===
          0 ? (
            <div className="mt-5 js-card rounded-2xl p-6 text-center">
              <p className="font-medium">
                No evidence attached
              </p>

              <p className="mt-2 text-sm text-neutral-500">
                Add an existing JobShield
                analysis to begin this
                investigation.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {artifacts.map(
                (
                  analysis,
                ) => (
                  <article
                    key={
                      analysis.id
                    }
                    className="js-card rounded-2xl p-5"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full border px-2 py-1 text-xs capitalize">
                            {analysis.analysis_type.replace(
                              /_/g,
                              " ",
                            )}
                          </span>

                          {analysis.risk_level && (
                            <span className="rounded-full border px-2 py-1 text-xs uppercase">
                              {
                                analysis.risk_level
                              }
                            </span>
                          )}
                        </div>

                        <p className="mt-3 leading-6">
                          {analysis.summary ||
                            "No summary available."}
                        </p>

                        <p className="mt-3 text-xs text-neutral-500">
                          Added to case{" "}
                          {new Date(
                            analysis.added_at,
                          ).toLocaleString()}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-4">
                          <Link
                            href={`/dashboard/analysis/${analysis.id}`}
                            className="js-secondary-button group inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold"
                          >
                            <FileText
                              className="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
                            />

                            View Evidence Report
                          </Link>

                          {caseRecord.status ===
                            "open" && (
                            <RemoveCaseArtifact
                              caseId={
                                caseRecord.id
                              }
                              analysisId={
                                analysis.id
                              }
                            />
                          )}
                        </div>
                      </div>


                      <div className="shrink-0">
                        {analysis.risk_score !==
                        null ? (
                          <p className="text-2xl font-bold">
                            {
                              analysis.risk_score
                            }
                            <span className="text-sm font-normal text-neutral-500">
                              /100
                            </span>
                          </p>
                        ) : (
                          <p className="text-sm text-neutral-500">
                            {
                              analysis.status
                            }
                          </p>
                        )}
                      </div>
                    </div>
                  </article>
                ),
              )}
            </div>
          )}
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

      <p className="mt-2 text-xl font-semibold">
        {value}
      </p>
    </div>
  );
}