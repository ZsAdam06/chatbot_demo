import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

export type DocSection = { heading: string; paragraphs: string[] };

export type KbDoc = {
  file: string;
  title: string;
  product: string;
  validFrom: string; // YYYY-MM-DD
  validTo: string;
  note: string | null; // a "> ..." megjegyzés az első fejezet előtt
  sections: DocSection[];
  raw: string; // a teljes .md, frontmatterrel együtt
};

const day = (d: unknown) => (d instanceof Date ? d.toISOString().slice(0, 10) : String(d));

// A tudásbázis dokumentumai a felület olvasónézetéhez. Build időben fut,
// ugyanazzal a "## " fejezetbontással, mint az indexelés (lib/chunk.ts).
export async function loadDocs(): Promise<KbDoc[]> {
  const dir = path.join(process.cwd(), "data");
  const files = (await readdir(dir)).filter((f) => f.endsWith(".md")).sort();
  return Promise.all(
    files.map(async (file) => {
      const raw = await readFile(path.join(dir, file), "utf8");
      const { data, content } = matter(raw);
      const [intro, ...parts] = content.split(/^## /m);
      const note = intro.split("\n").find((l) => l.startsWith(">"))?.replace(/^>\s*/, "").trim() ?? null;
      const sections = parts.map((part) => {
        const [heading, ...rest] = part.split("\n");
        const paragraphs = rest.join("\n").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
        return { heading: heading.trim(), paragraphs };
      });
      return {
        file,
        title: data.title,
        product: data.product,
        validFrom: day(data.validFrom),
        validTo: day(data.validTo),
        note,
        sections,
        raw,
      };
    }),
  );
}
