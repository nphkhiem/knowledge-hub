import { expect, test } from "@playwright/test";

const PATHS = "paths/";
const FOUNDATIONS = "paths/interview-foundations/";

test("lists the available paths", async ({ page }) => {
  await page.goto(PATHS);

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Interview Foundations/ }),
  ).toBeVisible();
});

test("opens a path and shows its lessons in recommended order", async ({
  page,
}) => {
  await page.goto(FOUNDATIONS);

  await expect(
    page.getByRole("heading", { level: 1, name: "Interview Foundations" }),
  ).toBeVisible();
  await expect(page.getByText(/1 of 15 lessons published/)).toBeVisible();
  await expect(page.locator("[data-lesson-slug]")).toHaveCount(1);
});

test("says plainly that nothing is gated", async ({ page }) => {
  await page.goto(FOUNDATIONS);

  await expect(page.getByText(/Nothing here is gated/)).toBeVisible();
});

test("reaches the lesson from the path", async ({ page }) => {
  await page.goto(FOUNDATIONS);
  await page.locator("[data-lesson-slug] a").first().click();

  await expect(
    page.getByRole("heading", { level: 1, name: "Two Pointers" }),
  ).toBeVisible();
});

test("a lesson opens directly without any path context", async ({ page }) => {
  // A path is a recommendation, so a lesson must never depend on arriving
  // through one.
  await page.goto("lessons/dsa/two-pointers/");

  await expect(
    page.getByRole("heading", { level: 1, name: "Two Pointers" }),
  ).toBeVisible();
});

test("reaches Paths from the header on every page", async ({ page }) => {
  await page.goto("./");
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("link", { name: "Paths" })
    .click();

  await expect(page).toHaveURL(/\/paths\/$/);
});

test("does not publish a path that was never declared", async ({ page }) => {
  const response = await page.request.get("paths/does-not-exist/");
  expect(response.status()).toBe(404);
});

test("keeps one heading level one and an unbroken heading order", async ({
  page,
}) => {
  await page.goto(FOUNDATIONS);

  const levels = await page
    .locator("h1, h2, h3, h4, h5, h6")
    .evaluateAll((nodes) => nodes.map((node) => Number(node.tagName.slice(1))));

  const jumps = levels.filter(
    (level, index) => index > 0 && level - (levels[index - 1] ?? 0) > 1,
  );

  expect({
    h1Count: levels.filter((level) => level === 1).length,
    jumps,
  }).toEqual({ h1Count: 1, jumps: [] });
});

test("reads without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(FOUNDATIONS);

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator("[data-lesson-slug]")).toHaveCount(1);

  await context.close();
});
