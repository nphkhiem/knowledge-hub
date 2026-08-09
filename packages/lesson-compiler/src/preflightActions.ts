import type {
  LessonDiagnostic,
  LessonSourceV1,
} from "@knowledge-hub/lesson-schema";

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
        case "highlight":
          if (object.kind !== "array") {
            diagnostics.push({
              code: "reference.wrong-kind",
              file,
              path: `${path}.objectId`,
              message: `Action "highlight" requires an array, but "${object.id}" resolves to ${primitiveWithArticle(object.kind)}.`,
            });
          } else if (
            action.indices.some((index) => index >= object.values.length)
          ) {
            diagnostics.push({
              code: "reference.invalid",
              file,
              path: `${path}.indices`,
              message: `Highlight indices must be inside array "${object.id}".`,
            });
          }
          break;
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
          const validValue = ["pending", "found", "not-found"].includes(
            String(action.value),
          );
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
