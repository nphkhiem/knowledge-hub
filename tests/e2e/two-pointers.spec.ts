import { expect, test } from "@playwright/test";

const LESSON = "/lessons/dsa/two-pointers/";

test("teaches Two Pointers from a direct URL through optional depth", async ({
  page,
}) => {
  await page.goto(LESSON);

  await expect(
    page.getByRole("heading", { level: 1, name: "Two Pointers" }),
  ).toBeVisible();

  const brief = page.locator("[data-visual-brief]");
  await expect(
    page.getByRole("button", { name: "Pause animation" }),
  ).toBeVisible();

  // The loop reaches its own terminal state without any interaction.
  await expect(brief).toHaveAttribute("data-step-index", "8", {
    timeout: 15_000,
  });
  // The result is SVG text, so assert on the figure's content, not a text role.
  await expect(brief).toContainText("Pair found at indices 2 and 4");

  await page.getByRole("button", { name: "Pause animation" }).click();
  await expect(
    page.getByRole("button", { name: "Resume animation" }),
  ).toBeVisible();

  await expect(
    page.getByRole("heading", { name: "Real-World Applications" }),
  ).toBeVisible();

  await page.locator("details.deep-dive summary").click();
  await expect(page.getByRole("tab", { name: "Python" })).toBeVisible();
});

test("resumes from where it paused rather than starting over", async ({
  page,
}) => {
  await page.goto(LESSON);
  const brief = page.locator("[data-visual-brief]");

  await expect(brief).toHaveAttribute("data-step-index", "2", {
    timeout: 10_000,
  });
  await page.getByRole("button", { name: "Pause animation" }).click();
  const paused = await brief.getAttribute("data-step-index");

  await page.waitForTimeout(1_500);
  const stillPaused = await brief.getAttribute("data-step-index");
  await page.getByRole("button", { name: "Resume animation" }).click();
  const onResume = await brief.getAttribute("data-step-index");

  expect({ onResume, stillPaused }).toEqual({
    onResume: paused,
    stillPaused: paused,
  });
});

test("restarts automatically after holding the outcome", async ({ page }) => {
  await page.goto(LESSON);
  const brief = page.locator("[data-visual-brief]");

  await expect(brief).toHaveAttribute("data-step-index", "8", {
    timeout: 15_000,
  });
  await expect(brief).toHaveAttribute("data-step-index", "0", {
    timeout: 5_000,
  });
  await expect(brief).toHaveAttribute("data-step-index", "1", {
    timeout: 5_000,
  });
});

test("offers every language sample and switches with the keyboard", async ({
  page,
}) => {
  await page.goto(LESSON);
  await page.locator("details.deep-dive summary").click();

  const tabs = page.getByRole("tab");
  await expect(tabs).toHaveCount(5);
  await expect(tabs.first()).toHaveAttribute("aria-selected", "true");

  await tabs.first().press("ArrowRight");
  await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
  await expect(
    page.locator('[data-example-panel][data-language="typescript"]'),
  ).toBeVisible();
  await expect(
    page.locator('[data-example-panel][data-language="python"]'),
  ).toBeHidden();

  await tabs.nth(1).press("End");
  await expect(tabs.nth(4)).toHaveAttribute("aria-selected", "true");
});

test("reaches every lesson section by its own fragment", async ({ page }) => {
  const anchors = [
    "see-it-work",
    "step-by-step",
    "quick-understanding",
    "going-deeper",
    "real-world-applications",
  ];

  for (const anchor of anchors) {
    await page.goto(`${LESSON}#${anchor}`);
    await expect(page.locator(`#${anchor}`)).toBeVisible();
  }
});

test("keeps the whole lesson readable without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(LESSON);

  await expect(
    page.getByRole("heading", { level: 1, name: "Two Pointers" }),
  ).toBeVisible();
  await expect(page.locator("[data-motion-equivalent] > li")).toHaveCount(9);
  await expect(page.locator("[data-example-panel]")).toHaveCount(5);
  await expect(page.locator("#quick-understanding")).toBeVisible();

  // No control may sit there doing nothing when nothing can wire it up.
  await expect(page.getByRole("button", { name: /animation/ })).toHaveCount(0);

  await context.close();
});

