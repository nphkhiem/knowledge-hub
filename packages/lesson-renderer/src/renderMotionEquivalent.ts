import type { CompiledLesson } from "@knowledge-hub/lesson-compiler";
import { renderView } from "./renderSnapshot.js";
import type { RenderedStep } from "./types.js";

/**
 * The ordered static equivalent of the animation. Every compiled snapshot
 * becomes one numbered step, so the sequence survives without motion.
 */
export function renderMotionEquivalent(
  lesson: CompiledLesson,
): readonly RenderedStep[] {
  return lesson.snapshots.map((snapshot, index) => ({
    ...renderView(snapshot, "static"),
    narration: snapshot.narration,
    stepId: snapshot.stepId,
    stepNumber: index + 1,
  }));
}
