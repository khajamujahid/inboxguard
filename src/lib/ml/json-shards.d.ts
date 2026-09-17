declare module "./vocabulary-a.json" { const vocabularyA: string[]; export default vocabularyA; }
declare module "./vocabulary-b.json" { const vocabularyB: string[]; export default vocabularyB; }
declare module "./idf-a.json" { const idfA: number[]; export default idfA; }
declare module "./idf-b.json" { const idfB: number[]; export default idfB; }
declare module "./coef-a.json" { const coefA: number[]; export default coefA; }
declare module "./coef-b.json" { const coefB: number[]; export default coefB; }
declare module "./meta.json" {
  const meta: {
    version: number; algorithm: string; ngram_range: [number, number];
    sublinear_tf: boolean; norm: "l2"; intercept: number;
    metrics: import("./types").ModelMetrics;
  };
  export default meta;
}
