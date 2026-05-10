import { getTranslations } from "next-intl/server";
import { AppShell } from "@/components/layout/app-shell";
import { ProjectManager } from "@/components/projects/project-manager";
import { Badge } from "@/components/ui/badge";

export default async function ProjectsPage() {
  const t = await getTranslations();

  return (
    <AppShell>
      <div className="space-y-8">
        <section className="max-w-3xl space-y-3">
          <Badge variant="outline">Workspace</Badge>
          <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
            {t("projects.title")}
          </h1>
          <p className="text-base leading-7 text-muted-foreground md:text-lg">
            {t("projects.subtitle")}
          </p>
        </section>
        <ProjectManager />
      </div>
    </AppShell>
  );
}
