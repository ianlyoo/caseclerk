import { z } from "zod";
import { actions, audit, cases, rateLimit } from "@/lib/db";
import type { DisputeLinkRel } from "@/lib/types";
import { caseDto, clientKey, envInt, errMessage, json, jsonError, parseBody } from "../../../_lib/http";
import { withWire } from "@/lib/db/wire";
import { getDispute } from "@/lib/paypal/disputes";
import { PayPalError } from "@/lib/paypal/client";
import { adjudicate, requireEvidence } from "@/lib/paypal/simulators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("require_evidence") }).strict(),
  z.object({ action: z.literal("adjudicate"), outcome: z.enum(["SELLER_FAVOR", "BUYER_FAVOR"]) }).strict(),
]);

const LABEL = { require_evidence: "Request more evidence", adjudicate: "Adjudicate" } as const;

// POST /api/cases/:id/simulate  body: {action:"require_evidence"} | {action:"adjudicate", outcome}
// Sandbox demo controls; test disputes only. PayPal's webhook then reports the new state.
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return withWire({ origin: "seller", caseId: id }, () => simulate(req, id));
}

async function simulate(req: Request, id: string): Promise<Response> {
  const body = await parseBody(req, Body);
  if (body instanceof Response) return body;

  const existing = await cases.get(id).catch(() => null);
  if (!existing) return jsonError(404, "not_found", `No case ${id}.`);
  if (!existing.isTestDispute) return jsonError(403, "forbidden", "Demo controls work only on test disputes.");

  // Two budgets per IP: checks (refresh + "not allowed yet") are cheap and may be retried while
  // PayPal unlocks the link; simulator calls are what we really cap.
  const ip = clientKey(req);
  const checks = await rateLimit.hit(`simulate-check:ip:${ip}`, envInt("SIMULATE_CHECKS_PER_IP_PER_HOUR", 120), 3600).catch(() => null);
  if (!checks) return jsonError(503, "unavailable", "Demo controls are unavailable right now.");
  if (!checks.allowed) return jsonError(429, "rate_limited", "Too many demo requests. Wait a bit and retry.", { resetAt: checks.resetAt });

  // Refresh first: PayPal enables these links minutes after each step (see docs/experiments.md).
  let record = existing;
  try {
    record = (await cases.upsertFromSnapshot(await getDispute(id))).record;
  } catch (e) {
    console.warn(`[api/cases/${id}/simulate] refresh failed: ${errMessage(e)}`);
  }
  const rel: DisputeLinkRel = body.action;
  if (!record.snapshot.allowed.includes(rel)) {
    return jsonError(409, "conflict", `PayPal doesn't allow "${LABEL[body.action]}" on this dispute yet. It usually unlocks a few minutes after the last step.`, {
      allowed: record.snapshot.allowed,
    });
  }

  const rl = await rateLimit.hit(`simulate:ip:${ip}`, envInt("SIMULATE_PER_IP_PER_HOUR", 20), 3600).catch(() => null);
  if (!rl) return jsonError(503, "unavailable", "Demo controls are unavailable right now.");
  if (!rl.allowed) return jsonError(429, "rate_limited", "Too many demo actions. Wait a bit and retry.", { resetAt: rl.resetAt });

  const params = body.action === "adjudicate" ? { outcome: body.outcome } : {};
  const action = await actions.insert({
    caseId: id,
    kind: body.action,
    params,
    rationale: "Sandbox demo control",
    requiresApproval: false,
    status: "executing",
  });
  let result: { status: number; debugId?: string };
  try {
    result = body.action === "adjudicate" ? await adjudicate(id, body.outcome) : await requireEvidence(id);
  } catch (e) {
    const failed = await actions.update(action.id, {
      status: "failed",
      result: {
        ...(e instanceof PayPalError ? { httpStatus: e.status, ...(e.debugId ? { debugId: e.debugId } : {}) } : {}),
        error: errMessage(e).slice(0, 300),
      },
    });
    await audit.append({
      caseId: id,
      actor: "seller",
      kind: `demo.${body.action}.failed`,
      summary: `${LABEL[body.action]} failed in the PayPal sandbox`,
      data: { actionId: action.id, ...params },
    });
    console.error(`[api/cases/${id}/simulate] ${body.action} failed: ${errMessage(e)}`);
    return jsonError(502, "upstream_error", `PayPal's sandbox rejected "${LABEL[body.action]}". Try again in a minute.`, {
      action: failed,
    });
  }
  const done = await actions.update(action.id, {
    status: "executed",
    result: { httpStatus: result.status, ...(result.debugId ? { debugId: result.debugId } : {}) },
  });
  await audit.append({
    caseId: id,
    actor: "seller",
    kind: `demo.${body.action}`,
    summary:
      body.action === "adjudicate"
        ? `Demo control: PayPal sandbox asked to rule ${body.outcome === "SELLER_FAVOR" ? "for the seller" : "for the buyer"}`
        : "Demo control: PayPal sandbox asked the seller for more evidence",
    data: { actionId: action.id, ...params },
  });
  return json({ action: done, case: caseDto(record) });
}
