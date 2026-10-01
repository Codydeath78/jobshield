import Link from "next/link";

import {
  redirect,
} from "next/navigation";

import {
  CreateCaseForm,
} from "@/components/cases/create-case-form";

import {
  createClient,
} from "@/lib/supabase/server";

import {
  ArrowLeft,
} from "lucide-react";


export default async function NewCasePage() {
  const supabase =
    await createClient();


  const {
    data:
      claimsData,
  } =
    await supabase
      .auth
      .getClaims();


  if (
    !claimsData
      ?.claims
      ?.sub
  ) {
    redirect(
      "/auth/login",
    );
  }


  return (
      <main className="relative min-h-screen overflow-hidden bg-[#06070a]">
    {/* Ambient background glow */}
    <div className="js-orb -left-32 top-20 h-80 w-80 bg-violet-600/10" />

    <div className="js-orb -right-40 top-72 h-96 w-96 bg-blue-600/10 [animation-delay:-4s]" />
      <div className="js-page-enter relative mx-auto max-w-3xl px-5 py-10">
        <Link
  href="/dashboard/cases"
  className="js-secondary-button group inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
>
  <ArrowLeft
    className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1"
  />

  Investigations
</Link>

<div className="mt-7">
  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-neutral-500">
    JobShield
  </p>

  <h1 className="mt-3 text-4xl font-bold tracking-tight">
    New Investigation
  </h1>

  <p className="mt-3 text-lg text-neutral-500">
    Group related JobShield analyses into one investigation.
  </p>
</div>

        <div className="mt-7">
          <CreateCaseForm />
        </div>
      </div>
    </main>
  );
}