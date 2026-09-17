import { modelAlgorithm, modelMetrics, predictEmail } from "./predict";
import { predictRequestSchema } from "./schema";

export async function handlePredict(request: Request): Promise<Response> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json(
      { error: "Body must be JSON: { subject, body }" },
      { status: 400 },
    );
  }

  const parsed = predictRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const subject = parsed.data.subject.trim();
  const body = parsed.data.body.trim();
  if (!subject && !body) {
    return Response.json(
      { error: "Provide a subject or a body" },
      { status: 400 },
    );
  }

  const result = predictEmail({ subject, body });
  return Response.json({
    label: result.label,
    confidence: result.confidence,
    reasons: result.reasons,
    pSpam: result.pSpam,
    signals: result.signals,
  });
}

export function handleHealth(): Response {
  return Response.json({
    status: "ok",
    model: modelAlgorithm,
    metrics: modelMetrics,
  });
}
