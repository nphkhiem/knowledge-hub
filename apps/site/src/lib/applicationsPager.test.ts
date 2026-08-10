import { afterEach, expect, test } from "vitest";
import {
  mountApplicationsPager,
  type ApplicationsPagerEnvironment,
} from "./applicationsPager";

let release: (() => void) | undefined;

interface Harness {
  readonly root: HTMLElement;
  readonly environment: ApplicationsPagerEnvironment;
  readonly scrolledTo: () => string[];
  readonly setVisible: (index: number) => void;
  readonly indicators: () => HTMLButtonElement[];
}

function createHarness(titles: readonly string[]): Harness {
  const root = document.createElement("div");
  root.dataset.applications = "";
  root.innerHTML = `<div data-applications-track>${titles
    .map(
      (title, index) =>
        `<article data-application id="app-${index}"><h3>${title}</h3><p>Body ${index}</p></article>`,
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
    articles: harness.root.querySelectorAll("[data-application]").length,
    indicators: harness.indicators().length,
  }).toEqual({ articles: 2, indicators: 0 });
});

test("adds one named indicator per application", () => {
  const harness = createHarness(TITLES);
  release = mountApplicationsPager(harness.root, harness.environment);

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
  release = mountApplicationsPager(harness.root, harness.environment);

  harness.indicators()[1]?.click();

  expect({
    active: harness.root.dataset.activeApplication,
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
  release = mountApplicationsPager(harness.root, harness.environment);
  const press = (key: string): void => {
    harness
      .indicators()[0]
      ?.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key }));
  };

  press("ArrowRight");
  const afterRight = harness.root.dataset.activeApplication;
  press("End");
  const afterEnd = harness.root.dataset.activeApplication;
  press("Home");

  expect({
    afterEnd,
    afterHome: harness.root.dataset.activeApplication,
    afterRight,
  }).toEqual({ afterEnd: "2", afterHome: "0", afterRight: "1" });
});

test("follows the track when the learner scrolls it themselves", () => {
  const harness = createHarness(TITLES);
  release = mountApplicationsPager(harness.root, harness.environment);

  harness.setVisible(1);

  expect({
    active: harness.root.dataset.activeApplication,
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
  release = mountApplicationsPager(harness.root, harness.environment);

  expect(harness.indicators()).toHaveLength(0);
});

test("removes what it added when released", () => {
  const harness = createHarness(TITLES);
  const stop = mountApplicationsPager(harness.root, harness.environment);

  stop();

  expect({
    articles: harness.root.querySelectorAll("[data-application]").length,
    indicators: harness.indicators().length,
  }).toEqual({ articles: 2, indicators: 0 });
});
