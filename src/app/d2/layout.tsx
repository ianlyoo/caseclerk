import type { ReactNode } from "react";
import { Shell, SITE } from "./_ui/Shell";

export const metadata = SITE;

/** /d2 was the redesign's preview path; its routes now send visitors to the same pages at the root. */
export default function D2Layout({ children }: { children: ReactNode }) {
  return <Shell>{children}</Shell>;
}
