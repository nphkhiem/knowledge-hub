import type { CompiledLesson } from "@knowledge-hub/lesson-compiler";
import {
  createInitialEngineState,
  transition,
  type EngineState,
} from "@knowledge-hub/lesson-engine";

const TAUGHT_VERDICT = "That is the move this lesson teaches.";
const OTHER_VERDICT = "This lesson moves a different pointer.";

/**
 * Wires the optional Model Check.
 *
 * Answering is never required and never scored. Choosing an option records the
 * choice; the explanation appears only when the learner explicitly asks for it,
 * so nothing is spoiled by simply reading the page. Changing the choice hides
 * the explanation again, because it no longer describes what is selected.
 * Nothing is persisted, so revisiting the lesson starts clean.
 */
export function mountModelCheck(
  root: HTMLElement,
  lesson: CompiledLesson,
): () => void {
  const options = [
    ...root.querySelectorAll<HTMLInputElement>("[data-model-option]"),
  ];
  const submit = root.querySelector("[data-model-submit]");
  const region = root.querySelector("[data-model-explanation]");
  const verdict = root.querySelector("[data-model-verdict]");

  let state: EngineState = createInitialEngineState(lesson);

  function render(): void {
    const { explanationRevealed, selectedOptionId } = state.modelCheck;

    if (submit instanceof HTMLButtonElement) {
      submit.disabled = selectedOptionId === null;
      submit.hidden = false;
    }
    if (region instanceof HTMLElement) region.hidden = !explanationRevealed;
    if (verdict instanceof HTMLElement) {
      verdict.textContent = !explanationRevealed
        ? ""
        : selectedOptionId === lesson.modelCheck.correctOptionId
          ? TAUGHT_VERDICT
          : OTHER_VERDICT;
    }
  }

  function answer(optionId: string, revealExplanation: boolean): void {
    state = transition(lesson, state, {
      optionId,
      revealExplanation,
      type: "answer",
    });
    render();
  }

  function onChange(event: Event): void {
    const input = event.currentTarget;
    if (input instanceof HTMLInputElement) answer(input.value, false);
  }

  function onSubmit(): void {
    const selected = state.modelCheck.selectedOptionId;
    if (selected !== null) answer(selected, true);
  }

  for (const input of options) input.addEventListener("change", onChange);
  submit?.addEventListener("click", onSubmit);
  render();

  return () => {
    for (const input of options) input.removeEventListener("change", onChange);
    submit?.removeEventListener("click", onSubmit);
  };
}
