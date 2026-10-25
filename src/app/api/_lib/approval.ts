// Shared by POST /api/actions/:id/approve and /deny. W2's executeApproved/deny claim the action
// (compare-and-set), write the seller's audit entry and call PayPal; this maps their result to HTTP.
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
    const r = await withWire({ origin: "seller", caseId: action.caseId }, () =>
      verdict === "approve" ? executeApproved(id) : deny(id, body.note),
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
