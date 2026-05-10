export function hasDatabaseUrl() {
  const url = process.env.DATABASE_URL;

  return Boolean(url && !url.includes("user:password") && !url.includes("postgres:postgres"));
}
