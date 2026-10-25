// Spike helpers. Credentials come from env only (never printed, logged or passed as args).
import { appendFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

export const API_BASE = process.env.PAYPAL_API_BASE ?? "https://api-m.sandbox.paypal.com";
const RUN_LOG = process.env.SPIKE_RUN_LOG ?? "/srv/company/work/g251-pm-104/w-spike/.scratch/runs.jsonl";

let token;
export let tokenScope = "";
export async function accessToken() {
  if (token) return token;
  const id = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!id || !secret) throw new Error("PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET not set (source the env file)");
  if (!API_BASE.includes("sandbox")) throw new Error("refusing: API base is not sandbox");
  const res = await fetch(`${API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`oauth2/token ${res.status} ${json.error ?? ""} ${json.error_description ?? ""}`);
  log({ step: "oauth2/token", status: res.status, scope: json.scope, app_id: json.app_id });
  tokenScope = json.scope ?? "";
  token = json.access_token;
  return token;
}

/** JSON body → application/json; FormData body → multipart (fetch sets the boundary). */
export async function api(method, path, { json, form, headers = {}, step } = {}) {
  const h = { Authorization: `Bearer ${await accessToken()}`, ...headers };
  let body;
  if (json !== undefined) {
    h["Content-Type"] = "application/json";
    body = JSON.stringify(json);
  } else if (form) {
    body = form;
  }
  const started = Date.now();
  const res = await fetch(`${API_BASE}${path}`, { method, headers: h, body });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  const debugId = res.headers.get("paypal-debug-id");
  log({ step: step ?? `${method} ${path}`, method, path, status: res.status, ms: Date.now() - started, debug_id: debugId, request: json ?? (form ? "[multipart]" : undefined), response: data });
  console.log(`${method} ${path} → ${res.status} (${Date.now() - started} ms) debug_id=${debugId}`);
  // Write calls that fail make the CLI exit non-zero, so flows can retry instead of assuming success.
  if (!res.ok && method !== "GET") process.exitCode = 1;
  return { status: res.status, ok: res.ok, data };
}

export function log(entry) {
  mkdirSync(dirname(RUN_LOG), { recursive: true });
  appendFileSync(RUN_LOG, JSON.stringify({ at: new Date().toISOString(), ...entry }) + "\n");
}

export function show(obj) {
  console.log(JSON.stringify(obj, null, 2));
}
