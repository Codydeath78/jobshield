"use client";

import {
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  Archive,
  RotateCcw,
} from "lucide-react";


export function CaseStatusControls({
  caseId,
  status,
}: {
  caseId: string;

  status:
    "open" |
    "closed";
}) {
  const router =
    useRouter();


  const [
    loading,
    setLoading,
  ] =
    useState(false);


  async function toggle() {
    setLoading(
      true,
    );


    try {
      const response =
        await fetch(
          `/api/cases/${caseId}`,
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                status:
                  status ===
                    "open"
                    ? "closed"
                    : "open",
              }),
          },
        );


      if (
        response.ok
      ) {
        router.refresh();
      }
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
    toggle
  }
  className={[
    "group inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50",

    status ===
    "open"
      ? "border border-amber-500/20 bg-amber-500/[0.04] text-amber-200 hover:border-amber-500/30 hover:bg-amber-500/[0.08]"
      : "js-secondary-button",
  ].join(
    " ",
  )}
>
  {status ===
  "open" ? (
    <Archive
      className="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
    />
  ) : (
    <RotateCcw
      className="h-4 w-4 transition-transform duration-300 group-hover:-rotate-45"
    />
  )}


  {loading
    ? "Updating..."
    : status ===
        "open"
      ? "Close Case"
      : "Reopen Case"}
</button>
  );
}