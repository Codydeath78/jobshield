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
  authenticateExtension,
} from "@/lib/extension/authenticate";


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

    const auth =
  await authenticateExtension(
    request,
  );


 if (!auth) {
  return NextResponse.json(
    {
      error:
        "Invalid or revoked extension token.",
    },
    {
      status: 401,
    },
  );
 }


const {
  supabase,
  userId,
} =
  auth;




    const formData =
      await request.formData();

    
    const sourceHostValue =
  formData.get(
    "sourceHost",
  );


const sourceHost =
  typeof sourceHostValue ===
    "string" &&
  sourceHostValue.trim()
    ? sourceHostValue
        .trim()
        .slice(
          0,
          253,
        )
    : null;


const captureWidthValue =
  formData.get(
    "captureWidth",
  );


const captureHeightValue =
  formData.get(
    "captureHeight",
  );


const captureWidth =
  typeof captureWidthValue ===
    "string"
    ? Number.parseInt(
        captureWidthValue,
        10,
      )
    : null;


const captureHeight =
  typeof captureHeightValue ===
    "string"
    ? Number.parseInt(
        captureHeightValue,
        10,
      )
    : null;


const safeCaptureWidth =
  Number.isInteger(
    captureWidth,
  ) &&
  captureWidth! > 0 &&
  captureWidth! <= 20_000
    ? captureWidth
    : null;


const safeCaptureHeight =
  Number.isInteger(
    captureHeight,
  ) &&
  captureHeight! > 0 &&
  captureHeight! <= 20_000
    ? captureHeight
    : null;

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
          userId,

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

    source:
      "browser_extension",

    captureType:
      "selected_region",

    sourceHost,

    pixelWidth:
      safeCaptureWidth,

    pixelHeight:
      safeCaptureHeight,

    privacy: {
      fullViewportUploaded:
        false,

      croppedRegionUploaded:
        true,

      rawImageRetained:
        false,
    },
  },
},
      });

      const topFindings =
  result.findings
    .filter(
      (
        finding,
      ) =>
        finding.severity !==
        "info",
    )
    .slice(
      0,
      5,
    )
    .map(
      (
        finding,
      ) => ({
        title:
          finding.title,

        severity:
          finding.severity,

        source:
          finding.source,

        explanation:
          finding.explanation,
      }),
    );


return NextResponse.json({
  analysisId:
    result.analysisId,

  riskScore:
    result.riskScore,

  riskLevel:
    result.riskLevel,

  summary:
    result.summary,

  topFindings,

  reportPath:
    `/dashboard/analysis/${result.analysisId}`,

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