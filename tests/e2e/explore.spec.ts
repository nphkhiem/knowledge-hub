import { expect, test, type Locator, type Page } from "@playwright/test";

const EXPLORE = "explore/";

function visibleRows(page: Page): Locator {
  return page.locator("[data-lesson-slug]:not([hidden])");
}

test("lists the whole catalog", async ({ page }) => {
  await page.goto(EXPLORE);

  await expect(
    page.getByRole("heading", { level: 1, name: "Explore" }),
  ).toBeVisible();
  const total = await page.locator("[data-lesson-slug]").count();
  await expect(visibleRows(page)).toHaveCount(total);
  await expect(page.locator("[data-explore-summary]")).toContainText(
    `Showing all ${total} lesson`,
  );
});

test("narrows as a term is typed", async ({ page }) => {
  await page.goto(EXPLORE);
  await page.getByLabel("Search lessons").fill("two pointers");

  await expect(visibleRows(page)).toHaveCount(1);
  await expect(page.locator("[data-explore-summary]")).toContainText(
    'matching "two pointers"',
  );
});

test("explains an empty result and recovers from it", async ({ page }) => {
  await page.goto(EXPLORE);
  await page.getByLabel("Search lessons").fill("kubernetes");

  await expect(visibleRows(page)).toHaveCount(0);
  await expect(page.locator("[data-explore-empty]")).toBeVisible();

  await page.getByLabel("Search lessons").fill("");
  await expect(visibleRows(page)).toHaveCount(
    await page.locator("[data-lesson-slug]").count(),
  );
  await expect(page.locator("[data-explore-empty]")).toBeHidden();
});

test("keeps the address shareable", async ({ page }) => {
  await page.goto(EXPLORE);
  await page.getByLabel("Search lessons").fill("pair");

  await expect(page).toHaveURL(/\?q=pair/);
});

test("opens a shared address with its filter already applied", async ({
  page,
}) => {
  await page.goto(`${EXPLORE}?q=kubernetes`);

  await expect(page.locator("[data-explore-empty]")).toBeVisible();
  await expect(page.getByLabel("Search lessons")).toHaveValue("kubernetes");
});

test("ignores a parameter the site no longer supports", async ({ page }) => {
  // `saved=1` filtered to bookmarks before the site stopped keeping any. An old
  // shared link must still open something useful.
  await page.goto(`${EXPLORE}?saved=1`);

  await expect(visibleRows(page)).toHaveCount(
    await page.locator("[data-lesson-slug]").count(),
  );
  await expect(page.locator("[data-explore-empty]")).toBeHidden();
});

test("filters by domain", async ({ page }) => {
  await page.goto(EXPLORE);
  await page.getByLabel("Domain").selectOption("dsa");

  await expect(visibleRows(page)).toHaveCount(
    await page.locator("[data-lesson-slug]").count(),
  );
  await expect(page.locator("[data-explore-summary]")).toContainText("in DSA");
});

test("reaches the lesson from a result", async ({ page }) => {
  await page.goto(EXPLORE);
  await page.getByRole("link", { name: /Two Pointers/ }).click();

  await expect(
    page.getByRole("heading", { level: 1, name: "Two Pointers" }),
  ).toBeVisible();
});

test("serves the whole catalog without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(EXPLORE);

  // The catalog is real markup, so it is browsable with scripting unavailable.
  await expect(visibleRows(page)).toHaveCount(
    await page.locator("[data-lesson-slug]").count(),
  );
  await expect(page.getByRole("link", { name: /Two Pointers/ })).toBeVisible();

  await context.close();
});

test("survives an unusable search index", async ({ page }) => {
  await page.route(`**/${EXPLORE}`, async (route) => {
    const response = await route.fetch();
    const body = (await response.text()).replace(
      /(<script type="application\/json" data-search-index[^>]*>)[\s\S]*?(<\/script>)/,
      "$1{broken$2",
    );
    await route.fulfill({ body, response });
  });

  await page.goto(EXPLORE);

  // Filtering is gone, but the catalog it would have filtered is still here.
  await expect(visibleRows(page)).toHaveCount(
    await page.locator("[data-lesson-slug]").count(),
  );
  await expect(page.getByRole("link", { name: /Two Pointers/ })).toBeVisible();
});

test("stores nothing about the visitor", async ({ page }) => {
  await page.goto(EXPLORE);

  const stored = await page.evaluate(() => ({
    local: window.localStorage.length,
    session: window.sessionStorage.length,
    cookies: document.cookie,
  }));

  expect(stored).toEqual({ local: 0, session: 0, cookies: "" });
});

test("reaches Explore from the header on every page", async ({ page }) => {
  await page.goto("./");
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("link", { name: "Explore" })
    .click();

  await expect(
    page.getByRole("heading", { level: 1, name: "Explore" }),
  ).toBeVisible();
});

test("searches from the home page entry", async ({ page }) => {
  await page.goto("./");
  await page.getByPlaceholder("Search lessons").fill("pair");
  await page.getByRole("button", { name: "Search" }).click();

  await expect(page).toHaveURL(/explore\/\?q=pair/);

  /**
   * Deliberately not a fixed count. This asserted exactly one match until a
   * later lesson mentioned closest pairs, which is legitimate content rather
   * than a defect. How many lessons mention a term is catalog size in
   * disguise, and docs/catalog-assumptions.md item 7 has recorded that mistake
   * twice already. What must hold is that the query reached Explore, narrowed
   * the list, and kept the lesson the term names.
   */
  const matched = await visibleRows(page).count();
  await expect(page.locator('[data-lesson-slug="two-pointers"]')).toBeVisible();

  await page.goto("explore/");
  const published = await visibleRows(page).count();

  expect({ narrowed: matched < published, someMatched: matched > 0 }).toEqual({
    narrowed: true,
    someMatched: true,
  });
});

test("finds a lesson by a term that appears only in its prose", async ({
  page,
}) => {
  await page.goto(EXPLORE);
  // Before the index reached lesson prose, this returned nothing although a
  // whole lesson is about scans.
  await page.getByLabel("Search lessons").fill("scan");

  await expect(visibleRows(page)).not.toHaveCount(0);
});
