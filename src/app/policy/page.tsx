import type { Metadata } from "next";
import { Policy } from "../d2/_views/Policy";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Rules: CaseClerk" };

export default function PolicyPage() {
  return <Policy />;
}
