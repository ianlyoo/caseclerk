import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { splitStatements } from "@/lib/db/migrate";

describe("splitStatements", () => {
  it("splits the v1 schema into one statement per table/index", () => {
    const parts = splitStatements(readFileSync("db/migrations/001_init.sql", "utf8"));
    expect(parts.filter((s) => s.startsWith("CREATE TABLE"))).toHaveLength(9);
    expect(parts.every((s) => /^CREATE (TABLE|INDEX)/.test(s))).toBe(true);
    expect(parts.some((s) => s.includes(";"))).toBe(false);
  });
});
