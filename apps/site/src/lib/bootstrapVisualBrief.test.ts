import { compiledTwoPointersLesson } from "@knowledge-hub/lesson-testing";
import { afterEach, expect, test } from "vitest";
import { bootstrapVisualBrief } from "./bootstrapVisualBrief";
import type { VisualBriefEnvironment } from "./visualBriefController";

/** jsdom has no IntersectionObserver, so the default environment cannot mount. */
const stubEnvironment: VisualBriefEnvironment = {
  clearTimer: () => undefined,
  observeDocumentVisibility: (callback) => {
    callback(false);
    return () => undefined;
  },
  observeReducedMotion: (callback) => {
    callback(false);
    return () => undefined;
  },
  observeVisibility: (_element, callback) => {
    callback(true);
    return () => undefined;
  },
  setTimer: () => 1,
};

const UNAVAILABLE_NOTICE =
  "The animated view is unavailable. The complete step-by-step explanation is available below.";

/** Mirrors what VisualBrief.astro prerenders, including the static steps. */
function createRenderedVisualBrief(dataText: string): HTMLElement {
  const root = document.createElement("figure");
  root.dataset.visualBrief = "";
  root.innerHTML = [
    '<div data-snapshot-host><svg role="img"><title>opening</title></svg></div>',
    '<p data-narration aria-live="off">Opening narration.</p>',
    "<p data-motion-notice hidden></p>",
    '<p data-visual-notice hidden role="note"></p>',
    '<button type="button" data-visual-brief-control hidden>Resume</button>',
    '<script type="application/json" data-compiled-lesson>' +
      dataText +
      "</script>",
  ].join("");
  const steps = document.createElement("ol");
  steps.dataset.motionEquivalent = "";
  steps.innerHTML = "<li>Step one</li><li>Step two</li>";

  document.body.append(root, steps);
  return root;
}

afterEach(() => {
  document.body.innerHTML = "";
});

function survivingContent(root: HTMLElement): Record<string, unknown> {
  return {
    motionEquivalentSteps: document.querySelectorAll(
      "[data-motion-equivalent] li",
    ).length,
    narration: root.querySelector("[data-narration]")?.textContent,
    openingFigure: root.querySelectorAll("[data-snapshot-host] svg").length,
  };
}

test("preserves static instruction when the data block is malformed", () => {
  const root = createRenderedVisualBrief("{invalid json");

  const handle = bootstrapVisualBrief(root);

  expect({
    ...survivingContent(root),
    controlHidden: root.querySelector<HTMLElement>(
      "[data-visual-brief-control]",
    )?.hidden,
    handle,
    notice: root.querySelector("[data-visual-notice]")?.textContent,
    noticeHidden: root.querySelector<HTMLElement>("[data-visual-notice]")
      ?.hidden,
    state: root.dataset.visualState,
  }).toEqual({
    controlHidden: true,
    handle: undefined,
    motionEquivalentSteps: 2,
    narration: "Opening narration.",
    notice: UNAVAILABLE_NOTICE,
    noticeHidden: false,
    openingFigure: 1,
    state: "unavailable",
  });
});

test("never throws, whatever the data block contains", () => {
  const cases = ["{invalid json", "", "   ", "null", "[]", '{"snapshots":[]}'];

  const outcomes = cases.map((text) => {
    const root = createRenderedVisualBrief(text);
    let threw = false;
    try {
      bootstrapVisualBrief(root);
    } catch {
      threw = true;
    }
    return {
      notice: root.querySelector("[data-visual-notice]")?.textContent,
      threw,
    };
  });

  expect(outcomes).toEqual(
    cases.map(() => ({ notice: UNAVAILABLE_NOTICE, threw: false })),
  );
});

test("mounts normally and shows no notice when the data block is sound", () => {
  const root = createRenderedVisualBrief(
    JSON.stringify(compiledTwoPointersLesson),
  );

  const handle = bootstrapVisualBrief(root, stubEnvironment);

  expect({
    ...survivingContent(root),
    mounted: handle !== undefined,
    noticeHidden: root.querySelector<HTMLElement>("[data-visual-notice]")
      ?.hidden,
    state: root.dataset.visualState,
  }).toEqual({
    motionEquivalentSteps: 2,
    mounted: true,
    narration:
      "The left pointer starts at value 1 and the right pointer starts at value 15. The target is 15.",
    noticeHidden: true,
    openingFigure: 1,
    state: "animated",
  });

  handle?.destroy();
});
