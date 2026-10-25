// Recorded agent runs used for replay when the demo budget is spent.
// Recorded from live sandbox runs with eval/run-live.ts (PII-free: ids, states, agent text only).
import type { RecordedRun } from "../replay";
import chargebackSnad from "./chargeback-snad.json";

export const FIXTURES: RecordedRun[] = [chargebackSnad as RecordedRun];
