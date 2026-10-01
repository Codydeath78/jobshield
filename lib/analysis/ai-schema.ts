import { z } from "zod/v4";

export const ScamCategorySchema = z.enum([
  "PAYMENT_SCAM",
  "CHECK_SCAM",
  "EQUIPMENT_SCAM",
  "CRYPTO_SCAM",
  "IDENTITY_THEFT",
  "PHISHING",
  "IMPERSONATION",
  "FAKE_RECRUITER",
  "FAKE_COMPANY",
  "MONEY_MULE",
  "RESUME_HARVESTING",
  "UNREALISTIC_COMPENSATION",
  "SUSPICIOUS_INTERVIEW",
  "SUSPICIOUS_DOMAIN",
  "PERSONAL_EMAIL_RECRUITER",
  "OFF_PLATFORM_COMMUNICATION",
  "URGENCY_MANIPULATION",
  "ADVANCE_FEE",
  "OTHER",
]);

export const SeveritySchema = z.enum([
  "info",
  "low",
  "medium",
  "high",
  "critical",
]);

export const AIAnalysisSchema = z.object({
  scamLikelihood: z
    .number()
    .int()
    .min(0)
    .max(100),

  confidence: z
    .number()
    .min(0)
    .max(1),

  summary: z.string(),

  patterns: z.array(
    z.object({
      category: ScamCategorySchema,

      severity: SeveritySchema,

      title: z.string(),

      explanation: z.string(),

      evidence: z.string(),
    }),
  ),

  companyNames: z.array(z.string()),

  recruiterEmails: z.array(z.string()),

  urls: z.array(z.string()),

  paymentMethods: z.array(z.string()),

  requestedSensitiveData: z.array(
    z.string(),
  ),
});

export type AIAnalysisOutput = z.infer<
  typeof AIAnalysisSchema
>;