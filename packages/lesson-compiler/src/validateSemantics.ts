import type {
  LessonDiagnostic,
  LessonSourceV1,
} from "@knowledge-hub/lesson-schema";

export function validateLessonSemantics(
  source: LessonSourceV1,
  file: string,
): readonly LessonDiagnostic[] {
  const diagnostics: LessonDiagnostic[] = [];
  const objectIds = new Set<string>();
  const optionIds = new Set<string>();
  const stepIds = new Set<string>();

  for (const [objectIndex, object] of source.scene.objects.entries()) {
    if (objectIds.has(object.id)) {
      diagnostics.push({
        code: "identifier.duplicate",
        file,
        path: `scene.objects[${objectIndex}].id`,
        message: `Identifier "${object.id}" is duplicated.`,
      });
    }
    objectIds.add(object.id);
  }

  for (const [objectIndex, object] of source.scene.objects.entries()) {
    if (object.kind === "pointer" && !objectIds.has(object.targetObjectId)) {
      diagnostics.push({
        code: "reference.broken",
        file,
        path: `scene.objects[${objectIndex}].targetObjectId`,
        message: `Reference "${object.targetObjectId}" does not resolve to a scene object.`,
      });
    }
    if (object.kind === "comparison") {
      const references = [
        ["arrayObjectId", object.arrayObjectId],
        ["leftPointerId", object.leftPointerId],
        ["rightPointerId", object.rightPointerId],
      ] as const;
      for (const [property, reference] of references) {
        if (!objectIds.has(reference)) {
          diagnostics.push({
            code: "reference.broken",
            file,
            path: `scene.objects[${objectIndex}].${property}`,
            message: `Reference "${reference}" does not resolve to a scene object.`,
          });
        }
      }
    }
  }

  for (const [stepIndex, step] of source.timeline.entries()) {
    if (stepIds.has(step.id)) {
      diagnostics.push({
        code: "identifier.duplicate",
        file,
        path: `timeline[${stepIndex}].id`,
        message: `Identifier "${step.id}" is duplicated.`,
      });
    }
    stepIds.add(step.id);
    for (const [actionIndex, action] of step.actions.entries()) {
      if (!objectIds.has(action.objectId)) {
        diagnostics.push({
          code: "reference.broken",
          file,
          path: `timeline[${stepIndex}].actions[${actionIndex}].objectId`,
          message: `Reference "${action.objectId}" does not resolve to a scene object.`,
        });
      }
      if (action.type === "connect") {
        const endpoints = [
          ["fromObjectId", action.fromObjectId],
          ["toObjectId", action.toObjectId],
        ] as const;
        for (const [property, reference] of endpoints) {
          if (!objectIds.has(reference)) {
            diagnostics.push({
              code: "reference.broken",
              file,
              path: `timeline[${stepIndex}].actions[${actionIndex}].${property}`,
              message: `Reference "${reference}" does not resolve to a scene object.`,
            });
          }
        }
      }
    }
  }

  for (const [optionIndex, option] of source.modelCheck.options.entries()) {
    if (optionIds.has(option.id)) {
      diagnostics.push({
        code: "identifier.duplicate",
        file,
        path: `modelCheck.options[${optionIndex}].id`,
        message: `Identifier "${option.id}" is duplicated.`,
      });
    }
    optionIds.add(option.id);
  }
  if (!optionIds.has(source.modelCheck.correctOptionId)) {
    diagnostics.push({
      code: "reference.broken",
      file,
      path: "modelCheck.correctOptionId",
      message: `Reference "${source.modelCheck.correctOptionId}" does not resolve to a Model Check option.`,
    });
  }
  const stepIndexById = new Map(
    source.timeline.map((step, stepIndex) => [step.id, stepIndex] as const),
  );
  for (const [stepIndex, step] of source.timeline.entries()) {
    if (step.nextStepId !== undefined && !stepIndexById.has(step.nextStepId)) {
      diagnostics.push({
        code: "reference.broken",
        file,
        path: `timeline[${stepIndex}].nextStepId`,
        message: `Reference "${step.nextStepId}" does not resolve to a timeline step.`,
      });
    }
  }
  const visitedStepIndices = new Set<number>();
  let currentStepIndex: number | undefined = 0;
  let previousStepIndex: number | undefined;
  let reachedTerminal = false;

  while (currentStepIndex !== undefined) {
    if (visitedStepIndices.has(currentStepIndex)) {
      const cycleStep = source.timeline[currentStepIndex];
      if (cycleStep && previousStepIndex !== undefined) {
        diagnostics.push({
          code: "timeline.cycle",
          file,
          path: `timeline[${previousStepIndex}].nextStepId`,
          message: `Timeline step "${cycleStep.id}" creates a cycle.`,
        });
      }
      break;
    }
    visitedStepIndices.add(currentStepIndex);
    const step: LessonSourceV1["timeline"][number] | undefined =
      source.timeline[currentStepIndex];
    if (!step) break;
    if (step.terminal === true) {
      reachedTerminal = true;
      break;
    }
    previousStepIndex = currentStepIndex;
    currentStepIndex =
      step.nextStepId === undefined
        ? currentStepIndex + 1 < source.timeline.length
          ? currentStepIndex + 1
          : undefined
        : stepIndexById.get(step.nextStepId);
  }

  if (!reachedTerminal) {
    diagnostics.push({
      code: "timeline.terminal-required",
      file,
      path: "timeline",
      message: "A timeline requires a reachable terminal step.",
    });
  }
  for (const [stepIndex, step] of source.timeline.entries()) {
    if (!visitedStepIndices.has(stepIndex)) {
      diagnostics.push({
        code: "timeline.unreachable",
        file,
        path: `timeline[${stepIndex}].id`,
        message: `Timeline step "${step.id}" is unreachable.`,
      });
    }
  }

  return diagnostics;
}
