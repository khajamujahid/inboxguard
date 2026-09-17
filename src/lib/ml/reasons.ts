import type { Signal, SpamLabel } from "./types";

type Heuristic = {
  id: string;
  reason: string;
  test: (text: string) => boolean;
  toward: SpamLabel;
};

const HEURISTICS: Heuristic[] = [
  {
    id: "urgency",
    toward: "spam",
    reason: "Contains urgency phrases like 'act now'",
    test: (t) =>
      /\b(act now|urgent|immediately|final notice|account (is )?locked|verify (your )?account|limited time|expires today)\b/i.test(
        t,
      ),
  },
  {
    id: "money",
    toward: "spam",
    reason: "Mentions money / prize",
    test: (t) =>
      /\b(winner|you won|prize|lottery|jackpot|free money|guaranteed returns|wire transfer|gift cards?|processing fee|bitcoin|crypto trading)\b/i.test(
        t,
      ) || /\$\s?\d{2,}/.test(t),
  },
  {
    id: "link",
    toward: "spam",
    reason: "Suspicious link-like text",
    test: (t) =>
      /https?:\/\/[^\s]*\.(xyz|ru|top|click|gq|tk)\b/i.test(t) ||
      /\b(bit\.ly|tinyurl|click here)\b/i.test(t),
  },
  {
    id: "secrets",
    toward: "spam",
    reason: "Asks for passwords or sensitive details",
    test: (t) =>
      /\b(password|ssn|social security|credit card|pin|bank details|gift card codes?)\b/i.test(
        t,
      ),
  },
  {
    id: "threat",
    toward: "spam",
    reason: "Threatens account loss or a countdown",
    test: (t) =>
      /\b(suspended|terminated|permanently closed|account will be deleted|forfeit|do not ignore)\b/i.test(
        t,
      ),
  },
  {
    id: "caps",
    toward: "spam",
    reason: "Unusually high share of ALL-CAPS words",
    test: (t) => {
      const words = t.split(/\s+/).filter((w) => w.replace(/[^A-Za-z]/g, "").length >= 4);
      if (words.length < 6) return false;
      const caps = words.filter((w) => /^[^a-z]*[A-Z]{4,}[^a-z]*$/.test(w));
      return caps.length / words.length >= 0.28;
    },
  },
  {
    id: "recruiter",
    toward: "ham",
    reason: "Reads like a recruiter or colleague, not a blast",
    test: (t) =>
      /\b(portfolio|intro|take-home|interview|recruiting|would you have|role on our team)\b/i.test(
        t,
      ),
  },
  {
    id: "meeting",
    toward: "ham",
    reason: "Looks like meeting notes or a calendar change",
    test: (t) =>
      /\b(action items|reconvene|sync|1:1|agenda|let me know if I missed)\b/i.test(
        t,
      ),
  },
  {
    id: "newsletter",
    toward: "ham",
    reason: "Matches a subscribed newsletter (opt-in, unsubscribe)",
    test: (t) =>
      /\b(unsubscribe|you('re| are) receiving this because|opted in|digest|what we shipped)\b/i.test(
        t,
      ),
  },
];

const STOP = new Set([
  "the","and","for","you","your","to","of","in","on","is","it","this","that","with","from","are","be","as","at","or","we","if","will","can","have","has","was","were","not","but","our","out","any","all","just","about","what","when","would","could","should","because","there","here","been","than","then","them","they","know","like","home","role","week","time","please","thanks","hello","http","https","com",
]);

function phraseReason(term: string, direction: SpamLabel): string {
  const quoted = `\u201c${term}\u201d`;
  if (direction === "spam") return `Heavy spam signal: ${quoted}`;
  return `Everyday phrasing: ${quoted}`;
}

function usefulTerm(term: string, label: SpamLabel): boolean {
  const words = term.split(" ");
  if (words.every((w) => STOP.has(w))) return false;
  if (/^\d+$/.test(term)) return false;
  if (words.length === 1) {
    if (STOP.has(term)) return false;
    if (term.length < 5) return false;
    if (label === "ham") return false;
  }
  return true;
}

export function reasonsFor(text: string, label: SpamLabel, signals: Signal[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (reason: string) => {
    const key = reason.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(reason);
  };
  for (const h of HEURISTICS) {
    if (h.toward !== label) continue;
    if (h.test(text)) push(h.reason);
  }
  for (const s of signals) {
    if (s.direction !== label) continue;
    if (!usefulTerm(s.term, label)) continue;
    if (Math.abs(s.weight) < 0.08) continue;
    push(phraseReason(s.term, s.direction));
    if (out.length >= 5) break;
  }
  if (label === "ham") {
    push("No urgency, prize, or password-harvest language");
    push("Tone matches ordinary correspondence");
  }
  if (out.length === 0) {
    push(
      label === "spam"
        ? "The classifier found a spam-like n-gram pattern"
        : "No strong spam n-grams; reads like ordinary mail",
    );
  }
  return out.slice(0, 5);
}
