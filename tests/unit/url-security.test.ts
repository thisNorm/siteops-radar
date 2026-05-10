import { describe, expect, it } from "vitest";
import { isBlockedIp } from "@/lib/security/ip-ranges";
import { normalizeUrl } from "@/lib/validators/url";

describe("URL normalization", () => {
  it("normalizes plain hostnames to https URLs", () => {
    expect(normalizeUrl("Example.com/")).toBe("https://example.com/");
  });

  it("rejects non-http protocols", () => {
    expect(() => normalizeUrl("file:///etc/passwd")).toThrow("INVALID_URL");
    expect(() => normalizeUrl("ftp://example.com")).toThrow("INVALID_URL");
  });

  it("rejects credential URLs", () => {
    expect(() => normalizeUrl("https://user:pass@example.com")).toThrow(
      "URL_CREDENTIALS_NOT_ALLOWED",
    );
  });
});

describe("blocked IP ranges", () => {
  it.each(["127.0.0.1", "0.0.0.0", "10.0.0.1", "172.16.1.1", "192.168.0.1", "169.254.1.1"])(
    "blocks private IPv4 %s",
    (ip) => {
      expect(isBlockedIp(ip)).toBe(true);
    },
  );

  it.each(["::1", "::", "fc00::1", "fd00::1", "fe80::1"])(
    "blocks local IPv6 %s",
    (ip) => {
      expect(isBlockedIp(ip)).toBe(true);
    },
  );

  it("allows public IP addresses", () => {
    expect(isBlockedIp("93.184.216.34")).toBe(false);
    expect(isBlockedIp("2606:2800:220:1:248:1893:25c8:1946")).toBe(false);
  });
});
