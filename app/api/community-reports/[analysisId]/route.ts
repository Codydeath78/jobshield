import {
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@/lib/supabase/server";


type RouteContext = {
  params: Promise<{
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
      report,
  } =
    await supabase
      .from(
        "scam_reports",
      )
      .select(
        "id",
      )
      .eq(
        "analysis_id",
        analysisId,
      )
      .eq(
        "user_id",
        user.id,
      )
      .maybeSingle();


  if (!report) {
    return NextResponse.json(
      {
        error:
          "Report not found.",
      },
      {
        status: 404,
      },
    );
  }


  /* Remove this report's community contributions. */
  const {
    error:
      deleteError,
  } =
    await supabase
      .from(
        "community_indicator_reports",
      )
      .delete()
      .eq(
        "report_id",
        report.id,
      );


  if (deleteError) {
    return NextResponse.json(
      {
        error:
          "Could not withdraw community indicators.",
      },
      {
        status: 500,
      },
    );
  }


  const now =
    new Date()
      .toISOString();


  const {
    error:
      updateError,
  } =
    await supabase
      .from(
        "scam_reports",
      )
      .update({
        status:
          "withdrawn",

        withdrawn_at:
          now,

        updated_at:
          now,
      })
      .eq(
        "id",
        report.id,
      );


  if (
    updateError
  ) {
    return NextResponse.json(
      {
        error:
          "Could not withdraw report.",
      },
      {
        status: 500,
      },
    );
  }


  return NextResponse.json({
    withdrawn:
      true,
  });
}