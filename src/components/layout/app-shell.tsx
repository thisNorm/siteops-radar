import { Activity, BarChart3, FileText, Gauge, Settings, Shield } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/i18n/navigation";
import { ThemeSwitcher } from "./theme-switcher";
import { LocaleSwitcher } from "./locale-switcher";

export function AppShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations();
  const nav = [
    { label: t("nav.dashboard"), icon: Gauge, href: "/dashboard" },
    { label: t("nav.projects"), icon: Activity, href: "/projects" },
    { label: t("nav.competitors"), icon: BarChart3, href: "/competitors" },
    { label: t("nav.reports"), icon: FileText, href: "/reports" },
    { label: t("nav.settings"), icon: Settings, href: "/settings" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-sidebar/70 px-4 py-5 backdrop-blur lg:block">
        <div className="flex items-center gap-2 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md border bg-background">
            <Shield className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-semibold">{t("app.name")}</div>
            <div className="text-xs text-muted-foreground">{t("app.tagline")}</div>
          </div>
        </div>
        <Separator className="my-5" />
        <nav className="space-y-1">
          {nav.map((item, index) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                index === 0
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-5 left-4 right-4 rounded-md border bg-background/70 p-3">
          <Badge variant="secondary">MVP</Badge>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            Single-page intelligence with extensible analyzers.
          </p>
        </div>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/85 px-4 backdrop-blur md:px-8">
          <div className="min-w-0">
            <div className="text-sm font-semibold lg:hidden">{t("app.name")}</div>
            <div className="hidden text-sm text-muted-foreground lg:block">
              {t("app.description")}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LocaleSwitcher />
            <ThemeSwitcher />
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">{children}</main>
      </div>
    </div>
  );
}
