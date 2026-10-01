import {
  NextResponse,
} from "next/server";

import {
  generateExtensionToken,
} from "@/lib/extension/token";

import {
  createClient,
} from "@/lib/supabase/server";


const MAX_ACTIVE_TOKENS =
  5;


export async function POST(
  request: Request,
) {
  try {
    const supabase =
      await createClient();


    const {
      data: {
        user,
      },

      error:
        authError,
    } =
      await supabase
        .auth
        .getUser();


    if (
      authError ||
      !user
    ) {
      return NextResponse.json(
        {
          error:
            "Authentication required.",
        },
        {
          status: 401,
        },
      );
    }


    const body =
      (
        await request
          .json()
          .catch(
            () => ({}),
          )
      ) as {
        label?: unknown;
      };


    const label =
      typeof body.label ===
        "string"
        ? body.label
            .trim()
            .slice(
              0,
              80,
            )
        : "Chrome Extension";


    const {
      count,
    } =
      await supabase
        .from(
          "extension_tokens",
        )
        .select(
          "id",
          {
            count:
              "exact",

            head:
              true,
          },
        )
        .eq(
          "user_id",
          user.id,
        )
        .is(
          "revoked_at",
          null,
        );


    if (
      (
        count ??
        0
      ) >=
      MAX_ACTIVE_TOKENS
    ) {
      return NextResponse.json(
        {
          error:
            `You can have up to ${MAX_ACTIVE_TOKENS} active extension connections.`,
        },
        {
          status: 409,
        },
      );
    }


    const {
      token,
      tokenHash,
      tokenPrefix,
    } =
      generateExtensionToken();


    const {
      data:
        record,

      error:
        insertError,
    } =
      await supabase
        .from(
          "extension_tokens",
        )
        .insert({
          user_id:
            user.id,

          label:
            label ||
            "Chrome Extension",

          token_hash:
            tokenHash,

          token_prefix:
            tokenPrefix,
        })
        .select(
          `
            id,
            label,
            token_prefix,
            created_at
          `,
        )
        .single();


    if (
      insertError ||
      !record
    ) {
      console.error(
        "Extension token creation failed:",
        insertError,
      );


      return NextResponse.json(
        {
          error:
            "Could not create extension connection.",
        },
        {
          status: 500,
        },
      );
    }


    /* This is the ONLY time the raw token is returned. */
    return NextResponse.json({
      ...record,

      token,
    });
  } catch (error) {
    console.error(
      "Extension token API failed:",
      error,
    );


    return NextResponse.json(
      {
        error:
          "Unexpected server error.",
      },
      {
        status: 500,
      },
    );
  }
}