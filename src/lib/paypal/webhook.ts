import { paypalFetch } from "./client";

const HEADER_KEYS = {
  auth_algo: "paypal-auth-algo",
  cert_url: "paypal-cert-url",
  transmission_id: "paypal-transmission-id",
  transmission_sig: "paypal-transmission-sig",
  transmission_time: "paypal-transmission-time",
} as const;

export type VerifyResult = { verified: boolean; status: string; reason?: string };

/**
 * Verifies a webhook delivery with POST /v1/notifications/verify-webhook-signature.
 * The raw body is spliced in unchanged: re-serialising the parsed JSON can change
 * byte order/escaping and make PayPal answer FAILURE.
 */
export async function verifyWebhookSignature(headers: Headers, rawBody: string): Promise<VerifyResult> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId || !process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
    return { verified: false, status: "NOT_CONFIGURED", reason: "PayPal env vars missing" };
  }

  const fields: Record<string, string> = { webhook_id: webhookId };
  for (const [field, header] of Object.entries(HEADER_KEYS)) {
    const v = headers.get(header);
    if (!v) return { verified: false, status: "MISSING_HEADER", reason: header };
    fields[field] = v;
  }
  const body = `${JSON.stringify(fields).slice(0, -1)},"webhook_event":${rawBody}}`;

  const res = await paypalFetch("/v1/notifications/verify-webhook-signature", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  if (!res.ok) return { verified: false, status: `HTTP_${res.status}` };
  const json = (await res.json()) as { verification_status?: string };
  const status = json.verification_status ?? "UNKNOWN";
  return { verified: status === "SUCCESS", status };
}
