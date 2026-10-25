// PayPal REST client (sandbox only). Credentials come from env only; never log them.
// Every call either returns { status, debugId, json } or throws PayPalError carrying the
// HTTP status and PayPal's debug_id, so callers can show both in the case timeline.

const DEFAULT_BASE = "https://api-m.sandbox.paypal.com";

export function apiBase(): string {
  return (process.env.PAYPAL_API_BASE ?? DEFAULT_BASE).replace(/\/$/, "");
}

/** PayPal's error body: { name, message, debug_id, details: [{ issue, description, field }] }. */
export type PayPalErrorBody = {
  name?: string;
  message?: string;
  debug_id?: string;
  details?: { issue?: string; description?: string; field?: string }[];
  error?: string;
  error_description?: string;
};

export class PayPalError extends Error {
  readonly status: number;
  readonly debugId?: string;
  readonly method: string;
  readonly path: string;
  /** PayPal error name, e.g. UNPROCESSABLE_ENTITY, NOT_AUTHORIZED. */
  readonly errorName?: string;
  /** First detail issue, e.g. ACTION_NOT_ALLOWED_IN_CURRENT_DISPUTE_STATE. */
  readonly issue?: string;
  readonly body?: PayPalErrorBody;

  constructor(init: { status: number; debugId?: string; method: string; path: string; body?: PayPalErrorBody; message?: string }) {
    const b = init.body;
    const issue = b?.details?.[0]?.issue;
    const what = issue ?? b?.name ?? b?.error ?? "";
    super(init.message ?? `PayPal ${init.method} ${init.path} → ${init.status}${what ? ` ${what}` : ""}${init.debugId ? ` (debug_id ${init.debugId})` : ""}`);
    this.name = "PayPalError";
    this.status = init.status;
    this.debugId = init.debugId;
    this.method = init.method;
    this.path = init.path;
    this.errorName = b?.name ?? b?.error;
    this.issue = issue;
    this.body = b;
  }
}

/** The app lacks a feature/permission (e.g. Transaction Search not ticked on the REST app). */
export class NotEnabledError extends PayPalError {
  readonly feature: string;
  constructor(feature: string, cause: PayPalError) {
    super({
      status: cause.status,
      debugId: cause.debugId,
      method: cause.method,
      path: cause.path,
      body: cause.body,
      message: `${feature} is not enabled on the PayPal app (HTTP ${cause.status}${cause.debugId ? `, debug_id ${cause.debugId}` : ""})`,
    });
    this.name = "NotEnabledError";
    this.feature = feature;
  }
}

export type PayPalResult<T = unknown> = { status: number; debugId?: string; json: T };

export type PayPalFetchInit = Omit<RequestInit, "body"> & {
  body?: string | FormData;
  /**
   * Retry a 400 a few times. Use only for sandbox action calls (adjudicate, require-evidence,
   * provide-evidence) that PayPal sometimes rejects right after their HATEOAS link appears.
   */
  retryOn400?: boolean;
  /** Sent as PayPal-Request-Id so retried writes stay idempotent where PayPal supports it. */
  requestId?: string;
};

/** 400 issues that are real refusals, not the sandbox's transient ones: never retried. */
const DEFINITIVE_400 = new Set(["ACTION_NOT_ALLOWED_IN_CURRENT_DISPUTE_STATE", "INVALID_EVIDENCE_FILE", "DUPLICATE_REQUEST"]);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Retry schedule (ms). Overridable in tests through setRetryDelays. */
let delays = { server: [1_000, 3_000, 8_000], badRequest: [5_000, 15_000] };
export function setRetryDelays(next: { server?: number[]; badRequest?: number[] }) {
  delays = { server: next.server ?? delays.server, badRequest: next.badRequest ?? delays.badRequest };
}

function assertSandbox(base: string) {
  if (!/sandbox\.paypal\.com$/.test(new URL(base).hostname)) {
    throw new Error("Refusing to call PayPal: PAYPAL_API_BASE is not the sandbox");
  }
}

let cached: { token: string; expiresAt: number; scope: string } | null = null;

export function clearTokenCache() {
  cached = null;
}

export async function getAccessToken(): Promise<string> {
  return (await getToken()).token;
}

