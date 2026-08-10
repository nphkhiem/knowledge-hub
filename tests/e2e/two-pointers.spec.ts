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

  await page
    .getByRole("radio", { name: "Move the right pointer left" })
    .check();
  await page.getByRole("button", { name: "Check my model" }).click();
  await expect(
    page.getByText(/every pair using the current largest value/i),
  ).toBeVisible();

  await page.getByRole("button", { name: "Bookmark" }).click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Remove bookmark" }),
  ).toBeVisible();
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
    "real-world-applications",
    "model-check",
    "going-deeper",
    "evidence",
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
  await expect(page.getByRole("button", { name: "Bookmark" })).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Check my model" }),
  ).toHaveCount(0);

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

test("marks completed and shares without an account", async ({ page }) => {
  await page.goto(LESSON);

  await page.getByRole("button", { name: "Mark completed" }).click();
  await expect(page.getByRole("button", { name: "Completed" })).toBeDisabled();
  await expect(page.getByRole("status")).toContainText(
    "Lesson marked as completed.",
  );

  await page.getByRole("button", { name: "Share" }).click();
  await expect(page.getByRole("status")).toContainText(
    /copied|Copy the address/,
  );

  await expect(page.getByText(/account|sign in|sync/i)).toHaveCount(0);
});

test("suspends the loop while the figure is offscreen", async ({ page }) => {
  await page.goto(LESSON);
  const brief = page.locator("[data-visual-brief]");
  await expect(brief).toHaveAttribute("data-step-index", "1", {
    timeout: 10_000,
  });

  await page.locator("#evidence").scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const whenScrolledAway = await brief.getAttribute("data-step-index");
  await page.waitForTimeout(2_000);

  expect(await brief.getAttribute("data-step-index")).toBe(whenScrolledAway);
});
