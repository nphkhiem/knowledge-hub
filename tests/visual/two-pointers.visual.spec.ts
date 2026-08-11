import { expect, test, type Page } from "@playwright/test";

const LESSON = "lessons/dsa/two-pointers/";

/**
 * Responsive visual regression for the Two Pointers lesson.
 *
 * This suite is local-only and is not wired into CI. Baselines are named with
 * the platform (see `snapshotPathTemplate`) because they are rendered by this
 * machine's font stack and would not match a Linux runner. Run it with
 * `pnpm test:visual`; regenerate deliberately with `--update-snapshots` and
 * review every image by eye before trusting it. Never loosen a threshold to
 * make a failure go away: a diff is either a defect or an intended change.
 */
const VIEWPORTS = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 1000 },
] as const;

type BriefState = "terminal-paused" | "reduced-motion";

/**
 * Both states are frozen before capture, by different means, so neither
 * screenshot can race the instructional loop.
 */
async function openFrozen(page: Page, state: BriefState): Promise<void> {
  if (state === "reduced-motion") {
    await page.emulateMedia({ reducedMotion: "reduce" });
  }

  await page.goto(LESSON);
  const brief = page.locator("[data-visual-brief]");

  if (state === "reduced-motion") {
    // Emulation has silently failed in this Playwright version before, and a
    // baseline captured mid-animation would be worse than no baseline at all.
    await expect(brief).toHaveAttribute("data-visual-state", "reduced-motion");
  } else {
    // The engine holds a terminal snapshot, so pausing there cannot advance.
    await expect(brief).toHaveAttribute("data-step-index", "8", {
      timeout: 15_000,
    });
    await page.getByRole("button", { name: "Pause animation" }).click();
    await expect(
      page.getByRole("button", { name: "Resume animation" }),
    ).toBeVisible();
  }

  // Self-hosted variable fonts still shift layout while they swap.
  await page.evaluate(() => document.fonts.ready);
}

for (const viewport of VIEWPORTS) {
  for (const state of ["terminal-paused", "reduced-motion"] as const) {
    test(`${state} at ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      await openFrozen(page, state);

      await expect(page).toHaveScreenshot(`${state}-${viewport.name}.png`, {
        fullPage: true,
      });
    });
  }
}
