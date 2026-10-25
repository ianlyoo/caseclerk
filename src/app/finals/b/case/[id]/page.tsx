import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CASES, getCase } from "../../_lib/data";
import { fromApi, isRealId, SNAPSHOTS } from "../../_lib/live";
import { CaseView } from "../../_ui/CaseView";

// Samples and the recorded real cases render ahead of time; any other real PayPal id renders on request and the
// page reads it from /api/cases.
export function generateStaticParams() {
  return [...Object.keys(SNAPSHOTS), ...CASES.map((c) => c.id)].map((id) => ({ id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  const c = getCase(id) ?? (SNAPSHOTS[id] ? fromApi(SNAPSHOTS[id]) : undefined);
  return { title: c ? `${c.short}, ${c.buyer}: CaseClerk` : `${id}: CaseClerk` };
}

export default async function CasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!getCase(id) && !isRealId(id)) notFound();
  return (
    <Suspense>
      <CaseView id={id} />
    </Suspense>
  );
}
