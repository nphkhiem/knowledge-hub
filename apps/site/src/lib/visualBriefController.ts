import type { CompiledLesson } from "@knowledge-hub/lesson-compiler";
import {
  createInitialEngineState,
  transition,
  type EngineState,
} from "@knowledge-hub/lesson-engine";
import { renderSnapshot } from "@knowledge-hub/lesson-renderer";

const SEMANTIC_STEP_MS = 520;
const OUTCOME_HOLD_MS = 1400;
const LOOP_RESET_MS = 280;

/**
 * The visible label stays short. The accessible name adds what is being paused,
 * and contains the visible text so it satisfies WCAG 2.5.3 Label in Name.
 */
const PAUSED_STATE = { label: "Resume", name: "Resume animation" } as const;
const PLAYING_STATE = { label: "Pause", name: "Pause animation" } as const;

const REDUCED_MOTION_NOTICE =
  "Animation is off because your device requests reduced motion. Follow the step-by-step view below.";

/**
 * Every source of time and visibility the loop depends on, injected so the
 * schedule can be driven deterministically in tests. The controller requests
 * semantic transitions only; it cannot invent or alter snapshot meaning.
 *
 * Both observers must report the current state once at subscribe time and then
 * on every change. A page can load in a background tab, so waiting for the
 * first change event would leave the controller believing it is visible.
 */
export interface VisualBriefEnvironment {
  readonly setTimer: (callback: () => void, delayMs: number) => number;
  readonly clearTimer: (timerId: number) => void;
  readonly observeVisibility: (
    element: Element,
    callback: (visible: boolean) => void,
  ) => () => void;
  readonly observeDocumentVisibility: (
    callback: (hidden: boolean) => void,
  ) => () => void;
  readonly observeReducedMotion: (
    callback: (reduced: boolean) => void,
  ) => () => void;
}

export interface VisualBriefHandle {
  pause(): void;
  resume(): void;
  destroy(): void;
}

export function createBrowserEnvironment(): VisualBriefEnvironment {
  return {
    clearTimer: (timerId) => {
      window.clearTimeout(timerId);
    },
    observeDocumentVisibility: (callback) => {
      const listener = (): void => {
        callback(document.hidden);
      };
      document.addEventListener("visibilitychange", listener);
      callback(document.hidden);
      return () => {
        document.removeEventListener("visibilitychange", listener);
      };
    },
    observeVisibility: (element, callback) => {
      const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) callback(entry.isIntersecting);
      });
      observer.observe(element);
      return () => {
        observer.disconnect();
      };
    },
    observeReducedMotion: (callback) => {
      const query = window.matchMedia("(prefers-reduced-motion: reduce)");
      const listener = (event: MediaQueryListEvent): void => {
        callback(event.matches);
      };
      query.addEventListener("change", listener);
      callback(query.matches);
      return () => {
        query.removeEventListener("change", listener);
      };
    },
    setTimer: (callback, delayMs) => window.setTimeout(callback, delayMs),
  };
}

