import {
  PDFDocument,
  PDFPage,
  PDFFont,
  StandardFonts,
  rgb,
} from "pdf-lib";

import type {
  PrivateReportData,
} from "@/lib/reports/private-report-data";


const PAGE_WIDTH =
  612;

const PAGE_HEIGHT =
  792;

const MARGIN =
  48;

const CONTENT_WIDTH =
  PAGE_WIDTH -
  MARGIN * 2;

const TOP =
  PAGE_HEIGHT -
  MARGIN;

const BOTTOM =
  MARGIN + 28;


type PdfContext = {
  pdf:
    PDFDocument;

  page:
    PDFPage;

  regular:
    PDFFont;

  bold:
    PDFFont;

  y:
    number;
};

function safeText(
  value:
    unknown,
): string {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(
    value,
  )
    .replace(
      /[\u2018\u2019]/g,
      "'",
    )
    .replace(
      /[\u201C\u201D]/g,
      '"',
    )
    .replace(
      /[\u2013\u2014]/g,
      "-",
    )
    .replace(
      /\u2026/g,
      "...",
    )
    .replace(
      /\u2022/g,
      "*",
    )
    .replace(
      /[^\x09\x0A\x0D\x20-\x7E]/g,
      "",
    );
}


function splitLongWord(
  word: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
) {
  const parts:
    string[] = [];

  let current =
    "";


  for (
    const character
    of word
  ) {
    const candidate =
      current +
      character;

    const width =
      font.widthOfTextAtSize(
        candidate,
        size,
      );


    if (
      width >
        maxWidth &&
      current
    ) {
      parts.push(
        current,
      );

      current =
        character;
    } else {
      current =
        candidate;
    }
  }


  if (current) {
    parts.push(
      current,
    );
  }


  return parts;
}


function wrapText(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
): string[] {
  const normalized =
    safeText(
      text,
    );


  const paragraphs =
    normalized.split(
      /\r?\n/,
    );


  const lines:
    string[] = [];


  for (
    const paragraph
    of paragraphs
  ) {
    if (
      paragraph.trim() ===
      ""
    ) {
      lines.push(
        "",
      );

      continue;
    }


    const originalWords =
      paragraph
        .trim()
        .split(
          /\s+/,
        );


    const words =
      originalWords.flatMap(
        (word) => {
          const width =
            font.widthOfTextAtSize(
              word,
              size,
            );

          if (
            width <=
            maxWidth
          ) {
            return [
              word,
            ];
          }

          return splitLongWord(
            word,
            font,
            size,
            maxWidth,
          );
        },
      );


    let currentLine =
      "";


    for (
      const word of words
    ) {
      const candidate =
        currentLine
          ? `${currentLine} ${word}`
          : word;


      const width =
        font.widthOfTextAtSize(
          candidate,
          size,
        );


      if (
        width >
          maxWidth &&
        currentLine
      ) {
        lines.push(
          currentLine,
        );

        currentLine =
          word;
      } else {
        currentLine =
          candidate;
      }
    }


    if (currentLine) {
      lines.push(
        currentLine,
      );
    }
  }


  return lines;
}

function addPage(
  context:
    PdfContext,
) {
  context.page =
    context.pdf.addPage([
      PAGE_WIDTH,
      PAGE_HEIGHT,
    ]);

  context.y =
    TOP;
}


function ensureSpace(
  context:
    PdfContext,
  required:
    number,
) {
  if (
    context.y -
      required <
    BOTTOM
  ) {
    addPage(
      context,
    );
  }
}

function drawTextLine(
  context:
    PdfContext,

  text: string,

  options?: {
    size?: number;
    bold?: boolean;
    indent?: number;
  },
) {
  const size =
    options?.size ??
    10;

  const font =
    options?.bold
      ? context.bold
      : context.regular;

  const indent =
    options?.indent ??
    0;


  ensureSpace(
    context,
    size + 7,
  );


  context.page.drawText(
    safeText(
      text,
    ),
    {
      x:
        MARGIN +
        indent,

      y:
        context.y,

      size,

      font,

      color:
        rgb(
          0.12,
          0.12,
          0.12,
        ),
    },
  );


  context.y -=
    size + 6;
}


