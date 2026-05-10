"use client";

import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AppProviders({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  return (
    <SessionProvider session={session}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        enableColorScheme
        storageKey="siteops-radar-theme"
      >
        <TooltipProvider delay={250}>{children}</TooltipProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
