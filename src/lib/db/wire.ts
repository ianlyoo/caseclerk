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
import { randomUUID } from "node:crypto";
import { setPayPalCallObserver, type PayPalCall } from "@/lib/paypal/client";
import { actions, wire } from "./index";
import type { AgentAction } from "@/lib/types";
import type { NewWireEntry, WireEntry, WireOrigin } from "./repo";

export type WireContext = {
  origin: WireOrigin;
  caseId?: string;
  /** Set while checking a webhook signature: written on each call row (PENDING), stamped with the result after. */
  verify?: string;
  /** The action being executed (approve): its filing is stored by id, not looked up. */
  actionId?: string;
  /**
   * When set, rows and the filing are handed to this scheduler (the approve route runs them in
   * after()) instead of being awaited inside each PayPal call.
   */
  defer?: (task: () => Promise<void>) => void;
  /** ids of the call rows written (or scheduled) so far */
  rowIds: string[];
};

const als = new AsyncLocalStorage<WireContext>();

/** Runs fn with PayPal calls attributed to `origin` (and `caseId` when the path doesn't name a dispute). */
export function withWire<T>(ctx: Omit<WireContext, "rowIds">, fn: (ctx: WireContext) => Promise<T>): Promise<T> {
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
  const id = randomUUID();
  ctx?.rowIds.push(id);
  const row: NewWireEntry = {
    id,
    kind: "call",
    origin: ctx?.origin ?? "system",
    ...(caseId ? { caseId } : {}),
    method: c.method,
    path: c.path.split("?")[0],
    status: c.status,
    ...(c.debugId ? { debugId: c.debugId } : {}),
    durationMs: c.durationMs,
    at: c.at,
    ...(ctx?.verify ? { verify: ctx.verify } : {}),
  };
  const isFiling = caseId && c.method === "POST" && c.path.endsWith("/provide-evidence") && c.body instanceof FormData;
  const filing = isFiling ? await readFiling(c, c.body as FormData) : null;
  if (ctx?.defer) {
    ctx.defer(async () => {
      await wire.append(row);
    });
    if (filing && ctx.actionId) {
      const actionId = ctx.actionId;
      ctx.defer(() => storeFiling(actionId, filing));
      return;
    }
  } else {
    await wire.append(row);
  }
  if (filing && caseId) {
    // Agent runs: the action executing now is the newest provide_evidence one in "executing".
    const target = (await actions.listByCase(caseId)).filter((a) => a.kind === "provide_evidence" && a.status === "executing").at(-1);
    if (target) await storeFiling(target, filing, ["executing"]);
  }
}

type Filing = { input: unknown; files: { field: string; name: string; size: number; contentType: string }[]; at: string; httpStatus: number; debugId?: string };

/** What went to PayPal: the evidence input JSON and the file names/sizes (no file bytes). */
async function readFiling(c: PayPalCall, form: FormData): Promise<Filing> {
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
  const files: Filing["files"] = [];
  form.forEach((v, field) => {
    if (field !== "input" && typeof v !== "string") files.push({ field, name: v.name, size: v.size, contentType: v.type });
  });
  return { input, files, at: c.at, httpStatus: c.status, ...(c.debugId ? { debugId: c.debugId } : {}) };
}

/** Stores the filing on the action as params.filing (replacing a prepared one with what was sent). */
async function storeFiling(action: AgentAction | string, filing: Filing, ifStatus?: AgentAction["status"][]): Promise<void> {
  const a = typeof action === "string" ? await actions.get(action) : action;
  if (!a) return;
  await actions.update(a.id, { params: { ...a.params, filing } }, ifStatus ? { ifStatus } : undefined);
}

/**
 * One webhook delivery, written at receipt (so it sorts before the calls made while handling it)
 * with verify PENDING, which keeps it off the public wire until stampVerify marks it SUCCESS.
 * Finish it with wire.update(id, { status, durationMs, detail }).
 */
export async function recordWebhookEvent(e: Omit<NewWireEntry, "kind" | "origin" | "verify">): Promise<WireEntry> {
  return wire.append({ ...e, kind: "event", origin: "webhook", verify: "PENDING" });
}

/** Stamps the signature result on a delivery's event row and the calls made to check it. */
export async function stampVerify(rowIds: string[], verify: string): Promise<void> {
  await Promise.all(rowIds.map((id) => wire.update(id, { verify })));
}

setPayPalCallObserver(recordPayPalCall);
