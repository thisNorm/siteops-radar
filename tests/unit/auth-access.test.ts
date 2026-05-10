import { afterEach, describe, expect, it } from "vitest";
import { getAdminEmails, isAdminEmail, isAuthorizedEmail } from "@/lib/auth/access";

const originalEnv = {
  AUTHORIZED_EMAILS: process.env.AUTHORIZED_EMAILS,
  ADMIN_EMAILS: process.env.ADMIN_EMAILS,
};

function restoreEnvValue(key: keyof typeof originalEnv, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
}

afterEach(() => {
  restoreEnvValue("AUTHORIZED_EMAILS", originalEnv.AUTHORIZED_EMAILS);
  restoreEnvValue("ADMIN_EMAILS", originalEnv.ADMIN_EMAILS);
});

describe("auth email access rules", () => {
  it("allows any Google account when AUTHORIZED_EMAILS is empty", () => {
    delete process.env.AUTHORIZED_EMAILS;

    expect(isAuthorizedEmail("user@example.com")).toBe(true);
  });

  it("allows any Google account when AUTHORIZED_EMAILS is wildcard", () => {
    process.env.AUTHORIZED_EMAILS = "*";

    expect(isAuthorizedEmail("user@example.com")).toBe(true);
  });

  it("does not treat wildcard authorized access as admin access", () => {
    process.env.AUTHORIZED_EMAILS = "*";
    delete process.env.ADMIN_EMAILS;

    expect(getAdminEmails()).toEqual([]);
    expect(isAdminEmail("user@example.com")).toBe(false);
  });

  it("keeps explicit admin emails restricted", () => {
    process.env.AUTHORIZED_EMAILS = "*";
    process.env.ADMIN_EMAILS = "kisook2557@gmail.com";

    expect(isAdminEmail("kisook2557@gmail.com")).toBe(true);
    expect(isAdminEmail("other@example.com")).toBe(false);
  });
});
