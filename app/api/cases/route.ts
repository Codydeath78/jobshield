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
      await request.json();


    const title =
      typeof body.title ===
        "string"
        ? body.title.trim()
        : "";


    const description =
      typeof body.description ===
        "string"
        ? body.description.trim()
        : "";


    if (
      title.length < 1 ||
      title.length > 120
    ) {
      return NextResponse.json(
        {
          error:
            "Case title must be between 1 and 120 characters.",
        },

        {
          status: 400,
        },
      );
    }


    if (
      description.length >
      2000
    ) {
      return NextResponse.json(
        {
          error:
            "Case description cannot exceed 2,000 characters.",
        },

        {
          status: 400,
        },
      );
    }


    const {
      data:
        createdCase,

      error:
        insertError,
    } =
      await supabase
        .from(
          "cases",
        )
        .insert({
          user_id:
            user.id,

          title,

          description:
            description ||
            null,

          status:
            "open",
        })
        .select(
          `
            id,
            title,
            status
          `,
        )
        .single();


    if (
      insertError ||
      !createdCase
    ) {
      console.error(
        "Case creation failed:",
        insertError,
      );


      return NextResponse.json(
        {
          error:
            "Could not create case.",
        },

        {
          status: 500,
        },
      );
    }


    return NextResponse.json(
      createdCase,
      {
        status:
          201,
      },
    );
  } catch (error) {
    console.error(
      "Unexpected case creation error:",
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