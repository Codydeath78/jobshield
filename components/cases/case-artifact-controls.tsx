"use client";

import {
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  FilePlus2,
} from "lucide-react";


type AvailableAnalysis = {
  id: string;

  analysisType:
    string;

  riskScore:
    number | null;

  riskLevel:
    string | null;

  createdAt:
    string;
};


export function CaseArtifactControls({
  caseId,
  availableAnalyses,
}: {
  caseId: string;

  availableAnalyses:
    AvailableAnalysis[];
}) {
  const router =
    useRouter();


  const [
    selected,
    setSelected,
  ] =
    useState("");


  const [
    loading,
    setLoading,
  ] =
    useState(false);


  const [
    error,
    setError,
  ] =
    useState("");


  async function attach() {
    if (!selected) {
      return;
    }


    setLoading(
      true,
    );

    setError("");


    try {
      const response =
        await fetch(
          `/api/cases/${caseId}/analyses`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                analysisId:
                  selected,
              }),
          },
        );


      const data =
        await response.json();


      if (!response.ok) {
        throw new Error(
          data.error ||
          "Could not attach analysis.",
        );
      }


      setSelected("");

      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not attach analysis.",
      );
    } finally {
      setLoading(
        false,
      );
    }
  }


  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <select
  value={
    selected
  }
  onChange={(
    event,
  ) =>
    setSelected(
      event.target.value,
    )
  }
  className="h-12 min-w-0 flex-1 cursor-pointer rounded-xl border border-white/10 bg-black/30 px-4 text-sm outline-none transition
             hover:border-white/20
             focus:border-violet-400/40
             focus:ring-4
             focus:ring-violet-500/10"
>
  <option value="">
    Select an analysis...
  </option>

  {availableAnalyses.map(
    (
      analysis,
    ) => (
      <option
        key={
          analysis.id
        }
        value={
          analysis.id
        }
      >
        {analysis.analysisType.replace(
          /_/g,
          " ",
        )}{" "}
        —{" "}
        {analysis.riskScore ??
          "unscored"}
        {analysis.riskLevel
          ? ` ${analysis.riskLevel}`
          : ""}
      </option>
    ),
  )}
</select>

        <button
  type="button"
  disabled={
    loading ||
    !selected
  }
  onClick={
    attach
  }
  className="js-primary-button group inline-flex h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold disabled:opacity-50"
>
  <FilePlus2
    className="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
  />

  {loading
    ? "Adding..."
    : "Add Evidence"}
</button>
      </div>


      {availableAnalyses.length ===
        0 && (
        <p className="text-sm text-neutral-500">
          All recent analyses are already
          attached to this case.
        </p>
      )}


      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}