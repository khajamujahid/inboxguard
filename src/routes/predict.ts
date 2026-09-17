import { createFileRoute } from "@tanstack/react-router";
import { handlePredict } from "@/lib/ml/handler";

export const Route = createFileRoute("/predict")({
  server: {
    handlers: {
      POST: async ({ request }) => handlePredict(request),
    },
  },
});
