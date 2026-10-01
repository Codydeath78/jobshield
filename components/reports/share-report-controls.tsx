"use client";

import {
  useState,
} from "react";

import {
  Check,
  Copy,
  Link2,
  RefreshCw,
  ShieldOff,
} from "lucide-react";

type Props = {
  analysisId: string;

  initialActive:
    boolean;

  initialExpiresAt:
    string | null;
};


export function ShareReportControls({
  analysisId,
  initialActive,
  initialExpiresAt,
}: Props) {
  const [
    active,
    setActive,
  ] =
    useState(
      initialActive,
    );

  const [
    expiresAt,
    setExpiresAt,
  ] =
    useState<
      string | null
    >(
      initialExpiresAt,
    );

  const [
    expiresInDays,
    setExpiresInDays,
  ] =
    useState(
      7,
    );

  const [
    generatedUrl,
    setGeneratedUrl,
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

  const [
    copied,
    setCopied,
  ] =
    useState(false);


  async function createLink() {
    setLoading(
      true,
    );

    setError("");
    setCopied(
      false,
    );


    try {
      const response =
        await fetch(
          `/api/reports/${analysisId}/share`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                expiresInDays,
              }),
          },
        );


      const data =
        await response.json();


      if (!response.ok) {
        throw new Error(
          data.error ||
          "Could not create share link.",
        );
      }


      const url =
        `${window.location.origin}${data.sharePath}`;


      setGeneratedUrl(
        url,
      );

      setExpiresAt(
        data.expiresAt,
      );

      setActive(
        true,
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not create share link.",
      );
    } finally {
      setLoading(
        false,
      );
    }
  }


  async function copyLink() {
    if (!generatedUrl) {
      return;
    }


    try {
      await navigator
        .clipboard
        .writeText(
          generatedUrl,
        );

      setCopied(
        true,
      );
    } catch {
      setError(
        "Could not copy the link automatically.",
      );
    }
  }

  async function revokeLink() {
    setLoading(
      true,
    );

    setError("");


    try {
      const response =
        await fetch(
          `/api/reports/${analysisId}/share`,
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
          "Could not revoke share link.",
        );
      }


      setActive(
        false,
      );

      setGeneratedUrl(
        "",
      );

      setExpiresAt(
        null,
      );

      setCopied(
        false,
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not revoke share link.",
      );
    } finally {
      setLoading(
        false,
      );
    }
  }


  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">
          Share report
        </h2>

        <p className="mt-1 text-sm text-neutral-500">
          Shared reports are redacted. Original
          analyzed content and evidence excerpts
          are hidden.
        </p>
      </div>


      {active && (
        <div className="rounded-xl border p-4">
          <p className="font-medium">
            Sharing is active
          </p>

          {expiresAt && (
            <p className="mt-1 text-sm text-neutral-500">
              Expires{" "}
              {new Date(
                expiresAt,
              ).toLocaleString()}
            </p>
          )}

          {!generatedUrl && (
            <p className="mt-3 text-xs text-neutral-500">
              JobShield does not store the raw
              secret token. Generate a new link
              below if you need to copy it again.
              The previous link will immediately
              stop working.
            </p>
          )}
        </div>
      )}


      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
            Link expires in
          </span>

          <select
            value={
              expiresInDays
            }
            onChange={(
              event,
            ) =>
              setExpiresInDays(
                Number(
                  event
                    .target
                    .value,
                ),
              )
            }
            className="mt-2 h-12 w-full cursor-pointer rounded-xl border border-white/10 bg-black/30 px-4 text-sm outline-none transition hover:border-white/20 focus:border-violet-400/40 focus:ring-4 focus:ring-violet-500/10 sm:w-44"
          >
            <option value={1}>
              1 day
            </option>

            <option value={7}>
              7 days
            </option>

            <option value={30}>
              30 days
            </option>
          </select>
        </label>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          disabled={
            loading
          }
          onClick={
            createLink
          }
          className="js-primary-button group inline-flex h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold disabled:opacity-50"
        >
          <Link2
            className="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
          />
          {loading
            ? "Working..."
            : active
              ? "Generate new link"
              : "Create share link"}
        </button>


        {active && (
          <button
            type="button"
            disabled={
              loading
            }
            onClick={
              revokeLink
            }
            className="group inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/[0.04] px-4 py-2.5 text-sm font-semibold text-red-300 transition
             hover:border-red-500/30
             hover:bg-red-500/[0.08]
             disabled:opacity-50"
          >
              <ShieldOff
                className="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
              />

            Revoke
          </button>
          
        )}
        </div>
      </div>


      {generatedUrl && (
        <div className="mt-5">
  <label className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
    Share URL
  </label>


  <div className="mt-2 flex overflow-hidden rounded-xl border border-white/10 bg-black/30 transition focus-within:border-violet-400/40 focus-within:ring-4 focus-within:ring-violet-500/10">
    <div className="flex min-w-0 flex-1 items-center gap-3 px-4">
      <Link2 className="h-4 w-4 shrink-0 text-neutral-500" />

      <input
        readOnly
        value={
          generatedUrl
        }
        className="h-12 min-w-0 flex-1 bg-transparent text-sm outline-none"
      />
    </div>


    <button
      type="button"
      onClick={
        copyLink
      }
      className="group inline-flex h-12 items-center gap-2 border-l border-white/10 px-4 text-sm font-semibold transition hover:bg-white/[0.05]"
    >
      <Copy
        className="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
      />
              {copied
                ? "Copied"
                : "Copy"}
            </button>
          </div>
        </div>
      )}


      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}
    </div>
  );
}