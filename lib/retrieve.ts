import type { Hit, IndexedChunk } from "./types";

export function cosine(a: number[], b: number[]): number {
  // a vektorok normalizáltak, így a skaláris szorzat = koszinusz-hasonlóság
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

export function search(
  index: IndexedChunk[],
  queryVector: number[],
  opts: { product?: string | null; today?: string; k?: number } = {},
): Hit[] {
  const today = opts.today ?? new Date().toISOString().slice(0, 10);
  return index
    // 1. metaadat-szűrés: termék + csak a ma érvényes dokumentumok
    .filter((c) => !opts.product || c.product === opts.product)
    .filter((c) => c.validFrom <= today && today <= c.validTo)
    // 2. hasonlóság számítása és rendezés
    .map(({ embedding, ...c }) => ({ ...c, score: cosine(embedding, queryVector) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, opts.k ?? 4);
}
