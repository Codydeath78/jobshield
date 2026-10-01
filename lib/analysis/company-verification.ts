import {
  getDomain,
} from "tldts";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

import {
  companyNameMatchesDomain,
  companyNameTokens,
  normalizeCompanyName,
  scoreCompanyNameMatch,
} from "@/lib/analysis/company-name";

import type {
  AIAssessment,
  AnalysisFinding,
  CompanyVerification,
  CompanyVerificationStatus,
  ExtractedEntities,
  DomainCheck
} from "@/lib/analysis/types";


const MAX_COMPANIES = 5;

const MIN_REGISTRY_SCORE =
  0.86;


type RegistryRow = {
  cik: number;

  company_name: string;

  normalized_name: string;

  ticker: string;

  exchange:
    string | null;
};


type RegistryCandidate = {
  row: RegistryRow;
  score: number;
};


function unique(
  values: string[],
): string[] {
  return [
    ...new Set(values),
  ];
}


function getRecruiterDomains(
  aiAssessment:
    AIAssessment | null,
): string[] {
  if (!aiAssessment) {
    return [];
  }

  return unique(
    aiAssessment
      .recruiterEmails
      .map((email) => {
        const host =
          email
            .toLowerCase()
            .split("@")[1];

        if (!host) {
          return null;
        }

        return getDomain(
          host,
        );
      })
      .filter(
        (
          domain,
        ): domain is string =>
          domain !== null,
      ),
  );
}


async function findRegistryCandidate(
  claimedName: string,
): Promise<{
  candidate:
    RegistryCandidate | null;

  ambiguous: boolean;
}> {
  const tokens =
    companyNameTokens(
      claimedName,
    );

  if (
    tokens.length === 0
  ) {
    return {
      candidate:
        null,

      ambiguous:
        false,
    };
  }


  const supabase =
    createAdminClient();


  const {
    data,
    error,
  } =
    await supabase
      .from(
        "company_registry_entities",
      )
      .select(
        `
          cik,
          company_name,
          normalized_name,
          ticker,
          exchange
        `,
      )
      .eq(
        "source",
        "sec",
      )
      .overlaps(
        "name_tokens",
        tokens,
      )
      .limit(100);


  if (error) {
    throw error;
  }

  const rows =
    (
      data ?? []
    ) as RegistryRow[];


  /*
   * Multiple securities can belong
   * to the same CIK. Keep one company
   * candidate per CIK for matching.
   */
  const uniqueCiks =
    new Map<
      number,
      RegistryRow
    >();


  for (
    const row of rows
  ) {
    if (
      !uniqueCiks.has(
        row.cik,
      )
    ) {
      uniqueCiks.set(
        row.cik,
        row,
      );
    }
  }


  const candidates =
    Array.from(
      uniqueCiks.values(),
    )
      .map((row) => ({
        row,

        score:
          scoreCompanyNameMatch(
            claimedName,
            row.company_name,
          ),
      }))
      .sort(
        (a, b) =>
          b.score -
          a.score,
      );


  const first =
    candidates[0];

  const second =
    candidates[1];


  if (
    !first ||
    first.score <
      MIN_REGISTRY_SCORE
  ) {
    return {
      candidate:
        null,

      ambiguous:
        false,
    };
  }


  const ambiguous =
    Boolean(
      second &&
      second.row.cik !==
        first.row.cik &&
      Math.abs(
        first.score -
        second.score,
      ) < 0.04,
    );


  return {
    candidate:
      first,

    ambiguous,
  };
}

function determineStatus(
  registryMatched: boolean,
  ambiguous: boolean,
  alignedDomains: string[],
): CompanyVerificationStatus {
  if (ambiguous) {
    return (
      "ambiguous_registry_match"
    );
  }

  if (
    registryMatched &&
    alignedDomains.length > 0
  ) {
    return (
      "registry_and_domain_corroborated"
    );
  }

  if (registryMatched) {
    return (
      "public_registry_match"
    );
  }

  if (
    alignedDomains.length > 0
  ) {
    return (
      "domain_corroborated"
    );
  }

  return (
    "no_public_registry_match"
  );
}

