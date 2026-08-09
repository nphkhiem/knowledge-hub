import type { CompiledLesson } from "@knowledge-hub/lesson-compiler";
import { createInitialEngineState } from "./createInitialState.js";
import type { EngineCommand, EngineState } from "./types.js";

function freezeEngineState(state: EngineState): EngineState {
  return Object.freeze({
    ...state,
    modelCheck: Object.freeze({ ...state.modelCheck }),
  });
}

function withStatus(
  state: EngineState,
  status: EngineState["status"],
): EngineState {
  return state.status === status
    ? state
    : freezeEngineState({ ...state, status });
}

function next(lesson: CompiledLesson, state: EngineState): EngineState {
  const lastStepIndex = lesson.snapshots.length - 1;
  if (state.stepIndex >= lastStepIndex) return state;

  const stepIndex = state.stepIndex + 1;
  const status =
    lesson.snapshots[stepIndex]?.terminal === true ? "completed" : state.status;
  return freezeEngineState({ ...state, status, stepIndex });
}

function previous(state: EngineState): EngineState {
  if (state.stepIndex <= 0) return state;

  return freezeEngineState({
    ...state,
    stepIndex: state.stepIndex - 1,
    status: state.status === "completed" ? "paused" : state.status,
  });
}

function seek(
  lesson: CompiledLesson,
  state: EngineState,
  requestedStepIndex: number,
): EngineState {
  if (!Number.isInteger(requestedStepIndex)) return state;

  const lastStepIndex = lesson.snapshots.length - 1;
  const stepIndex = Math.max(0, Math.min(requestedStepIndex, lastStepIndex));
  if (stepIndex === state.stepIndex) return state;

  const status =
    lesson.snapshots[stepIndex]?.terminal === true
      ? "completed"
      : state.status === "completed"
        ? "paused"
        : state.status;
  return freezeEngineState({ ...state, status, stepIndex });
}

function answer(
  lesson: CompiledLesson,
  state: EngineState,
  optionId: string,
  revealExplanation: boolean,
): EngineState {
  if (!lesson.modelCheck.options.some((option) => option.id === optionId)) {
    return state;
  }

  const explanationRevealed =
    revealExplanation && state.modelCheck.selectedOptionId === optionId;
  if (
    state.modelCheck.selectedOptionId === optionId &&
    state.modelCheck.explanationRevealed === explanationRevealed
  ) {
    return state;
  }

  return freezeEngineState({
    ...state,
    modelCheck: { selectedOptionId: optionId, explanationRevealed },
  });
}

function isResetAndPlaying(state: EngineState): boolean {
  return (
    state.stepIndex === 0 &&
    state.status === "playing" &&
    state.modelCheck.selectedOptionId === null &&
    !state.modelCheck.explanationRevealed
  );
}

function hasValidStep(lesson: CompiledLesson, state: EngineState): boolean {
  return (
    Number.isInteger(state.stepIndex) &&
    state.stepIndex >= 0 &&
    state.stepIndex < lesson.snapshots.length
  );
}

function hasValidStatus(state: EngineState): boolean {
  return (
    state.status === "idle" ||
    state.status === "playing" ||
    state.status === "paused" ||
    state.status === "completed"
  );
}

function hasCoherentCompletion(
  lesson: CompiledLesson,
  state: EngineState,
): boolean {
  const terminal = lesson.snapshots[state.stepIndex]?.terminal === true;
  return (state.status === "completed") === terminal;
}

function hasValidModelCheck(
  lesson: CompiledLesson,
  state: EngineState,
): boolean {
  const modelCheck = state.modelCheck;
  if (
    typeof modelCheck !== "object" ||
    modelCheck === null ||
    Array.isArray(modelCheck)
  ) {
    return false;
  }
  if (typeof modelCheck.explanationRevealed !== "boolean") return false;
  if (
    modelCheck.selectedOptionId !== null &&
    (typeof modelCheck.selectedOptionId !== "string" ||
      !lesson.modelCheck.options.some(
        (option) => option.id === modelCheck.selectedOptionId,
      ))
  ) {
    return false;
  }
  return (
    !modelCheck.explanationRevealed || modelCheck.selectedOptionId !== null
  );
}

function isValidEngineState(
  lesson: CompiledLesson,
  state: EngineState,
): boolean {
  return (
    hasValidStep(lesson, state) &&
    hasValidStatus(state) &&
    hasCoherentCompletion(lesson, state) &&
    hasValidModelCheck(lesson, state)
  );
}

export function transition(
  lesson: CompiledLesson,
  state: EngineState,
  command: EngineCommand,
): EngineState {
  if (typeof state !== "object" || state === null) {
    return createInitialEngineState(lesson);
  }
  if (state.lessonId !== lesson.id) return state;
  if (!isValidEngineState(lesson, state))
    return createInitialEngineState(lesson);
  if (typeof command !== "object" || command === null) return state;

  switch (command.type) {
    case "play":
      return state.status === "completed"
        ? state
        : withStatus(state, "playing");
    case "pause":
      return state.status === "completed" ? state : withStatus(state, "paused");
    case "restart":
      return isResetAndPlaying(state)
        ? state
        : freezeEngineState({
            ...createInitialEngineState(lesson),
            status: "playing",
          });
    case "next":
      return next(lesson, state);
    case "previous":
      return previous(state);
    case "seek":
      return seek(lesson, state, command.stepIndex);
    case "answer":
      return answer(lesson, state, command.optionId, command.revealExplanation);
    default:
      return state;
  }
}
