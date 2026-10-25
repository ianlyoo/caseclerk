import { getDb } from "@/lib/db";
import { errMessage } from "../_lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const has = (...names: string[]) => names.every((n) => Boolean(process.env[n]));

// GET /api/health → build sha + which integrations are configured (booleans only, never values).
export async function GET() {
  const db = getDb();
  let dbOk = true;
  try {
    await db.cases.list({ limit: 1 });
  } catch (e) {
    dbOk = false;
    console.error(`[api/health] db check failed: ${errMessage(e)}`);
  }
  return Response.json(
    {
      ok: dbOk,
      sha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
      env: process.env.VERCEL_ENV ?? "local",
      store: db.kind,
      dbReachable: dbOk,
      configured: {
        paypal: has("PAYPAL_CLIENT_ID", "PAYPAL_CLIENT_SECRET"),
        paypalWebhook: has("PAYPAL_WEBHOOK_ID"),
        database: has("DATABASE_URL"),
        anthropic: has("ANTHROPIC_API_KEY"),
      },
    },
    { status: dbOk ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
