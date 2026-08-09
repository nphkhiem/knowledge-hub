import type {
  LessonDiagnostic,
  LessonSourceV1,
} from "@knowledge-hub/lesson-schema";

function primitiveWithArticle(kind: string): string {
  return `${kind === "array" ? "an" : "a"} ${kind}`;
}

export function validateLessonSemantics(
  source: LessonSourceV1,
  file: string,
): readonly LessonDiagnostic[] {
  const diagnostics: LessonDiagnostic[] = [];
  const objectIds = new Set<string>();
  const optionIds = new Set<string>();
  const stepIds = new Set<string>();
  const objectsById = new Map(
    source.scene.objects.map((object) => [object.id, object] as const),
  );

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
    if (object.kind === "pointer") {
      const target = objectsById.get(object.targetObjectId);
      if (!target) {
        diagnostics.push({
          code: "reference.broken",
          file,
          path: `scene.objects[${objectIndex}].targetObjectId`,
          message: `Reference "${object.targetObjectId}" does not resolve to a scene object.`,
        });
      } else if (target.kind !== "array") {
        diagnostics.push({
          code: "reference.wrong-kind",
          file,
          path: `scene.objects[${objectIndex}].targetObjectId`,
          message: `Reference "${object.targetObjectId}" must resolve to an array, but resolves to ${primitiveWithArticle(target.kind)}.`,
        });
      } else if (object.index >= target.values.length) {
        diagnostics.push({
          code: "reference.invalid",
          file,
          path: `scene.objects[${objectIndex}].index`,
          message: `Pointer "${object.id}" index ${object.index} is outside target array "${target.id}" (length ${target.values.length}).`,
        });
      }
    }
    if (object.kind === "comparison") {
      const references = [
        ["arrayObjectId", object.arrayObjectId, "array"],
        ["leftPointerId", object.leftPointerId, "pointer"],
        ["rightPointerId", object.rightPointerId, "pointer"],
      ] as const;
      for (const [property, reference, expectedKind] of references) {
        const target = objectsById.get(reference);
        if (!target) {
          diagnostics.push({
            code: "reference.broken",
            file,
            path: `scene.objects[${objectIndex}].${property}`,
            message: `Reference "${reference}" does not resolve to a scene object.`,
          });
        } else if (target.kind !== expectedKind) {
          diagnostics.push({
            code: "reference.wrong-kind",
            file,
            path: `scene.objects[${objectIndex}].${property}`,
            message: `Reference "${reference}" must resolve to ${primitiveWithArticle(expectedKind)}, but resolves to ${primitiveWithArticle(target.kind)}.`,
          });
        }
      }
    }
  }

  for (const [stepIndex, step] of source.timeline.entries()) {
    if (step.id === "initial") {
      diagnostics.push({
        code: "reference.invalid",
        file,
        path: `timeline[${stepIndex}].id`,
        message:
          'Timeline step id "initial" is reserved for the synthetic initial snapshot.',
      });
    }
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
          const endpoint = objectsById.get(reference);
          if (!endpoint) {
            diagnostics.push({
              code: "reference.broken",
              file,
              path: `timeline[${stepIndex}].actions[${actionIndex}].${property}`,
              message: `Reference "${reference}" does not resolve to a scene object.`,
            });
          } else if (endpoint.kind !== "pointer") {
            diagnostics.push({
              code: "reference.wrong-kind",
              file,
              path: `timeline[${stepIndex}].actions[${actionIndex}].${property}`,
              message: `Reference "${reference}" must resolve to a pointer, but resolves to ${primitiveWithArticle(endpoint.kind)}.`,
            });
          }
        }
        if (action.fromObjectId === action.toObjectId) {
          diagnostics.push({
            code: "reference.invalid",
            file,
            path: `timeline[${stepIndex}].actions[${actionIndex}].toObjectId`,
            message: "Connect actions require two distinct pointer endpoints.",
          });
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
    if (step.terminal === true && step.nextStepId !== undefined) {
      diagnostics.push({
        code: "timeline.terminal-edge",
        file,
        path: `timeline[${stepIndex}].nextStepId`,
        message: `Terminal timeline step "${step.id}" cannot continue.`,
      });
    }
  }
  const successorIndex = (stepIndex: number): number | undefined => {
    const step = source.timeline[stepIndex];
    if (!step || step.terminal === true) return undefined;
    if (step.nextStepId !== undefined) {
      return stepIndexById.get(step.nextStepId);
    }
    return stepIndex + 1 < source.timeline.length ? stepIndex + 1 : undefined;
  };
  const visitState = new Uint8Array(source.timeline.length);
  for (const startIndex of source.timeline.keys()) {
    if (visitState[startIndex] !== 0) continue;
    const currentPath: number[] = [];
    let currentIndex: number | undefined = startIndex;
    while (currentIndex !== undefined && visitState[currentIndex] === 0) {
      visitState[currentIndex] = 1;
      currentPath.push(currentIndex);
      currentIndex = successorIndex(currentIndex);
    }
    if (currentIndex !== undefined && visitState[currentIndex] === 1) {
      const contributorIndex = currentPath.at(-1);
      const cycleStep = source.timeline[currentIndex];
      if (contributorIndex !== undefined && cycleStep) {
        diagnostics.push({
          code: "timeline.cycle",
          file,
          path: `timeline[${contributorIndex}].nextStepId`,
          message: `Timeline step "${cycleStep.id}" creates a cycle.`,
        });
      }
    }
    for (const visitedIndex of currentPath) visitState[visitedIndex] = 2;
  }

  const visitedStepIndices = new Set<number>();
  let currentStepIndex: number | undefined = 0;
  let reachedTerminal = false;

  while (currentStepIndex !== undefined) {
    if (visitedStepIndices.has(currentStepIndex)) break;
    visitedStepIndices.add(currentStepIndex);
    const step: LessonSourceV1["timeline"][number] | undefined =
      source.timeline[currentStepIndex];
    if (!step) break;
    if (step.terminal === true) {
      reachedTerminal = true;
      break;
    }
    currentStepIndex = successorIndex(currentStepIndex);
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
