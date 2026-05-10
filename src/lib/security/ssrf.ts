import dns from "node:dns/promises";
import net from "node:net";
import { normalizeUrl } from "@/lib/validators/url";
import { isBlockedIp } from "./ip-ranges";

const blockedHostnames = new Set(["localhost", "localhost.localdomain"]);

export type SafeUrl = {
  normalizedUrl: string;
  hostname: string;
  resolvedIps: string[];
};

export async function assertSafePublicUrl(input: string): Promise<SafeUrl> {
  const normalizedUrl = normalizeUrl(input);
  const url = new URL(normalizedUrl);

  if (blockedHostnames.has(url.hostname)) {
    throw new Error("BLOCKED_HOSTNAME");
  }

  if (net.isIP(url.hostname) && isBlockedIp(url.hostname)) {
    throw new Error("BLOCKED_IP");
  }

  const records = await dns.lookup(url.hostname, { all: true, verbatim: true });
  const resolvedIps = records.map((record) => record.address);

  if (resolvedIps.length === 0 || resolvedIps.some(isBlockedIp)) {
    throw new Error("BLOCKED_RESOLVED_IP");
  }

  return {
    normalizedUrl,
    hostname: url.hostname,
    resolvedIps,
  };
}
