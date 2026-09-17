const SAMPLES = [
  { id: "phishing", title: "Phishing bank email", tone: "spam", subject: "Urgent: Your Chase account is locked", body: "We detected unusual activity on your Chase account. Verify your account immediately or it will be suspended. Click here to restore access: http://chase-secure-login.xyz/verify Enter your password and SSN. Act now — this is a final notice." },
  { id: "recruiter", title: "Recruiter email", tone: "ham", subject: "Frontend role at Northwind — intro", body: "Hi, I came across your portfolio and thought you'd be a fit for a staff frontend role on our design systems team. Would you have 20 minutes Thursday to chat? No take-home until after the intro. Best, Mara Chen, recruiting." },
  { id: "newsletter", title: "Newsletter", tone: "ham", subject: "InboxGuard digest — what shipped in March", body: "Here's what we shipped this month: tighter false-positive handling, a new reasons panel, and mobile layout fixes. Read the notes on our blog. You're receiving this because you subscribed. Unsubscribe anytime." },
  { id: "prize", title: "Prize scam", tone: "spam", subject: "CONGRATULATIONS YOU WON $2,500,000", body: "You have been selected as a winner of the international lottery. To claim your prize send a processing fee via gift cards. Act now limited time. Reply with your full name and bank details." },
  { id: "notes", title: "Meeting notes", tone: "ham", subject: "Notes from Tuesday sync", body: "Thanks for joining. Action items: Alex will send the Figma link, I'll update the timeline, and we'll reconvene Friday 10am. Let me know if I missed anything." },
];

const HEURISTICS = [
  { toward: "spam", reason: "Contains urgency phrases like 'act now'", words: ["act now", "urgent", "immediately", "final notice", "account is locked", "verify your account", "limited time", "expires today"] },
  { toward: "spam", reason: "Mentions money / prize", words: ["winner", "you won", "prize", "lottery", "jackpot", "gift card", "processing fee", "bitcoin", "wire transfer"] },
  { toward: "spam", reason: "Suspicious link-like text", words: [".xyz", "bit.ly", "tinyurl", "click here"] },
  { toward: "spam", reason: "Asks for passwords or sensitive details", words: ["password", "ssn", "social security", "credit card", "bank details", "gift card code"] },
  { toward: "spam", reason: "Threatens account loss or a countdown", words: ["suspended", "terminated", "account will be deleted", "do not ignore"] },
  { toward: "ham", reason: "Reads like a recruiter or colleague, not a blast", words: ["portfolio", "take-home", "interview", "recruiting", "would you have"] },
  { toward: "ham", reason: "Looks like meeting notes or a calendar change", words: ["action items", "reconvene", "let me know if i missed"] },
  { toward: "ham", reason: "Matches a subscribed newsletter (opt-in, unsubscribe)", words: ["unsubscribe", "receiving this because", "what we shipped"] },
];

function hasWord(text, word) {
  return text.indexOf(word) !== -1;
}

function hit(h, text) {
  return h.words.some((w) => hasWord(text, w));
}

function pct(n) {
  return (n * 100).toFixed(1) + "%";
}

function reasonsFor(text, label) {
  const out = [];
  for (const h of HEURISTICS) {
    if (h.toward === label && hit(h, text)) out.push(h.reason);
  }
  if (label === "ham") {
    out.push("No urgency, prize, or password-harvest language");
    out.push("Tone matches ordinary correspondence");
  }
  if (!out.length) {
    out.push(label === "spam" ? "Looks like a spam-style pitch" : "Reads like ordinary mail");
  }
  return out.slice(0, 5);
}

function predictHeuristic(subject, body) {
  const text = (subject + " " + body).toLowerCase();
  const spamHits = HEURISTICS.filter((h) => h.toward === "spam" && hit(h, text)).length;
  const hamHits = HEURISTICS.filter((h) => h.toward === "ham" && hit(h, text)).length;
  const label = spamHits > hamHits ? "spam" : "ham";
  const pSpam = label === "spam" ? Math.min(0.94, 0.58 + spamHits * 0.12) : Math.max(0.06, 0.28 - hamHits * 0.06);
  return { label, confidence: label === "spam" ? pSpam : 1 - pSpam, pSpam, reasons: reasonsFor(text, label) };
}

let model = null;
const BASES = [
  "./model",
  "https://cdn.jsdelivr.net/gh/khajamujahid/inboxguard@main/src/lib/ml",
  "https://raw.githubusercontent.com/khajamujahid/inboxguard/main/src/lib/ml",
];

async function loadJson(base, name) {
  const res = await fetch(base + "/" + name);
  if (!res.ok) throw new Error(name);
  return res.json();
}

