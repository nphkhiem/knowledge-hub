import { expect, test } from "vitest";
import { mountExampleTabs } from "./exampleTabs";

function createExamples(
  languages: readonly (readonly [string, string])[],
): HTMLElement {
  const root = document.createElement("div");
  root.dataset.lessonExamples = "";
  root.innerHTML = languages
    .map(
      ([language, label]) =>
        `<section data-example-panel data-language="${language}" data-language-label="${label}">` +
        `<h4 data-example-heading>${label}</h4><pre><code>code for ${language}</code></pre>` +
        `</section>`,
    )
    .join("");
  document.body.append(root);
  return root;
}

function tabs(root: HTMLElement): HTMLButtonElement[] {
  return [...root.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
}

function visiblePanels(root: HTMLElement): string[] {
  return [...root.querySelectorAll<HTMLElement>("[data-example-panel]")]
    .filter((panel) => !panel.hidden)
    .map((panel) => panel.dataset.language ?? "");
}

const twoLanguages = [
  ["python", "Python"],
  ["typescript", "TypeScript"],
] as const;

test("shows every sample when nothing has enhanced the markup", () => {
  const root = createExamples(twoLanguages);

  expect({
    panels: visiblePanels(root),
    tablist: root.querySelectorAll('[role="tablist"]').length,
  }).toEqual({ panels: ["python", "typescript"], tablist: 0 });
});

test("builds one tab per sample and reveals only the selected one", () => {
  const root = createExamples(twoLanguages);
  mountExampleTabs(root);

  expect({
    labels: tabs(root).map((tab) => tab.textContent),
    selected: tabs(root).map((tab) => tab.getAttribute("aria-selected")),
    visible: visiblePanels(root),
  }).toEqual({
    labels: ["Python", "TypeScript"],
    selected: ["true", "false"],
    visible: ["python"],
  });
});

test("moves selection with the arrow, Home, and End keys", () => {
  const root = createExamples(twoLanguages);
  mountExampleTabs(root);
  const press = (key: string): void => {
    const focused = tabs(root).find(
      (tab) => tab.getAttribute("aria-selected") === "true",
    );
    focused?.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, key }),
    );
  };

  press("ArrowRight");
  const afterRight = visiblePanels(root);
  press("ArrowRight");
  const afterWrap = visiblePanels(root);
  press("Home");
  const afterHome = visiblePanels(root);
  press("End");
  const afterEnd = visiblePanels(root);

  expect({ afterEnd, afterHome, afterRight, afterWrap }).toEqual({
    afterEnd: ["typescript"],
    afterHome: ["python"],
    afterRight: ["typescript"],
    afterWrap: ["python"],
  });
});

test("selects a sample on click", () => {
  const root = createExamples(twoLanguages);
  mountExampleTabs(root);

  tabs(root)[1]?.click();

  expect({
    selected: tabs(root).map((tab) => tab.getAttribute("aria-selected")),
    visible: visiblePanels(root),
  }).toEqual({ selected: ["false", "true"], visible: ["typescript"] });
});

test("keeps exactly one tab in the focus order", () => {
  const root = createExamples(twoLanguages);
  mountExampleTabs(root);
  const before = tabs(root).map((tab) => tab.tabIndex);

  tabs(root)[1]?.click();

  expect({ after: tabs(root).map((tab) => tab.tabIndex), before }).toEqual({
    after: [-1, 0],
    before: [0, -1],
  });
});

test("names each panel by its own tab", () => {
  const root = createExamples(twoLanguages);
  mountExampleTabs(root);

  const pairs = [
    ...root.querySelectorAll<HTMLElement>("[data-example-panel]"),
  ].map((panel) => ({
    labelledBy: panel.getAttribute("aria-labelledby"),
    role: panel.getAttribute("role"),
  }));
  const tabIds = tabs(root).map((tab) => tab.id);

  expect({
    everyPanelNamed: pairs.every(
      ({ labelledBy }) => labelledBy !== null && tabIds.includes(labelledBy),
    ),
    roles: pairs.map(({ role }) => role),
    uniqueIds: new Set(tabIds).size,
  }).toEqual({
    everyPanelNamed: true,
    roles: ["tabpanel", "tabpanel"],
    uniqueIds: 2,
  });
});

test("adds no switcher when a lesson offers a single sample", () => {
  const root = createExamples([["python", "Python"]]);
  mountExampleTabs(root);

  expect({
    headingKept: root.querySelectorAll("[data-example-heading]").length,
    tablist: root.querySelectorAll('[role="tablist"]').length,
    visible: visiblePanels(root),
  }).toEqual({ headingKept: 1, tablist: 0, visible: ["python"] });
});

test("hides the redundant heading once a tab carries the same label", () => {
  const root = createExamples(twoLanguages);
  mountExampleTabs(root);

  expect(
    [...root.querySelectorAll<HTMLElement>("[data-example-heading]")].map(
      (heading) => heading.hidden,
    ),
  ).toEqual([true, true]);
});
