import { STATE_COOKIE } from "@/lib/paypal/consent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const API_BASE = process.env.PAYPAL_API_BASE ?? "https://api-m.sandbox.paypal.com";

function page(status: number, title: string, lines: string[]) {
  const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
  const body = `<!doctype html><meta charset="utf-8"><title>${esc(title)}</title>` +
    `<body style="font-family:system-ui;padding:24px"><h1 id="result">${esc(title)}</h1>` +
    lines.map((l) => `<p>${esc(l)}</p>`).join("") + "</body>";
  return new Response(body, { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}

// PayPal redirects here after the buyer approves (?code&scope&state) or cancels (?error…).
// We exchange the code once to prove consent and read the granted scopes. Tokens are never logged or stored:
// the dispute simulators identify the buyer by PayPal-Auth-Assertion, not by this token.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const error = url.searchParams.get("error");
  if (error) {
    console.log(`[paypal-consent] error=${error}`);
    return page(400, "CONSENT_ERROR", [`PayPal returned error=${error}`]);
  }
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = req.headers.get("cookie")?.match(new RegExp(`${STATE_COOKIE}=([a-f0-9]+)`))?.[1];
  if (!code) return page(400, "CONSENT_NO_CODE", ["No authorization code in the return URL."]);
  if (!state || state !== cookieState) {
    console.log("[paypal-consent] state mismatch");
    return page(400, "CONSENT_STATE_MISMATCH", ["Start again from /api/paypal/consent-start in the same browser."]);
  }

  const id = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!id || !secret) return page(503, "NOT_CONFIGURED", ["PayPal env vars missing on this deployment."]);
  const res = await fetch(`${API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "authorization_code", code }).toString(),
  });
  const json = (await res.json().catch(() => ({}))) as { scope?: string; error?: string; error_description?: string };
  const scopes = (json.scope ?? "").split(" ").filter(Boolean);
  const disputeScopes = scopes.filter((s) => s.includes("/disputes/"));
  console.log(
    `[paypal-consent] token_exchange=${res.status} debug_id=${res.headers.get("paypal-debug-id")} ` +
      `dispute_scopes=${disputeScopes.join(",") || "-"} error=${json.error ?? "-"}`,
  );
  if (!res.ok) return page(502, "CONSENT_EXCHANGE_FAILED", [`token exchange HTTP ${res.status}: ${json.error ?? ""} ${json.error_description ?? ""}`]);
  return page(200, disputeScopes.length ? "CONSENT_OK" : "CONSENT_OK_NO_DISPUTE_SCOPE", [
    `Granted scopes: ${scopes.join(" ")}`,
    "Next: run scripts/spike/run.sh disputes.mjs create <buyer_transaction_id> on Oracle.",
  ]);
}
