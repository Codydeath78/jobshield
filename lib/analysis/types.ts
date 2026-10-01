export type AnalysisType =
  | "text"
  | "email"
  | "job_posting"
  | "screenshot"
  | "job_offer"
  | "email_file"
  | "browser_selection";

export type RiskLevel =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type FindingSeverity =
  | "info"
  | "low"
  | "medium"
  | "high"
  | "critical";

export type FindingSource =
  | "rules"
  | "ai"
  | "domain"
  | "url_reputation"
  | "email_header"
  | "company"
  | "community";

export type AnalysisFinding = {
  key: string;
  category: string;
  source: FindingSource;
  severity: FindingSeverity;
  title: string;
  explanation: string;
  evidence: string;
  scoreContribution: number;
};

export type AIPattern = {
  category: string;
  severity: FindingSeverity;
  title: string;
  explanation: string;
  evidence: string;
};

export type AIAssessment = {
  scamLikelihood: number;
  confidence: number;
  summary: string;

  patterns: AIPattern[];

  companyNames: string[];
  recruiterEmails: string[];
  urls: string[];
  paymentMethods: string[];
  requestedSensitiveData: string[];
};

export type ExtractedEntities = {
  emails: string[];
  urls: string[];
  domains: string[];

  companyNames: string[];
  paymentMethods: string[];
  requestedSensitiveData: string[];
};

export type DomainSourceType =
  | "email"
  | "recruiter_email"
  | "url";

export type DomainTarget = {
  domain: string;
  sourceTypes: DomainSourceType[];
};

export type DomainCheck = {
  domain: string;
  sourceTypes: DomainSourceType[];

  dnsChecked: boolean;
  hasDns: boolean | null;
  hasMx: boolean | null;

  rdapChecked: boolean;
  rdapFound: boolean | null;

  domainCreatedAt: string | null;
  domainAgeDays: number | null;

  registrar: string | null;
  rdapStatuses: string[];
};

export type RiskResult = {
  riskScore: number;
  riskLevel: RiskLevel;

  ruleScore: number;
  aiSignal: number;
  domainSignal: number;
  urlSignal: number;
  emailSignal: number;
  communitySignal: number;
};

export type UrlThreatProvider =
  | "phishing_database"
  | "urlhaus";

export type UrlReputationMatch = {
  provider:
    UrlThreatProvider;

  threatType:
    "phishing"
    | "malware";

  target:
    string | null;

  externalId:
    string | null;

  active:
    boolean;
};

export type UrlReputationCheck = {
  url: string;
  normalizedUrl:
    string | null;

  checked:
    boolean;

  matched:
    boolean;

  matches:
    UrlReputationMatch[];
};

export type CompanyVerificationStatus =
  | "registry_and_domain_corroborated"
  | "public_registry_match"
  | "domain_corroborated"
  | "ambiguous_registry_match"
  | "no_public_registry_match"
  | "insufficient_information";

export type CompanyVerification = {
  claimedName: string;

  normalizedName: string;

  status:
    CompanyVerificationStatus;

  registryMatched: boolean;

  registryCompanyName:
    string | null;

  registryCik:
    number | null;

  registryTicker:
    string | null;

  registryExchange:
    string | null;

  registryMatchScore:
    number | null;

  recruiterDomains:
    string[];

  communicationDomains:
    string[];

  alignedDomains:
    string[];
};

export type AnalysisSignals = {
  ruleScore: number;
  aiSignal: number;
  domainSignal: number;
  urlSignal: number;
  emailSignal: number;
  communitySignal: number;

  aiAvailable: boolean;

  aiScamLikelihood:
    number | null;

  aiConfidence:
    number | null;
};

export type AnalysisPipelineResult = {
  analysisId: string;

  riskScore: number;
  riskLevel: RiskLevel;

  summary: string;

  findings:
    AnalysisFinding[];

  signals:
    AnalysisSignals;

  entities:
    ExtractedEntities;

  domainChecks:
    DomainCheck[];

  urlChecks:
    UrlReputationCheck[];

  companyVerifications:
    CompanyVerification[];

  communityChecks:
    CommunityCheck[];
};

export type CommunityIndicatorType =
  | "domain"
  | "url";

export type CommunityCheck = {
  indicatorKey: string;

  indicatorType:
    CommunityIndicatorType;

  displayValue: string;

  distinctReporters:
    number;

  lookbackDays:
    number;
};