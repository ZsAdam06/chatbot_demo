import { test } from "node:test";
import assert from "node:assert/strict";
import { numbersIn, verifySentences } from "./verify";
import type { Hit } from "./types";

const hit: Hit = {
  id: 5, source: "lakashitel-2026.md", title: "Lakáshitel", section: "Minimális önerő", product: "lakashitel",
  validFrom: "2026-01-01", validTo: "9999-12-31", score: 0.8,
  paragraphs: ["A minimális önerő a vételár 10%-a, ha az ügyfél az első lakását vásárolja. Minden más esetben 20%."],
};

test("számok kinyerése", () => {
  assert.deepEqual(numbersIn("300 ezer és 10 millió, 1,5%"), ["300", "10", "1.5"]);
});

test("helyes, forrással alátámasztott mondat", () => {
  const [s] = verifySentences([{ text: "Első lakásnál az önerő 10%.", sources: [5] }], [hit]);
  assert.equal(s.verified, true);
});

test("a forrásban nem szereplő szám -> nem ellenőrzött", () => {
  const [s] = verifySentences([{ text: "Első lakásnál az önerő 15%.", sources: [5] }], [hit]);
  assert.equal(s.verified, false);
  assert.match(s.issue!, /15/);
});

test("forrás nélküli mondat -> nem ellenőrzött", () => {
  const [s] = verifySentences([{ text: "Az önerő 10%.", sources: [] }], [hit]);
  assert.equal(s.verified, false);
});

test("nem létező forrásazonosító -> nem ellenőrzött", () => {
  const [s] = verifySentences([{ text: "Az önerő 10%.", sources: [99] }], [hit]);
  assert.equal(s.verified, false);
});
