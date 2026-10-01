import type {
  AnalysisFinding,
  DomainCheck,
  DomainTarget,
} from "@/lib/analysis/types";

import {
  resolve4,
  resolve6,
  resolveMx,
} from "node:dns/promises";

const MAX_DOMAINS = 10;

const IANA_RDAP_BOOTSTRAP =
  "https://data.iana.org/rdap/dns.json";

const PERSONAL_EMAIL_DOMAINS =
  new Set([
    "gmail.com",
    "yahoo.com",
    "outlook.com",
    "hotmail.com",
    "icloud.com",
    "aol.com",
    "live.com",
    "msn.com",
    "proton.me",
    "protonmail.com",
    "gmx.com",
    "mail.com",
    "ymail.com",
  ]);

type BootstrapData = {
  services: [
    string[],
    string[],
  ][];
};

type RdapEvent = {
  eventAction?: string;
  eventDate?: string;
};

type RdapEntity = {
  roles?: string[];
  handle?: string;
  vcardArray?: unknown;
};

type RdapResponse = {
  objectClassName?: string;
  events?: RdapEvent[];
  entities?: RdapEntity[];
  status?: string[];
};

let bootstrapCache:
  | {
      expiresAt: number;
      data: BootstrapData;
    }
  | null = null;

async function getBootstrap():
  Promise<BootstrapData> {
  const now = Date.now();

  if (
    bootstrapCache &&
    bootstrapCache.expiresAt > now
  ) {
    return bootstrapCache.data;
  }

  const response = await fetch(
    IANA_RDAP_BOOTSTRAP,
    {
      headers: {
        Accept:
          "application/json",
      },

      signal:
        AbortSignal.timeout(5000),
    },
  );

  if (!response.ok) {
    throw new Error(
      `IANA RDAP bootstrap failed: ${response.status}`,
    );
  }

  const data =
    (await response.json()) as BootstrapData;

  bootstrapCache = {
    data,

    // Cache for 24 hours.
    expiresAt:
      now +
      24 * 60 * 60 * 1000,
  };

  return data;
}


async function getRdapBaseUrl(
  domain: string,
): Promise<string | null> {
  const bootstrap =
    await getBootstrap();

  const labels =
    domain
      .toLowerCase()
      .split(".");

  const possibleMatches =
    labels.map(
      (_, index) =>
        labels
          .slice(index)
          .join("."),
    );

  let bestMatch:
    | {
        label: string;
        urls: string[];
      }
    | null = null;

  for (
    const [
      registeredLabels,
      urls,
    ] of bootstrap.services
  ) {
    for (
      const registeredLabel
      of registeredLabels
    ) {
      if (
        !possibleMatches.includes(
          registeredLabel,
        )
      ) {
        continue;
      }

      if (
        !bestMatch ||
        registeredLabel.length >
          bestMatch.label.length
      ) {
        bestMatch = {
          label:
            registeredLabel,

          urls,
        };
      }
    }
  }

  if (!bestMatch) {
    return null;
  }

  return (
    bestMatch.urls.find(
      (url) =>
        url.startsWith(
          "https://",
        ),
    ) ?? null
  );
}


function getRegistrarName(
  entities:
    | RdapEntity[]
    | undefined,
): string | null {
  if (!entities) {
    return null;
  }

  const registrar =
    entities.find((entity) =>
      entity.roles?.includes(
        "registrar",
      ),
    );

  if (!registrar) {
    return null;
  }

  const vcard =
    registrar.vcardArray;

  if (
    Array.isArray(vcard) &&
    Array.isArray(vcard[1])
  ) {
    for (const entry of vcard[1]) {
      if (
        Array.isArray(entry) &&
        entry[0] === "fn" &&
        typeof entry[3] ===
          "string"
      ) {
        return entry[3];
      }
    }
  }

  return registrar.handle ?? null;
}

