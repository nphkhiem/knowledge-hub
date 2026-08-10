import { mountLessonUtilities } from "./lessonUtilitiesController";
import { createLocalLessonState } from "./localLessonState";

/**
 * Starts the lesson utilities against real browser capabilities.
 *
 * Every capability is optional. `localStorage` throws outright in some privacy
 * modes, so even reaching for it is guarded. Web Share and the clipboard are
 * absent on plenty of browsers. None of that may prevent a lesson from being
 * read, so a failure here leaves the controls hidden and nothing else changes.
 */
export function bootstrapLessonUtilities(
  root: HTMLElement,
): (() => void) | undefined {
  try {
    let storage: Storage | undefined;
    try {
      storage = window.localStorage;
    } catch {
      storage = undefined;
    }

    const canonicalUrl = `${window.location.origin}${window.location.pathname}`;
    const share = navigator.share?.bind(navigator);
    const writeText = navigator.clipboard?.writeText.bind(navigator.clipboard);

    return mountLessonUtilities(root, createLocalLessonState(storage), {
      canonicalUrl,
      ...(share === undefined ? {} : { share }),
      ...(writeText === undefined ? {} : { writeText }),
    });
  } catch {
    return undefined;
  }
}
