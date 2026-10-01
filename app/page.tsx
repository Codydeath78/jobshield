export const instant =
  false;

import {
  redirect,
} from "next/navigation";

import {
  createClient,
} from "@/lib/supabase/server";


export default async function HomePage() {
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


  /* Signed-in users should never see the authentication screen again. */
  if (
    !claimsError &&
    userId
  ) {
    redirect(
      "/dashboard",
    );
  }


  /* Everyone else starts at login. */
  redirect(
    "/auth/login",
  );
}
