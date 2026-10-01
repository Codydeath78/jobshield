import * as mammoth from "mammoth";

import {
  extractText,
  getDocumentProxy,
} from "unpdf";

import type {
  JobOfferDocumentExtraction,
  JobOfferDocumentKind,
} from "@/lib/analysis/document-types";


const MAX_EXTRACTED_CHARACTERS =
  50_000;

const MAX_PDF_PAGES =
  40;

const PDF_MAX_IMAGE_SIZE =
  16_777_216;

const EXTRACTION_TIMEOUT_MS =
  15_000;


function extensionFromFilename(
  filename: string,
) {
  const index =
    filename.lastIndexOf(".");

  if (index === -1) {
    return "";
  }

  return filename
    .slice(index + 1)
    .toLowerCase();
}


function beginsWith(
  bytes: Uint8Array,
  signature: number[],
) {
  if (
    bytes.length <
    signature.length
  ) {
    return false;
  }

  return signature.every(
    (
      value,
      index,
    ) =>
      bytes[index] ===
      value,
  );
}


function detectDocumentKind(
  file: File,
  bytes: Uint8Array,
): JobOfferDocumentKind | null {
  const extension =
    extensionFromFilename(
      file.name,
    );


  // %PDF-
  const isPdf =
    beginsWith(
      bytes,
      [
        0x25,
        0x50,
        0x44,
        0x46,
        0x2d,
      ],
    );


  if (
    isPdf &&
    (
      file.type ===
        "application/pdf" ||
      extension === "pdf"
    )
  ) {
    return "pdf";
  }


  /*
   * DOCX files are ZIP containers.
   *
   * PK\x03\x04 is the common ZIP
   * local-file-header signature.
   */
  const isZip =
    beginsWith(
      bytes,
      [
        0x50,
        0x4b,
        0x03,
        0x04,
      ],
    );


  if (
    isZip &&
    (
      file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      extension === "docx"
    )
  ) {
    return "docx";
  }


  if (
    file.type ===
      "text/plain" ||
    extension === "txt"
  ) {
    return "txt";
  }


  return null;
}


async function withTimeout<T>(
  operation:
    Promise<T>,

  milliseconds:
    number,

  message:
    string,
): Promise<T> {
  let timeout:
    ReturnType<
      typeof setTimeout
    >
    | undefined;


  const timeoutPromise =
    new Promise<never>(
      (
        _resolve,
        reject,
      ) => {
        timeout =
          setTimeout(
            () => {
              reject(
                new Error(
                  message,
                ),
              );
            },
            milliseconds,
          );
      },
    );


  try {
    return await Promise.race([
      operation,
      timeoutPromise,
    ]);
  } finally {
    if (timeout) {
      clearTimeout(
        timeout,
      );
    }
  }
}


function finalizeText(
  rawText: string,
): {
  text: string;
  truncated: boolean;
  warnings: string[];
} {
  const warnings:
    string[] = [];


  const cleaned =
    rawText
      .replace(
        /\u0000/g,
        "",
      )
      .replace(
        /\r\n/g,
        "\n",
      )
      .replace(
        /\n{4,}/g,
        "\n\n\n",
      )
      .trim();


  if (
    cleaned.length <=
    MAX_EXTRACTED_CHARACTERS
  ) {
    return {
      text:
        cleaned,

      truncated:
        false,

      warnings,
    };
  }


  warnings.push(
    `Document text exceeded ${MAX_EXTRACTED_CHARACTERS.toLocaleString()} characters and was truncated before analysis.`,
  );


  return {
    text:
      cleaned.slice(
        0,
        MAX_EXTRACTED_CHARACTERS,
      ),

    truncated:
      true,

    warnings,
  };
}

async function extractPdf(
  bytes: Uint8Array,
): Promise<{
  text: string;
  pageCount: number;
  warnings: string[];
}> {
  const pdf =
    await withTimeout(
      getDocumentProxy(
        bytes,
        {
          maxImageSize:
            PDF_MAX_IMAGE_SIZE,
        },
      ),

      EXTRACTION_TIMEOUT_MS,

      "PDF parsing timed out.",
    );


  try {
    if (
      pdf.numPages >
      MAX_PDF_PAGES
    ) {
      throw new Error(
        `PDF contains ${pdf.numPages} pages. JobShield currently supports up to ${MAX_PDF_PAGES} pages per document.`,
      );
    }


    const result =
      await withTimeout(
        extractText(
          pdf,
          {
            mergePages:
              true,
          },
        ),

        EXTRACTION_TIMEOUT_MS,

        "PDF text extraction timed out.",
      );


    const text = result.text;


    return {
      text,

      pageCount:
        result.totalPages,

      warnings: [],
    };
  } finally {
    await pdf
      .cleanup()
      .catch(
        () => undefined,
      );
  }
}

async function extractDocx(
  bytes: Uint8Array,
): Promise<{
  text: string;
  warnings: string[];
}> {
  const result =
    await withTimeout(
      mammoth.extractRawText({
        buffer:
          Buffer.from(
            bytes,
          ),
      }),

      EXTRACTION_TIMEOUT_MS,

      "DOCX text extraction timed out.",
    );


  return {
    text:
      result.value,

    warnings:
      result.messages.map(
        (message) =>
          String(
            message.message,
          ),
      ),
  };
}


function extractTxt(
  bytes: Uint8Array,
) {
  const decoder =
    new TextDecoder(
      "utf-8",
      {
        fatal:
          false,
      },
    );


  return {
    text:
      decoder.decode(
        bytes,
      ),

    warnings:
      [] as string[],
  };
}

export async function extractJobOfferDocument(
  file: File,
): Promise<JobOfferDocumentExtraction> {
  const buffer =
    await file.arrayBuffer();

  const bytes =
    new Uint8Array(
      buffer,
    );


  const kind =
    detectDocumentKind(
      file,
      bytes,
    );


  if (!kind) {
    throw new Error(
      "Unsupported or invalid document format.",
    );
  }


  let rawText =
    "";

  let pageCount:
    number | null =
      null;

  let parser =
    "";

  let parserWarnings:
    string[] = [];


  if (
    kind === "pdf"
  ) {
    const result =
      await extractPdf(
        bytes,
      );

    rawText =
      result.text;

    pageCount =
      result.pageCount;

    parser =
      "unpdf";

    parserWarnings =
      result.warnings;
  }


  if (
    kind === "docx"
  ) {
    const result =
      await extractDocx(
        bytes,
      );

    rawText =
      result.text;

    parser =
      "mammoth";

    parserWarnings =
      result.warnings;
  }


  if (
    kind === "txt"
  ) {
    const result =
      extractTxt(
        bytes,
      );

    rawText =
      result.text;

    parser =
      "text-decoder";

    parserWarnings =
      result.warnings;
  }


  const finalized =
    finalizeText(
      rawText,
    );


  const warnings = [
    ...parserWarnings,
    ...finalized.warnings,
  ];


  if (
    finalized.text.length <
    10
  ) {
    if (
      kind === "pdf"
    ) {
      throw new Error(
        "JobShield could not extract enough text from this PDF. It may be an image-only or scanned PDF.",
      );
    }


    throw new Error(
      "JobShield could not extract enough readable text from this document.",
    );
  }


  return {
    text:
      finalized.text,

    kind,

    mimeType:
      file.type ||
      "application/octet-stream",

    sizeBytes:
      file.size,

    pageCount,

    parser,

    truncated:
      finalized.truncated,

    warnings,
  };
}