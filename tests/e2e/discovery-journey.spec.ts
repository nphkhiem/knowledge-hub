import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const VIEWPORTS = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 1000 },
] as const;

const SURFACES = [
  { name: "home", path: "./" },
  { name: "explore", path: "explore/" },
  { name: "paths", path: "paths/" },
  { name: "path detail", path: "paths/interview-foundations/" },
  { name: "domain", path: "domains/dsa/" },
  { name: "about", path: "about/" },
  { name: "accessibility", path: "accessibility/" },
  { name: "not found", path: "no-such-page/" },
] as const;

async function seriousViolations(page: Page): Promise<unknown[]> {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();

  return results.violations
    .filter((item) => ["critical", "serious"].includes(item.impact ?? ""))
    .map((item) => ({
      id: item.id,
      impact: item.impact,
      nodes: item.nodes.map((node) => node.target.join(" ")),
    }));
}

for (const surface of SURFACES) {
  test(`${surface.name} has no serious accessibility violations`, async ({
    page,
  }) => {
    await page.goto(surface.path);
    expect(await seriousViolations(page)).toEqual([]);
  });
}

test("a guided learner reaches a lesson from the home promise", async ({
  page,
}) => {
  await page.goto("./");
  await page
    .getByRole("link", { name: /Two Pointers/ })
    .first()
    .click();

  await expect(
    page.getByRole("heading", { level: 1, name: "Two Pointers" }),
  ).toBeVisible();
  await expect(page.locator("[data-visual-brief]")).toBeVisible();
});

test("a term-aware learner reaches a lesson by searching", async ({ page }) => {
  await page.goto("./");
  await page.getByPlaceholder("Search lessons").fill("pair");
  await page.getByRole("button", { name: "Search" }).click();
  await page.getByRole("link", { name: /Two Pointers/ }).click();

  await expect(
    page.getByRole("heading", { level: 1, name: "Two Pointers" }),
  ).toBeVisible();
});

test("a browsing learner reaches a lesson through a domain", async ({
  page,
}) => {
  await page.goto("./");
  await page
    .getByRole("link", { name: /Data Structures and Algorithms/ })
    .click();
  await page.locator("[data-lesson-slug] a").first().click();

  await expect(
    page.getByRole("heading", { level: 1, name: "Two Pointers" }),
  ).toBeVisible();
});

test("a path follower reaches a lesson through the recommended order", async ({
  page,
}) => {
  await page.goto("paths/");
  await page.getByRole("link", { name: /Interview Foundations/ }).click();
  await page.locator("[data-lesson-slug] a").first().click();

  await expect(
    page.getByRole("heading", { level: 1, name: "Two Pointers" }),
  ).toBeVisible();
});

test("a lost learner recovers from a bad address", async ({ page }) => {
  await page.goto("lessons/dsa/does-not-exist/");
  await page.getByRole("link", { name: /Follow a learning path/ }).click();

  await expect(
    page.getByRole("link", { name: /Interview Foundations/ }),
  ).toBeVisible();
});

for (const viewport of VIEWPORTS) {
  test(`every discovery surface reflows at ${viewport.name}`, async ({
    page,
  }) => {
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    });

    const overflowing: string[] = [];
    for (const surface of SURFACES) {
      await page.goto(surface.path);
      const scrolls = await page.evaluate(() => {
        const root = document.documentElement;
        return root.scrollWidth > root.clientWidth;
      });
      if (scrolls) overflowing.push(surface.name);
    }

    expect(overflowing).toEqual([]);
  });
}

test("every discovery surface works without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();

  const broken: string[] = [];
  for (const surface of SURFACES) {
    await page.goto(surface.path);
    const hasHeading = await page
      .getByRole("heading", { level: 1 })
      .isVisible()
      .catch(() => false);
    if (!hasHeading) broken.push(surface.name);
  }

  expect(broken).toEqual([]);
  await context.close();
});

test("reduced motion is honored across the journey", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./");

  const reduced = await page.evaluate(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  expect(reduced, "reduced motion was not emulated").toBe(true);

  await page
    .getByRole("link", { name: /Two Pointers/ })
    .first()
    .click();
  await expect(page.locator("[data-visual-brief]")).toHaveAttribute(
    "data-visual-state",
    "reduced-motion",
  );
});
