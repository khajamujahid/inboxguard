import { createFileRoute } from "@tanstack/react-router";
import { handleHealth } from "@/lib/ml/handler";

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => handleHealth(),
    },
  },
});
