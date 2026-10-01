import PostalMime from "postal-mime";

import type {
  Address,
  Header,
  Mailbox,
} from "postal-mime";

import {
  getDomain,
} from "tldts";

import type {
  EmailAddressSummary,
  EmailAuthenticationResult,
  EmailFileExtraction,
  EmailHtmlLink,
} from "@/lib/analysis/email-file-types";


const MAX_ANALYSIS_CHARACTERS =
  50_000;

const MAX_HTML_LINKS =
  50;

const PARSE_TIMEOUT_MS =
  15_000;

function withTimeout<T>(
  promise: Promise<T>,
  milliseconds: number,
): Promise<T> {
  let timeout:
    ReturnType<
      typeof setTimeout
    >;


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
                  "Email parsing timed out.",
                ),
              );
            },
            milliseconds,
          );
      },
    );


  return Promise.race([
    promise,
    timeoutPromise,
  ]).finally(() => {
    clearTimeout(
      timeout,
    );
  });
}


function registrableDomain(
  value:
    string | null |
    undefined,
) {
  if (!value) {
    return null;
  }


  const cleaned =
    value
      .trim()
      .toLowerCase()
      .replace(
        /^@/,
        "",
      );


  return getDomain(
    cleaned,
  );
}


function domainFromEmail(
  address:
    string | null |
    undefined,
) {
  if (!address) {
    return null;
  }


  const at =
    address.lastIndexOf(
      "@",
    );


  if (at === -1) {
    return null;
  }


  return registrableDomain(
    address.slice(
      at + 1,
    ),
  );
}


function domainFromMessageId(
  messageId:
    string | null |
    undefined,
) {
  if (!messageId) {
    return null;
  }


  const cleaned =
    messageId.replace(
      /[<>]/g,
      "",
    );


  return domainFromEmail(
    cleaned,
  );
}

function isMailbox(
  address: Address,
): address is Mailbox {
  return !(
    "group" in address &&
    Array.isArray(
      address.group,
    )
  );
}


function flattenAddresses(
  addresses:
    Address[],
): EmailAddressSummary[] {
  const output:
    EmailAddressSummary[] =
      [];


  for (
    const address
    of addresses
  ) {
    if (
      isMailbox(
        address,
      )
    ) {
      if (
        address.address
      ) {
        output.push({
          name:
            address.name ??
            "",

          address:
            address.address,

          domain:
            domainFromEmail(
              address.address,
            ),
        });
      }

      continue;
    }


    for (
      const member
      of address.group ??
      []
    ) {
      if (
        member.address
      ) {
        output.push({
          name:
            member.name ??
            "",

          address:
            member.address,

          domain:
            domainFromEmail(
              member.address,
            ),
        });
      }
    }
  }


  return output;
}

function headerValues(
  headers:
    Header[],

  key:
    string,
) {
  const normalized =
    key.toLowerCase();


  return headers
    .filter(
      (header) =>
        header.key
          .toLowerCase() ===
        normalized,
    )
    .map(
      (header) =>
        header.value,
    );
}

function parseAuthenticationResults(
  headers:
    Header[],
): EmailAuthenticationResult[] {
  const values =
    headerValues(
      headers,
      "authentication-results",
    );


  const results:
    EmailAuthenticationResult[] =
      [];


  for (
    const value
    of values
  ) {
    const firstSemicolon =
      value.indexOf(
        ";",
      );


    const authservId =
      firstSemicolon >= 0
        ? value
            .slice(
              0,
              firstSemicolon,
            )
            .trim() ||
          null
        : null;


    const matches =
      value.matchAll(
        /\b(spf|dkim|dmarc)\s*=\s*([a-zA-Z0-9_-]+)/gi,
      );


    for (
      const match
      of matches
    ) {
      results.push({
        authservId,

        method:
          match[1]
            .toLowerCase() as
            | "spf"
            | "dkim"
            | "dmarc",

        result:
          match[2]
            .toLowerCase(),
      });
    }
  }


  return results;
}

function decodeBasicHtml(
  value: string,
) {
  return value
    .replace(
      /&amp;/gi,
      "&",
    )
    .replace(
      /&quot;/gi,
      '"',
    )
    .replace(
      /&#39;/gi,
      "'",
    )
    .replace(
      /&lt;/gi,
      "<",
    )
    .replace(
      /&gt;/gi,
      ">",
    )
    .replace(
      /&nbsp;/gi,
      " ",
    );
}


function stripHtml(
  value: string,
) {
  return decodeBasicHtml(
    value
      .replace(
        /<script\b[\s\S]*?<\/script>/gi,
        " ",
      )
      .replace(
        /<style\b[\s\S]*?<\/style>/gi,
        " ",
      )
      .replace(
        /<[^>]+>/g,
        " ",
      )
      .replace(
        /\s+/g,
        " ",
      )
      .trim(),
  );
}


function domainFromUrl(
  value: string,
) {
  try {
    const url =
      new URL(
        value,
      );


    if (
      url.protocol !==
        "http:" &&
      url.protocol !==
        "https:"
    ) {
      return null;
    }


    return getDomain(
      url.hostname,
    );
  } catch {
    return null;
  }
}


function displayedDomainFromText(
  text: string,
) {
  const match =
    text.match(
      /(?:https?:\/\/)?(?:www\.)?([a-z0-9.-]+\.[a-z]{2,})(?:[/:?\s]|$)/i,
    );


  if (!match) {
    return null;
  }


  return getDomain(
    match[1],
  );
}


