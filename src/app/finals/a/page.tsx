import { REPLAY_ID, type ApiCase } from "./_real/model";
import { UPSTREAM } from "./_real/upstream";
import { LandingView } from "./LandingView";

export const dynamic = "force-dynamic";

async function replayCase(): Promise<ApiCase | null> {
  try {
    const r = await fetch(`${UPSTREAM}/api/cases/${REPLAY_ID}`, { cache: "no-store", signal: AbortSignal.timeout(15_000) });
    return r.ok ? ((await r.json()) as ApiCase) : null;
  } catch {
    return null;
  }
}

export default async function FinalALanding() {
  return <LandingView r={await replayCase()} />;
}
