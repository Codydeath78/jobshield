import Link from "next/link";
import { redirect } from "next/navigation";

import { AnalyzeForm } from "@/components/analysis/analyze-form";
import { createClient } from "@/lib/supabase/server";

import {
  FolderOpen,
  History,
  Puzzle,
} from "lucide-react";

import {
  LogoutButton,
} from "@/components/logout-button";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
  data: claimsData,
  error: claimsError,
} = await supabase.auth.getClaims();

const userId = claimsData?.claims?.sub;

if (claimsError || !userId) {
  redirect("/auth/login");
}



  const { data: analyses } = await supabase
    .from("analyses")
    .select(
      `
        id,
        analysis_type,
        risk_score,
        risk_level,
        summary,
        status,
        created_at
      `,
    )
    .eq("user_id", userId)
    .order("created_at", {
      ascending: false,
    })
    .limit(8);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#06070a]">
    {/* Ambient background glow */}
    <div className="js-orb -left-32 top-20 h-80 w-80 bg-violet-600/10" />

    <div className="js-orb -right-40 top-72 h-96 w-96 bg-blue-600/10 [animation-delay:-4s]" />
      <div className="js-page-enter relative mx-auto max-w-6xl px-5 py-10">


        <header className="mb-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
  {/* LEFT: PAGE INTRO */}
  <div className="max-w-2xl">
    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-neutral-500">
      JobShield
    </p>

    <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
      Scam Detection Dashboard
    </h1>

    <p className="mt-4 max-w-xl text-lg leading-7 text-neutral-500">
      Analyze suspicious recruiter messages,
      emails, and job postings before responding
      or sending information.
    </p>
    <LogoutButton />
  </div>


  {/* RIGHT: DASHBOARD ACTIONS */}
  <div className="js-glass flex flex-wrap items-center gap-2 rounded-2xl p-2">
    <Link
      href="/dashboard/history"
      className="js-secondary-button group inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
    >
      <History
        className="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
      />

      History
    </Link>


    <Link
      href="/dashboard/cases"
      className="js-secondary-button group inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
    >
      <FolderOpen
        className="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
      />

      Cases
    </Link>


    <Link
      href="/dashboard/extension"
      className="js-primary-button group inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
    >
      <Puzzle
        className="h-4 w-4 transition-transform duration-200 group-hover:rotate-6 group-hover:scale-110"
      />

      Browser Extension
    </Link>
  </div>
</div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
          <AnalyzeForm />

          <aside>
            <div className="js-glass js-page-enter rounded-3xl p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold">
                Recent Analyses
              </h2>
            </div>

              {!analyses ||
              analyses.length === 0 ? (
                <p className="mt-4 text-sm text-neutral-500">
                  You haven't analyzed anything
                  yet.
                </p>
              ) : (
                <div className="mt-4 divide-y">
                  {analyses.map((analysis) => (
                    <Link
                      key={analysis.id}
                      href={`/dashboard/analysis/${analysis.id}`}
                      className="block py-4 transition hover:opacity-70"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium capitalize">
                            {analysis.analysis_type.replace(
                              "_",
                              " ",
                            )}
                          </p>

                          <p className="mt-1 text-xs text-neutral-500">
                            {new Date(
                              analysis.created_at,
                            ).toLocaleString()}
                          </p>
                        </div>

                        {analysis.risk_score !==
                          null && (
                          <div className="text-right">
                            <p className="text-xl font-bold">
                              {
                                analysis.risk_score
                              }
                            </p>

                            <p className="text-xs uppercase text-neutral-500">
                              {
                                analysis.risk_level
                              }
                            </p>
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}