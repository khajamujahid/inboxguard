import { z } from "zod";

export const predictRequestSchema = z.object({
  subject: z.string().max(500).optional().default(""),
  body: z.string().max(20000).optional().default(""),
});

export type PredictRequestParsed = z.infer<typeof predictRequestSchema>;
