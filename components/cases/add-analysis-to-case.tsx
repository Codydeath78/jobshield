"use client";

import {
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  FolderPlus,
} from "lucide-react";


export function AddAnalysisToCase({
  analysisId,
  cases,
}: {
  analysisId: string;

  cases: Array<{
    id: string;
    title: string;
  }>;
}) {
  const router =
    useRouter();


  const [
    caseId,
    setCaseId,
  ] =
    useState("");


  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
  open,
  setOpen,
] =
  useState(
    false,
  );


  async function attach() {
    if (!caseId) {
      return;
    }


    setLoading(
      true,
    );


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
                analysisId,
              }),
          },
        );


      if (
        response.ok
      ) {
        setOpen(
  false,
);

setCaseId(
  "",
);
        router.refresh();
      }
    } finally {
      setLoading(
        false,
      );
    }
  }


  if (
    cases.length === 0
  ) {
    return null;
  }


  return (
  <div className="relative">
    <button
      type="button"
      onClick={() =>
        setOpen(
          (
            current,
          ) =>
            !current,
        )
      }
      className="js-secondary-button group inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
    >
      <FolderPlus
        className="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
      />

      Add to Investigation
    </button>


    {open && (
      <div className="js-glass absolute right-0 top-full z-50 mt-3 w-[340px] rounded-2xl p-4 shadow-2xl">
        <div>
          <p className="font-semibold">
            Add to investigation
          </p>

          <p className="mt-1 text-xs leading-5 text-neutral-500">
            Attach this evidence report to
            one of your open investigations.
          </p>
        </div>


        <select
          value={
            caseId
          }
          onChange={(
            event,
          ) =>
            setCaseId(
              event.target.value,
            )
          }
          className="mt-4 h-11 w-full cursor-pointer rounded-xl border border-white/10 bg-black/60 px-3 text-sm outline-none transition hover:border-white/20 focus:border-violet-400/40 focus:ring-4 focus:ring-violet-500/10"
        >
          <option value="">
            Select an investigation...
          </option>

          {cases.map(
            (
              item,
            ) => (
              <option
                key={
                  item.id
                }
                value={
                  item.id
                }
              >
                {
                  item.title
                }
              </option>
            ),
          )}
        </select>


        <button
          type="button"
          disabled={
            loading ||
            !caseId
          }
          onClick={
            attach
          }
          className="js-primary-button mt-3 w-full rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
        >
          {loading
            ? "Adding..."
            : "Add Evidence"}
        </button>
      </div>
    )}
  </div>
);
}