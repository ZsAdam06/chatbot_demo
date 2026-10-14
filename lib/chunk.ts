import matter from "gray-matter";

export type Chunk = {
  source: string;      // fájlnév, pl. "lakashitel-2026.md"
  title: string;       // dokumentum címe
  section: string;     // fejezet címe
  product: string;     // lakashitel | szemelyi_kolcson | bankszamla
  validFrom: Date;
  validTo: Date;
  paragraphs: string[]; // bekezdések -> külön citálható blokkok
  embedText: string;    // ezt vektorizáljuk
};

export function chunkMarkdown(fileName: string, raw: string): Chunk[] {
  const { data, content } = matter(raw);
  const chunks: Chunk[] = [];

  // "## " fejezetek mentén darabolunk: egy fejezet = egy chunk
  const sections = content.split(/^## /m).slice(1);
  for (const section of sections) {
    const [heading, ...rest] = section.split("\n");
    const paragraphs = rest
      .join("\n")
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (paragraphs.length === 0) continue;

    chunks.push({
      source: fileName,
      title: data.title,
      section: heading.trim(),
      product: data.product,
      validFrom: new Date(data.validFrom),
      validTo: new Date(data.validTo),
      paragraphs,
      // A kontextus (cím + fejezet) a szöveg elé kerül: így a
      // "Futamidő" chunk is tudja, hogy melyik termékről szól.
      embedText: `${data.title} – ${heading.trim()}\n${paragraphs.join("\n")}`,
    });
  }
  return chunks;
}
