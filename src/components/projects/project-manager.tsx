"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Radar, Trash2 } from "lucide-react";
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

type Project = {
  id: string;
  name: string;
  url: string;
  competitors: Competitor[];
  lastStatus?: "idle" | "running" | "succeeded" | "partial" | "failed";
  runs: {
    id: string;
    url: string;
    status: AnalysisRunStatus;
    createdAt: string;
  }[];
};

const storageKey = "siteops-radar-projects";

function createId() {
  return crypto.randomUUID();
}

function normalizeDraftUrl(value: string) {
  return value.includes("://") ? value : `https://${value}`;
}

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

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedId) ?? projects[0],
    [projects, selectedId],
  );

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (stored) {
      const parsed = JSON.parse(stored) as Project[];
      setProjects(parsed);
      setSelectedId(parsed[0]?.id ?? null);
      return;
    }

    const starter: Project[] = [
      {
        id: createId(),
        name: "Example SaaS",
        url: "https://example.com",
        lastStatus: "idle",
        runs: [],
        competitors: [
          {
            id: createId(),
            name: "Vercel",
            url: "https://vercel.com",
          },
        ],
      },
    ];
    setProjects(starter);
    setSelectedId(starter[0].id);
    window.localStorage.setItem(storageKey, JSON.stringify(starter));
  }, []);

  function persist(nextProjects: Project[]) {
    setProjects(nextProjects);
    window.localStorage.setItem(storageKey, JSON.stringify(nextProjects));
  }

  function addProject() {
    const url = normalizeDraftUrl(projectDraft.url);
    const project: Project = {
      id: createId(),
      name: projectDraft.name.trim() || new URL(url).hostname,
      url,
      competitors: [],
      lastStatus: "idle",
      runs: [],
    };
    const nextProjects = [project, ...projects];
    persist(nextProjects);
    setSelectedId(project.id);
  }

  function removeProject(id: string) {
    const nextProjects = projects.filter((project) => project.id !== id);
    persist(nextProjects);
    setSelectedId(nextProjects[0]?.id ?? null);
  }

  function addCompetitor() {
    if (!selectedProject) {
      return;
    }

    const url = normalizeDraftUrl(competitorDraft.url);
    const nextProjects = projects.map((project) =>
      project.id === selectedProject.id
        ? {
            ...project,
            competitors: [
              ...project.competitors,
              {
                id: createId(),
                name: competitorDraft.name.trim() || new URL(url).hostname,
                url,
              },
            ],
          }
        : project,
    );
    persist(nextProjects);
  }

  function removeCompetitor(id: string) {
    if (!selectedProject) {
      return;
    }

    persist(
      projects.map((project) =>
        project.id === selectedProject.id
          ? {
              ...project,
              competitors: project.competitors.filter((competitor) => competitor.id !== id),
            }
          : project,
      ),
    );
  }

  async function analyzeProject(project: Project) {
    persist(
      projects.map((item) =>
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

      persist(
        projects.map((item) =>
          item.id === project.id
            ? {
                ...item,
                lastStatus: status,
                runs: [
                  {
                    id: createId(),
                    url: project.url,
                    status,
                    createdAt: new Date().toISOString(),
                  },
                  ...(item.runs ?? []),
                ].slice(0, 8),
              }
            : item,
        ),
      );
    } catch {
      persist(
        projects.map((item) =>
          item.id === project.id
            ? {
                ...item,
                lastStatus: "failed",
                runs: [
                  {
                    id: createId(),
                    url: project.url,
                    status: "failed" as const,
                    createdAt: new Date().toISOString(),
                  },
                  ...(item.runs ?? []),
                ].slice(0, 8),
              }
            : item,
        ),
      );
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("actions.addSite")}</CardTitle>
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
            {projects.length === 0 ? (
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
                        <Badge variant={project.lastStatus === "failed" ? "destructive" : "secondary"}>
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
                      {new Date(run.createdAt).toLocaleString()}
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
