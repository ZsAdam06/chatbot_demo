import { embed, generateJson } from "./gemini";
import { search } from "./retrieve";
import { verifySentences } from "./verify";
import type { Answer, IndexedChunk } from "./types";
import indexJson from "../data/index.json";

const index = indexJson as IndexedChunk[];

// Ez alatt a hasonlóság alatt meg sem hívjuk a modellt. Az eval és a debug-panel alapján kalibráld!
// Alacsonyabb érték is biztonságos: a modell maga is jelezheti, ha nincs válasz (2. védvonal).
export const MIN_SCORE = Number(process.env.MIN_SCORE ?? 0.5);

const SYSTEM = `Belső tudásbázis-asszisztens vagy pénzügyi szakértők számára.
Szabályok:
- KIZÁRÓLAG a kapott forrásrészletek alapján válaszolj, saját tudást ne használj.
- Ha a források nem tartalmazzák egyértelműen a választ, az "answerable" mező legyen false, a "sentences" üres.
- Minden mondathoz add meg azoknak a forrásoknak az azonosítóját (id), amelyekből származik.
- Számokat, százalékokat, összegeket szó szerint vegyél át; ne kerekíts, ne számolj át.
- Ha a források ellentmondanak egymásnak, jelezd, és ne dönts helyettük.
- Magyarul, tömören válaszolj.`;

const SCHEMA = {
  type: "object",
  properties: {
    answerable: { type: "boolean" },
    sentences: {
      type: "array",
      items: {
        type: "object",
        properties: {
          text: { type: "string" },
          sources: { type: "array", items: { type: "integer" } },
        },
        required: ["text", "sources"],
      },
    },
  },
  required: ["answerable", "sentences"],
};

type ModelOutput = { answerable: boolean; sentences: { text: string; sources: number[] }[] };

export async function answer(question: string, product: string | null): Promise<Answer> {
  const [queryVector] = await embed([question], "RETRIEVAL_QUERY");
  const hits = search(index, queryVector, { product });
  const relevant = hits.filter((h) => h.score >= MIN_SCORE);

  // 1. védvonal: nincs elég releváns forrás -> nem kérdezzük a modellt
  if (relevant.length === 0) return { status: "no_answer", sentences: [], hits };

  const context = relevant
    .map((h) => `<forras id="${h.id}" cim="${h.title} – ${h.section}">\n${h.paragraphs.join("\n")}\n</forras>`)
    .join("\n\n");

  // 2. védvonal: szigorú prompt + strukturált (JSON) kimenet forrásazonosítókkal
  const out = (await generateJson(SYSTEM, `${context}\n\nKérdés: ${question}`, SCHEMA)) as ModelOutput;
  if (!out.answerable || out.sentences.length === 0) return { status: "no_answer", sentences: [], hits };

  // 3. védvonal: determinisztikus ellenőrzés (források és számok)
  return { status: "answered", sentences: verifySentences(out.sentences, relevant), hits };
}
