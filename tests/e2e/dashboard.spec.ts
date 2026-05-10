import { expect, test } from "@playwright/test";

test("renders localized dashboard and theme controls", async ({ page }) => {
  await page.goto("/ko/dashboard");

  await expect(page.getByRole("heading", { name: "안녕하세요, John님! 👋" })).toBeVisible();
  await expect(page.getByText("전체 상태 점수")).toBeVisible();
  await expect(page.getByText("개선 우선순위 TOP 5")).toBeVisible();

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
  await page.goto("/en/projects");

  await expect(page.getByRole("heading", { name: "Manage projects and competitors" })).toBeVisible();
  await page.getByLabel("Project name").fill("Acme Site");
  await page.getByLabel("Site URL").fill("https://acme.example");
  await page.getByRole("button", { name: "Add site" }).click();

  await expect(page.getByRole("cell", { name: "Acme Site" })).toBeVisible();

  await page.getByLabel("Competitor name").fill("Rival Site");
  await page.getByLabel("Competitor URL").fill("https://rival.example");
  await page.getByRole("button", { name: "Add competitor" }).click();

  await expect(page.locator("div").filter({ hasText: /^Rival Site$/ })).toBeVisible();
});
