import {
  NextResponse,
} from "next/server";

import {
  analyzeSubmission,
} from "@/lib/analysis/analyze-submission";

import {
  extractJobOfferDocument,
} from "@/lib/analysis/document-extractor";

import {
  createClient,
} from "@/lib/supabase/server";


const MAX_DOCUMENT_SIZE =
  8 * 1024 * 1024;


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
            "You must be signed in to analyze a job offer.",
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
        "document",
      );


    if (
      !(file instanceof File)
    ) {
      return NextResponse.json(
        {
          error:
            "Job offer document is required.",
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
            "The uploaded document is empty.",
        },

        {
          status: 400,
        },
      );
    }


    if (
      file.size >
      MAX_DOCUMENT_SIZE
    ) {
      return NextResponse.json(
        {
          error:
            "Job offer documents cannot exceed 8 MB.",
        },

        {
          status: 413,
        },
      );
    }


    let extraction;


    try {
      extraction =
        await extractJobOfferDocument(
          file,
        );
    } catch (error) {
      console.error(
        "Job offer extraction failed:",
        error,
      );


      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "JobShield could not read this document.",
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
          "job_offer",

        input:
          extraction.text,

        inputMetadata: {
          document: {
            kind:
              extraction.kind,

            mimeType:
              extraction.mimeType,

            sizeBytes:
              extraction.sizeBytes,

            pageCount:
              extraction.pageCount,

            parser:
              extraction.parser,

            truncated:
              extraction.truncated,

            warnings:
              extraction.warnings,

            rawFileStored:
              false,
          },
        },
      });


    return NextResponse.json({
      ...result,

      documentExtraction: {
        kind:
          extraction.kind,

        pageCount:
          extraction.pageCount,

        truncated:
          extraction.truncated,

        warnings:
          extraction.warnings,
      },
    });
  } catch (error) {
    console.error(
      "Unexpected document analysis error:",
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