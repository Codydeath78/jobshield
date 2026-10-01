"use client";

import {
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  Check,
  Copy,
  KeyRound,
  PlugZap,
  ShieldOff,
} from "lucide-react";


type TokenRecord = {
  id: string;
  label: string;
  token_prefix: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
};


export function ExtensionTokenManager({
  tokens,
}: {
  tokens:
    TokenRecord[];
}) {
  const router =
    useRouter();


  const [
  copied,
  setCopied,
] =
  useState(
    false,
  );


  const [
    label,
    setLabel,
  ] =
    useState(
      "Chrome Extension",
    );


  const [
    rawToken,
    setRawToken,
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


  async function createToken() {
    setLoading(
      true,
    );

    setError("");


    try {
      const response =
        await fetch(
          "/api/extension/tokens",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                label,
              }),
          },
        );


      const data =
        await response.json();


      if (!response.ok) {
        throw new Error(
          data.error ||
          "Could not create connection.",
        );
      }


      setRawToken(
        data.token,
      );


      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not create connection.",
      );
    } finally {
      setLoading(
        false,
      );
    }
  }


  async function copyToken() {
  if (!rawToken) {
    return;
  }


  await navigator
    .clipboard
    .writeText(
      rawToken,
    );


  setCopied(
    true,
  );


  window.setTimeout(
    () => {
      setCopied(
        false,
      );
    },
    1800,
  );
}


  async function revoke(
    id: string,
  ) {
    const response =
      await fetch(
        `/api/extension/tokens/${id}`,
        {
          method:
            "DELETE",
        },
      );


    if (
      response.ok
    ) {
      router.refresh();
    }
  }


  return (
    <div className="space-y-6">
      <section className="js-glass rounded-3xl p-6">
        <div className="flex items-start gap-3">
  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-violet-400/20 bg-violet-500/[0.06]">
    <PlugZap className="h-5 w-5 text-violet-300" />
  </div>

  <div>
    <h2 className="text-lg font-semibold">
      Connect browser extension
    </h2>

    <p className="mt-1 max-w-2xl text-sm leading-6 text-neutral-500">
      Generate a secret connection token, then
      paste it into the JobShield browser extension.
      The complete token is shown only once.
    </p>
  </div>
</div>


        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <div className="relative min-w-0 flex-1">
    <KeyRound
      className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500"
    />

    <input
      value={
        label
      }
      onChange={(
        event,
      ) =>
        setLabel(
          event.target.value,
        )
      }
      maxLength={
        80
      }
      placeholder="Chrome Extension"
      className="h-12 w-full rounded-xl border border-white/10 bg-black/30 pl-11 pr-4 text-sm outline-none transition
                 placeholder:text-neutral-600
                 hover:border-white/20
                 focus:border-violet-400/40
                 focus:ring-4
                 focus:ring-violet-500/10"
    />
  </div>

          <button
  type="button"
  disabled={
    loading
  }
  onClick={
    createToken
  }
  className="js-primary-button group inline-flex h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold disabled:opacity-50"
>
  <KeyRound
    className="h-4 w-4 transition-transform duration-200 group-hover:rotate-6 group-hover:scale-110"
  />

  {loading
    ? "Generating..."
    : "Generate Token"}
</button>
        </div>


        {rawToken && (
  <div className="js-card mt-5 rounded-2xl p-5">
    <div>
      <p className="font-semibold">
        Copy this token now
      </p>

      <p className="mt-1 text-xs leading-5 text-neutral-500">
        JobShield stores only a hash of this
        token and cannot display the complete
        value again.
      </p>
    </div>


    <div className="mt-4 flex overflow-hidden rounded-xl border border-white/10 bg-black/30 transition focus-within:border-violet-400/40 focus-within:ring-4 focus-within:ring-violet-500/10">
      <div className="flex min-w-0 flex-1 items-center gap-3 px-4">
        <KeyRound className="h-4 w-4 shrink-0 text-neutral-500" />

        <input
          readOnly
          value={
            rawToken
          }
          className="h-12 min-w-0 flex-1 bg-transparent font-mono text-xs outline-none"
        />
      </div>


      <button
        type="button"
        onClick={
          copyToken
        }
        className="group inline-flex h-12 items-center gap-2 border-l border-white/10 px-4 text-sm font-semibold transition hover:bg-white/[0.05]"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4" />
            Copied
          </>
        ) : (
          <>
            <Copy
              className="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
            />

            Copy
          </>
        )}
      </button>
    </div>
  </div>
)}


        {error && (
          <p className="mt-4 text-sm text-red-600">
            {error}
          </p>
        )}
      </section>


      <section className="js-glass rounded-3xl p-6">
        <h2 className="text-lg font-semibold">
          Connected browsers
        </h2>

        {tokens.length ===
        0 ? (
          <p className="mt-3 text-sm text-neutral-500">
            No extension connections yet.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {tokens.map(
              (
                token,
              ) => (
                <div
                  key={
                    token.id
                  }
                  className="js-card flex flex-col justify-between gap-4 rounded-2xl p-5 sm:flex-row sm:items-center"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">
                      {
                        token.label
                      }
                    </p>

                    <p className="mt-2 font-mono text-xs text-neutral-500">
                      {
                        token.token_prefix
                      }
                      ...
                    </p>

                    <p className="mt-2 text-xs text-neutral-500">
                      Last used:{" "}
                      {token.last_used_at
                        ? new Date(
                            token.last_used_at,
                          ).toLocaleString()
                        : "Never"}
                    </p>
                  </div>

                  {token.revoked_at ? (
                  <span className="text-sm text-neutral-600">
                    Connection revoked
                  </span>
                  ) : (
                  <button
                    type="button"
                    onClick={() =>
                      revoke(
                        token.id,
                      )
                    }
                    className="group inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/[0.04] px-4 py-2.5 text-sm font-semibold text-red-300 transition
                      hover:border-red-500/30
                        hover:bg-red-500/[0.08]"
                  >
                  <ShieldOff
                    className="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
                  />

                    Revoke
                  </button>
                )}
                </div>
              ),
            )}
          </div>
        )}
      </section>
    </div>
  );
}