import {
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@/lib/supabase/server";

//test


type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};


export async function PATCH(
  request: Request,
  {
    params,
  }: RouteContext,
) {
  try {
    const {
      id,
    } =
      await params;


    const supabase =
      await createClient();


    const {
      data: {
        user,
      },
    } =
      await supabase
        .auth
        .getUser();


    if (!user) {
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
        await request.json()
      ) as {
        title?: unknown;
      };


    const title =
      typeof body.title ===
        "string"
        ? body.title.trim()
        : "";


    if (
      title.length < 1 ||
      title.length > 120
    ) {
      return NextResponse.json(
        {
          error:
            "Title must be between 1 and 120 characters.",
        },
        {
          status: 400,
        },
      );
    }


    const {
      data:
        analysis,

      error,
    } =
      await supabase
        .from(
          "analyses",
        )
        .update({
          title,
        })
        .eq(
          "id",
          id,
        )
        .eq(
          "user_id",
          user.id,
        )
        .select(
          `
            id,
            title
          `,
        )
        .maybeSingle();


    if (
      error ||
      !analysis
    ) {
      return NextResponse.json(
        {
          error:
            "Analysis not found.",
        },
        {
          status: 404,
        },
      );
    }


    return NextResponse.json({
      title:
        analysis.title,
    });
  } catch (error) {
    console.error(
      "Analysis title update failed:",
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