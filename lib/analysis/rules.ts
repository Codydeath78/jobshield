import type {
  AnalysisFinding,
  FindingSeverity,
} from "@/lib/analysis/types";

type ScamRule = {
  id: string;
  category: string;
  severity: FindingSeverity;
  scoreContribution: number;
  title: string;
  explanation: string;
  patterns: RegExp[];
};

const scamRules: ScamRule[] = [
  {
    id: "equipment-check",
    category: "equipment_scam",
    severity: "critical",
    scoreContribution: 40,
    title: "Equipment purchase check",
    explanation:
      "The message appears to involve receiving a check and using the money to purchase work equipment. This is a common job-scam pattern.",
    patterns: [
      /check.{0,100}(equipment|computer|laptop|office supplies)/i,
      /(equipment|computer|laptop|office supplies).{0,100}check/i,
    ],
  },

  {
    id: "check-deposit",
    category: "check_scam",
    severity: "critical",
    scoreContribution: 35,
    title: "Suspicious check deposit request",
    explanation:
      "The message asks the recipient to deposit or cash a check. Fraudulent checks are frequently used in employment scams.",
    patterns: [
      /deposit (the|this|your) check/i,
      /cash (the|this) check/i,
      /mobile deposit/i,
      /e[- ]?check/i,
      /electronic check/i,
    ],
  },

  {
    id: "advance-fee",
    category: "advance_fee",
    severity: "critical",
    scoreContribution: 35,
    title: "Upfront payment request",
    explanation:
      "The message appears to require the applicant to pay money before employment begins. Legitimate hiring processes generally do not require applicants to pay upfront fees.",
    patterns: [
      /(pay|send|transfer).{0,40}(processing|registration|training|application|activation) fee/i,
      /upfront (fee|payment|deposit)/i,
      /(processing|registration|training) fee.{0,40}(pay|send|transfer)/i,
    ],
  },

  {
    id: "gift-card",
    category: "gift_card",
    severity: "critical",
    scoreContribution: 40,
    title: "Gift card request",
    explanation:
      "Gift card payment requests are a strong fraud indicator and are not a normal part of a legitimate hiring process.",
    patterns: [
      /gift card/i,
      /itunes card/i,
      /apple gift card/i,
      /google play card/i,
      /steam card/i,
    ],
  },

  {
    id: "crypto-payment",
    category: "crypto_payment",
    severity: "high",
    scoreContribution: 30,
    title: "Cryptocurrency payment",
    explanation:
      "The communication references cryptocurrency in connection with the hiring or payment process, which may indicate a scam.",
    patterns: [
      /bitcoin/i,
      /cryptocurrency/i,
      /crypto wallet/i,
      /\busdt\b/i,
      /ethereum/i,
    ],
  },

  {
    id: "peer-payment",
    category: "peer_payment",
    severity: "high",
    scoreContribution: 25,
    title: "Peer-to-peer payment request",
    explanation:
      "The message appears to request money through a consumer payment service. This can be a warning sign when combined with a job offer.",
    patterns: [
      /(zelle|cash ?app|venmo).{0,60}(send|pay|transfer)/i,
      /(send|pay|transfer).{0,60}(zelle|cash ?app|venmo)/i,
    ],
  },

  {
    id: "identity-document",
    category: "identity_theft",
    severity: "high",
    scoreContribution: 25,
    title: "Sensitive identity information requested",
    explanation:
      "The message appears to request highly sensitive identity information. Applicants should verify the employer before providing this information.",
    patterns: [
      /(send|provide|upload|email|text).{0,80}(social security number|ssn|passport|driver'?s license)/i,
      /(social security number|ssn|passport|driver'?s license).{0,80}(send|provide|upload|email|text)/i,
    ],
  },

  {
    id: "off-platform-interview",
    category: "suspicious_interview",
    severity: "medium",
    scoreContribution: 15,
    title: "Unusual interview platform",
    explanation:
      "The recruiter appears to be moving the interview to a messaging service commonly used in impersonation scams.",
    patterns: [
      /(telegram|signal|whatsapp).{0,60}(interview|recruiter|hiring manager|hiring process)/i,
      /(interview|recruiter|hiring manager|hiring process).{0,60}(telegram|signal|whatsapp)/i,
    ],
  },

  {
    id: "urgent-payment",
    category: "urgency_manipulation",
    severity: "medium",
    scoreContribution: 15,
    title: "Urgency involving money",
    explanation:
      "The communication creates urgency around a payment or financial action. Artificial urgency is commonly used to reduce careful verification.",
    patterns: [
      /(urgent|immediately|today|within \d+ hours).{0,80}(pay|send|deposit|transfer|purchase)/i,
      /(pay|send|deposit|transfer|purchase).{0,80}(urgent|immediately|today|within \d+ hours)/i,
    ],
  },
];

function getEvidenceSnippet(
  text: string,
  index: number,
  matchLength: number,
) {
  const padding = 60;

  const start = Math.max(0, index - padding);
  const end = Math.min(
    text.length,
    index + matchLength + padding,
  );

  let snippet = text.slice(start, end).trim();

  if (start > 0) {
    snippet = `...${snippet}`;
  }

  if (end < text.length) {
    snippet = `${snippet}...`;
  }

  return snippet;
}

export function runRules(
  input: string,
): AnalysisFinding[] {
  const findings: AnalysisFinding[] = [];

  for (const rule of scamRules) {
    for (const pattern of rule.patterns) {
      const match = pattern.exec(input);

      if (!match) {
        continue;
      }

      findings.push({
  key: `rule:${rule.id}`,
  category: rule.category,
  source: "rules",
  severity: rule.severity,
  title: rule.title,
  explanation: rule.explanation,
  evidence: getEvidenceSnippet(
    input,
    match.index,
    match[0].length,
  ),
  scoreContribution: rule.scoreContribution,
});

      // only create one finding per rule.
      break;
    }
  }

  return findings;
}