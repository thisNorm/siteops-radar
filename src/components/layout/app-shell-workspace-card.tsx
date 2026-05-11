"use client";

import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import { Shield, Sparkles } from "lucide-react";

type AppShellWorkspaceCardProps = {
  isAuthenticated: boolean;
  isAdmin: boolean;
};

export function AppShellWorkspaceCard({
  isAuthenticated,
  isAdmin,
}: AppShellWorkspaceCardProps) {
  const t = useTranslations("shell");
  const badgeLabel = isAdmin
    ? t("workspace.adminBadge")
    : isAuthenticated
      ? t("workspace.memberBadge")
      : t("workspace.previewBadge");
  const body = isAdmin
    ? t("workspace.adminDescription")
    : isAuthenticated
      ? t("workspace.memberDescription")
      : t("workspace.previewDescription");

  return (
    <div className="absolute right-4 bottom-28 left-4 rounded-lg border border-violet-100 bg-violet-50/70 p-4">
      <div className="flex items-center gap-2 text-primary">
        {isAdmin ? <Shield className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
        <Badge className="rounded-md bg-violet-600 text-white hover:bg-violet-600">{badgeLabel}</Badge>
      </div>
      <div className="mt-3 text-sm font-medium">{t("workspace.title")}</div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
    </div>
  );
}
