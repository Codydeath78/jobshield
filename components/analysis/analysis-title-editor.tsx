"use client";

import {
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  Check,
  Pencil,
  X,
} from "lucide-react";


export function AnalysisTitleEditor({
  analysisId,
  initialTitle,
  fallbackTitle,
}: {
  analysisId: string;
  initialTitle: string | null;
  fallbackTitle: string;
}) {
  const router =
    useRouter();


  const [
    editing,
    setEditing,
  ] =
    useState(false);


  const [
    title,
    setTitle,
  ] =
    useState(
      initialTitle ??
      "",
    );


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


  async function save() {
    const nextTitle =
      title.trim();


    if (
      nextTitle.length < 1
    ) {
      setError(
        "Enter a title.",
      );

      return;
    }


    setLoading(
      true,
    );

    setError("");


    try {
      const response =
        await fetch(
          `/api/analyses/${analysisId}/title`,
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                title:
                  nextTitle,
              }),
          },
        );


      const data =
        await response.json();


      if (!response.ok) {
        throw new Error(
          data.error ||
          "Could not update title.",
        );
      }


      setTitle(
        data.title,
      );

      setEditing(
        false,
      );

      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not update title.",
      );
    } finally {
      setLoading(
        false,
      );
    }
  }


  if (!editing) {
    return (
      <div className="group flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold">
          {title ||
            fallbackTitle}
        </h2>

        <button
          type="button"
          onClick={() =>
            setEditing(
              true,
            )
          }
          className="grid h-8 w-8 place-items-center rounded-lg text-neutral-500 opacity-60 transition
                     hover:bg-white/[0.05]
                     hover:text-white
                     group-hover:opacity-100"
          aria-label="Rename analysis"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex max-w-xl items-center gap-2">
        <input
          autoFocus
          value={
            title
          }
          onChange={(
            event,
          ) =>
            setTitle(
              event.target.value,
            )
          }
          maxLength={
            120
          }
          onKeyDown={(
            event,
          ) => {
            if (
              event.key ===
              "Enter"
            ) {
              void save();
            }

            if (
              event.key ===
              "Escape"
            ) {
              setEditing(
                false,
              );

              setTitle(
                initialTitle ??
                "",
              );
            }
          }}
          className="h-10 min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 text-sm outline-none transition
                     focus:border-violet-400/40
                     focus:ring-4
                     focus:ring-violet-500/10"
        />
        <button
          type="button"
          disabled={
            loading
          }
          onClick={
            save
          }
          className="grid h-10 w-10 place-items-center rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] text-emerald-300 transition hover:bg-emerald-500/[0.1]"
        >
          <Check className="h-4 w-4" />
        </button>


        <button
          type="button"
          disabled={
            loading
          }
          onClick={() => {
            setEditing(
              false,
            );

            setTitle(
              initialTitle ??
              "",
            );
          }}
          className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 text-neutral-400 transition hover:bg-white/[0.05]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>


      {error && (
        <p className="mt-2 text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}