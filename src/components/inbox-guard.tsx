import { useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Loader2,
  Mail,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ShieldMark } from "@/components/shield-mark";
import { SAMPLE_EMAILS, type SampleEmail } from "@/lib/ml/samples";
import { predictEmail } from "@/lib/ml/predict";
import type { Prediction } from "@/lib/ml/types";
import metrics from "@/lib/ml/metrics.json";
import { cn } from "@/lib/utils";

const pct = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
});

const compact = new Intl.NumberFormat("en-US");

function requestPredict(subject: string, body: string): Prediction {
  try {
    return predictEmail({ subject, body });
  } catch {
    throw new Error("Could not score this email.");
  }
}

export function InboxGuardApp() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [activeSample, setActiveSample] = useState<string | null>(null);
  const [result, setResult] = useState<Prediction | null>(null);
  const [pending, setPending] = useState(false);
  const [resultKey, setResultKey] = useState(0);
  const requestSeq = useRef(0);

  const canSubmit = useMemo(
    () => subject.trim().length > 0 || body.trim().length > 0,
    [subject, body],
  );

  async function runCheck(nextSubject = subject, nextBody = body) {
    if (!nextSubject.trim() && !nextBody.trim()) {
      toast.error("Paste a subject or a body first.");
      return;
    }
    const seq = ++requestSeq.current;
    setPending(true);
    try {
      const prediction = requestPredict(nextSubject, nextBody);
      if (seq !== requestSeq.current) return;
      setResult(prediction);
      setResultKey((k) => k + 1);
    } catch (err) {
      if (seq !== requestSeq.current) return;
      const message = err instanceof Error ? err.message : "Could not score this email.";
      toast.error(message);
    } finally {
      if (seq === requestSeq.current) setPending(false);
    }
  }

  function loadSample(sample: SampleEmail) {
    setSubject(sample.subject);
    setBody(sample.body);
    setActiveSample(sample.id);
    void runCheck(sample.subject, sample.body);
  }

  function reset() {
    requestSeq.current += 1;
    setSubject("");
    setBody("");
    setActiveSample(null);
    setResult(null);
    setPending(false);
  }

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <Header />

      <section className="mt-10 max-w-3xl rise-in sm:mt-14">
        <p className="font-mono text-xs tracking-kicker text-accent uppercase">
          Spam classifier
        </p>
        <h1 className="mt-3 font-display text-4xl font-medium leading-tight tracking-tight text-fg sm:text-5xl md:text-6xl">
          Before you{" "}
          <em className="italic text-accent">click</em>.
        </h1>
        <p className="mt-4 max-w-xl text-base leading-normal text-muted sm:text-lg">
          Paste a subject and body. A TF-IDF logistic model stamps it spam or
          not — with a score and the phrases that moved it. No inbox access.
        </p>
      </section>

      <div className="mt-8 flex flex-wrap gap-2 rise-in-2">
        {SAMPLE_EMAILS.map((sample) => (
          <button
            key={sample.id}
            type="button"
            onClick={() => loadSample(sample)}
            className={cn(
              "inline-flex min-h-11 items-center gap-2 rounded-full px-3.5 text-sm transition-[background-color,color,box-shadow] duration-150 ease-smooth",
              activeSample === sample.id
                ? "bg-accent text-accent-fg"
                : sample.tone === "spam"
                  ? "bg-spam-dim text-spam shadow-[var(--shadow-border)] hover:brightness-110"
                  : "bg-ham-dim text-ham shadow-[var(--shadow-border)] hover:brightness-110",
            )}
          >
            <Mail className="size-3.5" strokeWidth={1.75} />
            <span>{sample.title}</span>
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-5 lg:gap-5">
        <form
          className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] sm:p-5 lg:col-span-3"
          onSubmit={(e) => {
            e.preventDefault();
            void runCheck();
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="font-mono text-xs tracking-kicker text-subtle uppercase">
              Message
            </p>
            <button
              type="button"
              onClick={reset}
              className="inline-flex min-h-11 items-center gap-1.5 text-xs text-muted transition-colors duration-150 hover:text-fg"
            >
              <RotateCcw className="size-3.5" strokeWidth={1.75} />
              Clear
            </button>
          </div>

          <div className="mt-4 grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                name="subject"
                autoComplete="off"
                placeholder="Account alert, intro, digest…"
                value={subject}
                maxLength={500}
                onChange={(e) => {
                  setSubject(e.target.value);
                  setActiveSample(null);
                }}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="body">Body</Label>
              <Textarea
                id="body"
                name="body"
                placeholder="Paste the email body. Never include passwords or real account numbers."
                value={body}
                maxLength={20000}
                onChange={(e) => {
                  setBody(e.target.value);
                  setActiveSample(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    void runCheck();
                  }
                }}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-subtle">
              ⌘ Enter to run · nothing is stored
            </p>
            <Button type="submit" size="lg" disabled={!canSubmit || pending} className="w-full sm:w-auto">
              {pending ? (
                <Loader2 className="size-4 animate-spin" strokeWidth={1.75} />
              ) : (
                <ArrowRight className="size-4" strokeWidth={1.75} />
              )}
              Check email
            </Button>
          </div>
        </form>

        <div className="lg:col-span-2">
          <VerdictPanel key={resultKey} result={result} pending={pending} />
        </div>
      </div>

      <HowItWorks />
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2.5">
        <ShieldMark className="size-8" />
        <div className="leading-tight">
          <p className="text-sm font-medium tracking-tight text-fg">InboxGuard</p>
          <p className="text-xs text-subtle">Mail, inspected</p>
        </div>
      </div>
      <Badge variant="ink" className="font-mono tabular-nums">
        {pct.format(metrics.accuracy)} held-out
      </Badge>
    </header>
  );
}

function VerdictPanel({
  result,
  pending,
}: {
  result: Prediction | null;
  pending: boolean;
}) {
  if (pending) {
    return (
      <aside className="flex min-h-80 flex-col justify-between rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] sm:p-5">
        <p className="font-mono text-xs tracking-kicker text-subtle uppercase">
          Verdict
        </p>
        <div className="flex flex-1 flex-col items-center justify-center gap-3">
          <Loader2 className="size-6 animate-spin text-accent" strokeWidth={1.5} />
          <p className="text-sm text-muted">Reading n-grams…</p>
        </div>
      </aside>
    );
  }

  if (!result) {
    return (
      <aside className="flex min-h-80 flex-col rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] sm:p-5">
        <p className="font-mono text-xs tracking-kicker text-subtle uppercase">
          Verdict
        </p>
        <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
          <div className="flex size-14 items-center justify-center rounded-lg bg-accent-dim">
            <ShieldMark className="size-7 text-accent" />
          </div>
          <p className="mt-4 font-display text-2xl tracking-tight text-fg">
            Awaiting inspection
          </p>
          <p className="mt-2 max-w-xs text-sm leading-normal text-muted">
            Load a sample or paste a message. The stamp and reasons show up here.
          </p>
        </div>
      </aside>
    );
  }

  const isSpam = result.label === "spam";
  const stamp = isSpam ? "Spam" : "Clean";
  const Icon = isSpam ? ShieldAlert : ShieldCheck;

  return (
    <aside
      className={cn(
        "flex min-h-80 flex-col rounded-xl p-4 sm:p-5",
        isSpam ? "bg-spam-dim" : "bg-ham-dim",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-xs tracking-kicker text-subtle uppercase">
          Verdict
        </p>
        <Badge variant={isSpam ? "spam" : "ham"}>{isSpam ? "spam" : "not spam"}</Badge>
      </div>

      <div className="mt-6 flex items-end justify-between gap-4">
        <div>
          <div
            className={cn(
              "stamp-in inline-flex items-center gap-2 font-display text-5xl font-medium tracking-tight italic sm:text-6xl",
              isSpam ? "text-spam" : "text-ham",
            )}
          >
            <Icon className="size-8 sm:size-9" strokeWidth={1.5} />
            {stamp}
          </div>
          <p className="mt-2 text-sm text-muted">
            {pct.format(result.confidence)} confident this is {isSpam ? "junk" : "legitimate"}
          </p>
        </div>
        <p
          className={cn(
            "font-mono text-3xl tabular-nums sm:text-4xl",
            isSpam ? "text-spam" : "text-ham",
          )}
        >
          {pct.format(result.confidence)}
        </p>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between text-xs text-subtle">
          <span>Spam probability</span>
          <span className="font-mono tabular-nums">{pct.format(result.pSpam)}</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface/80">
          <div
            className={cn("bar-fill h-full rounded-full", isSpam ? "bg-spam" : "bg-ham")}
            style={{ width: `${Math.max(2, Math.round(result.pSpam * 1000) / 10)}%` }}
          />
        </div>
      </div>

      <ol className="mt-6 flex flex-1 flex-col gap-2">
        {result.reasons.map((reason, i) => (
          <li
            key={reason}
            className="rise-in flex gap-3 rounded-md bg-surface px-3 py-2.5 text-sm leading-snug text-fg shadow-[var(--shadow-border)]"
          >
            <span
              className={cn(
                "font-mono text-xs tabular-nums",
                isSpam ? "text-spam" : "text-ham",
              )}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <span>{reason}</span>
          </li>
        ))}
      </ol>
    </aside>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Words become numbers",
      body: "TF-IDF weighs each phrase by how unusual it is across the training mail.",
    },
    {
      n: "02",
      title: "A linear stamp",
      body: "Logistic regression learns which n-grams lean spam versus everyday mail.",
    },
    {
      n: "03",
      title: "Readable reasons",
      body: "The top contributing phrases are turned back into sentences you can audit.",
    },
  ];

  return (
    <section className="mt-16 grid gap-6 border-t border-line pt-10 md:grid-cols-3">
      {steps.map((step) => (
        <article key={step.n}>
          <p className="font-mono text-xs tabular-nums text-accent">{step.n}</p>
          <h2 className="mt-2 font-display text-xl tracking-tight text-fg">{step.title}</h2>
          <p className="mt-2 text-sm leading-normal text-muted">{step.body}</p>
        </article>
      ))}
    </section>
  );
}

function Footer() {
  return (
    <footer className="mt-14 flex flex-col gap-3 border-t border-line pt-6 text-xs text-subtle sm:flex-row sm:items-start sm:justify-between">
      <p className="max-w-md leading-normal">
        Trained on the{" "}
        <a
          className="text-accent underline decoration-accent/40 underline-offset-4 transition-colors hover:text-fg"
          href="https://archive.ics.uci.edu/dataset/228/sms+spam+collection"
          target="_blank"
          rel="noreferrer"
        >
          UCI SMS Spam Collection
        </a>{" "}
        plus a synthetic email corpus. {compact.format(metrics.n_train)} train /{" "}
        {compact.format(metrics.n_test)} test · F1 {metrics.f1.toFixed(3)}. Not a
        replacement for your mail provider’s filter.
      </p>
      <p className="font-mono text-subtle">POST /predict · GET /health</p>
    </footer>
  );
}
