"use client";
import { useState } from "react";
import type { Answer } from "@/lib/types";

const PRODUCTS = [
  { value: "", label: "Minden termék" },
  { value: "lakashitel", label: "Lakáshitel" },
  { value: "szemelyi_kolcson", label: "Személyi kölcsön" },
  { value: "bankszamla", label: "Bankszámla" },
];

const EXAMPLES = [
  { q: "Mennyi a minimális önerő első lakás vásárlásakor?", p: "lakashitel" },
  { q: "Mennyibe kerül az előtörlesztés?", p: "szemelyi_kolcson" },
  { q: "Mennyi a lakáshitel THM-je?", p: "lakashitel" },
];

type Response = Answer & { error?: string };

export default function Page() {
  const [question, setQuestion] = useState("");
  const [product, setProduct] = useState("");
  const [result, setResult] = useState<Response | null>(null);
  const [loading, setLoading] = useState(false);

  async function ask(q = question, p = product) {
    if (!q.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, product: p }),
      });
      setResult(await res.json());
    } catch {
      setResult({ status: "error", sentences: [], hits: [], error: "Hálózati hiba." });
    } finally {
      setLoading(false);
    }
  }

  // A hivatkozott források sorszámozása az első előfordulás sorrendjében: [1], [2] ...
  const order: number[] = [];
  result?.sentences.forEach((s) => s.sources.forEach((id) => { if (!order.includes(id)) order.push(id); }));
  const cited = order.map((id) => result!.hits.find((h) => h.id === id)!).filter(Boolean);
  const allVerified = result?.sentences.every((s) => s.verified);

  return (
    <main>
      <header>
        <h1>Tudásbázis-asszisztens</h1>
        <span className="badge">POC – kitalált adatok</span>
      </header>

      <section className="card">
        <div className="chips" role="group" aria-label="Termékszűrő">
          {PRODUCTS.map((p) => (
            <button key={p.value} className="chip" aria-pressed={product === p.value} onClick={() => setProduct(p.value)}>
              {p.label}
            </button>
          ))}
        </div>
        <form className="ask" onSubmit={(e) => { e.preventDefault(); ask(); }}>
          <input value={question} onChange={(e) => setQuestion(e.target.value)} maxLength={300}
                 placeholder="Kérdezz a tudásanyagokból…" aria-label="Kérdés" />
          <button disabled={loading || !question.trim()}>{loading ? "Keresés…" : "Kérdés"}</button>
        </form>
        <div className="examples">
          Példák:{" "}
          {EXAMPLES.map((e) => (
            <button key={e.q} onClick={() => { setQuestion(e.q); setProduct(e.p); ask(e.q, e.p); }}>{e.q}</button>
          ))}
        </div>
      </section>

      {result && (
        <section className="card answer" aria-live="polite">
          {result.status === "error" && <p className="error">{result.error}</p>}

          {result.status === "no_answer" && (
            <>
              <div className="status none">○ Nincs válasz</div>
              <p>A tudásbázisban nem találtam erre vonatkozó információt. Kérlek, ellenőrizd a forrásanyagokat, vagy fordulj a termékgazdához.</p>
            </>
          )}

          {result.status === "answered" && (
            <>
              <div className={`status ${allVerified ? "ok" : "warn"}`}>
                {allVerified ? "✓ Minden állítás forrással alátámasztva" : "⚠ Ellenőrizendő állítás – továbbadás előtt nézd meg a forrást!"}
              </div>
              <p>
                {result.sentences.map((s, i) => (
                  <span key={i}>
                    <span className={s.verified ? undefined : "unverified"}>
                      {s.text}
                      {s.sources.map((id) => <sup key={id}>[{order.indexOf(id) + 1}]</sup>)}
                    </span>{" "}
                    {s.issue && <span className="issue">⚠ {s.issue}</span>}
                  </span>
                ))}
              </p>

              <h2>Források</h2>
              {cited.map((h, i) => (
                <div key={h.id} className="source">
                  <strong>[{i + 1}] {h.title}</strong> – {h.section}
                  <div className="meta">{h.source} · érvényes: {h.validFrom} – {h.validTo === "9999-12-31" ? "visszavonásig" : h.validTo}</div>
                  <blockquote>„{h.paragraphs.join(" ")}”</blockquote>
                </div>
              ))}
            </>
          )}

          {result.hits.length > 0 && (
            <details>
              <summary>Keresési találatok (debug)</summary>
              <table>
                <thead><tr><th>Hasonlóság</th><th>Forrás</th><th>Fejezet</th></tr></thead>
                <tbody>
                  {result.hits.map((h) => (
                    <tr key={h.id}>
                      <td>{h.score.toFixed(3)}</td><td>{h.source}</td><td>{h.section}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          )}
        </section>
      )}

      <footer>Demó: Next.js · Gemini API (ingyenes keret) · vektoros keresés · determinisztikus forrás- és számellenőrzés</footer>
    </main>
  );
}
