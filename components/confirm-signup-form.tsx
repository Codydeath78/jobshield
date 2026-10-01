"use client";

import {
  useState,
} from "react";

import Link from "next/link";

import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  MailCheck,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";


export function ConfirmSignupForm({
  tokenHash,
}: {
  tokenHash:
    string | null;
}) {
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
    useState<
      string |
      null
    >(
      null,
    );


  async function handleConfirm() {
    if (
      loading ||
      !tokenHash
    ) {
      return;
    }


    setLoading(
      true,
    );


    setError(
      null,
    );


    try {
      const response =
        await fetch(
          "/api/auth/confirm-signup",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                tokenHash,
              }),
          },
        );


        const contentType =
  response.headers.get(
    "content-type",
  ) ?? "";


if (
  !contentType.includes(
    "application/json",
  )
) {
  const responseText =
    await response.text();


  console.error(
    "Signup confirmation returned non-JSON:",
    {
      status:
        response.status,

      url:
        response.url,

      redirected:
        response.redirected,

      body:
        responseText.slice(
          0,
          500,
        ),
    },
  );


  throw new Error(
    "JobShield could not complete account activation. Please try again.",
  );
}


const data =
  await response.json();


if (!response.ok) {
  throw new Error(
    data.error ||
      "Could not activate your account.",
  );
}


      /*
       * verifyOtp() has now authenticated
       * the user and stored the Supabase
       * session cookies.
       *
       * Uses a full navigation so the
       * dashboard starts with fresh auth
       * state.
       */
      window.location.replace(
        "/dashboard",
      );
    } catch (
      error:
        unknown
    ) {
      setError(
        error instanceof
          Error
          ? error.message
          : "Could not activate your account.",
      );


      setLoading(
        false,
      );
    }
  }


  /* user visited the page directly instead of through the confirmation email. */
  if (!tokenHash) {
    return (
      <div className="flex flex-col">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-500/10">
          <TriangleAlert className="h-7 w-7 text-amber-300" />
        </div>


        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-amber-300">
          Confirmation link required
        </p>


        <h1 className="text-3xl font-bold tracking-[-0.03em] text-white">
          We can&apos;t confirm this account
        </h1>


        <p className="mt-3 text-sm leading-6 text-neutral-400">
          Open the confirmation email sent by
          JobShield and use the link inside it.
        </p>


        <Link
          href="/auth/sign-up"
          className="js-primary-button mt-7 flex h-12 items-center justify-center gap-2 rounded-xl text-sm font-semibold"
        >
          Return to sign up

          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }


  return (
    <div className="flex flex-col">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/10 shadow-[0_0_40px_rgba(139,92,246,0.12)]">
        <MailCheck className="h-7 w-7 text-violet-300" />
      </div>


      <div className="mb-8">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/[0.08] px-3 py-1.5 text-xs font-medium text-violet-300">
          <ShieldCheck className="h-3.5 w-3.5" />

          Secure confirmation ready
        </div>


        <h1 className="text-3xl font-bold tracking-[-0.03em] text-white">
          Activate your JobShield account
        </h1>


        <p className="mt-3 text-sm leading-6 text-neutral-400">
          Your secure confirmation link is
          ready. Confirm your email below to
          activate your account and continue
          directly to your dashboard.
        </p>
      </div>


      <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-4">
        <div className="flex gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />

          <div>
            <p className="text-sm font-medium text-neutral-200">
              One final step
            </p>

            <p className="mt-1 text-xs leading-5 text-neutral-500">
              Your account is not activated
              until you press Confirm & Continue.
            </p>
          </div>
        </div>
      </div>


      {error && (
        <div
          role="alert"
          className="mt-5 rounded-xl border border-red-400/20 bg-red-500/[0.08] px-4 py-3"
        >
          <p className="text-sm leading-5 text-red-300">
            {error}
          </p>
        </div>
      )}


      <button
        type="button"
        onClick={
          handleConfirm
        }
        disabled={
          loading
        }
        className="js-primary-button group mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />

            Activating account...
          </>
        ) : (
          <>
            Confirm & Continue

            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </>
        )}
      </button>


      <p className="mt-6 text-center text-xs leading-5 text-neutral-600">
        JobShield will create your authenticated
        session only after this confirmation.
      </p>
    </div>
  );
}