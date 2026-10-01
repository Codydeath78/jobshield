"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  AnalysisProgress,
} from "@/components/analysis/analysis-progress";

import type {
  AnalysisFinding,
  AnalysisType,
  RiskLevel,
} from "@/lib/analysis/types";

type AnalysisResult = {
  analysisId: string;
  riskScore: number;
  riskLevel: RiskLevel;
  summary: string;
  findings: AnalysisFinding[];

  signals: {
    ruleScore: number;
    aiSignal: number;
    aiAvailable: boolean;
    aiScamLikelihood: number | null;
    aiConfidence: number | null;
    domainSignal: number;
    urlSignal: number;
  };
};

const analysisTypes: {
  value: AnalysisType;
  label: string;
}[] = [
  {
    value: "text",
    label: "Message",
  },
  {
    value: "email",
    label: "Email",
  },
  {
    value: "job_posting",
    label: "Job Posting",
  },
  {
  value: "screenshot",
  label: "Screenshot",
  },
  {
  value: "job_offer",
  label: "Job Offer",
},
{
  value: "email_file",
  label: "Email File",
},
];

export function AnalyzeForm() {
  const router = useRouter();

  const [analysisType, setAnalysisType] =
    useState<AnalysisType>("text");

  const [
  screenshot,
  setScreenshot,
] =
  useState<File | null>(
    null,
  );


  const [
  emailFile,
  setEmailFile,
] =
  useState<File | null>(
    null,
  );
  

  const [input, setInput] = useState("");
  const [result, setResult] =
    useState<AnalysisResult | null>(null);

  const [error, setError] = useState("");
  const [loading, setLoading] =
    useState(false);

  const [
  documentFile,
  setDocumentFile,
] =
  useState<File | null>(
    null,
  );

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setResult(null);

if (
  analysisType ===
  "screenshot"
) {
  if (!screenshot) {
    setError(
      "Choose a screenshot to analyze.",
    );

    return;
  }
} else if (
  analysisType ===
  "job_offer"
) {
  if (!documentFile) {
    setError(
      "Choose a job offer document to analyze.",
    );

    return;
  }
} else if (
  analysisType ===
  "email_file"
) {
  if (!emailFile) {
    setError(
      "Choose an .eml email file to analyze.",
    );

    return;
  }
} else if (
  input.trim().length <
  10
) {
  setError(
    "Enter at least 10 characters to analyze.",
  );

  return;
}

    setLoading(true);

    try {

let response:
  Response;


if (
  analysisType ===
  "screenshot"
) {
  const formData =
    new FormData();


  formData.append(
    "screenshot",
    screenshot!,
  );


  response =
    await fetch(
      "/api/analyze/screenshot",
      {
        method:
          "POST",

        body:
          formData,
      },
    );

    } else if (
  analysisType ===
  "email_file"
) {
  const formData =
    new FormData();


  formData.append(
    "emailFile",
    emailFile!,
  );


  response =
    await fetch(
      "/api/analyze/email-file",
      {
        method:
          "POST",

        body:
          formData,
      },
    );

} else if (
  analysisType ===
  "job_offer"
) {
  const formData =
    new FormData();


  formData.append(
    "document",
    documentFile!,
  );

  response =
    await fetch(
      "/api/analyze/document",
      {
        method:
          "POST",

        body:
          formData,
      },
    );
}

else {
  response =
    await fetch(
      "/api/analyze",
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            analysisType,
            input,
          }),
      },
    );
}

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Analysis failed.",
        );
      }

      setResult(data);

      // Refresh Server Component history below.
      router.refresh();


    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Analysis failed.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSubmit}
        className="js-glass js-page-enter rounded-3xl p-6"
      >
        <div className="mb-6">
          <h2 className="text-xl font-semibold">
            Analyze suspicious content
          </h2>

          <p className="mt-1 text-sm text-neutral-500">
            Paste a recruiter message, email, or
            job posting.
          </p>
        </div>

        <div className="mb-5 flex gap-2">
          {analysisTypes.map((type) => {
            const active =
              analysisType === type.value;

            return (
              <button
                key={type.value}
                type="button"
                onClick={() =>
                  setAnalysisType(type.value)
                }
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                  active
                    ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                    : "hover:bg-neutral-100 dark:hover:bg-neutral-900"
                }`}
              >
                {type.label}
              </button>
            );
          })}
        </div>


        {analysisType ===
          "screenshot" ? (
  <div className="space-y-4">
    <label className="block js-card rounded-2xl border-dashed p-6">
      <span className="block font-medium">
        Upload screenshot
      </span>

      <span className="mt-1 block text-sm text-neutral-500">
        PNG, JPEG, or WebP. Maximum 8 MB.
      </span>

      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="mt-4 block w-full text-sm"
        onChange={(
          event,
        ) => {
          const file =
            event
              .target
              .files?.[0] ??
            null;

          setScreenshot(
            file,
          );

          setError("");
          setResult(null);
        }}
      />

      {screenshot && (
        <div className="mt-4 rounded-lg bg-neutral-100 p-3 text-sm dark:bg-neutral-900">
          <p className="font-medium">
            {screenshot.name}
          </p>

          <p className="mt-1 text-xs text-neutral-500">
            {(
              screenshot.size /
              1024 /
              1024
            ).toFixed(2)}{" "}
            MB
          </p>
        </div>
      )}
    </label>

    <p className="text-xs text-neutral-500">
      The raw screenshot is processed for text
      extraction but is not stored in JobShield's
      database in this version.
    </p>
  </div>



  ) : analysisType ===
"job_offer" ? (
  <div className="space-y-4">
    <label className="block js-card rounded-2xl border-dashed p-6">
      <span className="block font-medium">
        Upload job offer
      </span>

      <span className="mt-1 block text-sm text-neutral-500">
        PDF, DOCX, or TXT. Maximum 8 MB.
      </span>

      <input
        type="file"
        accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
        className="mt-4 block w-full text-sm"
        onChange={(
          event,
        ) => {
          const file =
            event
              .target
              .files?.[0] ??
            null;

          setDocumentFile(
            file,
          );

          setError("");
          setResult(null);
        }}
      />

      {documentFile && (
        <div className="mt-4 rounded-lg bg-neutral-100 p-3 text-sm dark:bg-neutral-900">
          <p className="font-medium">
            {documentFile.name}
          </p>

          <p className="mt-1 text-xs text-neutral-500">
            {(
              documentFile.size /
              1024 /
              1024
            ).toFixed(2)}{" "}
            MB
          </p>
        </div>
      )}
    </label>

    <p className="text-xs leading-5 text-neutral-500">
      JobShield extracts text from the
      document for analysis. The original
      uploaded file is not stored.
    </p>
  </div>



) : analysisType ===
"email_file" ? (
  <div className="space-y-4">
    <label className="block js-card rounded-2xl border-dashed p-6">
      <span className="block font-medium">
        Upload email file
      </span>

      <span className="mt-1 block text-sm text-neutral-500">
        EML format. Maximum 10 MB.
      </span>

      <input
        type="file"
        accept=".eml,message/rfc822"
        className="mt-4 block w-full text-sm"
        onChange={(
          event,
        ) => {
          const file =
            event
              .target
              .files?.[0] ??
            null;

          setEmailFile(
            file,
          );

          setError("");
          setResult(null);
        }}
      />

      {emailFile && (
        <div className="mt-4 rounded-lg bg-neutral-100 p-3 text-sm dark:bg-neutral-900">
          <p className="font-medium">
            {emailFile.name}
          </p>

          <p className="mt-1 text-xs text-neutral-500">
            {(
              emailFile.size /
              1024 /
              1024
            ).toFixed(2)}{" "}
            MB
          </p>
        </div>
      )}
    </label>

    <p className="text-xs leading-5 text-neutral-500">
      JobShield parses the email body,
      headers, link destinations, and
      attachment metadata. The original
      EML file and attachment contents are
      not retained.
    </p>
  </div>
) : (
  <>
    <textarea
      value={input}
      onChange={(
        event,
      ) =>
        setInput(
          event.target.value,
        )
      }
      maxLength={50_000}
      rows={11}
      placeholder="Paste the suspicious job message here..."
      className="w-full resize-y js-card rounded-2xl bg-transparent p-4 outline-none focus:ring-2"
    />

        <div className="mt-2 flex justify-between text-xs text-neutral-500">
          <span>
            Don't include passwords or financial
            account credentials.
          </span>

          <span>
            {input.length.toLocaleString()} /
            50,000
          </span>
        </div>
      </>
    )}

        {error && (
          <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        )}

        <button
          type="submit"

  disabled={
    loading ||
  (
    analysisType ===
    "screenshot"
      ? !screenshot
      : analysisType ===
          "job_offer"
        ? !documentFile
        : analysisType ===
            "email_file"
          ? !emailFile
          : input
              .trim()
              .length < 10
  )
}

          className="js-primary-button mt-5 w-full rounded-xl px-5 py-3 font-semibold disabled:cursor-not-allowed"
        >
          {loading
  ? analysisType ===
    "screenshot"
    ? "Reading screenshot..."
    : analysisType ===
        "job_offer"
      ? "Reading document..."
      : analysisType ===
          "email_file"
        ? "Parsing email..."
        : "Analyzing..."
  : analysisType ===
    "screenshot"
    ? "Analyze Screenshot"
    : analysisType ===
        "job_offer"
      ? "Analyze Job Offer"
      : analysisType ===
          "email_file"
        ? "Analyze Email File"
        : "Analyze"}
        </button>
      </form>

        {loading && (
          <AnalysisProgress
            analysisType={
              analysisType
            }
          />
      )}

      {result && (
        <AnalysisResultCard result={result} />
      )}
    </div>
  );
}

function AnalysisResultCard({
  result,
}: {
  result: AnalysisResult;
}) {
  const riskClass =
  result.riskLevel ===
  "critical"
    ? "js-risk-critical"
    : result.riskLevel ===
        "high"
      ? "js-risk-high"
      : result.riskLevel ===
          "medium"
        ? "js-risk-medium"
        : "js-risk-low";
return (
    <section className="js-glass js-page-enter rounded-3xl p-6">
      {/* Final risk header */}
      <div
  className={`js-risk-glow ${riskClass} rounded-2xl p-5`}
>
      <div className="flex flex-col gap-5 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">
            JobShield Risk Analysis
          </p>

          <h2 className="mt-1 text-2xl font-bold capitalize">
            {result.riskLevel} risk
          </h2>
        </div>

        <div className="text-left sm:text-right">
          <span className="text-5xl font-bold">
            {result.riskScore}
          </span>

          <span className="text-lg text-neutral-500">
            /100
          </span>
        </div>
      </div>
  </div>

      {/* Hybrid signals */}
      <div className="grid gap-3 border-b py-5 sm:grid-cols-5">
  <div className="rounded-xl bg-neutral-100 p-4 dark:bg-neutral-900">
    <p className="text-xs uppercase text-neutral-500">
      Rules
    </p>

    <p className="mt-1 text-xl font-semibold">
      {result.signals.ruleScore}/100
    </p>
  </div>

  <div className="rounded-xl bg-neutral-100 p-4 dark:bg-neutral-900">
    <p className="text-xs uppercase text-neutral-500">
      AI Signal
    </p>

    <p className="mt-1 text-xl font-semibold">
      {result.signals.aiSignal}/60
    </p>
  </div>

  <div className="rounded-xl bg-neutral-100 p-4 dark:bg-neutral-900">
    <p className="text-xs uppercase text-neutral-500">
      Domain Signal
    </p>

    <p className="mt-1 text-xl font-semibold">
      {result.signals.domainSignal}/60
    </p>
  </div>

  <div className="rounded-xl bg-neutral-100 p-4 dark:bg-neutral-900">
    <p className="text-xs uppercase text-neutral-500">
      AI Confidence
    </p>

    <p className="mt-1 text-xl font-semibold">
      {result.signals.aiConfidence !== null
        ? `${Math.round(
            result.signals.aiConfidence * 100,
          )}%`
        : "Unavailable"}
    </p>
  </div>

  <div className="rounded-xl bg-neutral-100 p-4 dark:bg-neutral-900">
  <p className="text-xs uppercase text-neutral-500">
    URL Reputation
  </p>

  <p className="mt-1 text-xl font-semibold">
    {result.signals.urlSignal}/80
  </p>
</div>


</div>

      {/* Summary */}
      <p className="py-5 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
        {result.summary}
      </p>

      {/* Findings */}
      {result.findings.length === 0 ? (
        <div className="js-card rounded-2xl p-4 text-sm">
          No scam patterns were detected by the
          available analysis signals. This does not
          guarantee that the opportunity is
          legitimate.
        </div>
      ) : (
        <div className="space-y-4">
          {result.findings.map((finding) => (
            <article
              key={finding.key}
              className="js-card rounded-2xl p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold">
                  ⚠ {finding.title}
                </h3>

                <span className="rounded-full border px-2.5 py-1 text-xs font-medium uppercase">
                  {finding.severity}
                </span>
              </div>

              <p className="mt-3 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                {finding.explanation}
              </p>

              {finding.evidence && (
                <blockquote className="mt-3 rounded-lg bg-neutral-100 p-3 text-sm italic dark:bg-neutral-900">
                  "{finding.evidence}"
                </blockquote>
              )}

              <div className="mt-3 flex flex-wrap gap-3 text-xs text-neutral-500">
                <span>
                  Source: {finding.source}
                </span>

                {finding.scoreContribution > 0 && (
                  <span>
                    Risk contribution: +
                    {finding.scoreContribution}
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <a
        href={`/dashboard/analysis/${result.analysisId}`}
        className="mt-6 inline-block text-sm font-medium underline"
      >
        Open full report →
      </a>
    </section>
  );
}