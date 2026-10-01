import Link from "next/link";

import {
  redirect,
} from "next/navigation";

import {
  ExtensionTokenManager,
} from "@/components/extension/extension-token-manager";

import {
  createClient,
} from "@/lib/supabase/server";


import {
  ArrowLeft,
} from "lucide-react";


export default async function ExtensionPage() {
  const supabase =
    await createClient();


  const {
    data:
      claimsData,
  } =
    await supabase
      .auth
      .getClaims();


  const userId =
    claimsData
      ?.claims
      ?.sub;


  if (!userId) {
    redirect(
      "/auth/login",
    );
  }


  const {
    data:
      tokens,
  } =
    await supabase
      .from(
        "extension_tokens",
      )
      .select(
        `
          id,
          label,
          token_prefix,
          created_at,
          last_used_at,
          revoked_at
        `,
      )
      .eq(
        "user_id",
        userId,
      )
      .order(
        "created_at",
        {
          ascending:
            false,
        },
      );


  return (
      <main className="relative min-h-screen overflow-hidden bg-[#06070a]">
    {/* Ambient background glow */}
    <div className="js-orb -left-32 top-20 h-80 w-80 bg-violet-600/10" />

    <div className="js-orb -right-40 top-72 h-96 w-96 bg-blue-600/10 [animation-delay:-4s]" />
      <div className="js-page-enter relative mx-auto max-w-4xl px-5 py-10">
        <Link
  href="/dashboard"
  className="js-secondary-button group inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
>
  <ArrowLeft
    className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1"
  />

  Dashboard
</Link>

<div className="mt-7">
  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-neutral-500">
    JobShield
  </p>

  <h1 className="mt-3 text-4xl font-bold tracking-tight">
    Browser Extension
  </h1>

  <p className="mt-3 max-w-2xl text-lg leading-7 text-neutral-500">
    Connect Chrome or another Chromium browser
    to your JobShield account without sharing
    your web login session with the extension.
  </p>
</div>

        <div className="mt-8">
          <ExtensionTokenManager
            tokens={
              tokens ??
              []
            }
          />
        </div>
      </div>
    </main>
  );
}