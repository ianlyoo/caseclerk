// The production CaseClerk API. Final A's real pages read it through same-origin routes under
// /finals/a/live, because production sends no CORS headers. The routes only forward: the
// approve endpoint is already public on production, so the proxy adds no new exposure.

export const UPSTREAM = "https://caseclerk.vercel.app";
export const CASE_ID = /^PP-R-[A-Z]{3}-\d{6,12}$/;
export const ACTION_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Forwards a request and passes the status and JSON body through, never cached. */
export async function forward(path: string, init?: RequestInit): Promise<Response> {
  try {
    const r = await fetch(`${UPSTREAM}${path}`, { ...init, cache: "no-store", signal: AbortSignal.timeout(init?.method === "POST" ? 120_000 : 15_000) });
    const body = await r.text();
    return new Response(body, { status: r.status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: { code: "upstream_error", message: "CaseClerk's API didn't answer." } }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}

export const bad = (message: string) => Response.json({ error: { code: "bad_request", message } }, { status: 400 });
