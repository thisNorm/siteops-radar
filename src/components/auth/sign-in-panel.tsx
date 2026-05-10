"use client";

import { Loader2, LockKeyhole, Mail } from "lucide-react";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SignInPanelProps = {
  callbackUrl: string;
  defaultDevEmail: string;
  devCredentialsAvailable: boolean;
  googleAvailable: boolean;
  googleConfigured: boolean;
  authorizedEmailsConfigured: boolean;
  errorCode?: string;
};

export function SignInPanel({
  callbackUrl,
  defaultDevEmail,
  devCredentialsAvailable,
  googleAvailable,
  googleConfigured,
  authorizedEmailsConfigured,
  errorCode,
}: SignInPanelProps) {
  const t = useTranslations("auth");
  const [devEmail, setDevEmail] = useState(defaultDevEmail);
  const [isPending, startTransition] = useTransition();

  const errorLabel =
    errorCode && t.has(`errors.${errorCode}`) ? t(`errors.${errorCode}`) : errorCode ? t("errors.default") : null;

  function handleGoogleSignIn() {
    startTransition(() => {
      void signIn("google", { redirectTo: callbackUrl });
    });
  }

  function handleDevSignIn() {
    startTransition(() => {
      void signIn("credentials", {
        email: devEmail,
        redirectTo: callbackUrl,
      });
    });
  }

  return (
    <Card className="w-full max-w-md border-border/70 bg-card/95 shadow-xl backdrop-blur">
      <CardHeader className="space-y-4">
        <Badge variant="outline" className="w-fit">
          {t("eyebrow")}
        </Badge>
        <div className="space-y-2">
          <CardTitle className="text-3xl">{t("title")}</CardTitle>
          <p className="text-sm leading-6 text-muted-foreground">{t("subtitle")}</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {errorLabel ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {errorLabel}
          </div>
        ) : null}

        {googleAvailable ? (
          <Button className="w-full" size="lg" onClick={handleGoogleSignIn} disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}
            {t("continueWithGoogle")}
          </Button>
        ) : googleConfigured ? (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
            {authorizedEmailsConfigured ? t("googleTemporarilyUnavailable") : t("googleAllowlistRequired")}
          </div>
        ) : (
          <div className="rounded-2xl border border-border/70 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            {t("googleNotConfigured")}
          </div>
        )}

        {devCredentialsAvailable ? (
          <div className="space-y-3 rounded-2xl border border-dashed border-border/70 bg-muted/20 p-4">
            <div className="space-y-1">
              <div className="text-sm font-medium">{t("localModeTitle")}</div>
              <p className="text-xs leading-5 text-muted-foreground">{t("localModeDescription")}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dev-login-email">{t("localModeEmail")}</Label>
              <Input
                id="dev-login-email"
                type="email"
                value={devEmail}
                onChange={(event) => setDevEmail(event.target.value)}
              />
            </div>
            <Button className="w-full" variant="secondary" onClick={handleDevSignIn} disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              {t("continueLocally")}
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
