import type { CompiledLesson } from "@knowledge-hub/lesson-compiler";
import {
  mountVisualBrief,
  type VisualBriefEnvironment,
  type VisualBriefHandle,
} from "./visualBriefController";

const UNAVAILABLE_NOTICE =
  "The animated view is unavailable. The complete step-by-step explanation is available below.";

/**
 * Starts the Visual Brief, and fails open if anything about it is wrong.
 *
 * The lesson is already fully readable before this runs: the opening figure and
 * every static step are prerendered. So a malformed data block, a missing
 * element, or a renderer fault must never remove content. It reports the loss of
 * the animation and leaves the rest of the lesson exactly where it was.
 */
export function bootstrapVisualBrief(
  root: HTMLElement,
  environment?: VisualBriefEnvironment,
): VisualBriefHandle | undefined {
  try {
    const data = root.querySelector("[data-compiled-lesson]");
    const text = data?.textContent ?? "";
    if (text.trim() === "") return reportUnavailable(root);

    const lesson = JSON.parse(text) as CompiledLesson;
    if (!Array.isArray(lesson.snapshots) || lesson.snapshots.length === 0) {
      return reportUnavailable(root);
    }

    return environment === undefined
      ? mountVisualBrief(root, lesson)
      : mountVisualBrief(root, lesson, environment);
  } catch {
    return reportUnavailable(root);
  }
}

function reportUnavailable(root: HTMLElement): undefined {
  root.dataset.visualState = "unavailable";

  const control = root.querySelector("[data-visual-brief-control]");
  if (control instanceof HTMLElement) control.hidden = true;

  const notice = root.querySelector("[data-visual-notice]");
  if (notice instanceof HTMLElement) {
    notice.hidden = false;
    notice.textContent = UNAVAILABLE_NOTICE;
  }
  return undefined;
}
