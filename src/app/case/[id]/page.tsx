import type { Metadata } from "next";
import { Case } from "../../d2/_views/Case";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: `${decodeURIComponent(id)}: CaseClerk` };
}

export default async function CasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <Case id={decodeURIComponent(id)} />;
}
