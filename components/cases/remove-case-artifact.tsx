"use client";

import {
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  Unlink,
} from "lucide-react";


export function RemoveCaseArtifact({
  caseId,
  analysisId,
}: {
  caseId: string;
  analysisId: string;
}) {
  const router =
    useRouter();


  const [
    loading,
    setLoading,
  ] =
    useState(false);


  async function remove() {
    setLoading(
      true,
    );


    try {
      const response =
        await fetch(
          `/api/cases/${caseId}/analyses/${analysisId}`,
          {
            method:
              "DELETE",
          },
        );


      if (!response.ok) {
        return;
      }


      router.refresh();
    } finally {
      setLoading(
        false,
      );
    }
  }


  return (
    <button
      type="button"
      disabled={
      loading
      }
      onClick={
        remove
      }
      className="group inline-flex items-center gap-2 rounded-xl border border-red-500/15 bg-red-500/[0.025] px-3.5 py-2 text-sm font-semibold text-red-300 transition
             hover:border-red-500/25
             hover:bg-red-500/[0.07]
             disabled:opacity-50"
    >
    <Unlink
      className="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
    />

    {loading
    ? "Removing..."
    : "Remove from Case"}
  </button>
  );
}