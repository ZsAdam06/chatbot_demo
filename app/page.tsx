import { loadDocs } from "@/lib/docs";
import ChatApp from "./ChatApp";

// A tudásbázis dokumentumait build időben olvassuk be, a chat kliensoldalon fut.
export default async function Page() {
  return <ChatApp docs={await loadDocs()} />;
}