function drawParagraph(
  context:
    PdfContext,

  text: string,

  options?: {
    size?: number;
    bold?: boolean;
    indent?: number;
    spacingAfter?: number;
  },
) {
  const size =
    options?.size ??
    10;

  const font =
    options?.bold
      ? context.bold
      : context.regular;

  const indent =
    options?.indent ??
    0;

  const maxWidth =
    CONTENT_WIDTH -
    indent;


  const lines =
    wrapText(
      text,
      font,
      size,
      maxWidth,
    );


  for (
    const line of lines
  ) {
    ensureSpace(
      context,
      size + 7,
    );


    if (line) {
      context.page.drawText(
        line,
        {
          x:
            MARGIN +
            indent,

          y:
            context.y,

          size,

          font,

          color:
            rgb(
              0.15,
              0.15,
              0.15,
            ),
        },
      );
    }


    context.y -=
      size + 5;
  }


  context.y -=
    options
      ?.spacingAfter ??
    6;
}

function drawRule(
  context:
    PdfContext,
) {
  ensureSpace(
    context,
    15,
  );


  context.page.drawLine({
    start: {
      x:
        MARGIN,

      y:
        context.y,
    },

    end: {
      x:
        PAGE_WIDTH -
        MARGIN,

      y:
        context.y,
    },

    thickness:
      0.7,

    color:
      rgb(
        0.78,
        0.78,
        0.78,
      ),
  });


  context.y -=
    14;
}


function drawSectionTitle(
  context:
    PdfContext,

  title:
    string,
) {
  ensureSpace(
    context,
    30,
  );


  drawRule(
    context,
  );


  drawTextLine(
    context,
    title,
    {
      size: 14,
      bold: true,
    },
  );


  context.y -=
    3;
}


function drawLabelValue(
  context:
    PdfContext,

  label:
    string,

  value:
    string,
) {
  drawParagraph(
    context,
    `${label}: ${value}`,
    {
      size: 9,
      spacingAfter: 2,
    },
  );
}


function formatStatus(
  value:
    string | null,
) {
  if (!value) {
    return "Unknown";
  }


  return value
    .replace(
      /_/g,
      " ",
    )
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase(),
    );
}

