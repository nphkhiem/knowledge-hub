import { expect, test } from "@playwright/test";

const DSA = "domains/dsa/";

test("introduces the domain and what it teaches", async ({ page }) => {
  await page.goto(DSA);

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Data Structures and Algorithms",
    }),
  ).toBeVisible();
  await expect(page.getByText(/How data is arranged/)).toBeVisible();
});

test("recommends a starting lesson and lists every published one", async ({
  page,
}) => {
  await page.goto(DSA);

  await expect(page.getByText("New here? Start with")).toBeVisible();
  await expect(page.locator("[data-lesson-slug]")).toHaveCount(1);
  await expect(page.getByText(/1 lesson published/)).toBeVisible();
});

test("opens the lesson from the domain list", async ({ page }) => {
  await page.goto(DSA);
  await page.locator("[data-lesson-slug] a").first().click();

  await expect(
    page.getByRole("heading", { level: 1, name: "Two Pointers" }),
  ).toBeVisible();
});

test("does not publish a domain that has no lessons", async ({ page }) => {
  // Networking and system design have no content yet. A page promising an empty
  // shelf is worse than no page.
  for (const domain of ["networking", "system-design"]) {
    const response = await page.request.get(`domains/${domain}/`);
    expect(response.status(), `domains/${domain}/ should not exist`).toBe(404);
  }
});

test("reaches the domain from the home index", async ({ page }) => {
  await page.goto("./");
  await page
    .getByRole("link", { name: /Data Structures and Algorithms/ })
    .click();

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Data Structures and Algorithms",
    }),
  ).toBeVisible();
});

test("home shows only domains that have lessons", async ({ page }) => {
  await page.goto("./");

  const listed = await page
    .locator("section[aria-labelledby='browse-by-domain'] li")
    .count();

  expect(listed).toBe(1);
});

test("keeps one heading level one and an unbroken heading order", async ({
  page,
}) => {
  await page.goto(DSA);

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
  await page.goto(DSA);

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator("[data-lesson-slug]")).toHaveCount(1);

  await context.close();
});

test("groups lessons by difficulty without moving any lesson address", async ({
  page,
}) => {
  await page.goto(DSA);

  // C00's core guarantee: difficulty is metadata, never a route segment. A
  // regraded lesson must keep the address it was published under.
  await expect(page.locator("#difficulty-easy")).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Two Pointers/ }).first(),
  ).toHaveAttribute("href", /\/lessons\/dsa\/two-pointers\/$/);

  const headings = await page
    .locator("[id^='difficulty-']")
    .evaluateAll((nodes) => nodes.map((node) => node.id));
  expect(headings).toEqual(["difficulty-easy"]);
});
