import type { ReactNode } from "react";
import { DecisionProvider } from "../_shared/store";

export const metadata = { title: "CaseClerk" };

export default function FinalALayout({ children }: { children: ReactNode }) {
  return <DecisionProvider>{children}</DecisionProvider>;
}
