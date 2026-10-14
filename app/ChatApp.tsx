"use client";
import { useEffect, useRef, useState } from "react";
import type { Answer, Hit } from "@/lib/types";
import type { KbDoc } from "@/lib/docs";
import {
  IconAlert, IconArrow, IconBack, IconBook, IconCheck, IconChevron, IconClose,
  IconFile, IconPlus, IconSend, IconSlash, IconSpark,
} from "./icons";

const PRODUCTS = [
  { value: "", label: "Minden termék" },
  { value: "lakashitel", label: "Lakáshitel" },
  { value: "szemelyi_kolcson", label: "Személyi kölcsön" },
  { value: "bankszamla", label: "Bankszámla" },
];
const PRODUCT_LABEL: Record<string, string> = Object.fromEntries(PRODUCTS.map((p) => [p.value, p.label]));

const EXAMPLES = [
  { q: "Mennyi a minimális önerő első lakás vásárlásakor?", p: "lakashitel" },
  { q: "Mennyibe kerül az előtörlesztés?", p: "szemelyi_kolcson" },
  { q: "Mennyi a személyi kölcsön THM-je?", p: "szemelyi_kolcson" },
  { q: "Mit tegyek, ha elveszett a bankkártyám?", p: "bankszamla" },
  { q: "Mennyi a lakáshitel THM-je?", p: "lakashitel" },
];

type Result = Answer & { error?: string };
type Msg =
  | { id: number; role: "user"; text: string; product: string }
  | { id: number; role: "bot"; result: Result | null }; // null = a válasz még úton van
type Target = { file: string; section: string | null } | null;

const validity = (from: string, to: string) => `${from} – ${to === "9999-12-31" ? "visszavonásig" : to}`;
const today = () => new Date().toISOString().slice(0, 10);

export default function ChatApp({ docs }: { docs: KbDoc[] }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [question, setQuestion] = useState("");
  const [product, setProduct] = useState("");
  const [target, setTarget] = useState<Target>(null);
  const [panelOpen, setPanelOpen] = useState(false); // keskeny kijelzőn a tudásbázis-panel
  const nextId = useRef(1);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const loading = messages.some((m) => m.role === "bot" && !m.result);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  // a beviteli mező a tartalommal együtt nő (legfeljebb ~5 sorig)
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
    el.style.overflowY = el.scrollHeight > 140 ? "auto" : "hidden";
  }, [question]);

  async function ask(q: string, p: string) {
    q = q.trim();
    if (!q || loading) return;
    const userId = nextId.current++;
    const botId = nextId.current++;
    setMessages((m) => [...m, { id: userId, role: "user", text: q, product: p }, { id: botId, role: "bot", result: null }]);
    setQuestion("");

    let result: Result;
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, product: p }),
      });
      const data = await res.json();
      result = data.status ? data : { status: "error", sentences: [], hits: [], error: data.error ?? "Ismeretlen hiba." };
    } catch {
      result = { status: "error", sentences: [], hits: [], error: "Hálózati hiba – ellenőrizd a kapcsolatot, és próbáld újra." };
    }
    setMessages((m) => m.map((x) => (x.id === botId ? { ...x, result } : x)));
  }

  function openDoc(file: string, section: string | null = null) {
    setTarget({ file, section });
    setPanelOpen(true);
  }

  function reset() {
    setMessages([]);
    setQuestion("");
    inputRef.current?.focus();
  }

  return (
    <div className="app" data-panel={panelOpen ? "open" : "closed"}>
      <KbPanel
        docs={docs}
        target={target}
        onOpen={openDoc}
        onBack={() => setTarget(null)}
        onClose={() => setPanelOpen(false)}
      />
      <div className="scrim" onClick={() => setPanelOpen(false)} aria-hidden="true" />

      <main className="chat">
        <header className="topbar">
          <button className="icon-btn kb-toggle" onClick={() => setPanelOpen(true)} aria-label="Tudásbázis megnyitása">
            <IconBook />
          </button>
          <div className="brand">
            <span className="mark"><IconSpark /></span>
            <div>
              <h1>Tudásbázis-asszisztens</h1>
              <p>Lakáshitel · Személyi kölcsön · Bankszámla</p>
            </div>
          </div>
          <span className="badge">POC – kitalált adatok</span>
          {messages.length > 0 && (
            <button className="ghost-btn new-chat" onClick={reset} aria-label="Új beszélgetés">
              <IconPlus /><span>Új beszélgetés</span>
            </button>
          )}
        </header>

        <div className="scroll">
          <div className={`thread${messages.length === 0 ? " empty" : ""}`} aria-live="polite">
            {messages.length === 0 ? (
              <Welcome onPick={(q, p) => { setProduct(p); ask(q, p); }} />
            ) : (
              messages.map((m) =>
                m.role === "user" ? (
                  <div key={m.id} className="msg user">
                    <div className="bubble">{m.text}</div>
                    {m.product && <span className="filter-tag">Szűrő: {PRODUCT_LABEL[m.product]}</span>}
                  </div>
                ) : (
                  <div key={m.id} className="msg bot">
                    <span className="avatar"><IconSpark /></span>
                    <div className="bot-body">
                      {m.result ? <BotAnswer r={m.result} onOpen={openDoc} /> : <Typing />}
                    </div>
                  </div>
                ),
              )
            )}
            <div ref={endRef} />
          </div>
        </div>

        <form className="composer" onSubmit={(e) => { e.preventDefault(); ask(question, product); }}>
          <div className="composer-box">
            <div className="filters" role="group" aria-label="Termékszűrő">
              {PRODUCTS.map((p) => (
                <button type="button" key={p.value} className="chip" aria-pressed={product === p.value}
                        onClick={() => setProduct(p.value)}>
                  {p.label}
                </button>
              ))}
            </div>
            <div className="field">
              <textarea
                ref={inputRef}
                rows={1}
                value={question}
                maxLength={300}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(question, product); }
                }}
                placeholder="Kérdezz a tudásanyagokból…"
                aria-label="Kérdés"
              />
              <button type="submit" className="send" disabled={loading || !question.trim()} aria-label="Küldés">
                <IconSend />
              </button>
            </div>
          </div>
          <p className="fineprint">
            Gemini API (ingyenes keret) · vektoros keresés · determinisztikus forrás- és számellenőrzés
          </p>
        </form>
      </main>
    </div>
  );
}

