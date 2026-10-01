import { z } from "zod/v4";

export const ScreenshotExtractionSchema =
  z.object({
    extractedText:
      z.string(),

    confidence:
      z.number()
        .min(0)
        .max(1),

    warnings:
      z.array(
        z.string(),
      ),
  });

export type ScreenshotExtraction =
  z.infer<
    typeof ScreenshotExtractionSchema
  >;