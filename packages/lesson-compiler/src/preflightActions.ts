import type {
  LessonDiagnostic,
  LessonSourceV1,
} from "@knowledge-hub/lesson-schema";
import { isResultStatus } from "./resultStatus.js";

type SceneObjectV1 = LessonSourceV1["scene"]["objects"][number];

function primitiveWithArticle(kind: string): string {
  return `${kind === "array" ? "an" : "a"} ${kind}`;
}

export function validateStaticActions(
  source: LessonSourceV1,
  file: string,
): readonly LessonDiagnostic[] {
  const diagnostics: LessonDiagnostic[] = [];
  const duplicateObjectIds = new Set<string>();
  const objectsById = new Map<string, SceneObjectV1>();
  for (const object of source.scene.objects) {
    if (objectsById.has(object.id)) duplicateObjectIds.add(object.id);
    objectsById.set(object.id, object);
  }
  const objectFor = (id: string): SceneObjectV1 | undefined =>
    duplicateObjectIds.has(id) ? undefined : objectsById.get(id);
  const comparisons = source.scene.objects.filter(
    (object) => object.kind === "comparison",
  );

  for (const [stepIndex, step] of source.timeline.entries()) {
    for (const [actionIndex, action] of step.actions.entries()) {
      const path = `timeline[${stepIndex}].actions[${actionIndex}]`;
      const object = objectFor(action.objectId);
      if (!object) continue;

      switch (action.type) {
        case "move": {
          if (object.kind !== "pointer") {
            diagnostics.push({
              code: "reference.wrong-kind",
              file,
              path: `${path}.objectId`,
              message: `Action "move" requires a pointer, but "${object.id}" resolves to ${primitiveWithArticle(object.kind)}.`,
            });
            break;
          }
          const target = objectFor(object.targetObjectId);
          if (
            target?.kind === "array" &&
            action.toIndex >= target.values.length
          ) {
            diagnostics.push({
              code: "reference.invalid",
              file,
              path: `${path}.toIndex`,
              message: `Pointer index ${action.toIndex} is outside array "${target.id}".`,
            });
          }
          break;
        }
        case "narrow": {
          // Partially duplicated from applyAction. Preflight cannot know how
          // far a window has already narrowed, because that depends on earlier
          // steps, so it checks the authored range only. Every range the window
          // can actually hold is inside that one, so escaping it is always an
          // error and this reports no false positives. applyAction catches a
          // narrow that escapes the current, smaller range.
          if (object.kind !== "window") {
            diagnostics.push({
              code: "reference.wrong-kind",
              file,
              path: `${path}.objectId`,
              message: `Action "narrow" requires a window, but "${object.id}" resolves to ${primitiveWithArticle(object.kind)}.`,
            });
            break;
          }
          if (action.toEnd < action.toStart) {
            diagnostics.push({
              code: "reference.invalid",
              file,
              path: `${path}.toEnd`,
              message: `Window "${object.id}" cannot end at ${action.toEnd}, before its start ${action.toStart}.`,
            });
            break;
          }
          if (action.toStart < object.start || action.toEnd > object.end) {
            diagnostics.push({
              code: "reference.invalid",
              file,
              path: `${path}.toEnd`,
              message: `Action "narrow" must land inside "${object.id}", which covers ${object.start} to ${object.end}, but ${action.toStart} to ${action.toEnd} does not.`,
            });
          }
          break;
        }
        case "slide": {
          // Duplicated from applyAction so every bad slide in a lesson is
          // reported at once. The width is read from the authored window
          // rather than from a running state, which is sound precisely because
          // no slide is allowed to change it.
          if (object.kind !== "window") {
            diagnostics.push({
              code: "reference.wrong-kind",
              file,
              path: `${path}.objectId`,
              message: `Action "slide" requires a window, but "${object.id}" resolves to ${primitiveWithArticle(object.kind)}.`,
            });
            break;
          }
          if (action.toEnd < action.toStart) {
            diagnostics.push({
              code: "reference.invalid",
              file,
              path: `${path}.toEnd`,
              message: `Window "${object.id}" cannot end at ${action.toEnd}, before its start ${action.toStart}.`,
            });
            break;
          }
          const target = objectFor(object.targetObjectId);
          if (
            target?.kind === "array" &&
            action.toEnd >= target.values.length
          ) {
            diagnostics.push({
              code: "reference.invalid",
              file,
              path: `${path}.toEnd`,
              message: `Window range ${action.toStart} to ${action.toEnd} is outside array "${target.id}".`,
            });
          }
          const width = object.end - object.start;
          const requested = action.toEnd - action.toStart;
          if (width >= 0 && requested !== width) {
            diagnostics.push({
              code: "reference.invalid",
              file,
              path: `${path}.toEnd`,
              message: `Action "slide" keeps the width of "${object.id}". It covers ${width + 1} cells, but ${action.toStart} to ${action.toEnd} covers ${requested + 1}.`,
            });
          }
          break;
        }
        case "highlight": {
          // Both kinds that have positions accept a highlight. This rule is
          // duplicated from applyAction because preflight reports every
          // diagnostic at once rather than stopping at the first.
          const positions =
            object.kind === "array"
              ? object.values.length
              : object.kind === "buckets"
                ? object.slotCount
                : undefined;

          if (positions === undefined) {
            diagnostics.push({
              code: "reference.wrong-kind",
              file,
              path: `${path}.objectId`,
              message: `Action "highlight" requires an array or buckets, but "${object.id}" resolves to ${primitiveWithArticle(object.kind)}.`,
            });
          } else if (action.indices.some((index) => index >= positions)) {
            diagnostics.push({
              code: "reference.invalid",
              file,
              path: `${path}.indices`,
              message: `Highlight indices must be inside "${object.id}".`,
            });
          }
          break;
        }
        case "compare": {
          if (object.kind !== "comparison") {
            diagnostics.push({
              code: "reference.wrong-kind",
              file,
              path: `${path}.objectId`,
              message: `Action "compare" requires a comparison, but "${object.id}" resolves to ${primitiveWithArticle(object.kind)}.`,
            });
            break;
          }
          const array = objectFor(object.arrayObjectId);
          const leftPointer = objectFor(object.leftPointerId);
          const rightPointer = objectFor(object.rightPointerId);
          if (
            array?.kind === "array" &&
            leftPointer?.kind === "pointer" &&
            rightPointer?.kind === "pointer" &&
            (leftPointer.targetObjectId !== array.id ||
              rightPointer.targetObjectId !== array.id)
          ) {
            diagnostics.push({
              code: "reference.invalid",
              file,
              path: `${path}.objectId`,
              message: `Comparison "${object.id}" requires two pointers targeting array "${object.arrayObjectId}".`,
            });
          }
          break;
        }
        case "set": {
          if (object.kind !== "result") {
            diagnostics.push({
              code: "reference.wrong-kind",
              file,
              path: `${path}.objectId`,
              message: `Action "set" requires a result, but "${object.id}" resolves to ${primitiveWithArticle(object.kind)}.`,
            });
            break;
          }
          const validProperty = action.property === "status";
          const validValue = isResultStatus(action.value);
          if (!validProperty) {
            diagnostics.push({
              code: "reference.invalid",
              file,
              path: `${path}.property`,
              message:
                'Action "set" only supports the status property of a result object.',
            });
          }
          if (!validValue) {
            diagnostics.push({
              code: "reference.invalid",
              file,
              path: `${path}.value`,
              message: "Result status must be pending, found, or not-found.",
            });
          }
          if (
            validProperty &&
            validValue &&
            action.value !== "pending" &&
            comparisons.length !== 1
          ) {
            diagnostics.push({
              code: "reference.invalid",
              file,
              path: `${path}.objectId`,
              message: `A result action requires exactly one V1 comparison object; found ${comparisons.length}.`,
            });
          }
          break;
        }
        case "show":
        case "hide":
          break;
        case "connect": {
          const from = objectFor(action.fromObjectId);
          const to = objectFor(action.toObjectId);
          if (
            from?.kind === "pointer" &&
            to?.kind === "pointer" &&
            from.id !== to.id
          ) {
            diagnostics.push({
              code: "reference.invalid",
              file,
              path: `${path}.objectId`,
              message: `Action "connect" has no compatible V1 connection primitive for "${object.id}".`,
            });
          }
          break;
        }
        case "disconnect":
          diagnostics.push({
            code: "reference.invalid",
            file,
            path: `${path}.objectId`,
            message: `Action "disconnect" has no compatible V1 connection primitive for "${object.id}".`,
          });
          break;
        case "enqueue":
          diagnostics.push({
            code: "reference.invalid",
            file,
            path: `${path}.objectId`,
            message: `Action "enqueue" has no compatible V1 queue primitive for "${object.id}".`,
          });
          break;
        case "dequeue":
          diagnostics.push({
            code: "reference.invalid",
            file,
            path: `${path}.objectId`,
            message: `Action "dequeue" has no compatible V1 queue primitive for "${object.id}".`,
          });
          break;
      }
    }
  }

  return diagnostics;
}
