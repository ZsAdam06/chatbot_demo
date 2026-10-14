import { NextResponse } from "next/server";
import { answer } from "@/lib/answer";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { question, product } = (await req.json()) as { question?: string; product?: string | null };
  const q = question?.trim() ?? "";
  if (!q) return NextResponse.json({ error: "Üres kérdés." }, { status: 400 });
  if (q.length > 300) return NextResponse.json({ error: "Túl hosszú kérdés (max. 300 karakter)." }, { status: 400 });

  try {
    return NextResponse.json(await answer(q, product || null));
  } catch (e) {
    console.error(e);
    // pl. elfogyott az ingyenes kvóta: a felület érthető hibaüzenetet mutat
    return NextResponse.json(
      { status: "error", sentences: [], hits: [], error: "A nyelvi modell most nem érhető el. Próbáld újra egy perc múlva." },
      { status: 503 },
    );
  }
}
