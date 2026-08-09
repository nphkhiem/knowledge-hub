import type { CompiledLesson } from "@knowledge-hub/lesson-compiler";
import type { EngineState } from "./types.js";

export function createInitialEngineState(lesson: CompiledLesson): EngineState {
  return Object.freeze({
    lessonId: lesson.id,
    stepIndex: 0,
    status: "idle",
    modelCheck: Object.freeze({
      selectedOptionId: null,
      explanationRevealed: false,
    }),
  });
}
