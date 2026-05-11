import { describe, expect, it } from "vitest";
import { normalizeDatabaseUrl } from "@/lib/persistence/database";

describe("normalizeDatabaseUrl", () => {
  it("upgrades deprecated sslmode=require to verify-full by default", () => {
    const normalized = normalizeDatabaseUrl(
      "postgresql://user:password@example.com:5432/app?channel_binding=require&sslmode=require",
    );

    expect(normalized).toContain("sslmode=verify-full");
    expect(normalized).toContain("channel_binding=require");
  });

  it("preserves explicit libpq compatibility mode", () => {
    const normalized = normalizeDatabaseUrl(
      "postgresql://user:password@example.com:5432/app?uselibpqcompat=true&sslmode=require",
    );

    expect(normalized).toContain("uselibpqcompat=true");
    expect(normalized).toContain("sslmode=require");
  });

  it("leaves unrelated URLs unchanged", () => {
    const normalized = normalizeDatabaseUrl(
      "postgresql://user:password@example.com:5432/app?sslmode=verify-full",
    );

    expect(normalized).toContain("sslmode=verify-full");
  });
});
