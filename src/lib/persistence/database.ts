const deprecatedSslModes = new Set(["prefer", "require", "verify-ca"]);

export function normalizeDatabaseUrl(url: string | undefined) {
  if (!url) {
    return "";
  }

  try {
    const parsed = new URL(url);
    const sslMode = parsed.searchParams.get("sslmode")?.toLowerCase();
    const usesLibpqCompat = parsed.searchParams.get("uselibpqcompat")?.toLowerCase() === "true";

    if (sslMode && deprecatedSslModes.has(sslMode) && !usesLibpqCompat) {
      parsed.searchParams.set("sslmode", "verify-full");
      return parsed.toString();
    }

    return parsed.toString();
  } catch {
    return url;
  }
}

export function getDatabaseUrl() {
  return normalizeDatabaseUrl(process.env.DATABASE_URL);
}

export function hasDatabaseUrl() {
  const url = process.env.DATABASE_URL;

  return Boolean(url && !url.includes("user:password") && !url.includes("postgres:postgres"));
}
