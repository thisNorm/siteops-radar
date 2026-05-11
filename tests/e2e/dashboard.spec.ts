import { expect, test, type Page } from "@playwright/test";

async function signInLocally(page: Page, locale: "ko" | "en") {
  await page.goto(`/${locale}/sign-in`);
  await page.getByLabel(/Development login email|개발 로그인 이메일/).fill("local@siteopsradar.dev");
  await page.getByRole("button", { name: /Continue in local mode|로컬 모드로 계속하기/ }).click();
  await page.waitForURL(new RegExp(`/${locale}/dashboard(?:/preview|/sites(?:/[^/]+)?)?$`));
}

async function ensureSignedOut(page: Page, locale: "ko" | "en") {
  await page.context().clearCookies();
  await page.goto(`/${locale}/dashboard`);

  const signOutButton = page.getByRole("button", { name: /Sign out|로그아웃/ });

  if (await signOutButton.isVisible().catch(() => false)) {
    await signOutButton.click();
    await page.waitForURL(new RegExp(`/${locale}/sign-in$`));
    await page.context().clearCookies();
  }
}

test("renders public dashboard preview and optional sign-in", async ({ page }) => {
  await ensureSignedOut(page, "ko");
  await page.goto("/ko/dashboard");
  await page.waitForURL("/ko/dashboard/preview");

  await expect(page.getByRole("heading", { name: "안녕하세요, Public님!" })).toBeVisible();
  await expect(page.getByText("전체 건강 점수")).toBeVisible();
  await expect(page.getByRole("complementary").getByRole("button", { name: "로그인" })).toBeVisible();
  await expect(page.getByText("오픈 모드")).toBeVisible();
  await expect(page.getByText("AI 요약")).toBeVisible();
  await expect(page.getByText("우선순위 매트릭스")).toBeVisible();

  await signInLocally(page, "ko");
  await page.getByLabel("테마").click();
  await page.getByRole("menuitem", { name: "다크" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
});

test("shows invalid URL fallback error", async ({ page }) => {
  await page.goto("/en/dashboard");
  await page.getByLabel("https://example.com").fill("file:///etc/passwd");
  await page.locator("section").first().getByRole("button", { name: "Run analysis" }).click();
  await expect(page.getByText("The submitted URL is not allowed.")).toBeVisible();
});

test("manages projects and competitors", async ({ page }) => {
  const runId = Date.now();
  const projectName = `Acme Site ${runId}`;
  const projectUrl = `https://example.com/siteops-${runId}`;
  const competitorName = `Rival Site ${runId}`;
  const competitorUrl = `https://example.org/rival-${runId}`;

  await signInLocally(page, "en");
  await page.goto("/en/projects");

  await expect(page.getByRole("heading", { name: "Manage projects and competitors" })).toBeVisible();
  await page.getByLabel("Project name").fill(projectName);
  await page.getByLabel("Site URL").fill(projectUrl);
  const createProjectResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/api/projects") &&
      response.request().method() === "POST" &&
      response.status() === 201,
  );
  await page.getByRole("button", { name: "Add site" }).click();
  const createProjectPayload = await (await createProjectResponse).json();
  const projectId = createProjectPayload.project.id as string;

  await page.goto("/en/projects");
  await expect(page.getByText(`${projectName} · ${projectUrl}`)).toBeVisible();
  const projectRow = page.getByRole("row").filter({ hasText: projectUrl });
  await expect(projectRow).toBeVisible();

  await page.getByLabel("Competitor name").fill(competitorName);
  await page.getByLabel("Competitor URL").fill(competitorUrl);
  const createCompetitorResponse = page.waitForResponse(
    (response) =>
      response.url().includes(`/api/projects/${projectId}/competitors`) &&
      response.request().method() === "POST" &&
      response.ok(),
  );
  await page.getByRole("button", { name: "Add competitor" }).click();
  await createCompetitorResponse;

  await expect(page.locator("div").filter({ hasText: new RegExp(`^${competitorName}$`) })).toBeVisible();

  await page.goto("/en/dashboard");
  await page.waitForURL("/en/dashboard/sites");
  await expect(page.getByText("Saved site list")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Choose a saved site" })).toBeVisible();
  await expect(page.getByText("The scores currently shown are sample data.")).toHaveCount(0);

  await page.goto("/en/dashboard/preview");
  await page.waitForURL("/en/dashboard/sites");
  await expect(page.getByText("The scores currently shown are sample data.")).toHaveCount(0);

  await page.goto("/en/reports");
  await expect(page.getByRole("heading", { name: "View saved analyses like a report center" })).toBeVisible();
  await expect(page.getByText("Latest saved reports")).toBeVisible();
  await expect(page.getByText("Report coverage")).toBeVisible();

  await page.goto("/en/settings");
  await expect(page.getByRole("heading", { name: "Review your account and workspace state in one place" })).toBeVisible();
  await expect(page.getByText("Current workspace rules")).toBeVisible();
});
