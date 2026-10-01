import {
  NextResponse,
} from "next/server";

import {
  analyzeSubmission,
} from "@/lib/analysis/analyze-submission";

import {
  authenticateExtension,
} from "@/lib/extension/authenticate";


const MAX_INPUT_LENGTH =
  50_000;


export async function POST(
  request: Request,
) {
  try {
    const extensionAuth =
      await authenticateExtension(
        request,
      );


    if (!extensionAuth) {
      return NextResponse.json(
        {
          error:
            "Invalid or revoked extension connection.",
        },
        {
          status: 401,
        },
      );
    }


    const body =
      (
        await request.json()
      ) as {
        input?: unknown;
        sourceHost?: unknown;
      };


    const input =
      typeof body.input ===
        "string"
        ? body.input.trim()
        : "";


    if (
      input.length < 10
    ) {
      return NextResponse.json(
        {
          error:
            "Select at least 10 characters to analyze.",
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
            "Selected text exceeds 50,000 characters.",
        },
        {
          status: 400,
        },
      );
    }


    const sourceHost =
      typeof body.sourceHost ===
        "string"
        ? body.sourceHost
            .trim()
            .slice(
              0,
              253,
            )
        : null;


    const result =
      await analyzeSubmission({
        supabase:
          extensionAuth.supabase,

        userId:
          extensionAuth.userId,

        analysisType:
          "browser_selection",

        input,

        inputMetadata: {
          extension: {
            sourceHost,

            selectionLength:
              input.length,

            /* We intentionally do not collect the full page URL. */
            fullPageUrlStored:
              false,

            fullPageContentStored:
              false,
          },
        },
      });


    const topFindings =
      [...result.findings]
        .sort(
          (a, b) =>
            b.scoreContribution -
            a.scoreContribution,
        )
        .slice(
          0,
          5,
        )
        .map(
          (finding) => ({
            title:
              finding.title,

            severity:
              finding.severity,

            source:
              finding.source,

            explanation:
              finding.explanation,

            scoreContribution:
              finding.scoreContribution,
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
    });
  } catch (error) {
    console.error(
      "Extension analysis failed:",
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