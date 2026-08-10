import { expect, test } from "@playwright/test";

const LESSON = "/lessons/dsa/two-pointers/";

/**
 * The preference is emulated explicitly. Neither a file-level `test.use` nor
 * the project's own `use.reducedMotion` took effect in this Playwright version,
 * and a silently un-emulated run would assert nothing, so the guard below fails
 * loudly rather than passing for the wrong reason.
 */
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(LESSON);
  const reduced = await page.evaluate(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  expect(reduced, "reduced motion was not emulated").toBe(true);
});

test("never animates when the device asks for reduced motion", async ({
  page,
}) => {
  const brief = page.locator("[data-visual-brief]");

  await expect(brief).toHaveAttribute("data-visual-state", "reduced-motion");
  await expect(
    page.getByText(
      "Animation is off because your device requests reduced motion. Follow the step-by-step view below.",
    ),
  ).toBeVisible();

  // Given several loops' worth of time, the figure must not have advanced.
  await page.waitForTimeout(3_000);
  await expect(brief).toHaveAttribute("data-step-index", "0");
});

test("offers no motion control there is no motion to control", async ({
  page,
}) => {
  await expect(page.getByRole("button", { name: /animation/ })).toBeHidden();
});

test("keeps the full step sequence as the way to learn it", async ({
  page,
}) => {
  await expect(page.locator("[data-motion-equivalent] > li")).toHaveCount(9);
  await expect(
    page.locator("[data-motion-equivalent] > li").first(),
  ).toBeVisible();
  await expect(page.locator("[data-motion-equivalent] svg")).toHaveCount(9);
});

test("still teaches the rest of the lesson", async ({ page }) => {
  await expect(page.locator("#quick-understanding")).toBeVisible();
  await expect(page.locator("#real-world-applications")).toBeVisible();
  await expect(page.locator("#evidence")).toBeVisible();
  await page
    .getByRole("radio", { name: "Move the right pointer left" })
    .check();
  await page.getByRole("button", { name: "Check my model" }).click();
  await expect(
    page.getByText(/every pair using the current largest value/i),
  ).toBeVisible();
});
