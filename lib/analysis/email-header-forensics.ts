import type {
  AnalysisFinding,
} from "@/lib/analysis/types";

import type {
  EmailFileExtraction,
} from "@/lib/analysis/email-file-types";


const DANGEROUS_EXTENSIONS =
  new Set([
    "exe",
    "scr",
    "js",
    "jse",
    "vbs",
    "vbe",
    "bat",
    "cmd",
    "ps1",
    "lnk",
    "msi",
    "hta",
    "iso",
    "img",
  ]);


function extensionOf(
  filename:
    string | null,
) {
  if (!filename) {
    return "";
  }


  const index =
    filename.lastIndexOf(
      ".",
    );


  if (index === -1) {
    return "";
  }


  return filename
    .slice(
      index + 1,
    )
    .toLowerCase();
}


export function runEmailHeaderForensics(
  email:
    EmailFileExtraction,
): AnalysisFinding[] {
  const findings:
    AnalysisFinding[] =
      [];

  // DUPLICATE FROM HEADERS
  if (
    email.fromHeaderCount >
    1
  ) {
    findings.push({
      key:
        "email:duplicate-from",

      category:
        "duplicate_from_headers",

      source:
        "email_header",

      severity:
        "high",

      title:
        "Email contains multiple From headers",

      explanation:
        "The uploaded message contains more than one From header. This is unusual and can indicate a malformed or intentionally deceptive email.",

      evidence:
        `${email.fromHeaderCount} From headers`,

      scoreContribution:
        18,
    });
  }

  // FROM / REPLY-TO MISMATCH
  const fromDomains =
    new Set(
      email.from
        .map(
          (item) =>
            item.domain,
        )
        .filter(
          (
            domain,
          ): domain is string =>
            Boolean(
              domain,
            ),
        ),
    );


  const replyDomains =
    new Set(
      email.replyTo
        .map(
          (item) =>
            item.domain,
        )
        .filter(
          (
            domain,
          ): domain is string =>
            Boolean(
              domain,
            ),
        ),
    );


  if (
    fromDomains.size >
      0 &&
    replyDomains.size >
      0 &&
    [...replyDomains].every(
      (domain) =>
        !fromDomains.has(
          domain,
        ),
    )
  ) {
    findings.push({
      key:
        "email:reply-to-mismatch",

      category:
        "reply_to_domain_mismatch",

      source:
        "email_header",

      severity:
        "high",

      title:
        "Reply-To domain differs from sender domain",

      explanation:
        `The visible sender uses ${[
          ...fromDomains,
        ].join(
          ", ",
        )}, but replies are directed to ${[
          ...replyDomains,
        ].join(
          ", ",
        )}. Legitimate systems sometimes use different domains, but this mismatch is an important impersonation indicator that should be verified.`,

      evidence:
        `From domain: ${[
          ...fromDomains,
        ].join(
          ", ",
        )}; Reply-To domain: ${[
          ...replyDomains,
        ].join(
          ", ",
        )}`,

      scoreContribution:
        18,
    });
  }

  // RETURN-PATH DIFFERENCE
  // informational only because legitimate ESPs commonly
  // use separate bounce domains.
  if (
    email.returnPathDomain &&
    fromDomains.size >
      0 &&
    !fromDomains.has(
      email.returnPathDomain,
    )
  ) {
    findings.push({
      key:
        "email:return-path-mismatch",

      category:
        "return_path_domain_difference",

      source:
        "email_header",

      severity:
        "info",

      title:
        "Return-Path uses a different domain",

      explanation:
        `The Return-Path domain (${email.returnPathDomain}) differs from the visible sender domain. This can be normal for mailing providers and is recorded as contextual evidence rather than a scam determination.`,

      evidence:
        email.returnPathDomain,

      scoreContribution:
        0,
    });
  }

  // MISLEADING HTML LINKS
  const misleadingLinks =
    email.htmlLinks.filter(
      (link) =>
        Boolean(
          link.displayedDomain &&
          link.targetDomain &&
          link.displayedDomain !==
            link.targetDomain,
        ),
    );


  if (
    misleadingLinks.length >
    0
  ) {
    const first =
      misleadingLinks[0];


    findings.push({
      key:
        "email:misleading-html-link",

      category:
        "misleading_html_link",

      source:
        "email_header",

      severity:
        "high",

      title:
        "Displayed link points to a different domain",

      explanation:
        `The email visually presents ${first.displayedDomain}, but the underlying hyperlink leads to ${first.targetDomain}. This kind of destination mismatch is commonly relevant when evaluating phishing or impersonation attempts.`,

      evidence:
        `${first.displayText} -> ${first.url}`,

      scoreContribution:
        22,
    });
  }

  // DANGEROUS ATTACHMENTS
  const dangerousAttachments =
    email.attachments.filter(
      (attachment) =>
        DANGEROUS_EXTENSIONS.has(
          extensionOf(
            attachment.filename,
          ),
        ),
    );


  if (
    dangerousAttachments.length >
    0
  ) {
    findings.push({
      key:
        "email:dangerous-attachment",

      category:
        "dangerous_email_attachment",

      source:
        "email_header",

      severity:
        "critical",

      title:
        "Email contains a potentially executable attachment",

      explanation:
        "The uploaded email contains an attachment type capable of executing code or launching system actions. JobShield did not execute or open the attachment.",

      evidence:
        dangerousAttachments
          .map(
            (attachment) =>
              attachment.filename ??
              "(unnamed attachment)",
          )
          .join(
            ", ",
          ),

      scoreContribution:
        25,
    });
  }


  // REPORTED SPF / DKIM / DMARC
  //
  // IMPORTANT:
  // Do not score this because an uploaded EML's
  // Authentication-Results headers are not independently
  // trusted by JobShield.

  if (
    email.authenticationResults
      .length > 0
  ) {
    const failures =
      email.authenticationResults
        .filter(
          (result) =>
            [
              "fail",
              "softfail",
              "permerror",
            ].includes(
              result.result,
            ),
        );


    findings.push({
      key:
        "email:reported-authentication",

      category:
        "reported_email_authentication",

      source:
        "email_header",

      severity:
        failures.length >
        0
          ? "low"
          : "info",

      title:
        failures.length >
        0
          ? "Email reports authentication failures"
          : "Email contains reported authentication results",

      explanation:
        "The uploaded message contains Authentication-Results data for SPF, DKIM, or DMARC. JobShield is displaying these reported results but has not independently established that the header was added by a trusted receiving mail system.",

      evidence:
        email.authenticationResults
          .map(
            (result) =>
              `${result.method}=${result.result}`,
          )
          .join(
            ", ",
          ),

      scoreContribution:
        0,
    });
  }

  return findings;
}