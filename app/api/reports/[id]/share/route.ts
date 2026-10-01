import {
  NextResponse,
} from "next/server";

import {
  generateShareToken,
} from "@/lib/reports/share-token";

import {
  createClient,
} from "@/lib/supabase/server";


const ALLOWED_EXPIRATIONS =
  new Set([
    1,
    7,
    30,
  ]);


type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};


async function verifyAnalysisOwner(
  analysisId: string,
  userId: string,
  supabase:
    Awaited<
      ReturnType<
        typeof createClient
      >
    >,
) {
  const {
    data,
    error,
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
        userId,
      )
      .maybeSingle();


  if (
    error ||
    !data
  ) {
    return false;
  }


  return true;
}


export async function POST(
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


    const ownsAnalysis =
      await verifyAnalysisOwner(
        id,
        user.id,
        supabase,
      );


    if (!ownsAnalysis) {
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


    const body =
      await request
        .json()
        .catch(
          () => ({}),
        );


    const requestedDays =
      Number(
        body.expiresInDays,
      );


    const expiresInDays =
      ALLOWED_EXPIRATIONS.has(
        requestedDays,
      )
        ? requestedDays
        : 7;


    const {
      token,
      tokenHash,
      tokenPrefix,
    } =
      generateShareToken();


    const expiresAt =
      new Date(
        Date.now() +
        expiresInDays *
          24 *
          60 *
          60 *
          1000,
      ).toISOString();


    /*
     * There can be only one current sharing
     * record per analysis.
     *
     * Creating another link rotates the token,
     * immediately invalidating the old link.
     */
    const {
      error:
        shareError,
    } =
      await supabase
        .from(
          "shared_reports",
        )
        .upsert(
          {
            analysis_id:
              id,

            token_hash:
              tokenHash,

            token_prefix:
              tokenPrefix,

            expires_at:
              expiresAt,

            revoked_at:
              null,

            updated_at:
              new Date()
                .toISOString(),
          },

          {
            onConflict:
              "analysis_id",
          },
        );


    if (shareError) {
      console.error(
        "Share creation failed:",
        shareError,
      );

      return NextResponse.json(
        {
          error:
            "Could not create share link.",
        },

        {
          status: 500,
        },
      );
    }


    return NextResponse.json({
      sharePath:
        `/share/${token}`,

      expiresAt,
    });
  } catch (error) {
    console.error(
      "Unexpected share creation error:",
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


export async function DELETE(
  _request: Request,
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


    const ownsAnalysis =
      await verifyAnalysisOwner(
        id,
        user.id,
        supabase,
      );


    if (!ownsAnalysis) {
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


    const now =
      new Date()
        .toISOString();


    const {
      error,
    } =
      await supabase
        .from(
          "shared_reports",
        )
        .update({
          revoked_at:
            now,

          updated_at:
            now,
        })
        .eq(
          "analysis_id",
          id,
        );


    if (error) {
      console.error(
        "Share revocation failed:",
        error,
      );

      return NextResponse.json(
        {
          error:
            "Could not revoke share link.",
        },

        {
          status: 500,
        },
      );
    }


    return NextResponse.json({
      revoked: true,
    });
  } catch (error) {
    console.error(
      "Unexpected share revocation error:",
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