"use client";

import {
  useState,
  type ComponentPropsWithoutRef,
  type FormEvent,
} from "react";

import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LockKeyhole,
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


export function UpdatePasswordForm({
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  const [
    password,
    setPassword,
  ] =
    useState(
      "",
    );


  const [
    confirmPassword,
    setConfirmPassword,
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
    showConfirmPassword,
    setShowConfirmPassword,
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


  const passwordsMatch =
    confirmPassword.length >
      0 &&
    password ===
      confirmPassword;


  async function handleUpdatePassword(
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


    if (
      password !==
      confirmPassword
    ) {
      setError(
        "Passwords do not match.",
      );

      return;
    }


    setIsLoading(
      true,
    );


    try {
      const supabase =
        createClient();


      const {
        error:
          updateError,
      } =
        await supabase
          .auth
          .updateUser({
            password,
          });


      if (updateError) {
        throw updateError;
      }

      /*
       * Recovery links establish an authenticated
       * Supabase session, so after updating the
       * password I can continue into JobShield.
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
          : "Could not update your password. Please try again.",
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
          <KeyRound className="h-3.5 w-3.5" />

          Secure password reset
        </div>


        <h1 className="text-3xl font-bold tracking-[-0.03em] text-white">
          Choose a new password
        </h1>


        <p className="mt-2 text-sm leading-6 text-neutral-400">
          Create a new password for your
          JobShield account.
        </p>
      </div>

      <form
        onSubmit={
          handleUpdatePassword
        }
        className="space-y-5"
      >
        {/* New password */}
        <div className="space-y-2">
          <Label
            htmlFor="password"
            className="text-sm font-medium text-neutral-300"
          >
            New password
          </Label>


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
              autoComplete="new-password"
              placeholder="Enter your new password"
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
              className="h-12 rounded-xl border-white/10 bg-black/30 pl-11 pr-12 text-white placeholder:text-neutral-600 hover:border-white/20 focus-visible:border-violet-400/50 focus-visible:ring-4 focus-visible:ring-violet-500/10"
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

        {/* Confirm */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label
              htmlFor="confirm-password"
              className="text-sm font-medium text-neutral-300"
            >
              Confirm new password
            </Label>


            {passwordsMatch && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-300">
                <Check className="h-3.5 w-3.5" />

                Match
              </span>
            )}
          </div>

          <div className="group relative">
            <ShieldCheck className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-600 transition group-focus-within:text-violet-300" />


            <Input
              id="confirm-password"
              name="confirm-password"
              type={
                showConfirmPassword
                  ? "text"
                  : "password"
              }
              autoComplete="new-password"
              placeholder="Enter it again"
              required
              disabled={
                isLoading
              }
              value={
                confirmPassword
              }
              onChange={(
                event,
              ) => {
                setConfirmPassword(
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
              className={cn(
                "h-12 rounded-xl border-white/10 bg-black/30 pl-11 pr-12 text-white placeholder:text-neutral-600 hover:border-white/20 focus-visible:ring-4",
                confirmPassword &&
                  password !==
                    confirmPassword
                  ? "border-red-400/30 focus-visible:border-red-400/50 focus-visible:ring-red-500/10"
                  : passwordsMatch
                    ? "border-emerald-400/30 focus-visible:border-emerald-400/50 focus-visible:ring-emerald-500/10"
                    : "focus-visible:border-violet-400/50 focus-visible:ring-violet-500/10",
              )}
            />

            <button
              type="button"
              disabled={
                isLoading
              }
              onClick={() =>
                setShowConfirmPassword(
                  (
                    current,
                  ) =>
                    !current,
                )
              }
              aria-label={
                showConfirmPassword
                  ? "Hide password"
                  : "Show password"
              }
              className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-neutral-500 transition hover:bg-white/[0.06] hover:text-neutral-200 disabled:pointer-events-none"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>


          {confirmPassword &&
            password !==
              confirmPassword && (
              <p className="text-xs text-red-300">
                Passwords do not match.
              </p>
            )}
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

              Saving new password...
            </>
          ) : (
            <>
              Save new password

              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </>
          )}
        </Button>
      </form>


      <div className="mt-6 rounded-2xl border border-white/[0.08] bg-black/20 p-4">
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-violet-300" />

          <p className="text-xs leading-5 text-neutral-500">
            After your password is updated,
            you&apos;ll continue directly to
            your private JobShield dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}