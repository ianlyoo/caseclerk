import { vi } from "vitest";
import { clearTokenCache, setRetryDelays } from "../../src/lib/paypal/client";

export type Call = { method: string; path: string; headers: Headers; body: unknown };
type Reply = { status?: number; json?: unknown; headers?: Record<string, string> };
type Route = (c: Call) => Reply | undefined;

/** Stubs global fetch: the token endpoint always succeeds, other calls go to `route` (first match wins). */
export function mockPayPal(route: Route) {
  process.env.PAYPAL_CLIENT_ID = "test-client";
  process.env.PAYPAL_CLIENT_SECRET = "test-secret";
  delete process.env.PAYPAL_API_BASE;
  clearTokenCache();
  setRetryDelays({ server: [1, 1, 1], badRequest: [1, 1] });
  const calls: Call[] = [];
  const fetchMock = vi.fn(async (url: string | URL, init: RequestInit = {}) => {
    const u = new URL(String(url));
    const method = (init.method ?? "GET").toUpperCase();
    if (u.pathname === "/v1/oauth2/token") {
      return new Response(JSON.stringify({ access_token: "tok", expires_in: 32400, scope: "test" }), { status: 200 });
    }
    const c: Call = { method, path: u.pathname + u.search, headers: new Headers(init.headers), body: init.body };
    calls.push(c);
    const r = route(c) ?? { status: 404, json: { name: "RESOURCE_NOT_FOUND", debug_id: "dbg404" } };
    return new Response(r.json === undefined ? "" : JSON.stringify(r.json), {
      status: r.status ?? 200,
      headers: { "paypal-debug-id": "dbg-" + calls.length, ...r.headers },
    });
  });
  vi.stubGlobal("fetch", fetchMock);
  return { calls, fetchMock };
}
