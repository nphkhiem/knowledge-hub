import { compiledTwoPointersLesson } from "@knowledge-hub/lesson-testing";
import { afterEach, expect, test, vi } from "vitest";
import {
  createBrowserEnvironment,
  mountVisualBrief,
  type VisualBriefEnvironment,
  type VisualBriefHandle,
} from "./visualBriefController";

const SEMANTIC_STEP_MS = 520;
const OUTCOME_HOLD_MS = 1400;
const LOOP_RESET_MS = 280;
const LAST_STEP = compiledTwoPointersLesson.snapshots.length - 1;

interface Fixture {
  readonly root: HTMLElement;
  readonly environment: VisualBriefEnvironment;
  readonly clock: {
    advanceBy: (ms: number) => void;
    pendingTimers: () => number;
  };
  readonly setVisible: (visible: boolean) => void;
  readonly setDocumentHidden: (hidden: boolean) => void;
  readonly observerCount: () => number;
  readonly control: () => HTMLButtonElement;
  readonly currentStep: () => number;
  readonly narration: () => string;
}

function createVisualBriefFixture(
  options: Readonly<{
    visible: boolean;
    reducedMotion: boolean;
    documentHidden?: boolean;
  }>,
): Fixture {
  const root = document.createElement("div");
  root.innerHTML = [
    "<div data-snapshot-host></div>",
    '<p data-narration aria-live="off"></p>',
    '<button type="button" data-visual-brief-control hidden></button>',
  ].join("");
  document.body.append(root);

  let now = 0;
  let nextTimerId = 1;
  const timers = new Map<number, { at: number; callback: () => void }>();
  let visibilityCallback: ((visible: boolean) => void) | undefined;
  let documentCallback: ((hidden: boolean) => void) | undefined;
  let liveObservers = 0;

  const environment: VisualBriefEnvironment = {
    clearTimer: (timerId) => {
      timers.delete(timerId);
    },
    observeDocumentVisibility: (callback) => {
      documentCallback = callback;
      liveObservers += 1;
      /** The contract requires the current state at subscribe time. */
      callback(options.documentHidden === true);
      return () => {
        documentCallback = undefined;
        liveObservers -= 1;
      };
    },
    observeVisibility: (_element, callback) => {
      visibilityCallback = callback;
      liveObservers += 1;
      callback(options.visible);
      return () => {
        visibilityCallback = undefined;
        liveObservers -= 1;
      };
    },
    prefersReducedMotion: () => options.reducedMotion,
    setTimer: (callback, delayMs) => {
      const timerId = nextTimerId;
      nextTimerId += 1;
      timers.set(timerId, { at: now + delayMs, callback });
      return timerId;
    },
  };

  return {
    clock: {
      advanceBy: (ms) => {
        const target = now + ms;
        let guard = 0;
        for (;;) {
          const due = [...timers.entries()]
            .filter(([, timer]) => timer.at <= target)
            .sort(([, left], [, right]) => left.at - right.at)[0];
          if (due === undefined) break;
          guard += 1;
          if (guard > 1000) throw new Error("Runaway timer loop.");
          const [timerId, timer] = due;
          timers.delete(timerId);
          now = timer.at;
          timer.callback();
        }
        now = target;
      },
      pendingTimers: () => timers.size,
    },
    control: () => {
      const control = root.querySelector("[data-visual-brief-control]");
      if (!(control instanceof HTMLButtonElement)) {
        throw new Error("The fixture has no control button.");
      }
      return control;
    },
    currentStep: () => Number(root.dataset.stepIndex ?? "-1"),
    environment,
    narration: () =>
      root.querySelector("[data-narration]")?.textContent?.trim() ?? "",
    observerCount: () => liveObservers,
    root,
    setDocumentHidden: (hidden) => documentCallback?.(hidden),
    setVisible: (visible) => visibilityCallback?.(visible),
  };
}

let mounted: VisualBriefHandle | undefined;

afterEach(() => {
  mounted?.destroy();
  mounted = undefined;
  document.body.innerHTML = "";
});

function mount(
  options: Readonly<{
    visible: boolean;
    reducedMotion: boolean;
    documentHidden?: boolean;
  }>,
): Fixture {
  const fixture = createVisualBriefFixture(options);
  mounted = mountVisualBrief(
    fixture.root,
    compiledTwoPointersLesson,
    fixture.environment,
  );
  return fixture;
}

