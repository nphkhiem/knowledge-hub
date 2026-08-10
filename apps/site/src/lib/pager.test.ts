import { afterEach, expect, test } from "vitest";
import { mountPager, type PagerEnvironment } from "./pager";

let release: (() => void) | undefined;

interface Harness {
  readonly root: HTMLElement;
  readonly environment: PagerEnvironment;
  readonly scrolledTo: () => string[];
  readonly setVisible: (index: number) => void;
  readonly indicators: () => HTMLButtonElement[];
}

function createHarness(titles: readonly string[]): Harness {
  const root = document.createElement("div");
  root.dataset.pager = "";
  root.dataset.pagerNoun = "Application";
  root.innerHTML = `<div data-pager-track>${titles
    .map(
      (title, index) =>
        `<article data-pager-item id="app-${index}"><h3>${title}</h3><p>Body ${index}</p></article>`,
    )
    .join("")}</div>`;
  document.body.append(root);

  const scrolledTo: string[] = [];
  let onActive: ((index: number) => void) | undefined;

  return {
    environment: {
      observeActive: (_items, callback) => {
        onActive = callback;
        return () => {
          onActive = undefined;
        };
      },
      scrollToItem: (item) => scrolledTo.push(item.id),
    },
    indicators: () => [
      ...root.querySelectorAll<HTMLButtonElement>("[data-pager-indicator]"),
    ],
    root,
    scrolledTo: () => scrolledTo,
    setVisible: (index) => onActive?.(index),
  };
}

afterEach(() => {
  release?.();
  release = undefined;
  document.body.innerHTML = "";
});

const TITLES = [
  "Reconcile two sorted identifier snapshots",
  "Compact a sorted event batch in place",
] as const;

test("leaves every application reachable before anything enhances it", () => {
  const harness = createHarness(TITLES);

  expect({
    articles: harness.root.querySelectorAll("[data-pager-item]").length,
    indicators: harness.indicators().length,
  }).toEqual({ articles: 2, indicators: 0 });
});

test("adds one named indicator per application", () => {
  const harness = createHarness(TITLES);
  release = mountPager(harness.root, harness.environment);

  expect({
    current: harness.indicators().map((b) => b.getAttribute("aria-current")),
    labels: harness.indicators().map((b) => b.getAttribute("aria-label")),
  }).toEqual({
    current: ["true", "false"],
    labels: [
      "Application 1 of 2: Reconcile two sorted identifier snapshots",
      "Application 2 of 2: Compact a sorted event batch in place",
    ],
  });
});

test("moves to an application when its indicator is pressed", () => {
  const harness = createHarness(TITLES);
  release = mountPager(harness.root, harness.environment);

  harness.indicators()[1]?.click();

  expect({
    active: harness.root.dataset.pagerActive,
    current: harness.indicators().map((b) => b.getAttribute("aria-current")),
    scrolled: harness.scrolledTo(),
  }).toEqual({
    active: "1",
    current: ["false", "true"],
    scrolled: ["app-1"],
  });
});

test("walks the applications with the arrow, Home, and End keys", () => {
  const harness = createHarness([...TITLES, "A third application"]);
  release = mountPager(harness.root, harness.environment);
  const press = (key: string): void => {
    harness
      .indicators()[0]
      ?.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key }));
  };

  press("ArrowRight");
  const afterRight = harness.root.dataset.pagerActive;
  press("End");
  const afterEnd = harness.root.dataset.pagerActive;
  press("Home");

  expect({
    afterEnd,
    afterHome: harness.root.dataset.pagerActive,
    afterRight,
  }).toEqual({ afterEnd: "2", afterHome: "0", afterRight: "1" });
});

test("follows the track when the learner scrolls it themselves", () => {
  const harness = createHarness(TITLES);
  release = mountPager(harness.root, harness.environment);

  harness.setVisible(1);

  expect({
    active: harness.root.dataset.pagerActive,
    current: harness.indicators().map((b) => b.getAttribute("aria-current")),
    scrolled: harness.scrolledTo(),
  }).toEqual({
    active: "1",
    current: ["false", "true"],
    // Following the learner's own scrolling must not scroll them again.
    scrolled: [],
  });
});

test("adds no pager when a lesson has a single application", () => {
  const harness = createHarness(["Only one"]);
  release = mountPager(harness.root, harness.environment);

  expect(harness.indicators()).toHaveLength(0);
});

test("removes what it added when released", () => {
  const harness = createHarness(TITLES);
  const stop = mountPager(harness.root, harness.environment);

  stop();

  expect({
    articles: harness.root.querySelectorAll("[data-pager-item]").length,
    indicators: harness.indicators().length,
  }).toEqual({ articles: 2, indicators: 0 });
});

test("takes its vocabulary from the track rather than assuming one", () => {
  const root = document.createElement("div");
  root.dataset.pager = "";
  root.dataset.pagerNoun = "Step";
  root.dataset.pagerGroupLabel = "Choose a step";
  root.innerHTML = `<div data-pager-track>${[1, 2, 3]
    .map(
      (n) => `<li data-pager-item data-pager-item-label="Compare ${n}"></li>`,
    )
    .join("")}</div>`;
  document.body.append(root);
  release = mountPager(root, {
    observeActive: () => () => undefined,
    scrollToItem: () => undefined,
  });

  expect({
    group: root.querySelector(".pager-indicators")?.getAttribute("aria-label"),
    labels: [...root.querySelectorAll("[data-pager-indicator]")].map((b) =>
      b.getAttribute("aria-label"),
    ),
  }).toEqual({
    group: "Choose a step",
    labels: [
      "Step 1 of 3: Compare 1",
      "Step 2 of 3: Compare 2",
      "Step 3 of 3: Compare 3",
    ],
  });
});

test("names by position alone when an item offers no label", () => {
  const root = document.createElement("div");
  root.dataset.pager = "";
  root.dataset.pagerNoun = "Step";
  root.innerHTML =
    "<div data-pager-track><li data-pager-item></li><li data-pager-item></li></div>";
  document.body.append(root);
  release = mountPager(root, {
    observeActive: () => () => undefined,
    scrollToItem: () => undefined,
  });

  expect(
    [...root.querySelectorAll("[data-pager-indicator]")].map((b) =>
      b.getAttribute("aria-label"),
    ),
  ).toEqual(["Step 1 of 2", "Step 2 of 2"]);
});
