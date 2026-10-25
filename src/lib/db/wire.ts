// The PayPal wire log: every PayPal call the app makes, plus each webhook delivery, as rows in `wire`.
//
//   await withWire({ origin: "seller", caseId }, () => executeApproved(id));
//
// Importing this module registers an observer on W1's paypalFetch (setPayPalCallObserver), so any
// call made inside withWire() is tagged with its origin and case; calls outside one are origin
// "system". Rows hold ids, paths, statuses and timings only: never bodies, headers or secrets.
// A provide-evidence call also stores what was filed (the evidence input JSON and the file names)
// on its action as params.filing, so the UI can show the exact filing.
import { AsyncLocalStorage } from "node:async_hooks";
import { setPayPalCallObserver, type PayPalCall } from "@/lib/paypal/client";
import { actions, wire } from "./index";
import type { NewWireEntry, WireEntry, WireOrigin } from "./repo";

export type WireContext = { origin: WireOrigin; caseId?: string; /** ids of the call rows written so far */ rowIds: string[] };

const als = new AsyncLocalStorage<WireContext>();

/** Runs fn with PayPal calls attributed to `origin` (and `caseId` when the path doesn't name a dispute). */
export function withWire<T>(ctx: { origin: WireOrigin; caseId?: string }, fn: (ctx: WireContext) => Promise<T>): Promise<T> {
  const store: WireContext = { ...ctx, rowIds: [] };
  return als.run(store, () => fn(store));
}

const DISPUTE_PATH = /^\/v1\/customer\/disputes\/([^/?]+)/;

export function disputeIdFromPath(path: string): string | undefined {
  const m = DISPUTE_PATH.exec(path);
  if (!m) return undefined;
  try {
    return decodeURIComponent(m[1]);
  } catch {
    return m[1];
  }
}

/** The paypalFetch observer. Exported for tests; errors are the caller's to swallow. */
export async function recordPayPalCall(c: PayPalCall): Promise<void> {
  const ctx = als.getStore();
  const caseId = disputeIdFromPath(c.path) ?? ctx?.caseId;
  const row = await wire.append({
    kind: "call",
    origin: ctx?.origin ?? "system",
    ...(caseId ? { caseId } : {}),
    method: c.method,
    path: c.path.split("?")[0],
    status: c.status,
    ...(c.debugId ? { debugId: c.debugId } : {}),
    durationMs: c.durationMs,
    at: c.at,
  });
  ctx?.rowIds.push(row.id);
  if (caseId && c.method === "POST" && c.path.endsWith("/provide-evidence") && c.body instanceof FormData) {
    await attachFiling(caseId, c, c.body);
  }
}

/** Stores the evidence input and file names on the provide_evidence action being executed. */
async function attachFiling(caseId: string, c: PayPalCall, form: FormData): Promise<void> {
  const target = (await actions.listByCase(caseId)).filter((a) => a.kind === "provide_evidence" && a.status === "executing").at(-1);
  if (!target) return;
  let input: unknown = null;
  const part = form.get("input");
  if (part !== null) {
    const text = typeof part === "string" ? part : await part.text();
    try {
      input = JSON.parse(text);
    } catch {
      input = text.slice(0, 20_000);
    }
  }
  const files: { field: string; name: string; size: number; contentType: string }[] = [];
  form.forEach((v, field) => {
    if (field !== "input" && typeof v !== "string") files.push({ field, name: v.name, size: v.size, contentType: v.type });
  });
  const filing = { input, files, at: c.at, httpStatus: c.status, ...(c.debugId ? { debugId: c.debugId } : {}) };
  await actions.update(target.id, { params: { ...target.params, filing } }, { ifStatus: ["executing"] });
}

/**
 * One webhook delivery, written at receipt (so it sorts before the calls made while handling it);
 * finish it with wire.update(id, { status, verify, durationMs, detail }).
 */
export async function recordWebhookEvent(e: Omit<NewWireEntry, "kind" | "origin">): Promise<WireEntry> {
  return wire.append({ ...e, kind: "event", origin: "webhook" });
}

setPayPalCallObserver(recordPayPalCall);
