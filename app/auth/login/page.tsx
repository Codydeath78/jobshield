export const instant =
  false;

import {
  redirect,
} from "next/navigation";

import {
  LoginForm,
} from "@/components/login-form";

import {
  createClient,
} from "@/lib/supabase/server";


export default async function LoginPage() {
  const supabase =
    await createClient();


  const {
    data:
      claimsData,

    error:
      claimsError,
  } =
    await supabase
      .auth
      .getClaims();


  const userId =
    claimsData
      ?.claims
      ?.sub;


  if (
    !claimsError &&
    userId
  ) {
    redirect(
      "/dashboard",
    );
  }


  return (
    <div className="w-full">
      <LoginForm />
    </div>
  );
}