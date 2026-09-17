export type SpamLabel = "spam" | "ham";

export type ModelMetrics = {
  accuracy: number;
  f1: number;
  precision: number;
  recall: number;
  n_train: number;
  n_test: number;
  n_features: number;
  spam_rate_train: number;
  dataset: string;
};

export type ModelArtifact = {
  version: number;
  algorithm: string;
  ngram_range: [number, number];
  sublinear_tf: boolean;
  norm: "l2";
  vocabulary: string[];
  idf: number[];
  coef: number[];
  intercept: number;
  metrics: ModelMetrics;
};

export type Signal = {
  term: string;
  weight: number;
  direction: SpamLabel;
};

export type Prediction = {
  label: SpamLabel;
  confidence: number;
  reasons: string[];
  pSpam: number;
  signals: Signal[];
};

export type PredictRequest = {
  subject?: string;
  body?: string;
};
