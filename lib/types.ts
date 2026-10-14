export type IndexedChunk = {
  id: number;
  source: string;
  title: string;
  section: string;
  product: string;
  validFrom: string; // YYYY-MM-DD
  validTo: string;
  paragraphs: string[];
  embedding: number[];
};

export type Hit = Omit<IndexedChunk, "embedding"> & { score: number };

export type Sentence = {
  text: string;
  sources: number[];   // a chunkok id-jai
  verified: boolean;   // a szerveroldali ellenőrzés eredménye
  issue?: string;
};

export type Answer = {
  status: "answered" | "no_answer" | "error";
  sentences: Sentence[];
  hits: Hit[];
  model?: string;
};
