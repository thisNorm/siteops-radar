import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getAuthProviderAvailability } from "@/auth.config";
import { SignInPanel } from "@/components/auth/sign-in-panel";
import { getDefaultAppPath } from "@/lib/auth/access";
import type { Locale } from "@/i18n/routing";

function sanitizeCallbackUrl(rawValue: string | undefined, locale: Locale) {
  if (!rawValue || !rawValue.startsWith("/")) {
    return `/${locale}/dashboard`;
  }

  return rawValue;
}

export default async function SignInPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const session = await auth();
  const { locale } = await params;
  const resolvedSearchParams = await searchParams;
  const callbackUrl = sanitizeCallbackUrl(resolvedSearchParams.callbackUrl, locale);

  if (session?.user?.email) {
    redirect(getDefaultAppPath(locale, session.user.email) as never);
  }

  const providers = getAuthProviderAvailability();

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-10">
      <SignInPanel
        callbackUrl={callbackUrl}
        defaultDevEmail={providers.devLoginEmail}
        devCredentialsAvailable={providers.devCredentials}
        googleAvailable={providers.google}
        googleConfigured={providers.googleConfigured}
        authorizedEmailsConfigured={providers.authorizedEmailsConfigured}
        errorCode={resolvedSearchParams.error}
      />
    </main>
  );
}
