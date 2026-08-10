import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const LESSON = "/lessons/dsa/two-pointers/";

type LessonState =
  "initial" | "terminal" | "paused" | "deep-dive-open" | "reduced-motion";

async function openTwoPointersState(
  page: Page,
  state: LessonState,
): Promise<void> {
  if (state === "reduced-motion") {
    await page.emulateMedia({ reducedMotion: "reduce" });
  }
  await page.goto(LESSON);
  const brief = page.locator("[data-visual-brief]");

  switch (state) {
    case "terminal":
      await expect(brief).toHaveAttribute("data-step-index", "8", {
        timeout: 15_000,
      });
      return;
    case "paused":
      await page.getByRole("button", { name: "Pause animation" }).click();
      return;
    case "deep-dive-open":
      await page.locator("details.deep-dive summary").click();
      await expect(page.getByRole("tab").first()).toBeVisible();
      return;
    case "initial":
    case "reduced-motion":
      return;
  }
}

const states: LessonState[] = [
  "initial",
  "terminal",
  "paused",
  "deep-dive-open",
  "reduced-motion",
];

for (const state of states) {
  test(`${state} has no serious accessibility violations`, async ({ page }) => {
    await openTwoPointersState(page, state);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();

    expect(
      results.violations
        .filter((item) => ["critical", "serious"].includes(item.impact ?? ""))
        .map((item) => ({
          id: item.id,
          impact: item.impact,
          nodes: item.nodes.map((node) => node.target.join(" ")),
        })),
    ).toEqual([]);
  });
}

test("reaches every control by keyboard with a visible focus ring", async ({
  page,
}) => {
  await page.goto(LESSON);
  await page.locator("details.deep-dive summary").click();

  const reachable: string[] = [];
  for (let step = 0; step < 40; step += 1) {
    await page.keyboard.press("Tab");
    const focused = await page.evaluate(() => {
      const element = document.activeElement;
      if (element === null || element === document.body) return null;
      const outline = getComputedStyle(element, ":focus-visible").outlineStyle;
      return {
        label: (element.textContent ?? "").trim().slice(0, 30),
        outlined: outline !== "none",
        tag: element.tagName.toLowerCase(),
      };
    });
    if (focused === null) continue;
    reachable.push(`${focused.tag}:${focused.label}`);
    expect(
      focused.outlined,
      `${focused.tag} "${focused.label}" has no focus indicator`,
    ).toBe(true);
  }

  // Every interactive affordance on the page must be in the focus order.
  const joined = reachable.join("|");
  expect({
    deepDive: joined.includes("Deep dive"),
    pause: joined.includes("Pause"),
    skipLink: joined.includes("Skip to main content"),
  }).toEqual({ deepDive: true, pause: true, skipLink: true });
});

test("keeps one heading level one and an unbroken heading order", async ({
  page,
}) => {
  await page.goto(LESSON);

  const levels = await page.evaluate(() =>
    [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")]
      .filter((heading) => !(heading as HTMLElement).hidden)
      .map((heading) => Number(heading.tagName.slice(1))),
  );

  const skips = levels.filter(
    (level, index) => index > 0 && level - (levels[index - 1] ?? level) > 1,
  );

  expect({
    firstIsH1: levels[0],
    h1Count: levels.filter((l) => l === 1).length,
    skips,
  }).toEqual({
    firstIsH1: 1,
    h1Count: 1,
    skips: [],
  });
});