test("loops only while visible and toggles between Pause and Resume", () => {
  const fixture = mount({ reducedMotion: false, visible: true });

  expect(fixture.control()).toHaveTextContent("Pause");

  fixture.clock.advanceBy(SEMANTIC_STEP_MS);
  expect(fixture.currentStep()).toBe(1);

  fixture.setVisible(false);
  fixture.clock.advanceBy(5_000);
  expect(fixture.currentStep()).toBe(1);

  fixture.setVisible(true);
  fixture.clock.advanceBy(SEMANTIC_STEP_MS);
  expect(fixture.currentStep()).toBe(2);

  fixture.control().click();
  expect(fixture.control()).toHaveTextContent("Resume");

  fixture.control().click();
  expect({
    label: fixture.control().textContent?.trim(),
    step: fixture.currentStep(),
  }).toEqual({ label: "Pause", step: 2 });
});

test("resuming continues from the paused step instead of starting over", () => {
  const fixture = mount({ reducedMotion: false, visible: true });
  fixture.clock.advanceBy(SEMANTIC_STEP_MS * 3);

  fixture.control().click();
  const whilePaused = fixture.currentStep();

  fixture.control().click();
  const onResume = fixture.currentStep();

  fixture.clock.advanceBy(SEMANTIC_STEP_MS);

  expect({ afterResume: fixture.currentStep(), onResume, whilePaused }).toEqual(
    {
      afterResume: 4,
      onResume: 3,
      whilePaused: 3,
    },
  );
});

test("names the control for assistive technology without shouting it visually", () => {
  const fixture = mount({ reducedMotion: false, visible: true });
  const playing = {
    label: fixture.control().textContent?.trim(),
    name: fixture.control().getAttribute("aria-label"),
  };

  fixture.control().click();

  expect({
    paused: {
      label: fixture.control().textContent?.trim(),
      name: fixture.control().getAttribute("aria-label"),
    },
    playing,
  }).toEqual({
    paused: { label: "Resume", name: "Resume animation" },
    playing: { label: "Pause", name: "Pause animation" },
  });
});

test("advances one semantic step at a time and never sooner", () => {
  const fixture = mount({ reducedMotion: false, visible: true });

  fixture.clock.advanceBy(SEMANTIC_STEP_MS - 1);
  const beforeDue = fixture.currentStep();
  fixture.clock.advanceBy(1);

  expect({ afterDue: fixture.currentStep(), beforeDue }).toEqual({
    afterDue: 1,
    beforeDue: 0,
  });
});

test("holds the outcome, resets to the first step, then plays again", () => {
  const fixture = mount({ reducedMotion: false, visible: true });

  fixture.clock.advanceBy(SEMANTIC_STEP_MS * LAST_STEP);
  const atTerminal = fixture.currentStep();

  fixture.clock.advanceBy(OUTCOME_HOLD_MS - 1);
  const stillHolding = fixture.currentStep();

  fixture.clock.advanceBy(1);
  const afterHold = fixture.currentStep();

  /** The reset is shown plainly for its own beat before motion resumes. */
  fixture.clock.advanceBy(LOOP_RESET_MS);
  const afterReset = fixture.currentStep();

  fixture.clock.advanceBy(SEMANTIC_STEP_MS);
  const afterResume = fixture.currentStep();

  expect({
    afterHold,
    afterReset,
    afterResume,
    atTerminal,
    stillHolding,
  }).toEqual({
    afterHold: 0,
    afterReset: 0,
    afterResume: 1,
    atTerminal: LAST_STEP,
    stillHolding: LAST_STEP,
  });
});

test("suspends while the document is hidden and resumes when shown", () => {
  const fixture = mount({ reducedMotion: false, visible: true });

  fixture.setDocumentHidden(true);
  fixture.clock.advanceBy(5_000);
  const whileHidden = fixture.currentStep();

  fixture.setDocumentHidden(false);
  fixture.clock.advanceBy(SEMANTIC_STEP_MS);

  expect({ afterShown: fixture.currentStep(), whileHidden }).toEqual({
    afterShown: 1,
    whileHidden: 0,
  });
});

test("keeps at most one timer pending at any moment", () => {
  const fixture = mount({ reducedMotion: false, visible: true });
  const counts = [fixture.clock.pendingTimers()];

  for (let step = 0; step < LAST_STEP + 4; step += 1) {
    fixture.clock.advanceBy(SEMANTIC_STEP_MS);
    counts.push(fixture.clock.pendingTimers());
  }
  fixture.setVisible(false);
  counts.push(fixture.clock.pendingTimers());

  expect({ max: Math.max(...counts), whenPaused: counts.at(-1) }).toEqual({
    max: 1,
    whenPaused: 0,
  });
});

