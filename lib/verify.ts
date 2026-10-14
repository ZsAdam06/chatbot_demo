import type { Hit, Sentence } from "./types";

// Számok kinyerése: "300 ezer", "1%", "5 és 35" -> ["300", "1", "5", "35"]
export function numbersIn(text: string): string[] {
  return (text.match(/\d+(?:[.,]\d+)?/g) ?? []).map((n) => n.replace(",", "."));
}

/**
 * Determinisztikus ellenőrzés, nem az LLM-re bízzuk:
 *  1. minden mondatnak legalább egy forrásra kell hivatkoznia,
 *  2. a hivatkozott forrásnak a kapott találatok között kell lennie,
 *  3. a mondatban szereplő minden számnak szó szerint elő kell fordulnia a hivatkozott forrásban.
 */
export function verifySentences(
  raw: { text: string; sources: number[] }[],
  hits: Hit[],
): Sentence[] {
  const byId = new Map(hits.map((h) => [h.id, h]));
  return raw.map((s) => {
    const sources = [...new Set(s.sources)];
    if (sources.length === 0) return { ...s, sources, verified: false, issue: "Nincs forrásmegjelölés." };

    const unknown = sources.filter((id) => !byId.has(id));
    if (unknown.length) return { ...s, sources, verified: false, issue: "Nem létező forrásra hivatkozik." };

    const sourceText = sources.map((id) => byId.get(id)!.paragraphs.join(" ")).join(" ");
    const available = new Set(numbersIn(sourceText));
    const missing = numbersIn(s.text).filter((n) => !available.has(n));
    if (missing.length) {
      return { ...s, sources, verified: false, issue: `A forrásban nem szereplő szám: ${missing.join(", ")}` };
    }
    return { ...s, sources, verified: true };
  });
}
