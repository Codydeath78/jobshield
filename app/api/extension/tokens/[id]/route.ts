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


export async function DELETE(
  _request: Request,
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


  const now =
    new Date()
      .toISOString();


  const {
    error,
  } =
    await supabase
      .from(
        "extension_tokens",
      )
      .update({
        revoked_at:
          now,
      })
      .eq(
        "id",
        id,
      )
      .eq(
        "user_id",
        user.id,
      );


  if (error) {
    return NextResponse.json(
      {
        error:
          "Could not revoke extension connection.",
      },
      {
        status: 500,
      },
    );
  }


  return NextResponse.json({
    revoked:
      true,
  });
}