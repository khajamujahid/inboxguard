import { createFileRoute } from "@tanstack/react-router";
import { handlePredict } from "@/lib/ml/handler";

export const Route = createFileRoute("/api/predict")({
  server: {
    handlers: {
      POST: async ({ request }) => handlePredict(request),
    },
  },
});
