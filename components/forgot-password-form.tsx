"use client";

import {
  useState,
  type ComponentPropsWithoutRef,
  type FormEvent,
} from "react";

import Link from "next/link";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Mail,
  Send,
  ShieldCheck,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";

import {
  Input,
} from "@/components/ui/input";

import {
  Label,
} from "@/components/ui/label";

import {
  createClient,
} from "@/lib/supabase/client";

import {
  cn,
} from "@/lib/utils";


export function ForgotPasswordForm({
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  const [
    email,
    setEmail,
  ] =
    useState(
      "",
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


  const [
    success,
    setSuccess,
  ] =
    useState(
      false,
    );


  const [
    isLoading,
    setIsLoading,
  ] =
    useState(
      false,
    );


  async function handleForgotPassword(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();


    if (isLoading) {
      return;
    }


    setError(
      null,
    );


    setIsLoading(
      true,
    );


    try {
      const supabase =
        createClient();


      const {
        error:
          resetError,
      } =
        await supabase
          .auth
          .resetPasswordForEmail(
            email.trim(),
            {
              redirectTo:
                `${window.location.origin}/auth/recovery`,
            },
          );


      if (resetError) {
        throw resetError;
      }


      setSuccess(
        true,
      );
    } catch (
      error:
        unknown
    ) {
      setError(
        error instanceof
          Error
          ? error.message
          : "Could not send the reset email. Please try again.",
      );
    } finally {
      setIsLoading(
        false,
      );
    }
  }


  if (success) {
    return (
      <div
        className={cn(
          "flex flex-col",
          className,
        )}
        {...props}
      >
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-500/10">
          <CheckCircle2 className="h-7 w-7 text-emerald-300" />
        </div>


        <div className="mb-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">
            Reset link sent
          </p>


          <h1 className="text-3xl font-bold tracking-[-0.03em] text-white">
            Check your email
          </h1>


          <p className="mt-3 text-sm leading-6 text-neutral-400">
            If an account exists for
            <span className="font-medium text-neutral-200">
              {" "}
              {email}
            </span>
            , JobShield has sent password reset
            instructions.
          </p>
        </div>


        <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-4">
          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-violet-300" />

            <div>
              <p className="text-sm font-medium text-neutral-200">
                Didn&apos;t receive it?
              </p>

              <p className="mt-1 text-xs leading-5 text-neutral-500">
                Check your spam or junk folder and
                make sure you entered the correct
                email address.
              </p>
            </div>
          </div>
        </div>


        <button
          type="button"
          onClick={() => {
            setSuccess(
              false,
            );

            setError(
              null,
            );
          }}
          className="js-secondary-button mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold"
        >
          <Send className="h-4 w-4" />

          Send another reset email
        </button>


        <Link
          href="/auth/login"
          className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-medium text-neutral-400 transition hover:bg-white/[0.04] hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />

          Back to login
        </Link>
      </div>
    );
  }


  return (
    <div
      className={cn(
        "flex flex-col",
        className,
      )}
      {...props}
    >
      {/* Header */}
      <div className="mb-8">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/[0.08] px-3 py-1.5 text-xs font-medium text-violet-300">
          <ShieldCheck className="h-3.5 w-3.5" />

          Account recovery
        </div>


        <h1 className="text-3xl font-bold tracking-[-0.03em] text-white">
          Reset your password
        </h1>


        <p className="mt-2 text-sm leading-6 text-neutral-400">
          Enter your JobShield account email
          and we&apos;ll send you a secure link
          to choose a new password.
        </p>
      </div>


      <form
        onSubmit={
          handleForgotPassword
        }
        className="space-y-5"
      >
        <div className="space-y-2">
          <Label
            htmlFor="email"
            className="text-sm font-medium text-neutral-300"
          >
            Email address
          </Label>


          <div className="group relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-600 transition group-focus-within:text-violet-300" />


            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              disabled={
                isLoading
              }
              value={
                email
              }
              onChange={(
                event,
              ) => {
                setEmail(
                  event
                    .target
                    .value,
                );


                if (error) {
                  setError(
                    null,
                  );
                }
              }}
              className="h-12 rounded-xl border-white/10 bg-black/30 pl-11 pr-4 text-white placeholder:text-neutral-600 hover:border-white/20 focus-visible:border-violet-400/50 focus-visible:ring-4 focus-visible:ring-violet-500/10"
            />
          </div>
        </div>


        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-400/20 bg-red-500/[0.08] px-4 py-3"
          >
            <p className="text-sm leading-5 text-red-300">
              {error}
            </p>
          </div>
        )}


        <Button
          type="submit"
          disabled={
            isLoading
          }
          className="js-primary-button group h-12 w-full rounded-xl text-sm font-semibold"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />

              Sending reset link...
            </>
          ) : (
            <>
              Send reset email

              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </>
          )}
        </Button>
      </form>


      <div className="my-7 h-px bg-white/[0.08]" />


      <Link
        href="/auth/login"
        className="js-secondary-button group flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold"
      >
        <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />

        Back to login
      </Link>


      <p className="mt-6 text-center text-xs leading-5 text-neutral-600">
        For security, JobShield does not
        reveal whether an email address is
        registered.
      </p>
    </div>
  );
}