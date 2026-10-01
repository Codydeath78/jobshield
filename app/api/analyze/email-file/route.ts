import {
  NextResponse,
} from "next/server";

import {
  analyzeSubmission,
} from "@/lib/analysis/analyze-submission";

import {
  extractEmailFile,
} from "@/lib/analysis/email-file-extractor";

import {
  runEmailHeaderForensics,
} from "@/lib/analysis/email-header-forensics";

import {
  createClient,
} from "@/lib/supabase/server";


const MAX_EMAIL_SIZE =
  10 * 1024 * 1024;


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
            "You must be signed in to analyze an email file.",
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
        "emailFile",
      );


    if (
      !(file instanceof File)
    ) {
      return NextResponse.json(
        {
          error:
            "EML file is required.",
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
            "The uploaded email is empty.",
        },

        {
          status: 400,
        },
      );
    }


    if (
      file.size >
      MAX_EMAIL_SIZE
    ) {
      return NextResponse.json(
        {
          error:
            "Email files cannot exceed 10 MB.",
        },

        {
          status: 413,
        },
      );
    }


    if (
      !file.name
        .toLowerCase()
        .endsWith(
          ".eml",
        )
    ) {
      return NextResponse.json(
        {
          error:
            "JobShield currently supports .eml email files.",
        },

        {
          status: 400,
        },
      );
    }


    let extraction;


    try {
      extraction =
        await extractEmailFile(
          file,
        );
    } catch (error) {
      console.error(
        "EML extraction failed:",
        error,
      );


      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "JobShield could not parse this email file.",
        },

        {
          status: 422,
        },
      );
    }


    const headerFindings =
      runEmailHeaderForensics(
        extraction,
      );


    const result =
      await analyzeSubmission({
        supabase,

        userId:
          user.id,

        analysisType:
          "email_file",

        input:
          extraction.analysisText,

        inputFindings:
          headerFindings,

        inputMetadata: {
          emailFile: {
            subject:
              extraction.subject,

            from:
              extraction.from,

            replyTo:
              extraction.replyTo,

            returnPath:
              extraction.returnPath,

            messageId:
              extraction.messageId,

            messageIdDomain:
              extraction.messageIdDomain,

            date:
              extraction.date,

            receivedCount:
              extraction.receivedCount,

            dkimSignaturePresent:
              extraction.dkimSignaturePresent,

            authenticationResults:
              extraction.authenticationResults,

            attachments:
              extraction.attachments.map(
                (attachment) => ({
                  filename:
                    attachment.filename,

                  mimeType:
                    attachment.mimeType,

                  disposition:
                    attachment.disposition,

                  sizeBytes:
                    attachment.sizeBytes,
                }),
              ),

            htmlLinks:
              extraction.htmlLinks.map(
                (link) => ({
                  targetDomain:
                    link.targetDomain,

                  displayedDomain:
                    link.displayedDomain,

                  displayText:
                    link.displayText,
                }),
              ),

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

      emailForensics: {
        from:
          extraction.from,

        replyTo:
          extraction.replyTo,

        returnPath:
          extraction.returnPath,

        receivedCount:
          extraction.receivedCount,

        authenticationResults:
          extraction.authenticationResults,

        attachmentCount:
          extraction.attachments.length,

        linkCount:
          extraction.htmlLinks.length,
      },
    });
  } catch (error) {
    console.error(
      "Unexpected email-file analysis error:",
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