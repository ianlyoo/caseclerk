import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CASES, getCase } from "../../_lib/data";
import { CaseView } from "../../_ui/CaseView";

export function generateStaticParams() {
  return CASES.map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const c = getCase((await params).id);
  return { title: c ? `${c.short}, ${c.buyer}: CaseClerk` : "CaseClerk" };
}

export default async function CasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!getCase(id)) notFound();
  return (
    <Suspense>
      <CaseView id={id} />
    </Suspense>
  );
}
