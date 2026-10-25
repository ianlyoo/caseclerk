import { notFound } from "next/navigation";
import { CASE_IDS, caseDetail } from "../../../_cases";
import { CaseView } from "../../CaseView";

export const dynamicParams = false;
export const generateStaticParams = () => CASE_IDS.map((id) => ({ id }));

export default async function DraftBCaseById({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!caseDetail(id)) notFound();
  return <CaseView id={id} />;
}
