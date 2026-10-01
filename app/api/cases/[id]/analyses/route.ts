import {
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@/lib/supabase/server";


type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};


export async function POST(
  request: Request,
  {
    params,
  }: RouteContext,
) {
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
    await request.json();


  const analysisId =
    typeof body.analysisId ===
      "string"
      ? body.analysisId
      : "";


  if (!analysisId) {
    return NextResponse.json(
      {
        error:
          "Analysis ID is required.",
      },

      {
        status: 400,
      },
    );
  }


  // -----------------------------------------------------
  // VERIFY CASE OWNERSHIP + STATUS
  // -----------------------------------------------------

  const {
    data:
      caseRecord,
  } =
    await supabase
      .from(
        "cases",
      )
      .select(
        `
          id,
          status
        `,
      )
      .eq(
        "id",
        id,
      )
      .eq(
        "user_id",
        user.id,
      )
      .maybeSingle();


  if (!caseRecord) {
    return NextResponse.json(
      {
        error:
          "Case not found.",
      },

      {
        status: 404,
      },
    );
  }


  if (
    caseRecord.status !==
    "open"
  ) {
    return NextResponse.json(
      {
        error:
          "Reopen this case before adding evidence.",
      },

      {
        status: 409,
      },
    );
  }


  // -----------------------------------------------------
  // VERIFY ANALYSIS OWNERSHIP
  // -----------------------------------------------------

  const {
    data:
      analysis,
  } =
    await supabase
      .from(
        "analyses",
      )
      .select(
        "id",
      )
      .eq(
        "id",
        analysisId,
      )
      .eq(
        "user_id",
        user.id,
      )
      .maybeSingle();


  if (!analysis) {
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


  // -----------------------------------------------------
  // ATTACH
  // -----------------------------------------------------

  const {
    error,
  } =
    await supabase
      .from(
        "case_analyses",
      )
      .insert({
        case_id:
          id,

        analysis_id:
          analysisId,
      });


  if (error) {
    /*
     * PostgreSQL unique_violation.
     */
    if (
      error.code ===
      "23505"
    ) {
      return NextResponse.json({
        attached:
          true,

        alreadyAttached:
          true,
      });
    }


    console.error(
      "Case attachment failed:",
      error,
    );


    return NextResponse.json(
      {
        error:
          "Could not attach analysis.",
      },

      {
        status: 500,
      },
    );
  }


  await supabase
    .from(
      "cases",
    )
    .update({
      updated_at:
        new Date()
          .toISOString(),
    })
    .eq(
      "id",
      id
    );


  return NextResponse.json({
    attached:
      true,

    alreadyAttached:
      false,
  });
}