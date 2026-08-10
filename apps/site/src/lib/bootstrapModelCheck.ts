import type { CompiledLesson } from "@knowledge-hub/lesson-compiler";
import { mountModelCheck } from "./modelCheckController";

/**
 * Starts the Model Check, and fails open if the lesson data is unusable.
 *
 * The prompt and its options are prerendered, so a learner can still read and
 * think about the question when this cannot run. In that case the button stays
 * hidden rather than sitting there doing nothing.
 *
 * The compiled lesson is read from the page's single data block, which the
 * Visual Brief embeds. A page carrying a Model Check without that block simply
 * leaves the question unanswerable, which is the same as scripting being off.
 */
export function bootstrapModelCheck(
  root: HTMLElement,
): (() => void) | undefined {
  try {
    const data = document.querySelector("[data-compiled-lesson]");
    const text = data?.textContent ?? "";
    if (text.trim() === "") return undefined;

    const lesson = JSON.parse(text) as CompiledLesson;
    if (
      lesson.modelCheck === undefined ||
      !Array.isArray(lesson.modelCheck.options)
    ) {
      return undefined;
    }
    return mountModelCheck(root, lesson);
  } catch {
    return undefined;
  }
}