test("keeps the lesson intact when the compiled data is unusable", async ({
  page,
}) => {
  await page.route(`**${LESSON}`, async (route) => {
    const response = await route.fetch();
    const body = (await response.text()).replace(
      /(<script type="application\/json" data-compiled-lesson[^>]*>)[\s\S]*?(<\/script>)/,
      "$1{invalid json$2",
    );
    await route.fulfill({ body, response });
  });

  await page.goto(LESSON);

  await expect(
    page.getByText(
      "The animated view is unavailable. The complete step-by-step explanation is available below.",
    ),
  ).toBeVisible();
  await expect(page.locator("[data-motion-equivalent] > li")).toHaveCount(9);
  await expect(page.locator("[data-example-panel]")).toHaveCount(5);
  await expect(page.getByRole("button", { name: /animation/ })).toBeHidden();
});

test("suspends the loop while the figure is offscreen", async ({ page }) => {
  await page.goto(LESSON);
  const brief = page.locator("[data-visual-brief]");
  await expect(brief).toHaveAttribute("data-step-index", "1", {
    timeout: 10_000,
  });

  await page.locator("#going-deeper").scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const whenScrolledAway = await brief.getAttribute("data-step-index");
  await page.waitForTimeout(2_000);

  expect(await brief.getAttribute("data-step-index")).toBe(whenScrolledAway);
});

test("renders only the five sections the lesson keeps", async ({ page }) => {
  await page.goto(LESSON);

  const sections = await page
    .locator("section.lesson-section")
    .evaluateAll((nodes) => nodes.map((node) => node.id));

  expect(sections).toEqual([
    "see-it-work",
    "step-by-step",
    "quick-understanding",
    "going-deeper",
    "real-world-applications",
  ]);
});

test("carries no learner-state, model check, or evidence surface", async ({
  page,
}) => {
  await page.goto(LESSON);

  expect({
    bookmark: await page.getByRole("button", { name: "Bookmark" }).count(),
    checkModel: await page
      .getByRole("button", { name: "Check my model" })
      .count(),
    complete: await page
      .getByRole("button", { name: "Mark completed" })
      .count(),
    evidenceHeading: await page
      .getByRole("heading", { name: "Evidence" })
      .count(),
    modelHeading: await page
      .getByRole("heading", { name: "Check your model" })
      .count(),
    radios: await page.getByRole("radio").count(),
    share: await page.getByRole("button", { name: "Share" }).count(),
    storageNote: await page.getByText("Kept in this browser only.").count(),
  }).toEqual({
    bookmark: 0,
    checkModel: 0,
    complete: 0,
    evidenceHeading: 0,
    modelHeading: 0,
    radios: 0,
    share: 0,
    storageNote: 0,
  });
});

test("pages through the real-world applications with indicator bars", async ({
  page,
}) => {
  await page.goto("/lessons/dsa/two-pointers/");
  const applications = page.locator("#real-world-applications [data-pager]");
  const indicators = applications.getByRole("button");

  await expect(indicators).toHaveCount(2);
  await expect(indicators.first()).toHaveAttribute("aria-current", "true");

  await indicators.nth(1).click();
  await expect(indicators.nth(1)).toHaveAttribute("aria-current", "true");
  await expect(applications).toHaveAttribute("data-pager-active", "1");

  await indicators.nth(1).press("Home");
  await expect(applications).toHaveAttribute("data-pager-active", "0");
});

test("keeps both applications reachable without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/lessons/dsa/two-pointers/");

  // The track scrolls natively, so the content is present and no dead
  // indicator bars are rendered for a script that never ran.
  await expect(
    page.locator("#real-world-applications [data-pager-item]"),
  ).toHaveCount(2);
  await expect(
    page.locator("#real-world-applications [data-pager-indicator]"),
  ).toHaveCount(0);
  await expect(
    page.locator("#real-world-applications .pager-track"),
  ).toHaveAttribute("tabindex", "0");

  await context.close();
});

test("pages through the step sequence with its own indicator bars", async ({
  page,
}) => {
  await page.goto("/lessons/dsa/two-pointers/");
  const steps = page.locator("#step-by-step [data-pager]");
  const bars = steps.locator("[data-pager-indicator]");

  await expect(steps.locator("[data-pager-item]")).toHaveCount(9);
  await expect(bars).toHaveCount(9);
  await expect(bars.first()).toHaveAttribute("aria-current", "true");
  await expect(bars.first()).toHaveAttribute(
    "aria-label",
    /^Step 1 of 9: The left pointer starts/,
  );

  await bars.nth(3).click();
  await expect(steps).toHaveAttribute("data-pager-active", "3");

  await bars.nth(3).press("End");
  await expect(steps).toHaveAttribute("data-pager-active", "8");
});
