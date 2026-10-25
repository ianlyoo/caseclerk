// Shared by POST /api/actions/:id/approve and /deny. W2's executeApproved/deny claim the action
// (compare-and-set), write the seller's audit entry and call PayPal; this maps their result to HTTP.
import { after } from "next/server";
import { z } from "zod";
import { actions } from "@/lib/db";
import { withWire } from "@/lib/db/wire";
import type { AgentAction } from "@/lib/types";
import { deny, executeApproved } from "@/lib/agent/run";
import { errMessage, json, jsonError, parseBody } from "./http";

const Body = z.object({ note: z.string().trim().max(500).optional() }).strict();

export async function handleApproval(req: Request, id: string, verdict: "approve" | "deny"): Promise<Response> {
  const body = await parseBody(req, Body);
  if (body instanceof Response) return body;

  const action = await actions.get(id).catch(() => null);
  if (!action) return jsonError(404, "not_found", `No action ${id}.`);
  if (action.status !== "awaiting_approval") {
    return jsonError(409, "conflict", `This action is already ${action.status.replaceAll("_", " ")}.`, { action });
  }

  try {
    // Approve answers as soon as PayPal has answered: the wire rows, filing, audit entry, case status
    // and tracker restore are deferred and run after the response.
    const tasks: (() => Promise<void>)[] = [];
    const defer = (task: () => Promise<void>) => void tasks.push(task);
    after(() => drain(tasks, action.caseId, id));
    const r = await withWire({ origin: "seller", caseId: action.caseId, actionId: id, defer }, () =>
      verdict === "approve" ? executeApproved(id, { defer }) : deny(id, body.note),
    );
    if (!r.ok) {
      const current = r.action ?? (await actions.get(id).catch(() => null));
      // Someone else decided first → 409; PayPal or the policy gate refused → 502 with the reason.
      const lost = current && current.status !== "failed" && current.status !== "executed";
      return jsonError(lost ? 409 : 502, lost ? "conflict" : "upstream_error", r.message, {
        action: current,
        ...(verdict === "approve" && current ? paypalAnswer(current) : {}),
      });
    }
    const done = r.action ?? (await actions.get(id));
    return json({ action: done, message: r.message, ...(verdict === "approve" && done ? paypalAnswer(done) : {}) });
  } catch (e) {
    console.error(`[api/actions/${id}/${verdict}] failed: ${errMessage(e)}`);
    return jsonError(502, "upstream_error", `Couldn't ${verdict} the action. Try again.`, {
      action: await actions.get(id).catch(() => null),
    });
  }
}

/** PayPal's answer to the executed action, for the approval slip: HTTP status, debug id, time. */
function paypalAnswer(a: AgentAction): { status: number | null; debugId: string | null; at: string } {
  return { status: a.result?.httpStatus ?? null, debugId: a.result?.debugId ?? null, at: a.updatedAt };
}

/** Runs deferred work (in parallel; tasks may add more), PayPal calls inside it logged as seller calls. */
async function drain(tasks: (() => Promise<void>)[], caseId: string, actionId: string): Promise<void> {
  await withWire({ origin: "seller", caseId, actionId }, async () => {
    while (tasks.length) {
      const results = await Promise.allSettled(tasks.splice(0).map((t) => t()));
      for (const x of results) {
        if (x.status === "rejected") console.error(`[api/actions/${actionId}] deferred task failed: ${errMessage(x.reason)}`);
      }
    }
  });
}
