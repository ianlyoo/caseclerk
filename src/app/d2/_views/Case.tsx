import { notFound } from "next/navigation";
import { getCase, getPolicy } from "../_lib/api";
import { TopBar } from "../_ui/Chrome";
import { CaseView } from "../_ui/CaseView";

export async function Case({ id }: { id: string }) {
  const [b, policy] = await Promise.all([getCase(id), getPolicy()]);
  if (!b) notFound();
  return (
    <div className="metal case-page">
      <TopBar />
      <CaseView initial={b} line={policy?.evidenceApprovalAtUsd ?? 250} serverNow={new Date().toISOString()} />
    </div>
  );
}
