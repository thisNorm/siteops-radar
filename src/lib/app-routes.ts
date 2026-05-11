import type { Locale } from "@/i18n/routing";

export const appRouteSegments = {
  admin: "/admin",
  dashboard: "/dashboard",
  dashboardPreview: "/dashboard/preview",
  dashboardSites: "/dashboard/sites",
  projects: "/projects",
  reports: "/reports",
  settings: "/settings",
  signIn: "/sign-in",
} as const;

export type AppRouteSegment = (typeof appRouteSegments)[keyof typeof appRouteSegments];

export function getLocalizedAppPath(locale: Locale, segment: AppRouteSegment) {
  return `/${locale}${segment}`;
}

export function getAdminPath(locale: Locale) {
  return getLocalizedAppPath(locale, appRouteSegments.admin);
}

export function getDashboardPreviewPath(locale: Locale) {
  return getLocalizedAppPath(locale, appRouteSegments.dashboardPreview);
}

export function getDashboardSitesPath(locale: Locale) {
  return getLocalizedAppPath(locale, appRouteSegments.dashboardSites);
}

export function getDashboardProjectSegment(projectId: string) {
  return `${appRouteSegments.dashboardSites}/${projectId}`;
}

export function getDashboardProjectPath(locale: Locale, projectId: string) {
  return `${getDashboardSitesPath(locale)}/${projectId}`;
}

export function getProjectsPath(locale: Locale) {
  return getLocalizedAppPath(locale, appRouteSegments.projects);
}

export function getReportsPath(locale: Locale) {
  return getLocalizedAppPath(locale, appRouteSegments.reports);
}

export function getSettingsPath(locale: Locale) {
  return getLocalizedAppPath(locale, appRouteSegments.settings);
}

export function getSignInPath(locale: Locale) {
  return getLocalizedAppPath(locale, appRouteSegments.signIn);
}
