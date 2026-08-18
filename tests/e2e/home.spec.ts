import { expect, test } from "@playwright/test";

const HOME = "./";

test("states the promise and the guided starting point", async ({ page }) => {
  await page.goto(HOME);

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: /understand one software concept visually/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 2, name: "Interview Foundations" }),
  ).toBeVisible();
});

test("reports what is published rather than what is planned", async ({
  page,
}) => {
  await page.goto(HOME);

  // The honest count is the point: a partly written collection must not read as
  // a finished library.
  await expect(page.getByText(/of \d+ lessons/)).toBeVisible();
  await expect(page.getByText(/still being written/)).toBeVisible();
});

test("reads the progress sentence as a sentence", async ({ page }) => {
  await page.goto(HOME);

  /**
   * The count and the rest of the sentence come from two nodes, and JSX drops
   * whitespace between a closing tag and an expression. This line has shipped
   * wrong twice: once reading "2 of 15 lessons  published" with a doubled
   * space, and once with the count running straight into the word after it.
   *
   * The tests above did not catch either, because a substring match on "of 15
   * lessons" passes whatever follows it. This pins the whole sentence, so the
   * spacing has somewhere to fail.
   */
  const progress = (await page.locator("p.progress").textContent()) ?? "";

  expect(progress.trim()).toMatch(
    /^\d+ of \d+ lessons published so far, \d+ minutes of reading in [^.]+\. The rest are still being written\.$/,
  );
});

test("lists published lessons in their recommended order", async ({ page }) => {
  await page.goto(HOME);

  const titles = await page
    .locator(".lesson-list .title")
    .evaluateAll((nodes) => nodes.map((node) => node.textContent?.trim()));

  // Derived, not hardcoded. Listing the titles here re-encoded the catalog
  // size and broke on the very next lesson, which is the mistake
  // docs/catalog-assumptions.md item 7 exists to stop.
  const declared = await page
    .locator("[data-lesson-slug] .position")
    .evaluateAll((nodes) => nodes.map((node) => Number(node.textContent)));

  expect({
    count: titles.length > 0,
    ascending: declared.every(
      (order, index) => index === 0 || order > (declared[index - 1] ?? 0),
    ),
  }).toEqual({ count: true, ascending: true });
});

test("opens the lesson from its row", async ({ page }) => {
  await page.goto(HOME);
  await page.getByRole("link", { name: /Two Pointers/ }).click();

  await expect(
    page.getByRole("heading", { level: 1, name: "Two Pointers" }),
  ).toBeVisible();
});

test("ships no link it cannot honor", async ({ page }) => {
  await page.goto(HOME);

  const internal = await page
    .locator("a[href]")
    .evaluateAll((nodes) =>
      nodes
        .map((node) => (node as HTMLAnchorElement).href)
        .filter((url) => url.startsWith(window.location.origin)),
    );

  const destinations = [...new Set(internal)];

  // Guard against a vacuous pass: an empty link list would satisfy the
  // assertion below while proving nothing.
  expect(
    destinations.length,
    "no internal links were found to check",
  ).toBeGreaterThanOrEqual(3);

  // Every internal destination must already exist. This is what keeps Home from
  // advertising /explore/ and /paths/ before D02 and D04 build them.
  const broken: { url: string; status: number }[] = [];
  for (const url of destinations) {
    const response = await page.request.get(url);
    if (!response.ok()) broken.push({ url, status: response.status() });
  }

  expect(broken).toEqual([]);
});

test("keeps one heading level one and an unbroken heading order", async ({
  page,
}) => {
  await page.goto(HOME);

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

test("reads completely without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(HOME);

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: /Two Pointers/ })).toBeVisible();
  await expect(page.getByText(/of \d+ lessons/)).toBeVisible();

  await context.close();
});

test("stores nothing about the visitor", async ({ page }) => {
  await page.goto(HOME);

  // ADR 0006: the site keeps no learner state. The README promises this
  // publicly, so it is asserted rather than assumed.
  const stored = await page.evaluate(() => ({
    local: window.localStorage.length,
    session: window.sessionStorage.length,
    cookies: document.cookie,
  }));

  expect(stored).toEqual({ local: 0, session: 0, cookies: "" });
});
