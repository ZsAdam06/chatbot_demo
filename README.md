# Tudásbázis-asszisztens – RAG POC

Belső tudásbázis-chatbot pénzügyi szakértőknek: termékszűrés, forrásmegjelölés,
és determinisztikus ellenőrzés, hogy hibás szám ne mehessen ki.

> Minden adat kitalált, kizárólag demó célra.

**Stack (teljesen ingyenes):** Next.js · Google Gemini API (ingyenes keret) · JSON-alapú vektorindex · Vercel Hobby

## Hogyan működik

1. **Indexelés** (`npm run ingest`): a `data/*.md` dokumentumokat fejezetenként darabolja,
   a Gemini embedding modellel vektorizálja, és a `data/index.json`-be menti.
2. **Keresés:** a kérdés vektorát koszinusz-hasonlósággal veti össze a chunkokkal,
   **termékszűréssel** és **érvényességi idő** szerinti szűréssel (a lejárt dokumentum nem kerül elő).
3. **Válasz – három védvonal:**
   - relevanciaküszöb alatt meg sem hívja a modellt („nem találtam”),
   - szigorú prompt + JSON-kimenet, minden mondathoz forrásazonosítóval,
   - **szerveroldali ellenőrzés** (`lib/verify.ts`): minden mondatnak létező forrásra kell
     hivatkoznia, és minden számnak szó szerint szerepelnie kell a hivatkozott forrásban.
     Ha nem, a felület figyelmeztet.

## Futtatás

```bash
npm install
cp .env.example .env.local      # írd bele a GEMINI_API_KEY-t (aistudio.google.com)
npm run ingest                  # -> data/index.json
npm run dev                     # http://localhost:3000
npm test                        # unit tesztek (ellenőrzés, szűrés)
npm run eval                    # kiértékelés a tesztkérdéseken
```

## Deploy (Vercel Hobby, ingyenes)

1. A `data/index.json`-t is commitold, majd pushold a repót GitHubra.
2. vercel.com → Add New → Project → importáld a repót.
3. Environment Variables: `GEMINI_API_KEY`.
4. Deploy.

## Korlátok (POC)

- Kitalált adatok, kis tudásbázis, memóriában tartott index.
- Az ingyenes Gemini keretnél a Google felhasználhatja a beküldött adatokat. Éles
  rendszerben ezért fizetős szint vagy vállalati környezet (pl. Claude az Amazon Bedrockon) kell.
- Éleshez kellene még: valódi dokumentumforrás, jogosultságkezelés, naplózás, nagyobb tesztkészlet.
