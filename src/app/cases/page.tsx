import type { Metadata } from "next";
import { Inbox } from "../d2/_views/Inbox";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Cases: CaseClerk" };

export default function CasesPage() {
  return <Inbox />;
}
