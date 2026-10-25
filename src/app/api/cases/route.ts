import { z } from "zod";
import { cases } from "@/lib/db";
import type { CaseStatus } from "@/lib/types";
import { caseDto, errMessage, json, jsonError } from "../_lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES = [
  "new", "triaged", "awaiting_approval", "acting", "waiting_on_paypal", "waiting_on_buyer", "resolved", "error",
] as const satisfies readonly CaseStatus[];

const Query = z.object({
  open: z.enum(["true", "false"]).optional(),
  status: z
    .string()
    .optional()
    .transform((s) => (s ? s.split(",").filter(Boolean) : undefined))
    .pipe(z.array(z.enum(STATUSES)).optional()),
  test: z.enum(["true", "false"]).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
});

// GET /api/cases?open=true&status=new,triaged&test=true&limit=50 → { cases }
export async function GET(req: Request) {
  const q = Query.safeParse(Object.fromEntries(new URL(req.url).searchParams));
  if (!q.success) {
    return jsonError(400, "bad_request", "Invalid query.", {
      issues: q.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
  }
  try {
    const rows = await cases.list({
      ...(q.data.open ? { open: q.data.open === "true" } : {}),
      ...(q.data.status ? { status: q.data.status } : {}),
      ...(q.data.test ? { isTestDispute: q.data.test === "true" } : {}),
      ...(q.data.limit ? { limit: q.data.limit } : {}),
    });
    return json({ cases: rows.map(caseDto) });
  } catch (e) {
    console.error(`[api/cases] list failed: ${errMessage(e)}`);
    return jsonError(503, "unavailable", "Cases are unavailable right now. Try again shortly.");
  }
}
