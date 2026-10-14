import { readFile } from "node:fs/promises";
import { answer } from "../lib/answer";

type Case = { question: string; product: string | null; expectedSource: string | null };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const cases = JSON.parse(await readFile("eval/questions.json", "utf8")) as Case[];
  let ok = 0;
  for (const c of cases) {
    const res = await answer(c.question, c.product);
    const cited = new Set(res.sentences.flatMap((s) => s.sources)
      .map((id) => res.hits.find((h) => h.id === id)?.source));
    const pass = c.expectedSource
      ? res.status === "answered" && cited.has(c.expectedSource) && res.sentences.every((s) => s.verified)
      : res.status === "no_answer";
    if (pass) ok++;
    console.log(`${pass ? "✅" : "❌"} ${c.question}`);
    console.log(`   ${res.status} | top: ${res.hits.slice(0, 3).map((h) => `${h.source}(${h.score.toFixed(2)})`).join(", ")}`);
    await sleep(6500); // ingyenes kvóta: ~10 kérés/perc
  }
  console.log(`\nHelyes viselkedés: ${ok}/${cases.length}`);
  if (ok < cases.length) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
