import {
  getDomain,
} from "tldts";

import {
  hashThreatUrl,
  hostnameFromUrl,
  normalizeThreatUrl,
} from "@/lib/security/url-normalization";

import type {
  ExtractedEntities,
} from "@/lib/analysis/types";


export type CommunityReportCandidate = {
  key: string;

  type:
    | "domain"
    | "url";

  label: string;

  domainValue:
    string | null;

  urlHash:
    string | null;

  hostname:
    string | null;
};


/* Reporting these entire shared-provider domains as "scam domains" would generate extremely noisy community intelligence. */
const NON_REPORTABLE_DOMAINS =
  new Set([
    "gmail.com",
    "googlemail.com",

    "outlook.com",
    "hotmail.com",
    "live.com",
    "msn.com",

    "yahoo.com",
    "ymail.com",

    "icloud.com",

    "aol.com",

    "proton.me",
    "protonmail.com",

    "gmx.com",

    "mail.com",
  ]);


function canonicalDomain(
  value: string,
) {
  const cleaned =
    value
      .trim()
      .toLowerCase();


  return (
    getDomain(
      cleaned,
    ) ??
    cleaned
  );
}


export function buildCommunityReportCandidates(
  entities:
    ExtractedEntities,
): CommunityReportCandidate[] {
  const candidates =
    new Map<
      string,
      CommunityReportCandidate
    >();


  // DOMAIN INDICATORS
  for (
    const rawDomain
    of entities.domains
  ) {
    const domain =
      canonicalDomain(
        rawDomain,
      );


    if (
      !domain ||
      NON_REPORTABLE_DOMAINS.has(
        domain,
      )
    ) {
      continue;
    }

    const key =
      `domain:${domain}`;


    candidates.set(
      key,
      {
        key,

        type:
          "domain",

        label:
          domain,

        domainValue:
          domain,

        urlHash:
          null,

        hostname:
          domain,
      },
    );
  }

  // EXACT URL INDICATORS
  for (
    const rawUrl
    of entities.urls
  ) {
    const normalized =
      normalizeThreatUrl(
        rawUrl,
      );

    if (!normalized) {
      continue;
    }

    const hostname =
      hostnameFromUrl(
        normalized,
      );

    if (!hostname) {
      continue;
    }

    const urlHash =
      hashThreatUrl(
        normalized,
      );


    const key =
      `url:${urlHash}`;


    candidates.set(
      key,
      {
        key,

        type:
          "url",

        label:
          normalized,

        domainValue:
          null,

        urlHash,

        hostname,
      },
    );
  }

  return Array.from(
    candidates.values(),
  );
}