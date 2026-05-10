import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { routing, type Locale } from "@/i18n/routing";

function readLocale(value: string | undefined): Locale {
  if (value && routing.locales.includes(value as Locale)) {
    return value as Locale;
  }

  return routing.defaultLocale;
}

async function normalizeCallbackUrl(rawValue: string | undefined) {
  if (!rawValue) {
    return undefined;
  }

  if (rawValue.startsWith("/")) {
    return rawValue;
  }

  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";

  if (!host) {
    return undefined;
  }

  try {
    const url = new URL(rawValue);

    if (url.origin !== `${protocol}://${host}`) {
      return undefined;
    }

    return `${url.pathname}${url.search}`;
  } catch {
    return undefined;
  }
}

export default async function AuthSignInBridgePage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const cookieStore = await cookies();
  const locale = readLocale(cookieStore.get("NEXT_LOCALE")?.value);
  const resolvedSearchParams = await searchParams;
  const callbackUrl = await normalizeCallbackUrl(resolvedSearchParams.callbackUrl);
  const nextSearchParams = new URLSearchParams();

  if (callbackUrl) {
    nextSearchParams.set("callbackUrl", callbackUrl);
  }

  if (resolvedSearchParams.error) {
    nextSearchParams.set("error", resolvedSearchParams.error);
  }

  const search = nextSearchParams.toString();

  redirect(`/${locale}/sign-in${search ? `?${search}` : ""}` as never);
}