function Welcome({ onPick }: { onPick: (q: string, p: string) => void }) {
  return (
    <div className="welcome">
      <span className="avatar lg"><IconSpark /></span>
      <h2>Miben segíthetek?</h2>
      <p>
        A belső tudásbázisból válaszolok lakáshitel, személyi kölcsön és bankszámla témában. Minden állításhoz
        forrást adok, a számokat pedig a rendszer szó szerint ellenőrzi a forrásban.
      </p>
      <ul className="suggestions">
        {EXAMPLES.map((e) => (
          <li key={e.q}>
            <button onClick={() => onPick(e.q, e.p)}>
              <span className="sugg-q">{e.q}</span>
              <span className="tag">{PRODUCT_LABEL[e.p]}</span>
              <IconArrow className="sugg-arrow" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Typing() {
  return (
    <div className="typing" role="status" aria-label="Válasz készül">
      <span /><span /><span />
    </div>
  );
}

function BotAnswer({ r, onOpen }: { r: Result; onOpen: (file: string, section: string | null) => void }) {
  if (r.status === "error") {
    return (
      <div className="notice error"><IconAlert /><p>{r.error}</p></div>
    );
  }

  // A hivatkozott források sorszámozása az első előfordulás sorrendjében: 1, 2 ...
  const order: number[] = [];
  r.sentences.forEach((s) => s.sources.forEach((id) => { if (!order.includes(id)) order.push(id); }));
  const byId = (id: number) => r.hits.find((h) => h.id === id);
  const cited = order.map(byId).filter((h): h is Hit => Boolean(h));
  const allVerified = r.sentences.every((s) => s.verified);

  return (
    <>
      {r.status === "no_answer" ? (
        <>
          <p className="answer">
            A tudásbázisban nem találtam erre vonatkozó információt. Kérlek, ellenőrizd a forrásanyagokat, vagy
            fordulj a termékgazdához.
          </p>
          <span className="verify none"><IconSlash />Nincs alátámasztó forrás – nem találgatok</span>
        </>
      ) : (
        <>
          <p className="answer">
            {r.sentences.map((s, i) => (
              <span key={i} className={s.verified ? undefined : "unverified"}>
                {s.text}
                {s.sources.map((id) => {
                  const h = byId(id);
                  const n = order.indexOf(id) + 1;
                  return (
                    <button key={id} className="cite" aria-label={`${n}. forrás megnyitása`}
                            onClick={() => h && onOpen(h.source, h.section)}>
                      {n}
                    </button>
                  );
                })}
                {s.issue && <span className="issue"><IconAlert />{s.issue}</span>}{" "}
              </span>
            ))}
          </p>
          <span className={`verify ${allVerified ? "ok" : "warn"}`}>
            {allVerified ? <IconCheck /> : <IconAlert />}
            {allVerified ? "Minden állítás forrással alátámasztva" : "Ellenőrizendő állítás – továbbadás előtt nézd meg a forrást!"}
          </span>
        </>
      )}

      <div className="folds">
        {cited.length > 0 && (
          <details className="fold">
            <summary><IconChevron className="chev" />Források<span className="count">{cited.length}</span></summary>
            <ol className="sources">
              {cited.map((h, i) => (
                <li key={h.id}>
                  <span className="num">{i + 1}</span>
                  <div>
                    <div className="src-title">{h.title} <span>· {h.section}</span></div>
                    <blockquote>„{h.paragraphs.join(" ")}”</blockquote>
                    <div className="src-meta">
                      <span className="mono">{h.source}</span> · érvényes: {validity(h.validFrom, h.validTo)}
                    </div>
                    <button className="link-btn" onClick={() => onOpen(h.source, h.section)}>
                      Megnyitás a tudásbázisban<IconArrow />
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          </details>
        )}
        {r.hits.length > 0 && (
          <details className="fold">
            <summary><IconChevron className="chev" />Keresés részletei<span className="count">{r.hits.length}</span></summary>
            <table>
              <thead><tr><th>Hasonlóság</th><th>Forrás</th><th>Fejezet</th></tr></thead>
              <tbody>
                {r.hits.map((h) => (
                  <tr key={h.id}>
                    <td className="score">{h.score.toFixed(3)}</td>
                    <td className="mono">{h.source}</td>
                    <td>{h.section}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        )}
      </div>
    </>
  );
}

function KbPanel({ docs, target, onOpen, onBack, onClose }: {
  docs: KbDoc[];
  target: Target;
  onOpen: (file: string, section?: string | null) => void;
  onBack: () => void;
  onClose: () => void;
}) {
  const doc = target ? docs.find((d) => d.file === target.file) : undefined;

  return (
    <aside className="kb" aria-label="Tudásbázis">
      <div className="kb-head">
        {doc ? (
          <button className="ghost-btn" onClick={onBack}><IconBack /><span>Összes dokumentum</span></button>
        ) : (
          <div>
            <h2>Tudásbázis</h2>
            <p>{docs.length} dokumentum – ezekből dolgozik az asszisztens</p>
          </div>
        )}
        <button className="icon-btn kb-close" onClick={onClose} aria-label="Tudásbázis bezárása"><IconClose /></button>
      </div>
      <div className="kb-body">
        {doc ? <DocView key={`${doc.file}#${target?.section}`} doc={doc} section={target?.section ?? null} />
             : <DocList docs={docs} onOpen={onOpen} />}
      </div>
    </aside>
  );
}

function DocList({ docs, onOpen }: { docs: KbDoc[]; onOpen: (file: string) => void }) {
  return (
    <>
      {PRODUCTS.filter((p) => p.value).map((g) => {
        const items = docs.filter((d) => d.product === g.value);
        if (items.length === 0) return null;
        return (
          <section key={g.value} className="kb-group">
            <h3>{g.label}</h3>
            <ul>
              {items.map((d) => (
                <li key={d.file}>
                  <button className="doc-item" onClick={() => onOpen(d.file)}>
                    <IconFile className="doc-icon" />
                    <span className="doc-text">
                      <span className="doc-title">{d.title}</span>
                      <span className="doc-meta"><span className="mono">{d.file}</span> · {d.sections.length} fejezet</span>
                    </span>
                    {d.validTo < today() && <span className="tag">Lejárt</span>}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}

function DocView({ doc, section }: { doc: KbDoc; section: string | null }) {
  const [raw, setRaw] = useState(false);
  const hitRef = useRef<HTMLElement>(null);
  const expired = doc.validTo < today();

  useEffect(() => {
    hitRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <article className="doc">
      <h2>{doc.title}</h2>
      <dl className="doc-facts">
        <dt>Fájl</dt><dd className="mono">{doc.file}</dd>
        <dt>Termék</dt><dd>{PRODUCT_LABEL[doc.product] ?? doc.product}</dd>
        <dt>Érvényes</dt><dd>{validity(doc.validFrom, doc.validTo)}</dd>
      </dl>
      {expired && (
        <p className="notice muted">
          <IconSlash />
          <span>Lejárt dokumentum: a keresés kihagyja, ezért a válaszokban nem jelenhet meg.</span>
        </p>
      )}
      <div className="seg" role="group" aria-label="Nézet">
        <button aria-pressed={!raw} onClick={() => setRaw(false)}>Olvasó</button>
        <button aria-pressed={raw} onClick={() => setRaw(true)}>Nyers .md</button>
      </div>
      {raw ? (
        <pre className="raw">{doc.raw}</pre>
      ) : (
        <>
          {doc.note && <p className="doc-note">{doc.note}</p>}
          {doc.sections.map((s) => {
            const hit = s.heading === section;
            return (
              <section key={s.heading} ref={hit ? hitRef : undefined} className={hit ? "doc-sec hit" : "doc-sec"}>
                <h3>{s.heading}</h3>
                {s.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
              </section>
            );
          })}
        </>
      )}
    </article>
  );
}
