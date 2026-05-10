"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Radar, RefreshCw, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Competitor = {
  id: string;
  name: string;
  url: string;
};

type AnalysisRunStatus = "succeeded" | "partial" | "failed";
type ProjectStatus = "idle" | "queued" | "running" | AnalysisRunStatus;

type Project = {
  id: string;
  name: string;
  url: string;
  competitors: Competitor[];
  lastStatus?: ProjectStatus;
  runs: {
    id: string;
    url: string;
    status: AnalysisRunStatus;
    createdAt: string;
  }[];
};

export function ProjectManager() {
  const t = useTranslations();
  const locale = useLocale();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [projectDraft, setProjectDraft] = useState({
    name: "SiteOps Radar",
    url: "https://example.com",
  });
  const [competitorDraft, setCompetitorDraft] = useState({
    name: "Competitor",
    url: "https://vercel.com",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedId) ?? projects[0],
    [projects, selectedId],
  );

  async function loadProjects(nextSelectedId?: string | null) {
    setErrorMessage(null);

    const response = await fetch("/api/projects", {
      cache: "no-store",
    });
    const payload = (await response.json().catch(() => null)) as
      | { projects?: Project[]; errorMessage?: string }
      | null;

    if (!response.ok || !payload?.projects) {
      throw new Error(payload?.errorMessage ?? "Workspace data could not be loaded.");
    }

    const nextProjects = payload.projects;

    setProjects(nextProjects);
    setSelectedId((currentSelectedId) => {
      const preferredId = nextSelectedId ?? currentSelectedId;

      if (preferredId && nextProjects.some((project) => project.id === preferredId)) {
        return preferredId;
      }

      return nextProjects[0]?.id ?? null;
    });
  }

  useEffect(() => {
    void (async () => {
      try {
        await loadProjects();
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : t("projects.loadError"));
      } finally {
        setIsLoading(false);
      }
    })();
  }, [t]);

  async function refreshProjects(nextSelectedId?: string | null) {
    setIsRefreshing(true);

    try {
      await loadProjects(nextSelectedId);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t("projects.loadError"));
    } finally {
      setIsRefreshing(false);
    }
  }

  async function addProject() {
    setErrorMessage(null);

    const response = await fetch("/api/projects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(projectDraft),
    });
    const payload = (await response.json().catch(() => null)) as
      | { project?: { id: string }; errorMessage?: string }
      | null;

    if (!response.ok || !payload?.project) {
      setErrorMessage(payload?.errorMessage ?? t("projects.saveError"));
      return;
    }

    await refreshProjects(payload.project.id);
  }

  async function removeProject(id: string) {
    setErrorMessage(null);
    const response = await fetch(`/api/projects/${id}`, {
      method: "DELETE",
    });
    const payload = (await response.json().catch(() => null)) as { errorMessage?: string } | null;

    if (!response.ok) {
      setErrorMessage(payload?.errorMessage ?? t("projects.deleteError"));
      return;
    }

    await refreshProjects();
  }

  async function addCompetitor() {
    if (!selectedProject) {
      return;
    }

    setErrorMessage(null);

    const response = await fetch(`/api/projects/${selectedProject.id}/competitors`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(competitorDraft),
    });
    const payload = (await response.json().catch(() => null)) as
      | { errorMessage?: string }
      | null;

    if (!response.ok) {
      setErrorMessage(payload?.errorMessage ?? t("projects.saveError"));
      return;
    }

    await refreshProjects(selectedProject.id);
  }

  async function removeCompetitor(id: string) {
    if (!selectedProject) {
      return;
    }

    setErrorMessage(null);

    const response = await fetch(
      `/api/projects/${selectedProject.id}/competitors/${id}`,
      {
        method: "DELETE",
      },
    );
    const payload = (await response.json().catch(() => null)) as { errorMessage?: string } | null;

    if (!response.ok) {
      setErrorMessage(payload?.errorMessage ?? t("projects.deleteError"));
      return;
    }

    await refreshProjects(selectedProject.id);
  }

  async function analyzeProject(project: Project) {
    setErrorMessage(null);
    setProjects((currentProjects) =>
      currentProjects.map((item) =>
        item.id === project.id ? { ...item, lastStatus: "running" } : item,
      ),
    );

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: project.url, locale }),
      });
      const payload = await response.json();
      const status: AnalysisRunStatus =
        response.ok && (payload.status === "succeeded" || payload.status === "partial")
          ? payload.status
          : "failed";

      if (!response.ok) {
        setErrorMessage(payload.errorMessage ?? t("projects.analysisError"));
      }

      await refreshProjects(project.id);

      setProjects((currentProjects) =>
        currentProjects.map((item) =>
          item.id === project.id ? { ...item, lastStatus: status } : item,
        ),
      );
    } catch {
      setErrorMessage(t("projects.analysisError"));
      setProjects((currentProjects) =>
        currentProjects.map((item) =>
          item.id === project.id ? { ...item, lastStatus: "failed" } : item,
        ),
      );
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              {t("actions.addSite")}
              <Button size="sm" variant="ghost" onClick={() => void refreshProjects(selectedProject?.id ?? null)}>
                <RefreshCw className={isRefreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">{t("projects.projectName")}</Label>
              <Input
                id="project-name"
                value={projectDraft.name}
                onChange={(event) =>
                  setProjectDraft((draft) => ({ ...draft, name: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-url">{t("projects.projectUrl")}</Label>
              <Input
                id="project-url"
                value={projectDraft.url}
                onChange={(event) =>
                  setProjectDraft((draft) => ({ ...draft, url: event.target.value }))
                }
              />
            </div>
            <Button className="w-full" onClick={addProject}>
              <Plus className="h-4 w-4" />
              {t("actions.addSite")}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("actions.addCompetitor")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="competitor-name">{t("projects.competitorName")}</Label>
              <Input
                id="competitor-name"
                value={competitorDraft.name}
                onChange={(event) =>
                  setCompetitorDraft((draft) => ({ ...draft, name: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="competitor-url">{t("projects.competitorUrl")}</Label>
              <Input
                id="competitor-url"
                value={competitorDraft.url}
                onChange={(event) =>
                  setCompetitorDraft((draft) => ({ ...draft, url: event.target.value }))
                }
              />
            </div>
            <Button className="w-full" variant="secondary" onClick={addCompetitor}>
              <Plus className="h-4 w-4" />
              {t("actions.addCompetitor")}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              {t("projects.mySites")}
              <Badge variant="outline">{projects.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
              {t("projects.storageNotice")}
            </p>
            {errorMessage ? (
              <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                {errorMessage}
              </p>
            ) : null}
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("projects.loading")}
              </div>
            ) : projects.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("projects.emptyProjects")}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("projects.projectName")}</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>{t("projects.analysisStatus")}</TableHead>
                    <TableHead className="w-40" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project) => (
                    <TableRow key={project.id} data-state={project.id === selectedProject?.id ? "selected" : undefined}>
                      <TableCell className="font-medium">{project.name}</TableCell>
                      <TableCell className="max-w-56 truncate text-muted-foreground">
                        {project.url}
                      </TableCell>
                        <TableCell>
                         <Badge
                           variant={
                             project.lastStatus === "failed"
                               ? "destructive"
                               : project.lastStatus === "partial"
                                 ? "outline"
                                 : "secondary"
                           }
                         >
                           {project.lastStatus === "running" ? (
                             <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                           ) : null}
                          {project.lastStatus ?? "idle"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button size="icon-sm" variant="outline" onClick={() => setSelectedId(project.id)}>
                            <Radar className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon-sm" onClick={() => analyzeProject(project)}>
                            <Radar className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon-sm" variant="destructive" onClick={() => removeProject(project.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("projects.competitorSites")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="text-sm text-muted-foreground">{t("projects.selectedProject")}</div>
              <div className="font-medium">{selectedProject?.name ?? "-"}</div>
            </div>
            <Separator className="mb-4" />
            {!selectedProject || selectedProject.competitors.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("projects.emptyCompetitors")}</p>
            ) : (
              <div className="divide-y rounded-lg border">
                {selectedProject.competitors.map((competitor) => (
                  <div key={competitor.id} className="flex items-center justify-between gap-4 p-3">
                    <div className="min-w-0">
                      <div className="font-medium">{competitor.name}</div>
                      <div className="truncate text-sm text-muted-foreground">{competitor.url}</div>
                    </div>
                    <Button
                      size="icon-sm"
                      variant="destructive"
                      onClick={() => removeCompetitor(competitor.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("projects.recentRuns")}</CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedProject || (selectedProject.runs ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("projects.emptyRuns")}</p>
            ) : (
              <div className="divide-y rounded-lg border">
                {(selectedProject.runs ?? []).map((run) => (
                  <div key={run.id} className="grid gap-2 p-3 md:grid-cols-[1fr_auto_auto]">
                    <div className="truncate text-sm">{run.url}</div>
                    <Badge
                      variant={
                        run.status === "failed"
                          ? "destructive"
                          : run.status === "partial"
                            ? "outline"
                            : "secondary"
                      }
                    >
                      {run.status}
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      {new Date(run.createdAt).toLocaleString(locale)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
