import { after } from "next/server";
import { audit, cases, webhookEvents } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/paypal/webhook";
import { fetchDisputeSnapshot } from "../../_lib/dispute";
import { errMessage } from "../../_lib/http";
import { loadAgent } from "../../_lib/modules";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// The agent runs in after() within this invocation's budget (Vercel Hobby max).
export const maxDuration = 300;

const bootedAt = Date.now();
let invocations = 0;

type WebhookEvent = {
  id?: string;
  event_type?: string;
  resource_type?: string;
  resource?: { dispute_id?: string; id?: string; status?: string; dispute_life_cycle_stage?: string };
};

const EVENT_LABELS: Record<string, string> = {
  "CUSTOMER.DISPUTE.CREATED": "Dispute opened",
  "CUSTOMER.DISPUTE.UPDATED": "Dispute updated",
  "CUSTOMER.DISPUTE.RESOLVED": "Dispute resolved",
};

// Health/cold-start probe: reports whether this instance is fresh.
export async function GET() {
  invocations += 1;
  return Response.json({ ok: true, coldStart: invocations === 1, instanceAgeMs: Date.now() - bootedAt });
}

export async function POST(req: Request) {
  invocations += 1;
  const started = Date.now();
  const raw = await req.text();

  let event: WebhookEvent;
  try {
    event = JSON.parse(raw) as WebhookEvent;
  } catch {
    console.warn("[paypal-webhook] invalid JSON");
    return new Response("bad request", { status: 400 });
  }

  const verify = await verifyWebhookSignature(req.headers, raw).catch((e: unknown) => ({
    verified: false,
    status: "ERROR",
    reason: errMessage(e),
  }));

  const r = event.resource ?? {};
  const disputeId = r.dispute_id ?? (event.resource_type === "dispute" ? r.id : undefined);
  // IDs and states only: no names, emails, addresses or messages.
  const line =
    `[paypal-webhook] event=${event.event_type} event_id=${event.id} resource_type=${event.resource_type} ` +
    `resource_id=${r.dispute_id ?? r.id} status=${r.status ?? "-"} stage=${r.dispute_life_cycle_stage ?? "-"} ` +
    `verify=${verify.status}${"reason" in verify && verify.reason ? `(${verify.reason})` : ""} cold=${invocations === 1}`;

  // 503 makes PayPal retry later, once the env vars are set on this deployment.
  if (verify.status === "NOT_CONFIGURED") {
    console.log(`${line} -> 503`);
    return new Response("not configured", { status: 503 });
  }
  if (!verify.verified) {
    console.log(`${line} -> 401`);
    return new Response("signature not verified", { status: 401 });
  }
  if (!event.id) {
    console.log(`${line} -> 400 (no event id)`);
    return new Response("missing event id", { status: 400 });
  }
  if (!event.event_type?.startsWith("CUSTOMER.DISPUTE.") || !disputeId) {
    console.log(`${line} -> 200 ignored`);
    return Response.json({ received: true, ignored: true });
  }

  try {
    if (!(await webhookEvents.insertIfNew(event.id, { eventType: event.event_type, resourceId: disputeId }))) {
      console.log(`${line} -> 200 duplicate`);
      return Response.json({ received: true, duplicate: true });
    }
  } catch (e) {
    console.error(`${line} -> 503 dedupe failed: ${errMessage(e)}`);
    return new Response("storage unavailable", { status: 503 });
  }

  let caseId: string;
  let changed: boolean;
  try {
    const snapshot = await fetchDisputeSnapshot(disputeId);
    const up = await cases.upsertFromSnapshot(snapshot);
    caseId = up.record.id;
    changed = up.changed;
    await audit.append({
      caseId,
      actor: "paypal",
      kind: "webhook.received",
      summary: `${EVENT_LABELS[event.event_type] ?? event.event_type}: ${snapshot.status.replaceAll("_", " ").toLowerCase()}`,
      data: {
        eventId: event.id,
        eventType: event.event_type,
        status: snapshot.status,
        stage: snapshot.stage,
        allowed: snapshot.allowed,
        created: up.created,
        changed: up.changed,
      },
    });
  } catch (e) {
    // Forget the event so PayPal's retry is processed; 503 asks PayPal to retry.
    await webhookEvents.remove(event.id).catch(() => undefined);
    console.error(`${line} -> 503 processing failed: ${errMessage(e)}`);
    return new Response("temporarily unavailable", { status: 503 });
  }

  if (changed) {
    const eventType = event.event_type;
    after(async () => {
      const agent = await loadAgent();
      if (!agent) {
        console.warn(`[paypal-webhook] agent module not deployed; case=${caseId} not run`);
        return;
      }
      try {
        await agent.runAgent(caseId, { kind: "webhook", eventType });
      } catch (e) {
        console.error(`[paypal-webhook] runAgent failed case=${caseId}: ${errMessage(e)}`);
        await audit
          .append({
            caseId,
            actor: "system",
            kind: "agent.error",
            summary: "The agent stopped with an error; the next PayPal update will retry.",
            data: { error: errMessage(e).slice(0, 300) },
          })
          .catch(() => undefined);
      }
    });
  }

  console.log(`${line} case=${caseId} changed=${changed} -> 200 ms=${Date.now() - started}`);
  return Response.json({ received: true, caseId, changed });
}
