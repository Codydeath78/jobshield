import {
  NextResponse,
} from "next/server";

import {
  buildCommunityReportCandidates,
} from "@/lib/community/report-candidates";

import type {
  ExtractedEntities,
} from "@/lib/analysis/types";

import {
  createClient,
} from "@/lib/supabase/server";


const MAX_INDICATORS =
  5;


const REPORT_REASONS =
  new Set([
    "fake_recruiter",
    "phishing",
    "check_scam",
    "advance_fee",
    "impersonation",
    "malware",
    "other",
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
            "Authentication required.",
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
    analysisId?:
      unknown;

    reason?:
      unknown;

    selectedKeys?:
      unknown;
  };


    const analysisId =
      typeof body.analysisId ===
        "string"
        ? body.analysisId
        : "";


    const reason =
      typeof body.reason ===
        "string"
        ? body.reason
        : "";

    const rawSelectedKeys:
  unknown[] =
    Array.isArray(
      body.selectedKeys,
    )
      ? body.selectedKeys
      : [];


    const selectedKeys:
      string[] = [
        ...new Set(
          rawSelectedKeys.filter(
          (
            value,
          ): value is string =>
            typeof value ===
              "string",
          ),
        ),
      ];


    if (!analysisId) {
      return NextResponse.json(
        {
          error:
            "Analysis ID is required.",
        },
        {
          status: 400,
        },
      );
    }


    if (
      !REPORT_REASONS.has(
        reason,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Select a valid report reason.",
        },
        {
          status: 400,
        },
      );
    }


    if (
      selectedKeys.length <
        1 ||
      selectedKeys.length >
        MAX_INDICATORS
    ) {
      return NextResponse.json(
        {
          error:
            `Select between 1 and ${MAX_INDICATORS} suspicious indicators.`,
        },
        {
          status: 400,
        },
      );
    }

    // LOAD OWNED ANALYSIS
    const {
      data:
        analysis,
    } =
      await supabase
        .from(
          "analyses",
        )
        .select(
          `
            id,
            status,
            extracted_entities
          `,
        )
        .eq(
          "id",
          analysisId,
        )
        .eq(
          "user_id",
          user.id,
        )
        .maybeSingle();


    if (!analysis) {
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


    if (
      analysis.status !==
      "completed"
    ) {
      return NextResponse.json(
        {
          error:
            "Only completed analyses can be reported.",
        },
        {
          status: 409,
        },
      );
    }


    const entities =
      analysis
        .extracted_entities as
        ExtractedEntities;


    const candidates =
      buildCommunityReportCandidates(
        entities,
      );


    const candidateByKey =
      new Map(
        candidates.map(
          (candidate) => [
            candidate.key,
            candidate,
          ],
        ),
      );


    const selected =
      selectedKeys.map(
        (key) =>
          candidateByKey.get(
            key,
          ),
      );


    if (
      selected.some(
        (candidate) =>
          !candidate,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "One or more selected indicators are not part of this analysis.",
        },
        {
          status: 400,
        },
      );
    }

    // CREATE / REACTIVATE REPORT
    const now =
      new Date()
        .toISOString();


    const {
      data:
        report,

      error:
        reportError,
    } =
      await supabase
        .from(
          "scam_reports",
        )
        .upsert(
          {
            user_id:
              user.id,

            analysis_id:
              analysisId,

            reason,

            status:
              "active",

            withdrawn_at:
              null,

            updated_at:
              now,
          },
          {
            onConflict:
              "user_id,analysis_id",
          },
        )
        .select(
          "id",
        )
        .single();


    if (
      reportError ||
      !report
    ) {
      console.error(
        "Community report creation failed:",
        reportError,
      );


      return NextResponse.json(
        {
          error:
            "Could not create community report.",
        },
        {
          status: 500,
        },
      );
    }

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
      throw deleteError;
    }


    const indicatorRows =
      selected.map(
        (
          candidate,
        ) => ({
          report_id:
            report.id,

          user_id:
            user.id,

          analysis_id:
            analysisId,

          indicator_key:
            candidate!.key,

          indicator_type:
            candidate!.type,

          domain_value:
            candidate!
              .domainValue,

          url_hash:
            candidate!
              .urlHash,

          hostname:
            candidate!
              .hostname,
        }),
      );


    const {
      error:
        indicatorError,
    } =
      await supabase
        .from(
          "community_indicator_reports",
        )
        .insert(
          indicatorRows,
        );


    if (
      indicatorError
    ) {
      console.error(
        "Community indicator insert failed:",
        indicatorError,
      );


      return NextResponse.json(
        {
          error:
            "Could not save reported indicators.",
        },
        {
          status: 500,
        },
      );
    }


    return NextResponse.json({
      reported:
        true,

      reportId:
        report.id,

      indicatorCount:
        indicatorRows.length,
    });
  } catch (error) {
    console.error(
      "Unexpected community report error:",
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