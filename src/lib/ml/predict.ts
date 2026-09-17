import vocabularyA from "./vocabulary-a.json";
import vocabularyB from "./vocabulary-b.json";
import idfA from "./idf-a.json";
import idfB from "./idf-b.json";
import coefA from "./coef-a.json";
import coefB from "./coef-b.json";
import meta from "./meta.json";
import type { ModelArtifact, PredictRequest, Prediction, Signal, SpamLabel } from "./types";
import { reasonsFor } from "./reasons";

const artifact: ModelArtifact = {
  version: meta.version,
  algorithm: meta.algorithm,
  ngram_range: meta.ngram_range as [number, number],
  sublinear_tf: meta.sublinear_tf,
  norm: meta.norm as "l2",
  intercept: meta.intercept,
  metrics: meta.metrics,
  vocabulary: [...vocabularyA, ...vocabularyB],
  idf: [...idfA, ...idfB],
  coef: [...coefA, ...coefB],
};

const TOKEN = /[\p{L}\p{N}_]{2,}/gu;

const vocabIndex = new Map<string, number>();
for (let i = 0; i < artifact.vocabulary.length; i++) {
  vocabIndex.set(artifact.vocabulary[i]!, i);
}

const IDF = artifact.idf;
const COEF = artifact.coef;
const INTERCEPT = artifact.intercept;
const N = artifact.vocabulary.length;
const [NGRAM_LO, NGRAM_HI] = artifact.ngram_range;

function tokenize(text: string): string[] {
  return text.toLowerCase().match(TOKEN) ?? [];
}

function iterNgrams(tokens: string[], emit: (gram: string) => void) {
  const len = tokens.length;
  for (let n = NGRAM_LO; n <= NGRAM_HI; n++) {
    for (let i = 0; i + n <= len; i++) {
      emit(n === 1 ? tokens[i]! : tokens.slice(i, i + n).join(" "));
    }
  }
}

function sigmoid(z: number): number {
  if (z >= 0) {
    const ez = Math.exp(-z);
    return 1 / (1 + ez);
  }
  const ez = Math.exp(z);
  return ez / (1 + ez);
}

function combine(subject: string, body: string): string {
  const s = subject.trim();
  const b = body.trim();
  if (s && b) return `${s}\n\n${b}`;
  return s || b;
}

export function combineEmail(input: PredictRequest): string {
  return combine(input.subject ?? "", input.body ?? "");
}

function vectorize(text: string): Float64Array {
  const tokens = tokenize(text);
  const counts = new Map<number, number>();
  iterNgrams(tokens, (gram) => {
    const idx = vocabIndex.get(gram);
    if (idx === undefined) return;
    counts.set(idx, (counts.get(idx) ?? 0) + 1);
  });

  const values = new Float64Array(N);
  let sumSq = 0;
  for (const [idx, tfRaw] of counts) {
    const tf = artifact.sublinear_tf ? 1 + Math.log(tfRaw) : tfRaw;
    const v = tf * IDF[idx]!;
    values[idx] = v;
    sumSq += v * v;
  }
  if (sumSq > 0 && artifact.norm === "l2") {
    const norm = Math.sqrt(sumSq);
    for (const idx of counts.keys()) {
      values[idx]! /= norm;
    }
  }
  return values;
}

function topSignals(values: Float64Array, label: SpamLabel, k = 8): Signal[] {
  const scored: Signal[] = [];
  for (let i = 0; i < N; i++) {
    const x = values[i]!;
    if (x === 0) continue;
    const weight = x * COEF[i]!;
    if (weight === 0) continue;
    scored.push({
      term: artifact.vocabulary[i]!,
      weight,
      direction: weight > 0 ? "spam" : "ham",
    });
  }
  const want = label === "spam" ? 1 : -1;
  scored.sort((a, b) => {
    const aAlign = Math.sign(a.weight) === want ? 1 : 0;
    const bAlign = Math.sign(b.weight) === want ? 1 : 0;
    if (aAlign !== bAlign) return bAlign - aAlign;
    return Math.abs(b.weight) - Math.abs(a.weight);
  });
  return scored.slice(0, k);
}

export function predictEmail(input: PredictRequest): Prediction {
  const text = combineEmail(input);
  const values = vectorize(text);
  let score = INTERCEPT;
  for (let i = 0; i < N; i++) {
    const x = values[i]!;
    if (x !== 0) score += x * COEF[i]!;
  }
  const pSpam = sigmoid(score);
  const label: SpamLabel = pSpam >= 0.5 ? "spam" : "ham";
  const confidence = label === "spam" ? pSpam : 1 - pSpam;
  const signals = topSignals(values, label);
  const reasons = reasonsFor(text, label, signals);

  return {
    label,
    confidence: round4(confidence),
    reasons,
    pSpam: round4(pSpam),
    signals: signals.slice(0, 5).map((s) => ({
      ...s,
      weight: round4(s.weight),
    })),
  };
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

export const modelMetrics = artifact.metrics;
export const modelAlgorithm = artifact.algorithm;
