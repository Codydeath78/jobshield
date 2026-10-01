import { getDomain } from "tldts";

import type {
  AIAssessment,
  DomainSourceType,
  DomainTarget,
  ExtractedEntities,
} from "@/lib/analysis/types";

const EMAIL_REGEX =
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,63}\b/gi;

const URL_REGEX =
  /\b(?:https?:\/\/|www\.)[^\s<>"']+/gi;

function unique(
  values: string[],
): string[] {
  return [...new Set(values)];
}

function normalizeEmail(
  value: string,
): string {
  return value
    .trim()
    .toLowerCase();
}

function stripTrailingPunctuation(
  value: string,
): string {
  return value.replace(
    /[),.;!?]+$/g,
    "",
  );
}

function normalizeUrl(
  value: string,
): string | null {
  try {
    const clean =
      stripTrailingPunctuation(
        value.trim(),
      );

    const candidate =
      clean.startsWith("www.")
        ? `https://${clean}`
        : clean;

    const url = new URL(candidate);

    return url.toString();
  } catch {
    return null;
  }
}

function domainFromEmail(
  email: string,
): string | null {
  const host =
    email.split("@")[1];

  if (!host) {
    return null;
  }

  return getDomain(host);
}

function domainFromUrl(
  url: string,
): string | null {
  return getDomain(url);
}

export function extractEntities(
  input: string,
  aiAssessment: AIAssessment | null,
): ExtractedEntities {
  const deterministicEmails =
    Array.from(
      input.matchAll(EMAIL_REGEX),
    ).map((match) =>
      normalizeEmail(match[0]),
    );

  const deterministicUrls =
    Array.from(
      input.matchAll(URL_REGEX),
    )
      .map((match) =>
        normalizeUrl(match[0]),
      )
      .filter(
        (value): value is string =>
          value !== null,
      );

  const aiEmails =
    aiAssessment?.recruiterEmails.map(
      normalizeEmail,
    ) ?? [];

  const aiUrls =
    aiAssessment?.urls
      .map(normalizeUrl)
      .filter(
        (value): value is string =>
          value !== null,
      ) ?? [];

  const emails = unique([
    ...deterministicEmails,
    ...aiEmails,
  ]);

  const urls = unique([
    ...deterministicUrls,
    ...aiUrls,
  ]);

  const domains = unique(
    [
      ...emails.map(domainFromEmail),
      ...urls.map(domainFromUrl),
    ].filter(
      (domain): domain is string =>
        domain !== null,
    ),
  );

  return {
    emails,
    urls,
    domains,

    companyNames:
      aiAssessment?.companyNames ?? [],

    paymentMethods:
      aiAssessment?.paymentMethods ?? [],

    requestedSensitiveData:
      aiAssessment?.requestedSensitiveData ??
      [],
  };
}

export function buildDomainTargets(
  entities: ExtractedEntities,
  aiAssessment: AIAssessment | null,
): DomainTarget[] {
  const targetMap = new Map<
    string,
    Set<DomainSourceType>
  >();

  function add(
    domain: string | null,
    source: DomainSourceType,
  ) {
    if (!domain) {
      return;
    }

    const sources =
      targetMap.get(domain) ??
      new Set<DomainSourceType>();

    sources.add(source);

    targetMap.set(
      domain,
      sources,
    );
  }

  for (const email of entities.emails) {
    add(
      domainFromEmail(email),
      "email",
    );
  }

  for (const url of entities.urls) {
    add(
      domainFromUrl(url),
      "url",
    );
  }

  for (
    const email of
    aiAssessment?.recruiterEmails ?? []
  ) {
    add(
      domainFromEmail(email),
      "recruiter_email",
    );
  }

  return Array.from(
    targetMap.entries(),
  ).map(
    ([domain, sources]) => ({
      domain,
      sourceTypes:
        Array.from(sources),
    }),
  );
}