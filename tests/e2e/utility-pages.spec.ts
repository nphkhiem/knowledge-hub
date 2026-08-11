import { expect, test } from "@playwright/test";

test("About states the promise and the editorial standard", async ({
  page,
}) => {
  await page.goto("about/");

  await expect(
    page.getByRole("heading", { level: 1, name: "What this is for" }),
  ).toBeVisible();
  await expect(page.getByText(/three to five minutes/)).toBeVisible();
  await expect(page.getByText(/primary source/)).toBeVisible();
});

test("About is honest that the site remembers nothing", async ({ page }) => {
  await page.goto("about/");

  await expect(page.getByText(/remembers nothing about you/)).toBeVisible();
});

test("Accessibility describes real behavior and names its gaps", async ({
  page,
}) => {
  await page.goto("accessibility/");

  await expect(
    page.getByRole("heading", { level: 1, name: "How this site behaves" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 2, name: "Known gaps" }),
  ).toBeVisible();
  // The claim on this page must match what the product actually does.
  await expect(page.getByText(/Chromium only/)).toBeVisible();
});

test("a missing page offers real recovery routes", async ({ page }) => {
  const response = await page.goto("no-such-page/");

  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { level: 1, name: "That page is not here" }),
  ).toBeVisible();

  const recovery = page.getByRole("navigation", { name: "Try one of these" });
  await expect(recovery.getByRole("link")).toHaveCount(3);
});

test("recovery from a missing page actually works", async ({ page }) => {
  await page.goto("no-such-page/");
  await page.getByRole("link", { name: /Search every lesson/ }).click();

  await expect(
    page.getByRole("heading", { level: 1, name: "Explore" }),
  ).toBeVisible();
});

test("the footer reaches About and Accessibility from any page", async ({
  page,
}) => {
  await page.goto("lessons/dsa/two-pointers/");
  const utility = page.getByRole("navigation", { name: "Utility" });

  await expect(utility.getByRole("link", { name: "About" })).toBeVisible();
  await utility.getByRole("link", { name: "Accessibility" }).click();

  await expect(
    page.getByRole("heading", { level: 1, name: "How this site behaves" }),
  ).toBeVisible();
});

test("contribution stays last in the utility order", async ({ page }) => {
  await page.goto("./");

  const labels = await page
    .getByRole("navigation", { name: "Utility" })
    .getByRole("link")
    .evaluateAll((nodes) => nodes.map((node) => node.textContent?.trim()));

  expect(labels.at(-1)).toBe("Contribute on GitHub");
});

test("every internal link across the site resolves", async ({ page }) => {
  const pages = [
    "./",
    "explore/",
    "paths/",
    "paths/interview-foundations/",
    "domains/dsa/",
    "about/",
    "accessibility/",
    "lessons/dsa/two-pointers/",
  ];

  const broken: { from: string; url: string; status: number }[] = [];
  let checked = 0;

  for (const path of pages) {
    await page.goto(path);
    const links = await page
      .locator("a[href]")
      .evaluateAll((nodes) =>
        nodes
          .map((node) => (node as HTMLAnchorElement).href)
          .filter((url) => url.startsWith(window.location.origin)),
      );

    for (const url of [...new Set(links)]) {
      checked += 1;
      const response = await page.request.get(url);
      if (!response.ok())
        broken.push({ from: path, url, status: response.status() });
    }
  }

  // Guard against a vacuous pass.
  expect(checked, "no internal links were checked").toBeGreaterThan(20);
  expect(broken).toEqual([]);
});

test("no page writes anything to browser storage", async ({ page }) => {
  const pages = [
    "./",
    "explore/",
    "paths/",
    "domains/dsa/",
    "about/",
    "accessibility/",
    "lessons/dsa/two-pointers/",
  ];

  const offenders: string[] = [];
  for (const path of pages) {
    await page.goto(path);
    const stored = await page.evaluate(() => ({
      local: window.localStorage.length,
      session: window.sessionStorage.length,
      cookies: document.cookie,
    }));
    if (stored.local > 0 || stored.session > 0 || stored.cookies !== "")
      offenders.push(path);
  }

  expect(offenders).toEqual([]);
});
