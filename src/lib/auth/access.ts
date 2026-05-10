import type { Locale } from "@/i18n/routing";

function readEmailList(value: string | undefined) {
  return (value ?? "")
    .split(/[,\n]/)
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function getAuthorizedEmails() {
  return readEmailList(process.env.AUTHORIZED_EMAILS);
}

export function getAdminEmails() {
  const explicitAdmins = readEmailList(process.env.ADMIN_EMAILS);
  const fallbackAdmins = getAuthorizedEmails().filter((email) => email !== "*");

  return explicitAdmins.length > 0 ? explicitAdmins : fallbackAdmins;
}

export function isAuthorizedEmail(email: string | null | undefined) {
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail) {
    return false;
  }

  const authorizedEmails = getAuthorizedEmails();

  if (authorizedEmails.length === 0 || authorizedEmails.includes("*")) {
    return true;
  }

  return authorizedEmails.includes(normalizedEmail);
}

export function isAdminEmail(email: string | null | undefined) {
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail) {
    return false;
  }

  const adminEmails = getAdminEmails();

  if (adminEmails.length === 0) {
    return false;
  }

  return adminEmails.includes(normalizedEmail);
}

export function getDefaultAppPath(locale: Locale, email?: string | null) {
  return isAdminEmail(email) ? `/${locale}/admin` : `/${locale}/dashboard`;
}

export function buildSignInPath(locale: Locale, callbackPath?: string) {
  const signInPath = `/${locale}/sign-in`;

  if (!callbackPath) {
    return signInPath;
  }

  return `${signInPath}?callbackUrl=${encodeURIComponent(callbackPath)}`;
}

export function getAuthBaseUrl() {
  return (process.env.AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
}

export function getGoogleCallbackUrl() {
  const authBaseUrl = getAuthBaseUrl();

  if (!authBaseUrl) {
    return null;
  }

  return `${authBaseUrl}/api/auth/callback/google`;
}
