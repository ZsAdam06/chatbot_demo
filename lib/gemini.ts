import { GoogleGenAI } from "@google/genai";

// A kulcsot a GoogleGenAI a GEMINI_API_KEY környezeti változóból olvassa.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const EMBED_MODEL = "gemini-embedding-001";
export const EMBED_DIM = 768;

// Elsődleges modell + tartalék: ha az ingyenes kvóta elfogy (429),
// a következő modellel próbálkozunk.
const CHAT_MODELS = [
  process.env.GEMINI_MODEL ?? "gemini-3.8-flash",
  "gemini-3.5-flash-lite",
];

// 768 dimenziónál a gemini-embedding-001 vektorait nekünk kell normalizálni.
function normalize(v: number[]): number[] {
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  return v.map((x) => x / norm);
}

export async function embed(
  texts: string[],
  taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY",
): Promise<number[][]> {
  const res = await ai.models.embedContent({
    model: EMBED_MODEL,
    // minden szöveg külön Content -> szövegenként külön vektor
    contents: texts.map((t) => ({ role: "user", parts: [{ text: t }] })),
    config: { taskType, outputDimensionality: EMBED_DIM },
  });
  return (res.embeddings ?? []).map((e) => normalize(e.values ?? []));
}

export async function generateJson(system: string, prompt: string, schema: object): Promise<unknown> {
  let lastError: unknown;
  for (const model of CHAT_MODELS) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: system,
          responseMimeType: "application/json",
          responseJsonSchema: schema,
        },
      });
      return JSON.parse(res.text ?? "{}");
    } catch (e) {
      lastError = e;
      console.warn(`[gemini] ${model} hiba, próbálom a következőt:`, (e as Error).message);
    }
  }
  throw lastError;
}