test("does not start automatically under reduced motion", () => {
  const fixture = mount({ reducedMotion: true, visible: true });

  fixture.clock.advanceBy(10_000);

  expect({
    label: fixture.control().textContent?.trim(),
    pending: fixture.clock.pendingTimers(),
    step: fixture.currentStep(),
  }).toEqual({ label: "Resume", pending: 0, step: 0 });
});

test("pausing keeps the snapshot on screen and clears the timer", () => {
  const fixture = mount({ reducedMotion: false, visible: true });
  fixture.clock.advanceBy(SEMANTIC_STEP_MS * 2);
  const beforePause = fixture.currentStep();

  fixture.control().click();
  fixture.clock.advanceBy(10_000);

  expect({
    afterPause: fixture.currentStep(),
    beforePause,
    narrationKept: fixture.narration().length > 0,
    pending: fixture.clock.pendingTimers(),
  }).toEqual({
    afterPause: 2,
    beforePause: 2,
    narrationKept: true,
    pending: 0,
  });
});

test("narrates without ever announcing through a live region", () => {
  const fixture = mount({ reducedMotion: false, visible: true });
  fixture.clock.advanceBy(SEMANTIC_STEP_MS);

  const narration = fixture.root.querySelector("[data-narration]");

  expect({
    ariaLive: narration?.getAttribute("aria-live"),
    hasText: (narration?.textContent ?? "").length > 0,
    liveRegions: fixture.root.querySelectorAll(
      '[aria-live="polite"], [aria-live="assertive"], [role="status"], [role="alert"]',
    ).length,
  }).toEqual({ ariaLive: "off", hasText: true, liveRegions: 0 });
});

test("reveals the control only once it can actually do something", () => {
  const fixture = createVisualBriefFixture({
    reducedMotion: false,
    visible: true,
  });
  const beforeMount = fixture.control().hidden;

  mounted = mountVisualBrief(
    fixture.root,
    compiledTwoPointersLesson,
    fixture.environment,
  );

  expect({ afterMount: fixture.control().hidden, beforeMount }).toEqual({
    afterMount: false,
    beforeMount: true,
  });
});

test("never starts when the page loads in a hidden tab", () => {
  const fixture = mount({
    documentHidden: true,
    reducedMotion: false,
    visible: true,
  });

  fixture.clock.advanceBy(10_000);
  const whileHidden = {
    pending: fixture.clock.pendingTimers(),
    step: fixture.currentStep(),
  };

  fixture.setDocumentHidden(false);
  fixture.clock.advanceBy(SEMANTIC_STEP_MS);

  expect({ afterShown: fixture.currentStep(), whileHidden }).toEqual({
    afterShown: 1,
    whileHidden: { pending: 0, step: 0 },
  });
});

test("renders no player chrome", () => {
  const fixture = mount({ reducedMotion: false, visible: true });

  expect({
    buttons: fixture.root.querySelectorAll("button").length,
    progress: fixture.root.querySelectorAll("progress, [role='progressbar']")
      .length,
    ranges: fixture.root.querySelectorAll("input[type='range']").length,
  }).toEqual({ buttons: 1, progress: 0, ranges: 0 });
});

test("releases every observer and timer on destroy", () => {
  const fixture = mount({ reducedMotion: false, visible: true });
  fixture.clock.advanceBy(SEMANTIC_STEP_MS);
  const beforeDestroy = fixture.observerCount();

  mounted?.destroy();
  mounted = undefined;

  expect({
    beforeDestroy,
    observersAfter: fixture.observerCount(),
    timersAfter: fixture.clock.pendingTimers(),
  }).toEqual({ beforeDestroy: 2, observersAfter: 0, timersAfter: 0 });
});

test("replaces the figure with the snapshot the engine reports", () => {
  const fixture = mount({ reducedMotion: false, visible: true });
  fixture.clock.advanceBy(SEMANTIC_STEP_MS);

  const host = fixture.root.querySelector("[data-snapshot-host]");

  expect({
    describesStep: (
      host?.querySelector("svg > title")?.textContent ?? ""
    ).startsWith("Compare 1 at the left pointer"),
    figures: host?.querySelectorAll("svg").length,
  }).toEqual({ describesStep: true, figures: 1 });
});

test("the browser environment reports document visibility at subscribe time", () => {
  const seen: boolean[] = [];
  const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(true);

  const release = createBrowserEnvironment().observeDocumentVisibility(
    (isHidden) => {
      seen.push(isHidden);
    },
  );
  release();
  hidden.mockRestore();

  expect(seen).toEqual([true]);
});
