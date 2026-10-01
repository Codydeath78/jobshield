import {
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@/lib/supabase/server";


export async function POST(
  request: Request,
) {
  try {
    const body =
      await request.json();


    const tokenHash =
      typeof body?.tokenHash ===
        "string"
        ? body.tokenHash.trim()
        : "";


    if (
      !tokenHash ||
      tokenHash.length >
        2048
    ) {
      return NextResponse.json(
        {
          error:
            "This confirmation link is invalid.",
        },
        {
          status: 400,
        },
      );
    }


    const supabase =
      await createClient();


    /*
     * This is the moment the user's
     * email/account is actually verified.
     *
     * verifyOtp also establishes the
     * authenticated Supabase session.
     */
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
            "email",
        });


    if (
      error ||
      !data.user ||
      !data.session
    ) {
      console.error(
        "Signup confirmation failed:",
        error,
      );


      return NextResponse.json(
        {
          error:
            "This confirmation link is invalid, expired, or has already been used.",
        },
        {
          status: 400,
        },
      );
    }


    return NextResponse.json({
      ok:
        true,

      userId:
        data.user.id,
    });
  } catch (error) {
    console.error(
      "Unexpected signup confirmation error:",
      error,
    );


    return NextResponse.json(
      {
        error:
          "JobShield could not activate this account. Please try again.",
      },
      {
        status: 500,
      },
    );
  }
}