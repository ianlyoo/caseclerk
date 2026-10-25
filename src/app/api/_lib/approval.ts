// Shared by POST /api/actions/:id/approve and /deny.
import { z } from "zod";
import { actions, audit } from "@/lib/db";
import { errMessage, json, jsonError, parseBody } from "./http";
import { loadApprovals } from "./modules";

const Body = z.object({ note: z.string().trim().max(500).optional() }).strict();

export async function handleApproval(req: Request, id: string, verdict: "approve" | "deny"): Promise<Response> {
  const body = await parseBody(req, Body);
  if (body instanceof Response) return body;

  const action = await actions.get(id).catch(() => null);
  if (!action) return jsonError(404, "not_found", `No action ${id}.`);
  if (action.status !== "awaiting_approval") {
    return jsonError(409, "conflict", `This action is already ${action.status.replaceAll("_", " ")}.`, { action });
  }

  const approvals = await loadApprovals();
  if (verdict === "approve" && !approvals) {
    return jsonError(503, "unavailable", "Approvals can't be executed on this deployment yet.");
  }

  await audit.append({
    caseId: action.caseId,
    actor: "seller",
    kind: verdict === "approve" ? "action.approved" : "action.denied",
    summary: `Seller ${verdict === "approve" ? "approved" : "denied"} ${action.kind.replaceAll("_", " ")}`,
    data: { actionId: id, ...(body.note ? { note: body.note } : {}) },
  });

  try {
    if (verdict === "approve") await approvals!.executeApproved(id);
    else if (approvals) await approvals.deny(id);
    else {
      const denied = await actions.update(id, { status: "denied" }, { ifStatus: ["awaiting_approval"] });
      if (!denied) return jsonError(409, "conflict", "This action changed while you were deciding. Reload and retry.");
    }
  } catch (e) {
    console.error(`[api/actions/${id}/${verdict}] failed: ${errMessage(e)}`);
    return jsonError(502, "upstream_error", `Couldn't ${verdict} the action: ${errMessage(e).slice(0, 200)}`, {
      action: await actions.get(id).catch(() => null),
    });
  }
  return json({ action: await actions.get(id) });
}
