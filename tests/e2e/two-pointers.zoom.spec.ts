import { expect, test, type Page } from "@playwright/test";

const LESSON = "lessons/dsa/two-pointers/";

/**
 * Playwright cannot drive browser zoom, and the criteria being verified here
 * are reflow properties rather than pixel properties: WCAG 2.2 AA 1.4.4 Resize
 * Text and 1.4.10 Reflow. Halving a desktop viewport models 200% zoom for
 * layout purposes and, unlike a screenshot, is platform-independent, so this
 * runs in CI under the `experience` gate.
 */
const DESKTOP = { width: 1440, height: 1000 } as const;
const ZOOMED_200 = { width: DESKTOP.width / 2, height: DESKTOP.height / 2 };

const SECTIONS = [
  "see-it-work",
  "step-by-step",
  "quick-understanding",
  "going-deeper",
  "real-world-applications",
] as const;

async function openZoomed(page: Page): Promise<void> {
  await page.setViewportSize(ZOOMED_200);
  await page.goto(LESSON);
  await page.evaluate(() => document.fonts.ready);
}

test("reflows at 200% zoom without a horizontal scrollbar", async ({
  page,
}) => {
  await openZoomed(page);

  // Two-dimensional scrolling is the thing 1.4.10 forbids. One stray fixed
  // width anywhere on the page shows up here and nowhere else.
  const overflow = await page.evaluate(() => {
    const root = document.documentElement;
    return {
      scrollWidth: root.scrollWidth,
      clientWidth: root.clientWidth,
    };
  });

  expect(
    overflow.scrollWidth,
    `page scrolls horizontally at ${ZOOMED_200.width}px`,
  ).toBeLessThanOrEqual(overflow.clientWidth);
});

test("keeps every element inside the viewport at 200% zoom", async ({
  page,
}) => {
  await openZoomed(page);

  // A page can report no horizontal scroll while an individual element still
  // spills out of view, so the elements are measured directly.
  //
  // Two exclusions, both deliberate. Content inside a horizontal scroller (the
  // step pager) is allowed, because 1.4.10 forbids two-dimensional scrolling of
  // the page rather than a one-dimensional scroll region. Content a reader
  // cannot see is irrelevant: a closed <details> still reports a layout box, so
  // without the visibility check this measures the collapsed Deep Dive.
  const spilling = await page.evaluate(() => {
    const limit = document.documentElement.clientWidth;
    const insideScroller = (element: Element): boolean => {
      for (
        let node = element.parentElement;
        node !== null;
        node = node.parentElement
      ) {
        const overflowX = getComputedStyle(node).overflowX;
        if (overflowX === "auto" || overflowX === "scroll") return true;
      }
      return false;
    };

    return [...document.body.querySelectorAll("*")]
      .filter(
        (element) =>
          element.checkVisibility({ contentVisibilityAuto: true }) &&
          element.getBoundingClientRect().right > limit + 1 &&
          !insideScroller(element),
      )
      .map((element) => element.tagName.toLowerCase())
      .slice(0, 10);
  });

  expect(spilling).toEqual([]);
});

test("keeps the visual brief figure readable at 200% zoom", async ({
  page,
}) => {
  await openZoomed(page);
  const brief = page.locator("[data-visual-brief]");

  await expect(brief).toBeVisible();

  // The figure scales with its container rather than being cropped by it.
  const fits = await brief.evaluate((element) => {
    const svg = element.querySelector("svg");
    if (svg === null) return null;
    const figure = svg.getBoundingClientRect();
    const container = element.getBoundingClientRect();
    return figure.width > 0 && figure.right <= container.right + 1;
  });

  expect(fits).toBe(true);
});

test("reaches every lesson section at 200% zoom", async ({ page }) => {
  await openZoomed(page);

  const visible: Record<string, boolean> = {};
  for (const section of SECTIONS) {
    visible[section] = await page.locator(`#${section}`).isVisible();
  }

  expect(visible).toEqual(Object.fromEntries(SECTIONS.map((id) => [id, true])));
});

test("keeps the motion control operable at 200% zoom", async ({ page }) => {
  await openZoomed(page);

  const control = page.getByRole("button", { name: /animation/ });
  await expect(control).toBeVisible();
  await control.click();

  await expect(
    page.getByRole("button", { name: "Resume animation" }),
  ).toBeVisible();
});