export function mountVisualBrief(
  root: HTMLElement,
  lesson: CompiledLesson,
  environment: VisualBriefEnvironment = createBrowserEnvironment(),
): VisualBriefHandle {
  const host = root.querySelector("[data-snapshot-host]");
  const narration = root.querySelector("[data-narration]");
  const control = root.querySelector("[data-visual-brief-control]");
  const notice = root.querySelector("[data-motion-notice]");
  const lastStepIndex = lesson.snapshots.length - 1;

  let state: EngineState = createInitialEngineState(lesson);
  let pausedByLearner = false;
  /** Reduced motion suppresses motion outright; the learner cannot opt back in. */
  let reducedMotion = false;
  let visible = false;
  let documentHidden = false;
  let timerId: number | undefined;

  function clearPendingStep(): void {
    if (timerId === undefined) return;
    environment.clearTimer(timerId);
    timerId = undefined;
  }

  /**
   * The narration describes the figure rather than announcing itself, so it is
   * connected by reference. Nothing moves focus and nothing is a live region.
   */
  function describeFigure(): void {
    if (!(narration instanceof HTMLElement)) return;
    if (narration.id === "") narration.id = `${lesson.slug}-brief-narration`;
    root.setAttribute("aria-describedby", narration.id);
  }

  function paint(): void {
    const snapshot = lesson.snapshots[state.stepIndex];
    if (snapshot === undefined) return;

    const rendered = renderSnapshot(snapshot);
    if (host !== null) host.innerHTML = rendered.markup;
    if (narration !== null) narration.textContent = snapshot.narration;
    root.dataset.stepIndex = String(state.stepIndex);
  }

  /**
   * The control is prerendered hidden, because without this script it cannot do
   * anything. Mounting is what makes it real, so mounting is what reveals it.
   */
  function setControlLabel(): void {
    if (!(control instanceof HTMLElement)) return;
    /** Under reduced motion there is no motion to control, so there is no control. */
    if (reducedMotion) {
      control.hidden = true;
      return;
    }
    const { label, name } = pausedByLearner ? PAUSED_STATE : PLAYING_STATE;
    control.textContent = label;
    control.setAttribute("aria-label", name);
    control.hidden = false;
  }

  function setMotionNotice(): void {
    root.dataset.visualState = reducedMotion ? "reduced-motion" : "animated";
    if (!(notice instanceof HTMLElement)) return;
    notice.hidden = !reducedMotion;
    notice.textContent = reducedMotion ? REDUCED_MOTION_NOTICE : "";
  }

  function apply(command: Parameters<typeof transition>[2]): void {
    const next = transition(lesson, state, command);
    if (next === state) return;
    state = next;
    paint();
  }

  /** One timer at a time, and only while the loop should actually be running. */
  function schedule(): void {
    clearPendingStep();
    if (reducedMotion || pausedByLearner || !visible || documentHidden) return;

    const atTerminal = state.stepIndex >= lastStepIndex;
    const delayMs = atTerminal ? OUTCOME_HOLD_MS : SEMANTIC_STEP_MS;

    timerId = environment.setTimer(() => {
      timerId = undefined;
      if (atTerminal) {
        apply({ type: "restart" });
        /** The reset is shown plainly before the next pass begins. */
        timerId = environment.setTimer(() => {
          timerId = undefined;
          schedule();
        }, LOOP_RESET_MS);
        return;
      }
      apply({ type: "next" });
      schedule();
    }, delayMs);
  }

  function pause(): void {
    if (pausedByLearner || reducedMotion) return;
    pausedByLearner = true;
    clearPendingStep();
    setControlLabel();
  }

  /** Resuming continues from the snapshot on screen; it does not start over. */
  function resume(): void {
    if (!pausedByLearner || reducedMotion) return;
    pausedByLearner = false;
    setControlLabel();
    schedule();
  }

  /**
   * A motion preference change never leaves a half-finished frame on screen.
   * Turning reduction on holds the opening state; turning it off begins a fresh
   * pass from that same opening state rather than resuming mid-sequence.
   */
  function applyReducedMotion(reduced: boolean): void {
    if (reduced === reducedMotion) return;
    reducedMotion = reduced;
    pausedByLearner = false;
    clearPendingStep();
    apply({ type: "restart" });
    if (reduced) state = createInitialEngineState(lesson);
    paint();
    setMotionNotice();
    setControlLabel();
    schedule();
  }

  const releaseReducedMotion = environment.observeReducedMotion((reduced) => {
    if (reduced !== reducedMotion) applyReducedMotion(reduced);
  });

  const releaseVisibility = environment.observeVisibility(root, (isVisible) => {
    visible = isVisible;
    schedule();
  });

  const releaseDocument = environment.observeDocumentVisibility((hidden) => {
    documentHidden = hidden;
    schedule();
  });

  function onControlClick(): void {
    if (pausedByLearner) resume();
    else pause();
  }

  control?.addEventListener("click", onControlClick);

  if (!reducedMotion) apply({ type: "play" });
  describeFigure();
  paint();
  setMotionNotice();
  setControlLabel();
  schedule();

  return {
    destroy: () => {
      clearPendingStep();
      control?.removeEventListener("click", onControlClick);
      releaseVisibility();
      releaseDocument();
      releaseReducedMotion();
    },
    pause,
    resume,
  };
}
