import { notFound } from "next/navigation";
import { CASE_IDS, caseDetail } from "../../../_shared/cases";
import { CaseView } from "./CaseView";

export function generateStaticParams() {
  return CASE_IDS.map((id) => ({ id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const d = caseDetail((await params).id);
  return { title: d ? `${d.title}, CaseClerk` : "CaseClerk" };
}

export default async function FinalACase({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ state?: string }> }) {
  const { id } = await params;
  const { state } = await searchParams;
  if (!caseDetail(id)) notFound();
  return <CaseView key={`${id}-${state ?? ""}`} id={id} state={state} />;
}
