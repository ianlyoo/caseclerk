// Raw sandbox REST for eval/open-dispute.ts (order create/track and the chargeback simulator call).
// Keys come from env; nothing here prints them.

const BASE = (process.env.PAYPAL_API_BASE ?? "https://api-m.sandbox.paypal.com").replace(/\/$/, "");
if (!/sandbox\.paypal\.com$/.test(new URL(BASE).hostname)) throw new Error("eval: PAYPAL_API_BASE must be the sandbox");

let token: string | null = null;

async function auth(): Promise<string> {
  if (token) return token;
  const id = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!id || !secret) throw new Error("PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET not set (load the env file)");
  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`oauth2/token ${res.status}`);
  token = ((await res.json()) as { access_token: string }).access_token;
  return token;
}

export async function pp<T = Record<string, unknown>>(
  method: string,
  path: string,
  body?: string | FormData,
  extraHeaders: Record<string, string> = {},
): Promise<{ status: number; debugId?: string; json: T }> {
  const headers: Record<string, string> = { Authorization: `Bearer ${await auth()}`, ...extraHeaders };
  if (typeof body === "string") headers["Content-Type"] = "application/json";
  const res = await fetch(`${BASE}${path}`, { method, headers, body });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text.slice(0, 200) };
  }
  return { status: res.status, debugId: res.headers.get("paypal-debug-id") ?? undefined, json: json as T };
}
