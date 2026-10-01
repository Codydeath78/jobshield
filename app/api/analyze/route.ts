import {
  NextResponse,
} from "next/server";

import {
  analyzeSubmission,
} from "@/lib/analysis/analyze-submission";

import type {
  AnalysisType,
} from "@/lib/analysis/types";

import {
  createClient,
} from "@/lib/supabase/server";


const VALID_ANALYSIS_TYPES =
  new Set<AnalysisType>([
    "text",
    "email",
    "job_posting",
  ]);


const MAX_INPUT_LENGTH =
  50_000;


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
            "You must be signed in to analyze content.",
        },

        {
          status: 401,
        },
      );
    }


    const body =
      await request.json();


    const analysisType =
      body.analysisType as
        | AnalysisType
        | undefined;


    const input =
      typeof body.input ===
        "string"
        ? body.input.trim()
        : "";


    if (
      !analysisType ||
      !VALID_ANALYSIS_TYPES.has(
        analysisType,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid analysis type.",
        },

        {
          status: 400,
        },
      );
    }


    if (
      input.length < 10
    ) {
      return NextResponse.json(
        {
          error:
            "Please enter at least 10 characters to analyze.",
        },

        {
          status: 400,
        },
      );
    }


    if (
      input.length >
      MAX_INPUT_LENGTH
    ) {
      return NextResponse.json(
        {
          error:
            `Input cannot exceed ${MAX_INPUT_LENGTH.toLocaleString()} characters.`,
        },

        {
          status: 400,
        },
      );
    }


    const result =
      await analyzeSubmission({
        supabase,

        userId:
          user.id,

        analysisType,

        input,
      });


    return NextResponse.json(
      result,
    );
  } catch (error) {
    console.error(
      "Unexpected analysis error:",
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