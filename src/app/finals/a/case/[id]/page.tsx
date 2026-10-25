import { notFound } from "next/navigation";
import { CASE_IDS, caseDetail } from "../../../_shared/cases";
import { headline, thingOf, type ApiCase } from "../../_real/model";
import { CASE_ID, UPSTREAM } from "../../_real/upstream";
import { CaseView } from "./CaseView";
import { RealCaseView } from "./RealCaseView";

export function generateStaticParams() {
  return CASE_IDS.map((id) => ({ id }));
}

/** A real sandbox case from the production API, or null. Never cached: the page shows PayPal's latest. */
async function realCase(id: string): Promise<ApiCase | null> {
  if (caseDetail(id) || !CASE_ID.test(id)) return null;
  try {
    const r = await fetch(`${UPSTREAM}/api/cases/${id}`, { cache: "no-store", signal: AbortSignal.timeout(15_000) });
    return r.ok ? ((await r.json()) as ApiCase) : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  const d = caseDetail(id);
  if (d) return { title: `${d.title}, CaseClerk` };
  const r = await realCase(id);
  return { title: r ? `${thingOf(r)[0].toUpperCase()}${thingOf(r).slice(1)}, real sandbox case, CaseClerk` : "CaseClerk", description: r ? headline(r) : undefined };
}

export default async function FinalACase({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ state?: string; controls?: string }> }) {
  const { id } = await params;
  const { state, controls } = await searchParams;
  if (caseDetail(id)) return <CaseView key={`${id}-${state ?? ""}`} id={id} state={state} controls={controls === "1"} />;
  const r = await realCase(id);
  if (!r) notFound();
  return <RealCaseView initial={r} />;
}
