import {
  NextResponse,
} from "next/server";

import {
  analyzeSubmission,
} from "@/lib/analysis/analyze-submission";

import {
  extractScreenshotText,
} from "@/lib/analysis/screenshot-extractor";

import {
  createClient,
} from "@/lib/supabase/server";


const MAX_IMAGE_SIZE =
  8 * 1024 * 1024;


const ALLOWED_IMAGE_TYPES =
  new Set([
    "image/png",
    "image/jpeg",
    "image/webp",
  ]);


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
            "You must be signed in to analyze a screenshot.",
        },

        {
          status: 401,
        },
      );
    }


    const formData =
      await request.formData();


    const file =
      formData.get(
        "screenshot",
      );


    if (
      !(file instanceof File)
    ) {
      return NextResponse.json(
        {
          error:
            "Screenshot file is required.",
        },

        {
          status: 400,
        },
      );
    }


    if (
      !ALLOWED_IMAGE_TYPES.has(
        file.type,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Only PNG, JPEG, and WebP screenshots are supported.",
        },

        {
          status: 400,
        },
      );
    }


    if (
      file.size === 0
    ) {
      return NextResponse.json(
        {
          error:
            "The uploaded screenshot is empty.",
        },

        {
          status: 400,
        },
      );
    }


    if (
      file.size >
      MAX_IMAGE_SIZE
    ) {
      return NextResponse.json(
        {
          error:
            "Screenshot cannot exceed 8 MB.",
        },

        {
          status: 413,
        },
      );
    }


    let extraction;


    try {
      extraction =
        await extractScreenshotText(
          file,
        );
    } catch (error) {
      console.error(
        "Screenshot extraction failed:",
        error,
      );


      return NextResponse.json(
        {
          error:
            "JobShield could not read this screenshot.",
        },

        {
          status: 502,
        },
      );
    }


    if (
      extraction
        .extractedText
        .length < 10
    ) {
      return NextResponse.json(
        {
          error:
            "JobShield could not find enough readable text in this screenshot.",
        },

        {
          status: 422,
        },
      );
    }


    const result =
      await analyzeSubmission({
        supabase,

        userId:
          user.id,

        analysisType:
          "screenshot",

        input:
          extraction.extractedText,

        inputMetadata: {
          screenshot: {
            mimeType:
              file.type,

            sizeBytes:
              file.size,

            extractionConfidence:
              extraction.confidence,

            warnings:
              extraction.warnings,

            rawImageStored:
              false,
          },
        },
      });


    return NextResponse.json({
      ...result,

      screenshotExtraction: {
        extractedText:
          extraction.extractedText,

        confidence:
          extraction.confidence,

        warnings:
          extraction.warnings,
      },
    });
  } catch (error) {
    console.error(
      "Unexpected screenshot analysis error:",
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