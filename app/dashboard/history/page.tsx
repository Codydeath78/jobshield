import Link from "next/link";
import {
  redirect,
} from "next/navigation";

import type {
  AnalysisType,
  RiskLevel,
} from "@/lib/analysis/types";

import {
  createClient,
} from "@/lib/supabase/server";

import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";


const PAGE_SIZE = 10;


const ANALYSIS_TYPES:
  AnalysisType[] = [
    "text",
    "email",
    "job_posting",
    "screenshot",
    "job_offer",
    "email_file",
    "browser_selection",
  ];


const RISK_LEVELS:
  RiskLevel[] = [
    "low",
    "medium",
    "high",
    "critical",
  ];


type HistorySearchParams = {
  q?: string;
  type?: string;
  risk?: string;
  page?: string;
};


function isAnalysisType(
  value: string,
): value is AnalysisType {
  return ANALYSIS_TYPES.includes(
    value as AnalysisType,
  );
}


function isRiskLevel(
  value: string,
): value is RiskLevel {
  return RISK_LEVELS.includes(
    value as RiskLevel,
  );
}


function buildHistoryHref(
  options: {
    q: string;
    type: string;
    risk: string;
    page: number;
  },
) {
  const params =
    new URLSearchParams();

  if (options.q) {
    params.set(
      "q",
      options.q,
    );
  }

  if (options.type) {
    params.set(
      "type",
      options.type,
    );
  }

  if (options.risk) {
    params.set(
      "risk",
      options.risk,
    );
  }

  if (
    options.page > 1
  ) {
    params.set(
      "page",
      String(
        options.page,
      ),
    );
  }

  const query =
    params.toString();

  return query
    ? `/dashboard/history?${query}`
    : "/dashboard/history";
}


function previewText(
  text: string,
) {
  const cleaned =
    text
      .replace(
        /\s+/g,
        " ",
      )
      .trim();

  if (
    cleaned.length <= 180
  ) {
    return cleaned;
  }

  return (
    cleaned.slice(
      0,
      177,
    ) + "..."
  );
}


