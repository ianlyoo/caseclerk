import { z } from "zod";
import { policy } from "@/lib/db";
import type { SellerPolicy } from "@/lib/types";
import { errMessage, json, jsonError, parseBody } from "../_lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Policy = z
  .object({
    autoRefundMaxUsd: z.number().min(0).max(10_000),
    approvalAboveUsd: z.number().min(0).max(10_000),
    evidenceApprovalAtUsd: z.number().min(0).max(100_000).optional(),
    minWinProbabilityToFight: z.number().min(0).max(1),
    maxOfferPercent: z.number().min(0).max(100),
    dryRun: z.boolean(),
    voice: z.string().trim().max(500),
  })
  .strict()
  .refine((p) => p.autoRefundMaxUsd <= p.approvalAboveUsd, {
    message: "Auto-refund limit can't be above the approval threshold.",
    path: ["autoRefundMaxUsd"],
  }) satisfies z.ZodType<SellerPolicy>;

export async function GET() {
  try {
    return json({ policy: await policy.get() });
  } catch (e) {
    console.error(`[api/policy] get failed: ${errMessage(e)}`);
    return jsonError(503, "unavailable", "Policy is unavailable right now.");
  }
}

// PUT /api/policy  body: SellerPolicy → { policy }
export async function PUT(req: Request) {
  const body = await parseBody(req, Policy);
  if (body instanceof Response) return body;
  try {
    return json({ policy: await policy.set(body) });
  } catch (e) {
    console.error(`[api/policy] set failed: ${errMessage(e)}`);
    return jsonError(503, "unavailable", "Couldn't save the policy. Try again.");
  }
}