export async function generateEvidencePdf(
  report:
    PrivateReportData,
): Promise<Uint8Array> {
  const pdf =
    await PDFDocument.create();


  const regular =
    await pdf.embedFont(
      StandardFonts.Helvetica,
    );


  const bold =
    await pdf.embedFont(
      StandardFonts.HelveticaBold,
    );


  const firstPage =
    pdf.addPage([
      PAGE_WIDTH,
      PAGE_HEIGHT,
    ]);


  const context:
    PdfContext = {
    pdf,
    page:
      firstPage,
    regular,
    bold,
    y:
      TOP,
  };


  const {
    analysis,
    findings,
    domainChecks,
    urlChecks,
    companyVerifications,
  } =
    report;

  // PDF METADATA
  pdf.setTitle(
    `JobShield Evidence Report - ${analysis.id}`,
  );

  pdf.setAuthor(
    "JobShield",
  );

  pdf.setCreator(
    "JobShield",
  );

  pdf.setProducer(
    "JobShield",
  );

  pdf.setSubject(
    "Job scam risk analysis evidence report",
  );

  pdf.setCreationDate(
    new Date(),
  );

  // HEADER
  drawTextLine(
    context,
    "JOBSHIELD",
    {
      size: 11,
      bold: true,
    },
  );

  /*
 * Extra spacing is required because
 * the next line uses a much larger font.
 */
context.y -=
  10;


  drawTextLine(
    context,
    "Evidence Report",
    {
      size: 24,
      bold: true,
    },
  );


  context.y -=
    12;


  drawTextLine(
    context,
    `${String(
      analysis.risk_score ??
      0,
    )}/100 - ${formatStatus(
      analysis.risk_level,
    )} Risk`,
    {
      size: 18,
      bold: true,
    },
  );


  context.y -=
    4;


  drawLabelValue(
    context,
    "Analysis ID",
    analysis.id,
  );


  drawLabelValue(
    context,
    "Input type",
    formatStatus(
      analysis.analysis_type,
    ),
  );


  drawLabelValue(
    context,
    "Created",
    new Date(
      analysis.created_at,
    ).toLocaleString(),
  );


  drawLabelValue(
    context,
    "Pipeline",
    analysis.pipeline_version ??
      "Unknown",
  );

  // SIGNALS
  drawSectionTitle(
    context,
    "Detection Signals",
  );


  const signalBreakdown =
    (
      analysis.signal_breakdown ??
      {}
    ) as {
      ruleScore?: number;
      aiSignal?: number;
      domainSignal?: number;
      urlSignal?: number;
      emailSignal?: number;
      communitySignal?: number;
    };


  drawLabelValue(
    context,
    "Rules",
    `${signalBreakdown.ruleScore ?? 0}/100`,
  );


  drawLabelValue(
    context,
    "AI signal",
    `${signalBreakdown.aiSignal ?? 0}/60`,
  );


  drawLabelValue(
    context,
    "Domain signal",
    `${signalBreakdown.domainSignal ?? 0}/60`,
  );


  drawLabelValue(
    context,
    "URL reputation",
    `${signalBreakdown.urlSignal ?? 0}/80`,
  );


  if (
    analysis.ai_confidence !==
    null
  ) {
    drawLabelValue(
      context,
      "AI confidence",
      `${Math.round(
        Number(
          analysis.ai_confidence,
        ) * 100,
      )}%`,
    );
  }

  // SUMMARY
  drawSectionTitle(
    context,
    "Summary",
  );


  drawParagraph(
    context,
    analysis.summary ??
      "No summary was recorded.",
    {
      size: 10,
    },
  );

  // FINDINGS
  drawSectionTitle(
    context,
    "Evidence Findings",
  );


  if (
    findings.length === 0
  ) {
    drawParagraph(
      context,
      "No warning findings were recorded. This does not establish that the opportunity is legitimate.",
    );
  } else {
    findings.forEach(
      (
        finding,
        index,
      ) => {
        ensureSpace(
          context,
          90,
        );


        drawTextLine(
          context,
          `${index + 1}. ${safeText(
            finding.title,
          )}`,
          {
            size: 11,
            bold: true,
          },
        );


        drawLabelValue(
          context,
          "Severity",
          formatStatus(
            finding.severity,
          ),
        );


        drawLabelValue(
          context,
          "Source",
          formatStatus(
            finding.source,
          ),
        );


        if (
          Number(
            finding.score_contribution,
          ) > 0
        ) {
          drawLabelValue(
            context,
            "Risk contribution",
            `+${finding.score_contribution}`,
          );
        }


        drawParagraph(
          context,
          finding.explanation,
          {
            size: 9,
          },
        );


        if (
          finding.evidence
        ) {
          drawParagraph(
            context,
            `Evidence: "${finding.evidence}"`,
            {
              size: 8,
              indent: 12,
              spacingAfter: 10,
            },
          );
        }


        context.y -=
          4;
      },
    );
  }

  // DOMAIN INTELLIGENCE
  drawSectionTitle(
    context,
    "Domain Intelligence",
  );


  if (
    domainChecks.length ===
    0
  ) {
    drawParagraph(
      context,
      "No domains were available for verification.",
    );
  } else {
    for (
      const check
      of domainChecks
    ) {
      ensureSpace(
        context,
        75,
      );


      drawTextLine(
        context,
        check.domain,
        {
          size: 11,
          bold: true,
        },
      );


      drawLabelValue(
        context,
        "DNS active",
        check.has_dns ===
          true
          ? "Yes"
          : check.has_dns ===
              false
            ? "No"
            : "Unavailable",
      );


      drawLabelValue(
        context,
        "Mail records",
        check.has_mx ===
          true
          ? "Yes"
          : check.has_mx ===
              false
            ? "No"
            : "Unavailable",
      );


      drawLabelValue(
        context,
        "Domain age",
        check.domain_age_days !==
          null
          ? `${check.domain_age_days} days`
          : "Unavailable",
      );


      drawLabelValue(
        context,
        "Registrar",
        check.registrar ??
          "Unavailable",
      );


      context.y -=
        5;
    }
  }

  // URL REPUTATION
  drawSectionTitle(
    context,
    "URL Reputation",
  );


  if (
    urlChecks.length === 0
  ) {
    drawParagraph(
      context,
      "No URL reputation checks were recorded.",
    );
  } else {
    for (
      const check
      of urlChecks
    ) {
      ensureSpace(
        context,
        55,
      );


      drawTextLine(
        context,
        check.hostname,
        {
          size: 11,
          bold: true,
        },
      );


      drawLabelValue(
        context,
        "Check status",
        check.checked
          ? "Completed"
          : "Unavailable",
      );


      drawLabelValue(
        context,
        "Threat intelligence match",
        check.matched
          ? "Yes"
          : "No exact match",
      );


      context.y -=
        4;
    }


    drawParagraph(
      context,
      "A lack of an exact threat-intelligence match does not guarantee that a URL is safe.",
      {
        size: 8,
      },
    );
  }



  // COMPANY VERIFICATION
  drawSectionTitle(
    context,
    "Company Verification",
  );


  if (
    companyVerifications.length ===
    0
  ) {
    drawParagraph(
      context,
      "No claimed company was available for verification.",
    );
  } else {
    for (
      const company
      of companyVerifications
    ) {
      ensureSpace(
        context,
        85,
      );


      drawTextLine(
        context,
        company.claimed_name,
        {
          size: 11,
          bold: true,
        },
      );


      drawLabelValue(
        context,
        "Verification status",
        formatStatus(
          company.status,
        ),
      );


      drawLabelValue(
        context,
        "Public registry match",
        company.registry_matched
          ? "Yes"
          : "No",
      );


      if (
        company.registry_company_name
      ) {
        drawLabelValue(
          context,
          "Registry company",
          company.registry_company_name,
        );
      }


      if (
        company.registry_ticker
      ) {
        drawLabelValue(
          context,
          "Ticker",
          company.registry_ticker,
        );
      }


      if (
        company.registry_exchange
      ) {
        drawLabelValue(
          context,
          "Exchange",
          company.registry_exchange,
        );
      }


      drawLabelValue(
        context,
        "Aligned domains",
        company.aligned_domains
          ?.length
          ? company.aligned_domains.join(
              ", ",
            )
          : "None",
      );


      context.y -=
        5;
    }
  }



// SCREENSHOT METADATA
if (
  analysis.analysis_type ===
  "screenshot"
) {
  const metadata =
    analysis.input_metadata &&
    typeof analysis.input_metadata ===
      "object" &&
    "screenshot" in
      analysis.input_metadata
      ? (
          analysis.input_metadata as {
            screenshot?: {
              mimeType?:
                string;

              sizeBytes?:
                number;

              extractionConfidence?:
                number;

              warnings?:
                string[];

              rawImageStored?:
                boolean;

              source?:
                string;

              captureType?:
                string;

              sourceHost?:
                string | null;

              pixelWidth?:
                number | null;

              pixelHeight?:
                number | null;

              privacy?: {
                fullViewportUploaded?:
                  boolean;

                croppedRegionUploaded?:
                  boolean;

                rawImageRetained?:
                  boolean;
              };
            };
          }
        ).screenshot
      : undefined;

  // STANDARD SCREENSHOT EXTRACTION DETAILS
  drawSectionTitle(
    context,
    "Screenshot Extraction",
  );


  if (metadata) {
    drawLabelValue(
      context,
      "File type",
      metadata.mimeType ??
        "Unknown",
    );


    drawLabelValue(
      context,
      "Image size",
      metadata.sizeBytes !==
        undefined
        ? `${Math.round(
            metadata.sizeBytes /
              1024,
          )} KB`
        : "Unavailable",
    );


    drawLabelValue(
      context,
      "Extraction confidence",
      metadata.extractionConfidence !==
        undefined
        ? `${Math.round(
            metadata.extractionConfidence *
              100,
          )}%`
        : "Unavailable",
    );


    drawLabelValue(
      context,
      "Raw screenshot stored",
      metadata.rawImageStored ===
        true
        ? "Yes"
        : metadata.rawImageStored ===
            false
          ? "No"
          : "Unknown",
    );


    if (
      metadata.warnings
        ?.length
    ) {
      drawParagraph(
        context,
        `Warnings: ${metadata.warnings.join(
          "; ",
        )}`,
        {
          size:
            9,
        },
      );
    }

    // BROWSER EXTENSION CAPTURE PROVENANCE
    if (
      metadata.source ===
      "browser_extension"
    ) {
      drawSectionTitle(
        context,
        "Browser Capture",
      );


      drawLabelValue(
        context,
        "Capture source",
        "JobShield Browser Extension",
      );


      drawLabelValue(
        context,
        "Source website",
        metadata.sourceHost ??
          "Unavailable",
      );


      drawLabelValue(
        context,
        "Capture type",
        formatStatus(
          metadata.captureType ??
            null,
        ),
      );


      const dimensions =
        metadata.pixelWidth &&
        metadata.pixelHeight
          ? `${metadata.pixelWidth} x ${metadata.pixelHeight}`
          : "Unavailable";


      drawLabelValue(
        context,
        "Selected region",
        dimensions,
      );


      drawLabelValue(
        context,
        "Image retained",
        metadata.rawImageStored ===
          true
          ? "Yes"
          : metadata.rawImageStored ===
              false
            ? "No"
            : "Unknown",
      );


      context.y -=
        4;


      drawTextLine(
        context,
        "Privacy Protection",
        {
          size:
            10,

          bold:
            true,
        },
      );


      const fullViewportUploaded =
        metadata.privacy
          ?.fullViewportUploaded;


      const croppedRegionUploaded =
        metadata.privacy
          ?.croppedRegionUploaded;


      const rawImageRetained =
        metadata.privacy
          ?.rawImageRetained;


      drawParagraph(
        context,
        fullViewportUploaded ===
          false
          ? "Only the user-selected region was uploaded. The temporary full browser viewport was not uploaded."
          : fullViewportUploaded ===
              true
            ? "The full browser viewport was uploaded."
            : "Full-viewport upload status was not recorded.",
        {
          size:
            9,

          spacingAfter:
            4,
        },
      );


      drawParagraph(
        context,
        croppedRegionUploaded ===
          true
          ? "The cropped region selected by the user was uploaded for analysis."
          : croppedRegionUploaded ===
              false
            ? "The cropped region was not uploaded."
            : "Cropped-region upload status was not recorded.",
        {
          size:
            9,

          spacingAfter:
            4,
        },
      );


      drawParagraph(
        context,
        rawImageRetained ===
          false
          ? "The submitted screenshot image was processed for analysis but was not retained by JobShield."
          : rawImageRetained ===
              true
            ? "The submitted screenshot image was retained."
            : "Image-retention status was not recorded.",
        {
          size:
            9,
        },
      );
    }
  } else {
    drawParagraph(
      context,
      "Screenshot metadata was not available for this analysis.",
      {
        size:
          9,
      },
    );
  }
}

  if (
  analysis.analysis_type ===
  "job_offer"
) {
  drawSectionTitle(
    context,
    "Document Extraction",
  );


  const metadata =
    analysis.input_metadata &&
    typeof analysis.input_metadata ===
      "object" &&
    "document" in
      analysis.input_metadata
      ? (
          analysis.input_metadata as {
            document?: {
              kind?: string;
              pageCount?: number | null;
              parser?: string;
              truncated?: boolean;
              warnings?: string[];
              rawFileStored?: boolean;
            };
          }
        ).document
      : undefined;


  if (metadata) {
    drawLabelValue(
      context,
      "Format",
      metadata.kind
        ?.toUpperCase() ??
        "Unknown",
    );


    drawLabelValue(
      context,
      "Pages",
      metadata.pageCount !==
        null &&
      metadata.pageCount !==
        undefined
        ? String(
            metadata.pageCount,
          )
        : "N/A",
    );


    drawLabelValue(
      context,
      "Parser",
      metadata.parser ??
        "Unknown",
    );


    drawLabelValue(
      context,
      "Raw file stored",
      metadata.rawFileStored
        ? "Yes"
        : "No",
    );


    drawLabelValue(
      context,
      "Text truncated",
      metadata.truncated
        ? "Yes"
        : "No",
    );


    if (
      metadata.warnings
        ?.length
    ) {
      drawParagraph(
        context,
        `Warnings: ${metadata.warnings.join(
          "; ",
        )}`,
        {
          size: 9,
        },
      );
    }
  }
}


if (
  analysis.analysis_type ===
  "email_file"
) {
  drawLabelValue(
    context,
    "Email header signal",
    `${signalBreakdown.emailSignal ?? 0}/50`,
  );
}


drawLabelValue(
  context,
  "Community signal",
  `${signalBreakdown.communitySignal ?? 0}/30`,
);


  // ANALYZED CONTENT
drawSectionTitle(
  context,
  analysis.analysis_type ===
    "screenshot"
    ? "Extracted Screenshot Text"
    : analysis.analysis_type ===
        "job_offer"
      ? "Extracted Job Offer Text"
      : analysis.analysis_type ===
          "email_file"
        ? "Extracted Email Content and Headers"
        : "Analyzed Content",
);


  drawParagraph(
    context,
    analysis.input_text,
    {
      size: 8,
    },
  );


  // DISCLAIMER
  drawSectionTitle(
    context,
    "Important Notice",
  );


  drawParagraph(
    context,
    "JobShield provides risk indicators and corroborating evidence. A low score, registry match, active domain, or absence of detected indicators does not establish that an employer, recruiter, website, or job opportunity is legitimate. Independently verify important employment communications before sending money, identity documents, credentials, or sensitive financial information.",
    {
      size: 8,
    },
  );


  // PAGE NUMBERS / FOOTERS
  const pages =
    pdf.getPages();


  pages.forEach(
    (
      page,
      index,
    ) => {
      const footer =
        `JobShield Evidence Report  |  Page ${index + 1} of ${pages.length}`;


      page.drawText(
        footer,
        {
          x:
            MARGIN,

          y:
            24,

          size:
            7,

          font:
            regular,

          color:
            rgb(
              0.45,
              0.45,
              0.45,
            ),
        },
      );
    },
  );

  return pdf.save();
}