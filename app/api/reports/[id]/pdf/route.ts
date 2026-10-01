import {
  getPrivateReportData,
} from "@/lib/reports/private-report-data";

import {
  generateEvidencePdf,
} from "@/lib/reports/generate-evidence-pdf";

import {
  createClient,
} from "@/lib/supabase/server";


type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};


export async function GET(
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


    // AUTHENTICATION
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
      return new Response(
        "Authentication required.",
        {
          status: 401,
        },
      );
    }


    // AUTHORIZATION + REPORT DATA
    const report =
      await getPrivateReportData({
        supabase,

        userId:
          user.id,

        analysisId:
          id,
      });


    if (!report) {
      return new Response(
        "Report not found.",
        {
          status: 404,
        },
      );
    }

    // GENERATE PDF
    const pdfBytes =
      await generateEvidencePdf(
        report,
      );


    /*
     * Create a clean filename.
     *
     * Don't use recruiter/company input in the filename because that data is untrusted. */
    const filename =
      `jobshield-report-${id.slice(
        0,
        8,
      )}.pdf`;


    /* Convert the returned Uint8Array to an exact ArrayBuffer for the Web Response API. */
    const pdfBody =
      pdfBytes.buffer.slice(
        pdfBytes.byteOffset,
        pdfBytes.byteOffset +
          pdfBytes.byteLength,
      ) as ArrayBuffer;


    return new Response(
      pdfBody,
      {
        status:
          200,

        headers: {
          "Content-Type":
            "application/pdf",

          "Content-Disposition":
            `attachment; filename="${filename}"`,

          "Content-Length":
            String(
              pdfBytes.byteLength,
            ),

          /*
           * This is a private authenticated
           * evidence report.
           */
          "Cache-Control":
            "private, no-store, max-age=0",

          "X-Content-Type-Options":
            "nosniff",
        },
      },
    );
  } catch (error) {
    console.error(
      "PDF generation failed:",
      error,
    );


    return new Response(
      "Could not generate PDF.",
      {
        status:
          500,
      },
    );
  }
}