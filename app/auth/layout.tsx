import type {
  ReactNode,
} from "react";

import {
  Fingerprint,
  ScanSearch,
  ShieldCheck,
  Sparkles,
} from "lucide-react";


export default function AuthLayout({
  children,
}: {
  children:
    ReactNode;
}) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#06070a] text-white">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-32 h-[34rem] w-[34rem] rounded-full bg-violet-600/10 blur-[120px]" />

        <div className="absolute -right-40 bottom-0 h-[32rem] w-[32rem] rounded-full bg-blue-600/10 blur-[120px]" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.025),transparent_55%)]" />
      </div>


      <div className="relative mx-auto grid min-h-screen max-w-[1500px] lg:grid-cols-[1.05fr_0.95fr]">
        {/* Left product panel */}
        <section className="hidden min-h-screen border-r border-white/10 px-12 py-10 lg:flex lg:flex-col xl:px-20">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/10 shadow-[0_0_35px_rgba(139,92,246,0.12)]">
              <ShieldCheck className="h-6 w-6 text-violet-300" />
            </div>

            <div>
              <p className="text-lg font-bold tracking-tight">
                JobShield
              </p>

              <p className="text-xs text-neutral-500">
                Job scam intelligence
              </p>
            </div>
          </div>


          <div className="my-auto max-w-xl py-16">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/[0.08] px-3 py-1.5 text-xs font-medium text-violet-300">
              <Sparkles className="h-3.5 w-3.5" />

              Intelligent job-scam detection
            </div>


            <h1 className="text-5xl font-bold leading-[1.08] tracking-[-0.04em] xl:text-6xl">
              Investigate job
              opportunities before
              they become threats.
            </h1>


            <p className="mt-6 max-w-lg text-base leading-7 text-neutral-400">
              Analyze recruiter messages,
              emails, job postings,
              screenshots, domains, and
              suspicious links with one
              evidence-driven workflow.
            </p>


            <div className="mt-10 grid gap-4">
              <div className="flex items-start gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 backdrop-blur">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/10">
                  <ScanSearch className="h-4 w-4 text-violet-300" />
                </div>

                <div>
                  <p className="text-sm font-semibold">
                    Multi-signal analysis
                  </p>

                  <p className="mt-1 text-sm leading-6 text-neutral-500">
                    Rules, AI, domain
                    intelligence, URL
                    reputation, and company
                    verification work together.
                  </p>
                </div>
              </div>


              <div className="flex items-start gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 backdrop-blur">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
                  <Fingerprint className="h-4 w-4 text-blue-300" />
                </div>

                <div>
                  <p className="text-sm font-semibold">
                    Privacy-focused evidence
                  </p>

                  <p className="mt-1 text-sm leading-6 text-neutral-500">
                    Review findings, build
                    investigations, and create
                    evidence reports without
                    retaining unnecessary raw
                    files.
                  </p>
                </div>
              </div>
            </div>
          </div>


          <p className="text-xs text-neutral-600">
            JobShield provides risk indicators,
            not guarantees. Independently
            verify important employment
            communications.
          </p>
        </section>


        {/* Authentication panel */}
        <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
          <div className="w-full max-w-[460px]">
            {/* Mobile logo */}
            <div className="mb-10 flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/10">
                <ShieldCheck className="h-5 w-5 text-violet-300" />
              </div>

              <div>
                <p className="font-bold">
                  JobShield
                </p>

                <p className="text-xs text-neutral-500">
                  Job scam intelligence
                </p>
              </div>
            </div>


            <div className="rounded-[28px] border border-white/[0.09] bg-white/[0.035] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-8">
              {children}
            </div>


            <p className="mt-6 text-center text-xs leading-5 text-neutral-600">
              Secure authentication powered
              by Supabase. Your JobShield
              workspace remains private to
              your account.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}