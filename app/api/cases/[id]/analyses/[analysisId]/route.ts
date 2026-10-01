import {
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@/lib/supabase/server";


type RouteContext = {
  params: Promise<{
    id: string;
    analysisId: string;
  }>;
};


export async function DELETE(
  _request: Request,
  {
    params,
  }: RouteContext,
) {
  const {
    id,
    analysisId,
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


  const {
    data:
      caseRecord,
  } =
    await supabase
      .from(
        "cases",
      )
      .select(
        "id",
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


  const {
    error,
  } =
    await supabase
      .from(
        "case_analyses",
      )
      .delete()
      .eq(
        "case_id",
        id,
      )
      .eq(
        "analysis_id",
        analysisId,
      );


  if (error) {
    return NextResponse.json(
      {
        error:
          "Could not remove analysis.",
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
      id,
    );


  return NextResponse.json({
    removed:
      true,
  });
}