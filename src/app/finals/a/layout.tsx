import type { ReactNode } from "react";
import { DecisionProvider } from "../_shared/store";
import { fetchRealCases } from "./_real/fetch";
import { RealSeed } from "./ui";

export const metadata = { title: "CaseClerk" };
export const dynamic = "force-dynamic";

// The real cases go to every route from the server, so the nav's waiting count is right in the first HTML.
export default async function FinalALayout({ children }: { children: ReactNode }) {
  return (
    <DecisionProvider>
      <RealSeed cases={await fetchRealCases()}>{children}</RealSeed>
    </DecisionProvider>
  );
}
