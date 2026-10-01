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
      await request.json();


    const updates:
      Record<
        string,
        unknown
      > = {
        updated_at:
          new Date()
            .toISOString(),
      };


    if (
      body.status !==
      undefined
    ) {
      if (
        body.status !==
          "open" &&
        body.status !==
          "closed"
      ) {
        return NextResponse.json(
          {
            error:
              "Invalid case status.",
          },

          {
            status: 400,
          },
        );
      }


      updates.status =
        body.status;
    }


    if (
      body.title !==
      undefined
    ) {
      const title =
        String(
          body.title,
        ).trim();


      if (
        title.length < 1 ||
        title.length >
          120
      ) {
        return NextResponse.json(
          {
            error:
              "Invalid case title.",
          },

          {
            status: 400,
          },
        );
      }


      updates.title =
        title;
    }


    if (
      body.description !==
      undefined
    ) {
      const description =
        String(
          body.description ??
          "",
        ).trim();


      if (
        description.length >
        2000
      ) {
        return NextResponse.json(
          {
            error:
              "Description is too long.",
          },

          {
            status: 400,
          },
        );
      }


      updates.description =
        description ||
        null;
    }


    const {
      data:
        updatedCase,

      error,
    } =
      await supabase
        .from(
          "cases",
        )
        .update(
          updates,
        )
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
            title,
            description,
            status
          `,
        )
        .maybeSingle();


    if (
      error ||
      !updatedCase
    ) {
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


    return NextResponse.json(
      updatedCase,
    );
  } catch (error) {
    console.error(
      "Case update failed:",
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
  "closed"
) {
  return NextResponse.json(
    {
      error:
        "Close the case before deleting it.",
    },
    {
      status: 409,
    },
  );
}

  const {
    error,
  } =
    await supabase
      .from(
        "cases",
      )
      .delete()
      .eq(
        "id",
        id,
      )
      .eq(
        "user_id",
        user.id,
      );


  if (error) {
    console.error(
      "Case deletion failed:",
      error,
    );


    return NextResponse.json(
      {
        error:
          "Could not delete case.",
      },

      {
        status: 500,
      },
    );
  }


  return NextResponse.json({
    deleted:
      true,
  });
}