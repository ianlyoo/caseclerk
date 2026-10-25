import { verifyWebhookSignature } from "@/lib/paypal/webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const bootedAt = Date.now();
let invocations = 0;

type WebhookEvent = {
  id?: string;
  event_type?: string;
  resource_type?: string;
  resource?: { dispute_id?: string; id?: string; status?: string; dispute_life_cycle_stage?: string };
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
    reason: e instanceof Error ? e.message : "unknown",
  }));

  const r = event.resource ?? {};
  // IDs and states only: no names, emails, addresses or messages.
  console.log(
    `[paypal-webhook] event=${event.event_type} event_id=${event.id} resource_type=${event.resource_type} ` +
      `resource_id=${r.dispute_id ?? r.id} status=${r.status ?? "-"} stage=${r.dispute_life_cycle_stage ?? "-"} ` +
      `verify=${verify.status}${"reason" in verify && verify.reason ? `(${verify.reason})` : ""} ` +
      `cold=${invocations === 1} ms=${Date.now() - started}`,
  );

  // 503 makes PayPal retry later, once the env vars are set on this deployment.
  if (verify.status === "NOT_CONFIGURED") return new Response("not configured", { status: 503 });
  if (!verify.verified) return new Response("signature not verified", { status: 401 });
  return Response.json({ received: true });
}
