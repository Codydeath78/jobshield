import {
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@/lib/supabase/server";


export async function GET(
  request: Request,
) {
  const requestUrl =
    new URL(
      request.url,
    );


  const tokenHash =
    requestUrl
      .searchParams
      .get(
        "token_hash",
      )
      ?.trim();


  if (!tokenHash) {
    return NextResponse.redirect(
      new URL(
        "/auth/forgot-password?error=invalid_recovery_link",
        requestUrl.origin,
      ),
    );
  }


  const supabase =
    await createClient();


  const {
    data,
    error,
  } =
    await supabase
      .auth
      .verifyOtp({
        token_hash:
          tokenHash,

        type:
          "recovery",
      });


  if (
    error ||
    !data.user ||
    !data.session
  ) {
    console.error(
      "Password recovery verification failed:",
      error,
    );


    return NextResponse.redirect(
      new URL(
        "/auth/forgot-password?error=invalid_or_expired_recovery_link",
        requestUrl.origin,
      ),
    );
  }


  /*
   * verifyOtp() has now created the temporary
   * authenticated recovery session and the
   * Supabase SSR client stores that session
   * in cookies.
   *
   * updateUser() on the next page can now
   * change the password.
   */
  return NextResponse.redirect(
    new URL(
      "/auth/update-password",
      requestUrl.origin,
    ),
  );
}