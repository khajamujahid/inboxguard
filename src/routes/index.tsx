import { createFileRoute } from "@tanstack/react-router";
import { InboxGuardApp } from "@/components/inbox-guard";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <InboxGuardApp />;
}
