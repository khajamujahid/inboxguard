import { cn } from "@/lib/utils";

export function ShieldMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("text-accent", className)}
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M16 2.5c.4 0 .8.1 1.5.4 3.4 1.3 7.8 2.4 10.2 2.8.6.1 1.3.6 1.3 1.3v9.6c0 6.3-4.6 11.2-12.4 13.7-.4.1-.8.1-1.2 0C7.6 27.8 3 22.9 3 16.6V7c0-.7.7-1.2 1.3-1.3 2.4-.4 6.8-1.5 10.2-2.8.7-.3 1.1-.4 1.5-.4Z"
      />
      <path
        fill="var(--color-bg)"
        d="M9.2 13.2h13.6c.6 0 1 .5 1 1.1v6.2c0 3.2-3.2 5.4-7.6 6.4-.2 0-.4.1-.6.1s-.4 0-.6-.1c-4.4-1-7.6-3.2-7.6-6.4v-6.2c0-.6.4-1.1 1-1.1Zm2.2 2.2v5.2c0 1.4 1.6 2.6 4.6 3.3 3-0.7 4.6-1.9 4.6-3.3v-5.2H11.4Z"
      />
    </svg>
  );
}
