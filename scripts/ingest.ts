import { readdir, readFile, writeFile } from "node:fs/promises";
import { chunkMarkdown } from "../lib/chunk";
import { embed } from "../lib/gemini";
import type { IndexedChunk } from "../lib/types";

const day = (d: Date) => d.toISOString().slice(0, 10);

async function main() {
  const files = (await readdir("data")).filter((f) => f.endsWith(".md")).sort();
  const chunks = [];
  for (const f of files) chunks.push(...chunkMarkdown(f, await readFile(`data/${f}`, "utf8")));
  console.log(`${files.length} fájl -> ${chunks.length} chunk`);

  const vectors = await embed(chunks.map((c) => c.embedText), "RETRIEVAL_DOCUMENT");
  if (vectors.length !== chunks.length) throw new Error("Az embeddingek száma nem egyezik a chunkokéval.");

  const index: IndexedChunk[] = chunks.map((c, i) => ({
    id: i + 1,
    source: c.source,
    title: c.title,
    section: c.section,
    product: c.product,
    validFrom: day(c.validFrom),
    validTo: day(c.validTo),
    paragraphs: c.paragraphs,
    embedding: vectors[i].map((x) => Number(x.toFixed(6))), // kisebb fájl
  }));

  await writeFile("data/index.json", JSON.stringify(index));
  console.log("Kész: data/index.json");
}

main().catch((e) => { console.error(e); process.exit(1); });