export default async function HistoryPage({
  searchParams,
}: {
  searchParams:
    Promise<HistorySearchParams>;
}) {
  const params =
    await searchParams;


  const q =
    typeof params.q ===
      "string"
      ? params.q
          .trim()
          .slice(
            0,
            200,
          )
      : "";


  const type =
    typeof params.type ===
      "string" &&
    isAnalysisType(
      params.type,
    )
      ? params.type
      : "";


  const risk =
    typeof params.risk ===
      "string" &&
    isRiskLevel(
      params.risk,
    )
      ? params.risk
      : "";


  const requestedPage =
    Number.parseInt(
      params.page ?? "1",
      10,
    );


  const page =
    Number.isFinite(
      requestedPage,
    ) &&
    requestedPage > 0
      ? requestedPage
      : 1;


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


  let query =
    supabase
      .from(
        "analyses",
      )
      .select(
        `
          id,
          title,
          analysis_type,
          input_text,
          summary,
          risk_score,
          risk_level,
          status,
          pipeline_version,
          created_at,
          completed_at
        `,
        {
          count:
            "exact",
        },
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
      );


  if (q) {
  query =
    query.ilike(
      "title",
      `%${q}%`,
    );
  }


  if (type) {
    query =
      query.eq(
        "analysis_type",
        type,
      );
  }


  if (risk) {
    query =
      query.eq(
        "risk_level",
        risk,
      );
  }


  const from =
    (page - 1) *
    PAGE_SIZE;

  const to =
    from +
    PAGE_SIZE -
    1;


  const {
    data:
      analyses,

    count,

    error:
      historyError,
  } =
    await query.range(
      from,
      to,
    );


  if (historyError) {
    throw historyError;
  }


  const totalItems =
    count ?? 0;

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        totalItems /
        PAGE_SIZE,
      ),
    );


  if (
    page > totalPages
  ) {
    redirect(
      buildHistoryHref({
        q,
        type,
        risk,
        page:
          totalPages,
      }),
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


  return (
      <main className="relative min-h-screen overflow-hidden bg-[#06070a]">
    {/* Ambient background glow */}
    <div className="js-orb -left-32 top-20 h-80 w-80 bg-violet-600/10" />

    <div className="js-orb -right-40 top-72 h-96 w-96 bg-blue-600/10 [animation-delay:-4s]" />
      <div className="js-page-enter relative mx-auto max-w-6xl px-5 py-10">


        <div className="mb-8">
         <Link
            href="/dashboard"
              className="js-secondary-button group inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
            >
              <ArrowLeft
                className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1"
              />

              Dashboard
          </Link>

          <h1 className="mt-5 text-3xl font-bold tracking-tight">
            Analysis History
          </h1>

          <p className="mt-2 text-neutral-500">
            Search and review your previous
            JobShield analyses.
          </p>
        </div>


        <form
          method="GET"
          className="js-glass mt-8 rounded-3xl p-4"
        >
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_180px_auto]">
          <div className="relative">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500"
          />

          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search analysis titles..."
            className="h-12 w-full rounded-xl border border-white/10 bg-black/30 pl-11 pr-4 text-sm outline-none transition
             placeholder:text-neutral-600
             hover:border-white/20
             focus:border-violet-400/40
             focus:bg-white/[0.025]
             focus:ring-4
             focus:ring-violet-500/10"
  />
          </div>

          <select
            name="type"
            defaultValue={type}
            className="h-12 w-full cursor-pointer rounded-xl border border-white/10 bg-black/30 px-4 text-sm outline-none transition
             hover:border-white/20
             focus:border-violet-400/40
             focus:ring-4
             focus:ring-violet-500/10"
          >
            <option value="">
              All analysis types
            </option>

            <option value="text">
              Message
            </option>

            <option value="email">
              Email
            </option>

            <option value="job_posting">
              Job Posting
            </option>

            <option value="screenshot">
              Screenshot
            </option>
            <option value="job_offer">
              Job Offer
            </option>
            <option value="email_file">
              Email File
            </option>
            <option value="browser_selection">
              Browser Selection
            </option>

          </select>

          <select
            name="risk"
            defaultValue={risk}
            className="h-12 w-full cursor-pointer rounded-xl border border-white/10 bg-black/30 px-4 text-sm outline-none transition
             hover:border-white/20
             focus:border-violet-400/40
             focus:ring-4
             focus:ring-violet-500/10"
          >
            <option value="">
              All risk levels
            </option>

            <option value="low">
              Low
            </option>

            <option value="medium">
              Medium
            </option>

            <option value="high">
              High
            </option>

            <option value="critical">
              Critical
            </option>
          </select>

          <button
            type="submit"
            className="js-primary-button group inline-flex h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold"
            >
            <SlidersHorizontal
              className="h-4 w-4 transition-transform duration-200 group-hover:rotate-6"
            />

              Apply Filters
        </button>
          </div>
        </form>


        {(q ||
          type ||
          risk) && (
          <div className="flex items-center gap-2 mt-4">
            <Link
              href="/dashboard/history"
              className="js-secondary-button group inline-flex h-12 items-center justify-center rounded-xl px-4 text-sm font-semibold"
            >
            <X
              className="h-4 w-4 transition-transform duration-200 group-hover:rotate-90"
            />
              Clear
            </Link>
          </div>
        )}


        <div className="mt-7">
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
            <div>
             <p className="text-sm font-medium text-neutral-400">
              {totalItems}{" "}
                {totalItems === 1
                  ? "analysis"
                    : "analyses"}
              </p>
            </div>

        <div className="rounded-full  border-white/10 bg-white/[0.025] px-3 py-1.5 text-xs font-medium text-neutral-500">
          Page {page} of {totalPages}
        </div>
      </div>

          {!analyses ||
          analyses.length ===
            0 ? (
            <div className="js-glass js-page-enter rounded-3xl p-6">
              <p className="font-medium">
                No analyses found.
              </p>

              <p className="mt-2 text-sm text-neutral-500">
                Try changing your filters or
                analyze new content.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {analyses.map(
                (
                  analysis,
                ) => (
                  <Link
                    key={
                      analysis.id
                    }
                    href={`/dashboard/analysis/${analysis.id}`}
                    className="block js-glass js-page-enter rounded-3xl p-6 transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">


                      <div className="min-w-0">
                        <h2 className="truncate text-lg font-semibold">
                          {analysis.title ||
                            formatAnalysisType(
                              analysis.analysis_type,
                          )}
                      </h2>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-neutral-400">
                          {formatAnalysisType(
                            analysis.analysis_type,
                        )}
                      </span>

                      <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs uppercase text-neutral-400">
                        {analysis.risk_level ??
                        analysis.status}
                      </span>
                </div>


                <p className="mt-4 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                  {analysis.summary ||
                    previewText(
                      analysis.input_text,
                  )}
                </p>

                <p className="mt-3 text-xs text-neutral-500">
                  {new Date(
                    analysis.created_at,
                    ).toLocaleString()}
                </p>
            </div>
                      <div className="shrink-0">
                        {analysis.risk_score !==
                        null ? (
                          <>
                            <p className="shrink-0 text-3xl font-bold">
                                {analysis.risk_score}
                              <span className="text-sm font-normal text-neutral-500">
                                /100
                              </span>
                            </p>
                          </>
                        ) : (
                          <span className="text-sm text-neutral-500">
                            {analysis.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ),
              )}
            </div>
          )}


          <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-6">
  <div>
    {page > 1 && (
      <Link
        href={buildHistoryHref({
          q,
          type,
          risk,
          page:
            page - 1,
        })}
        className="js-secondary-button group inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
      >
        <ChevronLeft
          className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1"
        />

        Previous
      </Link>
    )}
  </div>


  <div className="flex items-center gap-4">
    <span className="hidden text-xs text-neutral-500 sm:block">
      Page {page} of {totalPages}
    </span>

    {page < totalPages && (
      <Link
        href={buildHistoryHref({
          q,
          type,
          risk,
          page:
            page + 1,
        })}
        className="js-secondary-button group inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
      >
        Next

        <ChevronRight
          className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
        />
      </Link>
    )}
  </div>
</div>
        </div>
      </div>
    </main>
  );
}