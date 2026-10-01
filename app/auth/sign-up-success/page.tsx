import Link from "next/link";

import {
  ArrowRight,
  CheckCircle2,
  MailCheck,
  ShieldCheck,
} from "lucide-react";


export default function SignUpSuccessPage() {
  return (
    <div className="flex flex-col">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-500/10">
        <CheckCircle2 className="h-7 w-7 text-emerald-300" />
      </div>


      <div className="mb-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">
          Account created
        </p>


        <h1 className="text-3xl font-bold tracking-[-0.03em] text-white">
          Check your email
        </h1>


        <p className="mt-3 text-sm leading-6 text-neutral-400">
            Your JobShield account has been created,
            but it is not active yet. Open the email
            we sent you, then continue to JobShield
            to confirm and activate your account.
        </p>
      </div>


      <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-4">
        <div className="flex gap-3">
          <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-violet-300" />

          <div>
            <p className="text-sm font-medium text-neutral-200">
              Confirmation required
            </p>

            <p className="mt-1 text-xs leading-5 text-neutral-500">
                The email link will return you to a secure
                JobShield confirmation page. Your account
                becomes active only after you press the
                confirmation button there.
            </p>
          </div>
        </div>
      </div>


      <Link
        href="/auth/login"
        className="js-primary-button group mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold"
      >
        Go to login

        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
      </Link>


      <div className="mt-5 flex items-start gap-2 text-xs leading-5 text-neutral-600">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />

        <p>
          If you don&apos;t see the email,
          check your spam or junk folder.
        </p>
      </div>
    </div>
  );
}