/** Token plus its granted scopes (used by the live tests to check the app's features). */
export async function getToken(): Promise<{ token: string; scope: string; expiresAt: number }> {
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached;
  const id = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!id || !secret) throw new Error("PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET not set");
  const base = apiBase();
  assertSandbox(base);
  const path = "/v1/oauth2/token";
  let attempt = 0;
  for (;;) {
    const res = await fetch(`${base}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
      signal: AbortSignal.timeout(20_000),
    });
    const debugId = res.headers.get("paypal-debug-id") ?? undefined;
    const json = (await readJson(res)) as { access_token?: string; expires_in?: number; scope?: string } & PayPalErrorBody;
    if (res.ok && json?.access_token) {
      cached = { token: json.access_token, expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000, scope: json.scope ?? "" };
      return cached;
    }
    if (isRetryableStatus(res.status) && attempt < delays.server.length) {
      await sleep(retryAfterMs(res) ?? delays.server[attempt++]);
      continue;
    }
    throw new PayPalError({ status: res.status, debugId, method: "POST", path, body: json ?? undefined });
  }
}

function isRetryableStatus(status: number) {
  return status === 429 || status >= 500;
}

function retryAfterMs(res: Response): number | undefined {
  const v = res.headers.get("retry-after");
  if (!v) return undefined;
  const s = Number(v);
  return Number.isFinite(s) ? Math.min(s * 1000, 30_000) : undefined;
}

async function readJson(res: Response): Promise<any> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { message: text.slice(0, 500) };
  }
}

/** One finished paypalFetch (after retries), reported to the optional call observer. */
export type PayPalCall = {
  method: string;
  path: string; // without the query string
  status: number; // 0 = network error / timeout
  debugId?: string;
  durationMs: number;
  at: string; // ISO start time
  /** The request body, for observers that record what was filed. Never log it whole. */
  body?: string | FormData;
};

let callObserver: ((c: PayPalCall) => void | Promise<void>) | null = null;

/**
 * Optional hook (W4's PayPal wire log): called once per paypalFetch, success or failure, and awaited
 * so the record lands before the caller continues. Observer errors are swallowed.
 */
export function setPayPalCallObserver(fn: ((c: PayPalCall) => void | Promise<void>) | null) {
  callObserver = fn;
}

/**
 * Calls the PayPal REST API with a bearer token. Retries 429/5xx and network errors with backoff,
 * refreshes the token once on 401, and (opt-in) retries the sandbox's spurious 400s.
 * JSON string bodies get Content-Type application/json; FormData bodies go out as multipart.
 */
export async function paypalFetch<T = any>(path: string, init: PayPalFetchInit = {}): Promise<PayPalResult<T>> {
  const started = Date.now();
  const report = async (status: number, debugId?: string) => {
    if (!callObserver) return;
    try {
      await callObserver({
        method: (init.method ?? "GET").toUpperCase(),
        path: path.split("?")[0],
        status,
        ...(debugId ? { debugId } : {}),
        durationMs: Date.now() - started,
        at: new Date(started).toISOString(),
        ...(init.body !== undefined ? { body: init.body } : {}),
      });
    } catch {
      // Logging must never break a PayPal call.
    }
  };
  try {
    const r = await paypalFetchOnce<T>(path, init);
    await report(r.status, r.debugId);
    return r;
  } catch (e) {
    await report(e instanceof PayPalError ? e.status : 0, e instanceof PayPalError ? e.debugId : undefined);
    throw e;
  }
}

async function paypalFetchOnce<T>(path: string, init: PayPalFetchInit): Promise<PayPalResult<T>> {
  const { retryOn400, requestId, ...rest } = init;
  const method = (rest.method ?? "GET").toUpperCase();
  const base = apiBase();
  assertSandbox(base);
  let serverAttempts = 0;
  let badRequestAttempts = 0;
  let refreshed = false;

  for (;;) {
    const token = await getAccessToken();
    const headers = new Headers(rest.headers);
    headers.set("Authorization", `Bearer ${token}`);
    if (typeof rest.body === "string" && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    if (requestId) headers.set("PayPal-Request-Id", requestId);

    let res: Response;
    try {
      res = await fetch(`${base}${path}`, { ...rest, method, headers, signal: rest.signal ?? AbortSignal.timeout(30_000) });
    } catch (err) {
      // Network error or timeout: retry like a 5xx, then surface as status 0.
      if (serverAttempts < delays.server.length) {
        await sleep(delays.server[serverAttempts++]);
        continue;
      }
      throw new PayPalError({ status: 0, method, path, message: `PayPal ${method} ${path} failed: ${(err as Error).message}` });
    }

    const debugId = res.headers.get("paypal-debug-id") ?? undefined;
    const json = await readJson(res);
    if (res.ok) return { status: res.status, debugId, json: json as T };

    if (res.status === 401 && !refreshed) {
      refreshed = true;
      clearTokenCache();
      continue;
    }
    if (isRetryableStatus(res.status) && serverAttempts < delays.server.length) {
      await sleep(retryAfterMs(res) ?? delays.server[serverAttempts++]);
      continue;
    }
    if (res.status === 400 && retryOn400 && !DEFINITIVE_400.has(json?.details?.[0]?.issue) && badRequestAttempts < delays.badRequest.length) {
      await sleep(delays.badRequest[badRequestAttempts++]);
      continue;
    }
    throw new PayPalError({ status: res.status, debugId: debugId ?? json?.debug_id, method, path, body: json ?? undefined });
  }
}

/** Tiny helper for JSON writes. */
export function jsonBody(value: unknown): string {
  return JSON.stringify(value);
}
