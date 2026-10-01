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


export function CreateCaseForm() {
  const router =
    useRouter();


  const [
    title,
    setTitle,
  ] =
    useState("");


  const [
    description,
    setDescription,
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


  async function submit(
    event:
      React.FormEvent,
  ) {
    event.preventDefault();


    if (
      !title.trim()
    ) {
      setError(
        "Enter a case title.",
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
          "/api/cases",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                title,
                description,
              }),
          },
        );


      const data =
        await response.json();


      if (!response.ok) {
        throw new Error(
          data.error ||
          "Could not create case.",
        );
      }


      router.push(
        `/dashboard/cases/${data.id}`,
      );


      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not create case.",
      );
    } finally {
      setLoading(
        false,
      );
    }
  }


  return (
    <form
      onSubmit={
        submit
      }
      className="js-glass space-y-6 rounded-3xl p-7"
    >
      <div>
  <label
    htmlFor="case-title"
    className="text-sm font-semibold"
  >
    Case title
  </label>

  <input
    id="case-title"
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
    placeholder="Microsoft recruiter — September"
    className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-sm outline-none transition
               placeholder:text-neutral-600
               hover:border-white/20
               focus:border-violet-400/40
               focus:bg-white/[0.025]
               focus:ring-4
               focus:ring-violet-500/10"
  />
</div>


      <div>
  <div className="flex items-center justify-between gap-3">
    <label
      htmlFor="case-description"
      className="text-sm font-semibold"
    >
      Description
    </label>

    <span className="rounded-full border border-white/10 bg-white/[0.025] px-2.5 py-1 text-xs text-neutral-500">
      {description.length}/2000
    </span>
  </div>


  <textarea
    id="case-description"
    value={
      description
    }
    onChange={(
      event,
    ) =>
      setDescription(
        event.target.value,
      )
    }
    maxLength={
      2000
    }
    rows={
      6
    }
    placeholder="Optional notes about this investigation..."
    className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm leading-6 outline-none transition
               placeholder:text-neutral-600
               hover:border-white/20
               focus:border-violet-400/40
               focus:bg-white/[0.025]
               focus:ring-4
               focus:ring-violet-500/10"
  />
</div>


      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}


      <button
  type="submit"
  disabled={
    loading ||
    !title.trim()
  }
  className="js-primary-button group inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold disabled:opacity-50"
>
  <FolderPlus
    className="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
  />

  {loading
    ? "Creating Investigation..."
    : "Create Case"}
</button>
    </form>
  );
}