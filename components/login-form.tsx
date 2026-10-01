"use client";

import {
  useState,
  type ComponentPropsWithoutRef,
  type FormEvent,
} from "react";

import Link from "next/link";

import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
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


export function LoginForm({
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
    password,
    setPassword,
  ] =
    useState(
      "",
    );


  const [
    showPassword,
    setShowPassword,
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


  const [
    isLoading,
    setIsLoading,
  ] =
    useState(
      false,
    );


  async function handleLogin(
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
          loginError,
      } =
        await supabase
          .auth
          .signInWithPassword({
            email:
              email.trim(),

            password,
          });


      if (loginError) {
        throw loginError;
      }


      /* Full navigation gives the authenticated dashboard a fresh server/client state. */
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
          : "Could not sign in. Please try again.",
      );


      setIsLoading(
        false,
      );
    }
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

          Secure workspace
        </div>


        <h1 className="text-3xl font-bold tracking-[-0.03em] text-white">
          Welcome back
        </h1>


        <p className="mt-2 text-sm leading-6 text-neutral-400">
          Sign in to continue to your
          JobShield dashboard and
          investigations.
        </p>
      </div>


      <form
        onSubmit={
          handleLogin
        }
        className="space-y-5"
      >
        {/* Email */}
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
              className="h-12 rounded-xl border-white/10 bg-black/30 pl-11 pr-4 text-white outline-none transition placeholder:text-neutral-600 hover:border-white/20 focus-visible:border-violet-400/50 focus-visible:ring-4 focus-visible:ring-violet-500/10"
            />
          </div>
        </div>


        {/* Password */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <Label
              htmlFor="password"
              className="text-sm font-medium text-neutral-300"
            >
              Password
            </Label>


            <Link
              href="/auth/forgot-password"
              className="text-xs font-medium text-violet-300 transition hover:text-violet-200"
            >
              Forgot password?
            </Link>
          </div>


          <div className="group relative">
            <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-600 transition group-focus-within:text-violet-300" />


            <Input
              id="password"
              name="password"
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              autoComplete="current-password"
              required
              disabled={
                isLoading
              }
              value={
                password
              }
              onChange={(
                event,
              ) => {
                setPassword(
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
              className="h-12 rounded-xl border-white/10 bg-black/30 pl-11 pr-12 text-white outline-none transition placeholder:text-neutral-600 hover:border-white/20 focus-visible:border-violet-400/50 focus-visible:ring-4 focus-visible:ring-violet-500/10"
            />


            <button
              type="button"
              disabled={
                isLoading
              }
              onClick={() =>
                setShowPassword(
                  (
                    current,
                  ) =>
                    !current,
                )
              }
              aria-label={
                showPassword
                  ? "Hide password"
                  : "Show password"
              }
              className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-neutral-500 transition hover:bg-white/[0.06] hover:text-neutral-200 disabled:pointer-events-none"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>


        {/* Error */}
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


        {/* Login */}
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

              Signing in...
            </>
          ) : (
            <>
              Sign in to JobShield

              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </>
          )}
        </Button>
      </form>


      {/* Divider */}
      <div className="my-7 flex items-center gap-4">
        <div className="h-px flex-1 bg-white/[0.08]" />

        <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-600">
          New to JobShield?
        </span>

        <div className="h-px flex-1 bg-white/[0.08]" />
      </div>


      {/* Signup */}
      <Link
        href="/auth/sign-up"
        className="js-secondary-button group flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold"
      >
        Create an account

        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
      </Link>


      <p className="mt-6 text-center text-xs leading-5 text-neutral-600">
        By continuing, you&apos;re accessing
        your private JobShield workspace.
        Never enter banking passwords or
        other account credentials into an
        analysis.
      </p>
    </div>
  );
}