async function lookupRdap(
  domain: string,
) {
  const baseUrl =
    await getRdapBaseUrl(
      domain,
    );

  if (!baseUrl) {
    return {
      checked: true,
      found: false,
      createdAt: null,
      registrar: null,
      statuses: [] as string[],
    };
  }

  const url =
    `${baseUrl}domain/` +
    encodeURIComponent(domain);

  try {
    const response =
      await fetch(url, {
        headers: {
          Accept:
            "application/rdap+json, application/json",
        },

        signal:
          AbortSignal.timeout(
            6000,
          ),
      });

    if (
      response.status === 404
    ) {
      return {
        checked: true,
        found: false,
        createdAt: null,
        registrar: null,
        statuses:
          [] as string[],
      };
    }

    if (!response.ok) {
      throw new Error(
        `RDAP returned ${response.status}`,
      );
    }

    const data =
      (await response.json()) as RdapResponse;

    const registrationEvent =
      data.events?.find(
        (event) =>
          event.eventAction ===
          "registration",
      );

    return {
      checked: true,
      found: true,

      createdAt:
        registrationEvent?.eventDate ??
        null,

      registrar:
        getRegistrarName(
          data.entities,
        ),

      statuses:
        data.status ?? [],
    };
  } catch (error) {
    console.error(
      `RDAP lookup failed for ${domain}:`,
      error,
    );

    /* Lookup failure is NOT evidence that a domain is malicious. */

    return {
      checked: false,
      found: null,
      createdAt: null,
      registrar: null,
      statuses:
        [] as string[],
    };
  }
}


function isNoDnsRecordError(
  error: unknown,
): boolean {
  if (
    typeof error !== "object" ||
    error === null ||
    !("code" in error)
  ) {
    return false;
  }

  const code = String(
    (error as { code?: unknown }).code,
  );

  return (
    code === "ENODATA" ||
    code === "ENOTFOUND" ||
    code === "NODATA" ||
    code === "NOTFOUND"
  );
}

async function resolveOrEmpty<T>(
  resolver: () => Promise<T[]>,
): Promise<T[]> {
  try {
    return await resolver();
  } catch (error) {
    /* "No record" is a valid DNS result, not an infrastructure failure. */
    if (isNoDnsRecordError(error)) {
      return [];
    }

    throw error;
  }
}

async function checkDns(
  domain: string,
) {
  try {
    const [
      aRecords,
      aaaaRecords,
      mxRecords,
    ] = await Promise.all([
      resolveOrEmpty(
        () => resolve4(domain),
      ),

      resolveOrEmpty(
        () => resolve6(domain),
      ),

      resolveOrEmpty(
        () => resolveMx(domain),
      ),
    ]);

    /*
     * RFC 7505 permits a "Null MX":
     *
     * example.com. MX 0 .
     *
     * That explicitly means the domain does
     * not accept email, so don't count "."
     * as a usable MX server.
     */
    const hasMx =
      mxRecords.some(
        (record) =>
          record.exchange !== ".",
      );

    const hasDns =
      aRecords.length > 0 ||
      aaaaRecords.length > 0 ||
      mxRecords.length > 0;

    return {
      checked: true,
      hasDns,
      hasMx,
    };
  } catch (error) {
    /* A resolver/network failure is different from "the domain has no DNS records." */

    console.error(
      `DNS lookup failed for ${domain}:`,
      error,
    );

    return {
      checked: false,
      hasDns: null,
      hasMx: null,
    };
  }
}


function calculateAgeDays(
  createdAt: string | null,
): number | null {
  if (!createdAt) {
    return null;
  }

  const timestamp =
    new Date(
      createdAt,
    ).getTime();

  if (
    !Number.isFinite(timestamp)
  ) {
    return null;
  }

  const age =
    Date.now() - timestamp;

  if (age < 0) {
    return null;
  }

  return Math.floor(
    age /
      (1000 * 60 * 60 * 24),
  );
}