function createVerificationFindings(
  verification:
    CompanyVerification,
): AnalysisFinding[] {
  const findings:
    AnalysisFinding[] = [];


  if (
    verification.registryMatched
  ) {
    findings.push({
      key:
        `company:sec:${verification.registryCik}:${verification.normalizedName}`,

      category:
        "company_registry_match",

      source:
        "company",

      severity:
        "info",

      title:
        "Company name found in SEC public-company registry",

      explanation:
        `${verification.claimedName} closely matches ${verification.registryCompanyName} in JobShield's locally synchronized SEC company registry${
          verification.registryTicker
            ? ` (${verification.registryTicker})`
            : ""
        }. This corroborates the company identity but does not verify the recruiter or job offer.`,

      evidence:
        verification.claimedName,

      scoreContribution:
        0,
    });
  }

  if (
    verification.alignedDomains
      .length > 0
  ) {
    findings.push({
      key:
        `company:domain:${verification.normalizedName}`,

      category:
        "company_domain_alignment",

      source:
        "company",

      severity:
        "info",

      title:
        "Active domain is consistent with company name",

      explanation:
        `The active domain ${
         verification.alignedDomains[0]
         } is consistent with the claimed company name. JobShield confirmed that the domain has active DNS infrastructure, but name similarity does not prove that the sender represents the company or that the job offer is legitimate.`,

      evidence:
        verification
          .alignedDomains[0],

      scoreContribution:
        0,
    });
  }


  return findings;
}

export async function runCompanyVerification(
  entities:
    ExtractedEntities,

  aiAssessment:
    AIAssessment | null,

  domainChecks:
    DomainCheck[],
): Promise<{
  verifications:
    CompanyVerification[];

  findings:
    AnalysisFinding[];
}> {
  const companyNames =
    unique(
      entities.companyNames,
    ).slice(
      0,
      MAX_COMPANIES,
    );


  if (
    companyNames.length === 0
  ) {
    return {
      verifications: [],
      findings: [],
    };
  }


  const recruiterDomains =
    getRecruiterDomains(
      aiAssessment,
    );


  const communicationDomains =
    unique(
      entities.domains,
    );

  
  const activeDomains =
  communicationDomains.filter(
    (domain) => {
      const check =
        domainChecks.find(
          (item) =>
            item.domain === domain,
        );

      return (
        check?.dnsChecked === true &&
        check.hasDns === true
      );
    },
  );


  const verifications:
    CompanyVerification[] = [];


  for (
    const companyName
    of companyNames
  ) {
    const {
      candidate,
      ambiguous,
    } =
      await findRegistryCandidate(
        companyName,
      );


    const alignedDomains =
      activeDomains
        .filter(
          (domain) =>
            companyNameMatchesDomain(
              companyName,
              domain,
            ),
        );


    const registryMatched =
      Boolean(
        candidate &&
        !ambiguous,
      );


    const status =
      determineStatus(
        registryMatched,
        ambiguous,
        alignedDomains,
      );


    verifications.push({
      claimedName:
        companyName,

      normalizedName:
        normalizeCompanyName(
          companyName,
        ),

      status,

      registryMatched,

      registryCompanyName:
        registryMatched
          ? candidate!
              .row
              .company_name
          : null,

      registryCik:
        registryMatched
          ? candidate!
              .row
              .cik
          : null,

      registryTicker:
        registryMatched
          ? candidate!
              .row
              .ticker
          : null,

      registryExchange:
        registryMatched
          ? candidate!
              .row
              .exchange
          : null,

      registryMatchScore:
        candidate
          ? candidate.score
          : null,

      recruiterDomains,

      communicationDomains,

      alignedDomains,
    });
  }

  return {
    verifications,

    findings:
      verifications.flatMap(
        createVerificationFindings,
      ),
  };
}