import Link from "next/link";

import {
  redirect,
} from "next/navigation";

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
  Plus,
} from "lucide-react";


export default async function CasesPage() {
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


  const {
    data:
      cases,
    error,
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
          updated_at,
          case_analyses (
            added_at,
            analyses (
              id,
              risk_score,
              risk_level,
              status
            )
          )
        `,
      )
      .eq(
        "user_id",
        userId,
      )
      .order(
        "updated_at",
        {
          ascending:
            false,
        },
      );


  if (error) {
    throw error;
  }


  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-black">
      <div className="mx-auto max-w-6xl px-5 py-10">

        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
  <div>
    <Link
      href="/dashboard"
      className="js-secondary-button group inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
    >
      <ArrowLeft
        className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1"
      />

      Dashboard
    </Link>


    <div className="mt-7">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-neutral-500">
        JobShield
      </p>

      <h1 className="mt-3 text-4xl font-bold tracking-tight">
        Investigations
      </h1>

      <p className="mt-3 max-w-2xl text-lg leading-7 text-neutral-500">
        Group related messages, emails,
        screenshots, job offers, and other
        evidence into one investigation.
      </p>
    </div>
  </div>


  <Link
    href="/dashboard/cases/new"
    className="js-primary-button group inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold"
  >
    <Plus
      className="h-4 w-4 transition-transform duration-200 group-hover:rotate-90"
    />

    New Case
  </Link>
</div>


        {!cases ||
        cases.length === 0 ? (
          <div className="mt-8 js-glass js-page-enter rounded-3xl p-6 text-center">
            <h2 className="font-semibold">
              No investigations yet
            </h2>

            <p className="mt-2 text-sm text-neutral-500">
              Create a case when several
              analyses belong to the same
              recruiter or job opportunity.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4">
            {cases.map(
              (
                caseRecord,
              ) => {
                const artifacts =
  (
    caseRecord
      .case_analyses ??
    []
  )
    .flatMap(
      (
        membership,
      ) =>
        membership
          .analyses ??
        [],
    )
    .map(
      (
        analysis,
      ) => ({
        id:
          analysis.id,

        riskScore:
          analysis.risk_score,

        riskLevel:
          analysis.risk_level as
            | RiskLevel
            | null,

        status:
          analysis.status,
      }),
    );


                const summary =
                  calculateCaseSummary(
                    artifacts,
                  );


                return (
                  <Link
                    key={
                      caseRecord.id
                    }
                    href={`/dashboard/cases/${caseRecord.id}`}
                    className="js-glass js-page-enter rounded-3xl p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
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

                        <h2 className="mt-4 text-xl font-semibold">
                          {
                            caseRecord.title
                          }
                        </h2>

                        {caseRecord.description && (
                          <p className="mt-2 line-clamp-2 text-sm text-neutral-500">
                            {
                              caseRecord.description
                            }
                          </p>
                        )}

                        <p className="mt-3 text-xs text-neutral-500">
                          Updated{" "}
                          {new Date(
                            caseRecord.updated_at,
                          ).toLocaleString()}
                        </p>
                      </div>


                      <div className="shrink-0">
                        {summary.riskScore !==
                        null ? (
                          <>
                            <p className="text-3xl font-bold">
                              {
                                summary.riskScore
                              }
                              <span className="text-base font-normal text-neutral-500">
                                /100
                              </span>
                            </p>

                            <p className="mt-1 text-xs uppercase text-neutral-500">
                              {
                                summary.riskLevel
                              }{" "}
                              observed risk
                            </p>
                          </>
                        ) : (
                          <p className="text-sm text-neutral-500">
                            No scored evidence
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              },
            )}
          </div>
        )}
      </div>
    </main>
  );
}