function createDomainFindings(
  check: DomainCheck,
): AnalysisFinding[] {
  const findings:
    AnalysisFinding[] = [];

  const isRecruiterDomain =
    check.sourceTypes.includes(
      "recruiter_email",
    );

  if (
    isRecruiterDomain &&
    PERSONAL_EMAIL_DOMAINS.has(
      check.domain,
    )
  ) {
    findings.push({
      key:
        `domain:personal-email:${check.domain}`,

      category:
        "personal_email_recruiter",

      source:
        "domain",

      severity:
        "medium",

      title:
        "Recruiter uses a personal email provider",

      explanation:
        `The recruiter appears to be using ${check.domain} rather than a corporate email domain. This does not prove fraud, but it is a useful verification signal.`,

      evidence:
        check.domain,

      scoreContribution:
        15,
    });
  }

  if (
    check.dnsChecked &&
    check.hasDns === false
  ) {
    findings.push({
      key:
        `domain:no-dns:${check.domain}`,

      category:
        "suspicious_domain",

      source:
        "domain",

      severity:
        "high",

      title:
        "Domain has no active DNS records",

      explanation:
        "The domain referenced in the communication did not return A, AAAA, or MX DNS records during verification.",

      evidence:
        check.domain,

      scoreContribution:
        20,
    });
  }

  if (
    isRecruiterDomain &&
    check.dnsChecked &&
    check.hasMx === false
  ) {
    findings.push({
      key:
        `domain:no-mx:${check.domain}`,

      category:
        "suspicious_domain",

      source:
        "domain",

      severity:
        "medium",

      title:
        "Recruiter domain has no MX record",

      explanation:
        "The recruiter's domain did not return an MX record during the check. This is unusual for a domain being used for corporate email, although it is not conclusive by itself.",

      evidence:
        check.domain,

      scoreContribution:
        10,
    });
  }

  const age =
    check.domainAgeDays;

  if (age !== null) {
    if (age < 30) {
      findings.push({
        key:
          `domain:age:${check.domain}`,

        category:
          "suspicious_domain",

        source:
          "domain",

        severity:
          "high",

        title:
          "Very recently registered domain",

        explanation:
          `The domain was registered approximately ${age} days ago. Very new domains can be relevant when evaluating an organization claiming an established recruiting presence.`,

        evidence:
          check.domain,

        scoreContribution:
          25,
      });
    } else if (age < 180) {
      findings.push({
        key:
          `domain:age:${check.domain}`,

        category:
          "suspicious_domain",

        source:
          "domain",

        severity:
          "medium",

        title:
          "Recently registered domain",

        explanation:
          `The domain was registered approximately ${age} days ago. Domain age should be considered alongside the other evidence rather than treated as proof of fraud.`,

        evidence:
          check.domain,

        scoreContribution:
          15,
      });
    } else if (age < 365) {
      findings.push({
        key:
          `domain:age:${check.domain}`,

        category:
          "suspicious_domain",

        source:
          "domain",

        severity:
          "low",

        title:
          "Relatively new domain",

        explanation:
          `The domain is approximately ${age} days old. A newer domain can be useful context during employer verification.`,

        evidence:
          check.domain,

        scoreContribution:
          8,
      });
    }
  }

  return findings;
}

async function checkDomain(
  target: DomainTarget,
): Promise<DomainCheck> {
  const [
    dns,
    rdap,
  ] =
    await Promise.all([
      checkDns(
        target.domain,
      ),

      lookupRdap(
        target.domain,
      ),
    ]);

  return {
    domain:
      target.domain,

    sourceTypes:
      target.sourceTypes,

    dnsChecked:
      dns.checked,

    hasDns:
      dns.hasDns,

    hasMx:
      dns.hasMx,

    rdapChecked:
      rdap.checked,

    rdapFound:
      rdap.found,

    domainCreatedAt:
      rdap.createdAt,

    domainAgeDays:
      calculateAgeDays(
        rdap.createdAt,
      ),

    registrar:
      rdap.registrar,

    rdapStatuses:
      rdap.statuses,
  };
}

export async function runDomainIntelligence(
  targets: DomainTarget[],
): Promise<{
  checks: DomainCheck[];
  findings: AnalysisFinding[];
}> {
  const limitedTargets =
    targets.slice(
      0,
      MAX_DOMAINS,
    );

  const checks =
    await Promise.all(
      limitedTargets.map(
        checkDomain,
      ),
    );

  const findings =
    checks.flatMap(
      createDomainFindings,
    );

  return {
    checks,
    findings,
  };
}