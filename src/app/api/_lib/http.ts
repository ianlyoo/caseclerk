// Small helpers shared by the API routes: JSON errors, zod parsing, client IP, DTOs.
import { createHash } from "node:crypto";
import type { z } from "zod";
import type { CaseRecord } from "@/lib/types";

export type ErrorCode =
  | "bad_request"
  | "not_found"
  | "conflict"
  | "unauthorized"
  | "forbidden"
  | "rate_limited"
  | "unavailable"
  | "upstream_error"
  | "internal";

export function jsonError(status: number, code: ErrorCode, message: string, extra: Record<string, unknown> = {}) {
  return Response.json({ error: { code, message, ...extra } }, { status, headers: { "Cache-Control": "no-store" } });
}

export function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

/** Parses a JSON body with zod; returns the data or a 400 Response. Empty body counts as {}. */
export async function parseBody<T extends z.ZodType>(req: Request, schema: T): Promise<z.infer<T> | Response> {
  const text = await req.text();
  let raw: unknown = {};
  if (text.trim()) {
    try {
      raw = JSON.parse(text);
    } catch {
      return jsonError(400, "bad_request", "Body must be JSON.");
    }
  }
  const r = schema.safeParse(raw);
  if (!r.success) {
    return jsonError(400, "bad_request", "Invalid request.", {
      issues: r.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
  }
  return r.data;
}

/** Hashed client IP (rate-limit keys never store the raw address). */
export function clientKey(req: Request): string {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip")?.trim() || "unknown";
  return createHash("sha256").update(`caseclerk:${ip}`).digest("hex").slice(0, 24);
}

export function envInt(name: string, def: number): number {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && v > 0 ? Math.floor(v) : def;
}

/** Case as sent to the browser: the raw PayPal payload stays server-side. */
export function caseDto(c: CaseRecord): CaseRecord {
  const { raw: _raw, ...snapshot } = c.snapshot;
  return { ...c, snapshot };
}

export function errMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