function extractHtmlLinks(
  html:
    string | undefined,
): EmailHtmlLink[] {
  if (!html) {
    return [];
  }


  const links:
    EmailHtmlLink[] =
      [];


  const anchorPattern =
    /<a\b[^>]*\bhref\s*=\s*(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi;


  for (
    const match
    of html.matchAll(
      anchorPattern,
    )
  ) {
    const url =
      decodeBasicHtml(
        match[2].trim(),
      );


    const targetDomain =
      domainFromUrl(
        url,
      );


    if (!targetDomain) {
      continue;
    }


    const displayText =
      stripHtml(
        match[3],
      );


    links.push({
      url,

      targetDomain,

      displayText,

      displayedDomain:
        displayedDomainFromText(
          displayText,
        ),
    });


    if (
      links.length >=
      MAX_HTML_LINKS
    ) {
      break;
    }
  }


  return links;
}

function htmlToAnalysisText(
  html:
    string | undefined,
) {
  if (!html) {
    return "";
  }


  return decodeBasicHtml(
    html
      .replace(
        /<script\b[\s\S]*?<\/script>/gi,
        " ",
      )
      .replace(
        /<style\b[\s\S]*?<\/style>/gi,
        " ",
      )
      .replace(
        /<(br|p|div|li|tr|h[1-6])\b[^>]*>/gi,
        "\n",
      )
      .replace(
        /<[^>]+>/g,
        " ",
      )
      .replace(
        /[ \t]+/g,
        " ",
      )
      .replace(
        /\n{3,}/g,
        "\n\n",
      )
      .trim(),
  );
}

function formatAddress(
  address:
    EmailAddressSummary,
) {
  return address.name
    ? `${address.name} <${address.address}>`
    : address.address;
}


export async function extractEmailFile(
  file: File,
): Promise<EmailFileExtraction> {
  const bytes =
    new Uint8Array(
      await file.arrayBuffer(),
    );


  const email =
    await withTimeout(
      PostalMime.parse(
        bytes,
        {
          attachmentEncoding:
            "arraybuffer",

          maxNestingDepth:
            40,

          maxHeadersSize:
            512 * 1024,

          maxRfc822NestingDepth:
            3,
        },
      ),

      PARSE_TIMEOUT_MS,
    );


  const from =
    email.from
      ? flattenAddresses([
          email.from,
        ])
      : [];


  const replyTo =
    flattenAddresses(
      email.replyTo ??
      [],
    );


  const authResults =
    parseAuthenticationResults(
      email.headers,
    );


  const htmlLinks =
    extractHtmlLinks(
      email.html,
    );


  const attachments =
    email.attachments.map(
      (attachment) => ({
        filename:
          attachment.filename ??
          null,

        mimeType:
          attachment.mimeType,

        disposition:
          attachment.disposition ??
          null,

        sizeBytes:
          attachment.content instanceof
          ArrayBuffer
            ? attachment
                .content
                .byteLength
            : Buffer.byteLength(
                String(
                  attachment.content,
                ),
              ),
      }),
    );

  const body =
    email.text?.trim() ||
    htmlToAnalysisText(
      email.html,
    );


  const returnPath =
    email.returnPath ??
    null;


  const messageId =
    email.messageId ??
    null;


  const warnings:
    string[] = [];


  const headerSection = [
    `Subject: ${email.subject ?? ""}`,

    `From: ${from
      .map(
        formatAddress,
      )
      .join(", ")}`,

    `Reply-To: ${replyTo
      .map(
        formatAddress,
      )
      .join(", ")}`,

    `Return-Path: ${returnPath ?? ""}`,

    `Message-ID: ${messageId ?? ""}`,

    `Date: ${email.date ?? ""}`,
  ];


  if (
    authResults.length >
    0
  ) {
    headerSection.push(
      `Reported authentication: ${authResults
        .map(
          (result) =>
            `${result.method}=${result.result}`,
        )
        .join(", ")}`,
    );
  }


  if (
    htmlLinks.length >
    0
  ) {
    headerSection.push(
      "",
      "HTML link targets:",
      ...htmlLinks.map(
        (link) =>
          `- ${link.displayText || "(no visible text)"} -> ${link.url}`,
      ),
    );
  }


  if (
    attachments.length >
    0
  ) {
    headerSection.push(
      "",
      "Attachments:",
      ...attachments.map(
        (attachment) =>
          `- ${attachment.filename ?? "(unnamed)"} (${attachment.mimeType})`,
      ),
    );
  }


  let analysisText =
    [
      ...headerSection,

      "",

      "Email body:",

      body,
    ].join(
      "\n",
    );


  let truncated =
    false;


  if (
    analysisText.length >
    MAX_ANALYSIS_CHARACTERS
  ) {
    analysisText =
      analysisText.slice(
        0,
        MAX_ANALYSIS_CHARACTERS,
      );

    truncated =
      true;

    warnings.push(
      "Extracted email content exceeded 50,000 characters and was truncated before analysis.",
    );
  }


  if (
    body.trim().length <
      5 &&
    from.length === 0
  ) {
    throw new Error(
      "JobShield could not extract a usable email message from this file.",
    );
  }


  return {
    analysisText,

    subject:
      email.subject ??
      "",

    from,

    replyTo,

    returnPath,

    returnPathDomain:
      domainFromEmail(
        returnPath,
      ),

    deliveredTo:
      email.deliveredTo ??
      null,

    messageId,

    messageIdDomain:
      domainFromMessageId(
        messageId,
      ),

    date:
      email.date ??
      null,

    authenticationResults:
      authResults,

    dkimSignaturePresent:
      headerValues(
        email.headers,
        "dkim-signature",
      ).length > 0,

    receivedCount:
      headerValues(
        email.headers,
        "received",
      ).length,

    fromHeaderCount:
      headerValues(
        email.headers,
        "from",
      ).length,

    replyToHeaderCount:
      headerValues(
        email.headers,
        "reply-to",
      ).length,

    htmlLinks,

    attachments,

    truncated,

    warnings,
  };
}