"use client";

import {
  useState,
} from "react";

import {
  LogOut,
  Loader2,
} from "lucide-react";

import {
  createClient,
} from "@/lib/supabase/client";


export function LogoutButton() {
  const [
    loading,
    setLoading,
  ] =
    useState(
      false,
    );


  async function handleLogout() {
    if (loading) {
      return;
    }


    setLoading(
      true,
    );


    try {
      const supabase =
        createClient();


      await supabase
        .auth
        .signOut();

      /*
       * Uses a full document navigation after
       * logout instead of router.replace().
       *
       * This clears any cached dashboard
       * client-component state including this
       * button's loading state.
       */


      window.location.replace(
  "/auth/login",
);

    } catch (
      error
    ) {
      console.error(
        "Logout failed:",
        error,
      );


      setLoading(
        false,
      );
    }
  }


  return (
    <button
      type="button"
      onClick={
        handleLogout
      }
      disabled={
        loading
      }
      className="js-secondary-button group inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
      )}

      {loading
        ? "Signing out..."
        : "Logout"}
    </button>
  );
}