async function loadModel() {
  let lastErr;
  for (const base of BASES) {
    try {
      const parts = await Promise.all([
        loadJson(base, "vocabulary-a.json"),
        loadJson(base, "vocabulary-b.json"),
        loadJson(base, "idf-a.json"),
        loadJson(base, "idf-b.json"),
        loadJson(base, "coef-a.json"),
        loadJson(base, "coef-b.json"),
        loadJson(base, "meta.json"),
      ]);
      const vocab = parts[0].concat(parts[1]);
      const vocabIndex = new Map();
      vocab.forEach((t, i) => vocabIndex.set(t, i));
      model = {
        vocab: vocab,
        vocabIndex: vocabIndex,
        idf: parts[2].concat(parts[3]),
        coef: parts[4].concat(parts[5]),
        intercept: parts[6].intercept,
        ngram: parts[6].ngram_range,
        metrics: parts[6].metrics,
      };
      const acc = document.getElementById("acc");
      if (acc && model.metrics && model.metrics.accuracy) {
        acc.textContent = (model.metrics.accuracy * 100).toFixed(1) + "% held-out";
      }
      return;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error("no model");
}

function tokenize(text) {
  const out = [];
  let cur = "";
  for (let i = 0; i < text.length; i++) {
    const c = text.charAt(i);
    if ((c >= "a" && c <= "z") || (c >= "0" && c <= "9") || c === "_") cur += c;
    else {
      if (cur.length >= 2) out.push(cur);
      cur = "";
    }
  }
  if (cur.length >= 2) out.push(cur);
  return out;
}

function predictEmail(subject, body) {
  const text = (subject + "  " + body).trim().toLowerCase();
  const tokens = tokenize(text);
  const counts = new Map();
  const ngram = model.ngram;
  for (let n = ngram[0]; n <= ngram[1]; n++) {
    for (let i = 0; i + n <= tokens.length; i++) {
      const gram = n === 1 ? tokens[i] : tokens.slice(i, i + n).join(" ");
      const idx = model.vocabIndex.get(gram);
      if (idx === undefined) continue;
      counts.set(idx, (counts.get(idx) || 0) + 1);
    }
  }
  const values = new Float64Array(model.idf.length);
  let sumSq = 0;
  counts.forEach((tfRaw, idx) => {
    const v = (1 + Math.log(tfRaw)) * model.idf[idx];
    values[idx] = v;
    sumSq += v * v;
  });
  if (sumSq > 0) {
    const norm = Math.sqrt(sumSq);
    counts.forEach((_, idx) => {
      values[idx] /= norm;
    });
  }
  let score = model.intercept;
  counts.forEach((_, idx) => {
    score += values[idx] * model.coef[idx];
  });
  const pSpam = score >= 0 ? 1 / (1 + Math.exp(-score)) : Math.exp(score) / (1 + Math.exp(score));
  const label = pSpam >= 0.5 ? "spam" : "ham";
  return { label: label, confidence: label === "spam" ? pSpam : 1 - pSpam, pSpam: pSpam, reasons: reasonsFor(text, label) };
}

function renderVerdict(result) {
  const el = document.getElementById("verdict");
  if (!result) {
    el.className = "card verdict";
    el.innerHTML = '<p class="kicker" style="color:var(--subtle);margin:0">Verdict</p><div class="await"><p>Load a sample or paste a message. The stamp and reasons show up here.</p></div>';
    return;
  }
  const spam = result.label === "spam";
  el.className = "card verdict " + (spam ? "spam-bg" : "ham-bg");
  const items = result.reasons.map((r, i) => '<li><span class="n ' + (spam ? "spam-c" : "ham-c") + '">' + String(i + 1).padStart(2, "0") + "</span><span>" + r + "</span></li>").join("");
  el.innerHTML =
    '<div style="display:flex;justify-content:space-between;align-items:center"><p class="kicker" style="color:var(--subtle);margin:0">Verdict</p><span class="badge">' +
    (spam ? "spam" : "not spam") +
    '</span></div><div class="stamp ' +
    (spam ? "spam-c" : "ham-c") +
    '">' +
    (spam ? "Spam" : "Clean") +
    '</div><p style="margin:.4rem 0 0;color:var(--muted)">' +
    pct(result.confidence) +
    " confident this is " +
    (spam ? "junk" : "legitimate") +
    '</p><div style="margin-top:1.1rem"><div style="display:flex;justify-content:space-between;font-size:.75rem;color:var(--subtle)"><span>Spam probability</span><span>' +
    pct(result.pSpam) +
    '</span></div><div class="bar"><span style="width:' +
    Math.max(2, result.pSpam * 100) +
    "%;background:" +
    (spam ? "var(--spam)" : "var(--ham)") +
    '"></span></div></div><ol>' +
    items +
    "</ol>";
}

function setStatus(msg) {
  const el = document.getElementById("status");
  el.hidden = !msg;
  el.textContent = msg || "";
}

async function runCheck() {
  const subject = document.getElementById("subject").value;
  const body = document.getElementById("body").value;
  if (!subject.trim() && !body.trim()) {
    setStatus("Paste a subject or a body first.");
    return;
  }
  setStatus("");
  if (!model) {
    try {
      await loadModel();
    } catch (e) {}
  }
  renderVerdict(model ? predictEmail(subject, body) : predictHeuristic(subject, body));
}

const samplesEl = document.getElementById("samples");
SAMPLES.forEach((s) => {
  const b = document.createElement("button");
  b.type = "button";
  b.className = s.tone;
  b.textContent = s.title;
  b.addEventListener("click", () => {
    document.querySelectorAll(".samples button").forEach((x) => x.classList.remove("on"));
    b.classList.add("on");
    document.getElementById("subject").value = s.subject;
    document.getElementById("body").value = s.body;
    runCheck();
  });
  samplesEl.appendChild(b);
});

document.getElementById("form").addEventListener("submit", (e) => {
  e.preventDefault();
  document.querySelectorAll(".samples button").forEach((x) => x.classList.remove("on"));
  runCheck();
});
document.getElementById("clear").addEventListener("click", () => {
  document.getElementById("subject").value = "";
  document.getElementById("body").value = "";
  document.querySelectorAll(".samples button").forEach((x) => x.classList.remove("on"));
  renderVerdict(null);
  setStatus("");
});
document.getElementById("body").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
    e.preventDefault();
    runCheck();
  }
});

loadModel().catch(() => {});
