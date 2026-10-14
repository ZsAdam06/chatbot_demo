import { test } from "node:test";
import assert from "node:assert/strict";
import { search } from "./retrieve";
import type { IndexedChunk } from "./types";

const base = { title: "t", section: "s", paragraphs: ["p"], validTo: "9999-12-31" };
const index: IndexedChunk[] = [
  { ...base, id: 1, source: "lakashitel-2025.md", product: "lakashitel", validFrom: "2025-01-01", validTo: "2025-12-31", embedding: [1, 0] },
  { ...base, id: 2, source: "lakashitel-2026.md", product: "lakashitel", validFrom: "2026-01-01", embedding: [0.9, 0.436] },
  { ...base, id: 3, source: "bankszamla.md", product: "bankszamla", validFrom: "2026-01-01", embedding: [0, 1] },
];

test("a lejárt dokumentum akkor sem kerül elő, ha a leghasonlóbb", () => {
  const hits = search(index, [1, 0], { today: "2026-10-15" });
  assert.ok(!hits.some((h) => h.source === "lakashitel-2025.md"));
  assert.equal(hits[0].source, "lakashitel-2026.md");
});

test("termékszűrő", () => {
  const hits = search(index, [1, 0], { product: "bankszamla", today: "2026-10-15" });
  assert.deepEqual(hits.map((h) => h.id), [3]);
});

test("a találat nem tartalmazza az embeddinget (kisebb API-válasz)", () => {
  const [h] = search(index, [1, 0], { today: "2026-10-15" });
  assert.equal("embedding" in h, false);
});
