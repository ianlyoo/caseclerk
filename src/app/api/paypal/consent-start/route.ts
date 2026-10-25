import { randomBytes } from "node:crypto";
import { STATE_COOKIE, consentRedirectUri, consentUrl } from "@/lib/paypal/consent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/paypal/consent-start[?scope=update-buyer] → redirects the (sandbox) buyer to PayPal's consent page.
export async function GET(req: Request) {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  if (!clientId) return new Response("not configured", { status: 503 });
  const extra = new URL(req.url).searchParams.get("scope") === "update-buyer"
    ? ["https://uri.paypal.com/services/disputes/update-buyer"]
    : [];
  const state = randomBytes(16).toString("hex");
  const url = consentUrl(clientId, consentRedirectUri(req.url), state, [
    "openid",
    "https://uri.paypal.com/services/disputes/create",
    ...extra,
  ]);
  return new Response(null, {
    status: 302,
    headers: {
      Location: url,
      "Set-Cookie": `${STATE_COOKIE}=${state}; Path=/api/paypal; HttpOnly; Secure; SameSite=Lax; Max-Age=900`,
    },
  });
}
