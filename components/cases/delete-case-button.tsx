"use client";

import {
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  Trash2,
  X,
} from "lucide-react";


export function DeleteCaseButton({
  caseId,
  caseTitle,
}: {
  caseId: string;
  caseTitle: string;
}) {
  const router =
    useRouter();


  const [
    open,
    setOpen,
  ] =
    useState(
      false,
    );


  const [
    loading,
    setLoading,
  ] =
    useState(
      false,
    );


  const [
    error,
    setError,
  ] =
    useState("");


  async function removeCase() {
    setLoading(
      true,
    );

    setError("");


    try {
      const response =
        await fetch(
          `/api/cases/${caseId}`,
          {
            method:
              "DELETE",
          },
        );


      const data =
        await response.json();


      if (!response.ok) {
        throw new Error(
          data.error ||
          "Could not delete case.",
        );
      }


      router.push(
        "/dashboard/cases",
      );

      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not delete case.",
      );
    } finally {
      setLoading(
        false,
      );
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() =>
          setOpen(
            true,
          )
        }
        className="group inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/[0.04] px-4 py-2.5 text-sm font-semibold text-red-300 transition
                   hover:border-red-500/35
                   hover:bg-red-500/[0.08]"
      >
        <Trash2
          className="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
        />

        Delete Case
      </button>


      {open && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/70 px-5 backdrop-blur-sm">
          <div className="js-glass js-page-enter w-full max-w-md rounded-3xl p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div className="grid h-11 w-11 place-items-center rounded-xl border border-red-500/20 bg-red-500/[0.06] text-red-300">
                <Trash2 className="h-5 w-5" />
              </div>

              <button
                type="button"
                disabled={
                  loading
                }
                onClick={() =>
                  setOpen(
                    false,
                  )
                }
                className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-neutral-400 transition hover:bg-white/[0.05] hover:text-white"
                aria-label="Close confirmation"
              >
                <X className="h-4 w-4" />
              </button>
            </div>


            <h2 className="mt-5 text-xl font-semibold">
              Delete investigation?
            </h2>

            <p className="mt-2 text-sm leading-6 text-neutral-400">
              This will permanently delete the case{" "}
              <span className="font-semibold text-white">
                {caseTitle}
              </span>
              {" "}and remove its evidence associations.
            </p>

            <p className="mt-3 text-sm leading-6 text-neutral-500">
              The original JobShield analyses and evidence reports
              will not be deleted.
            </p>


            {error && (
              <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/[0.05] p-3 text-sm text-red-300">
                {error}
              </p>
            )}


            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={
                  loading
                }
                onClick={() =>
                  setOpen(
                    false,
                  )
                }
                className="js-secondary-button rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
              >
                Cancel
              </button>


              <button
                type="button"
                disabled={
                  loading
                }
                onClick={
                  removeCase
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-200 transition
                           hover:bg-red-500/15
                           disabled:cursor-not-allowed
                           disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />

                {loading
                  ? "Deleting..."
                  : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}