import { HERO_ID, REPLAY_ID, type ApiCase } from "./_real/model";
import { UPSTREAM } from "./_real/upstream";
import { LandingView } from "./LandingView";

export const dynamic = "force-dynamic";

async function realCase(id: string): Promise<ApiCase | null> {
  try {
    const r = await fetch(`${UPSTREAM}/api/cases/${id}`, { cache: "no-store", signal: AbortSignal.timeout(15_000) });
    return r.ok ? ((await r.json()) as ApiCase) : null;
  } catch {
    return null;
  }
}

export default async function FinalALanding() {
  const [r, hero] = await Promise.all([realCase(REPLAY_ID), realCase(HERO_ID)]);
  return <LandingView r={r} hero={hero} />;
}
