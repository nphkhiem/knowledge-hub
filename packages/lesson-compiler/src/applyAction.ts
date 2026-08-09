import type {
  DiagnosticCode,
  LessonDiagnostic,
  LessonSourceV1,
  ValidationResult,
} from "@knowledge-hub/lesson-schema";
import type { CompiledSceneObject, SemanticSnapshot } from "./types.js";

type LessonActionV1 = LessonSourceV1["timeline"][number]["actions"][number];

export interface MutableSemanticState {
  readonly objectOrder: readonly string[];
  readonly objectsById: Map<string, CompiledSceneObject>;
  readonly pointers: Record<string, number>;
  readonly highlights: Record<string, readonly number[]>;
  comparison?: SemanticSnapshot["comparison"];
  comparisonIndices?: readonly [number, number];
  comparisonPointerIds?: readonly [string, string];
  result?: SemanticSnapshot["result"];
}

export interface CompileContext {
  readonly file: string;
  readonly path: string;
}

interface CurrentV1Comparison {
  readonly actual: number;
  readonly leftIndex: number;
  readonly rightIndex: number;
  readonly target: number;
}

function failure<T = MutableSemanticState>(
  context: CompileContext,
  message: string,
  code: DiagnosticCode = "reference.invalid",
  path = context.path,
): ValidationResult<T> {
  const diagnostic: LessonDiagnostic = {
    code,
    file: context.file,
    path,
    message,
  };
  return { ok: false, diagnostics: [diagnostic] };
}

function objectFor(
  state: MutableSemanticState,
  objectId: string,
  context: CompileContext,
): ValidationResult<CompiledSceneObject> {
  const object = state.objectsById.get(objectId);
  return object
    ? { ok: true, value: object }
    : failure<CompiledSceneObject>(
        context,
        `Reference "${objectId}" does not resolve to a compiled scene object.`,
      );
}

function replaceObject(
  state: MutableSemanticState,
  object: CompiledSceneObject,
): void {
  state.objectsById.set(object.id, object);
}

function resolveCurrentV1Comparison(
  state: MutableSemanticState,
  context: CompileContext,
): ValidationResult<CurrentV1Comparison> {
  const comparisons = state.objectOrder.flatMap((id) => {
    const object = state.objectsById.get(id);
    return object?.kind === "comparison" ? [object] : [];
  });
  if (comparisons.length !== 1) {
    return failure<CurrentV1Comparison>(
      context,
      `A result action requires exactly one V1 comparison object; found ${comparisons.length}.`,
      "reference.invalid",
      `${context.path}.objectId`,
    );
  }
  const comparison = comparisons[0]!;
  const array = state.objectsById.get(comparison.arrayObjectId);
  const leftPointer = state.objectsById.get(comparison.leftPointerId);
  const rightPointer = state.objectsById.get(comparison.rightPointerId);
  if (
    !array ||
    array.kind !== "array" ||
    !leftPointer ||
    leftPointer.kind !== "pointer" ||
    !rightPointer ||
    rightPointer.kind !== "pointer" ||
    leftPointer.targetObjectId !== array.id ||
    rightPointer.targetObjectId !== array.id
  ) {
    return failure<CurrentV1Comparison>(
      context,
      `Comparison "${comparison.id}" requires two pointers targeting array "${comparison.arrayObjectId}".`,
      "reference.invalid",
      `${context.path}.objectId`,
    );
  }
  const leftValue = array.values[leftPointer.index];
  const rightValue = array.values[rightPointer.index];
  if (leftValue === undefined || rightValue === undefined) {
    return failure<CurrentV1Comparison>(
      context,
      `Comparison "${comparison.id}" references an out-of-bounds pointer.`,
      "reference.invalid",
      `${context.path}.objectId`,
    );
  }
  return {
    ok: true,
    value: {
      actual: leftValue + rightValue,
      leftIndex: leftPointer.index,
      rightIndex: rightPointer.index,
      target: comparison.target,
    },
  };
}

export function applyAction(
  state: MutableSemanticState,
  action: LessonActionV1,
  context: CompileContext,
): ValidationResult<MutableSemanticState> {
  const resolved = objectFor(state, action.objectId, context);
  if (!resolved.ok) return resolved;
  const object = resolved.value;

  switch (action.type) {
    case "move": {
      if (object.kind !== "pointer") {
        return failure(
          context,
          `Action "move" requires a pointer, but "${object.id}" resolves to ${object.kind === "array" ? "an" : "a"} ${object.kind}.`,
          "reference.wrong-kind",
          `${context.path}.objectId`,
        );
      }
      const target = state.objectsById.get(object.targetObjectId);
      if (!target || target.kind !== "array") {
        return failure(
          context,
          `Pointer "${object.id}" requires an array target.`,
        );
      }
      if (action.toIndex >= target.values.length) {
        return failure(
          context,
          `Pointer index ${action.toIndex} is outside array "${target.id}".`,
          "reference.invalid",
          `${context.path}.toIndex`,
        );
      }
      replaceObject(state, { ...object, index: action.toIndex });
      state.pointers[object.id] = action.toIndex;
      return { ok: true, value: state };
    }
    case "highlight": {
      if (object.kind !== "array") {
        return failure(
          context,
          `Action "highlight" requires an array, but "${object.id}" resolves to a ${object.kind}.`,
          "reference.wrong-kind",
          `${context.path}.objectId`,
        );
      }
      if (action.indices.some((index) => index >= object.values.length)) {
        return failure(
          context,
          `Highlight indices must be inside array "${object.id}".`,
          "reference.invalid",
          `${context.path}.indices`,
        );
      }
      state.highlights[object.id] = [...action.indices];
      return { ok: true, value: state };
    }
    case "compare": {
      if (object.kind !== "comparison") {
        return failure(
          context,
          `Action "compare" requires a comparison, but "${object.id}" resolves to ${object.kind === "array" ? "an" : "a"} ${object.kind}.`,
          "reference.wrong-kind",
          `${context.path}.objectId`,
        );
      }
      const array = state.objectsById.get(object.arrayObjectId);
      const leftPointer = state.objectsById.get(object.leftPointerId);
      const rightPointer = state.objectsById.get(object.rightPointerId);
      if (
        !array ||
        array.kind !== "array" ||
        !leftPointer ||
        leftPointer.kind !== "pointer" ||
        !rightPointer ||
        rightPointer.kind !== "pointer" ||
        leftPointer.targetObjectId !== array.id ||
        rightPointer.targetObjectId !== array.id
      ) {
        return failure(
          context,
          `Comparison "${object.id}" requires two pointers targeting array "${object.arrayObjectId}".`,
          "reference.invalid",
          `${context.path}.objectId`,
        );
      }
      const leftValue = array.values[leftPointer.index];
      const rightValue = array.values[rightPointer.index];
      if (leftValue === undefined || rightValue === undefined) {
        return failure(
          context,
          `Comparison "${object.id}" references an out-of-bounds pointer.`,
        );
      }
      const actual = leftValue + rightValue;
      state.comparison = {
        actual,
        target: object.target,
        relation:
          actual < object.target
            ? "less"
            : actual > object.target
              ? "greater"
              : "equal",
      };
      state.comparisonIndices = [leftPointer.index, rightPointer.index];
      state.comparisonPointerIds = [leftPointer.id, rightPointer.id];
      return { ok: true, value: state };
    }
    case "set": {
      if (object.kind !== "result") {
        return failure(
          context,
          `Action "set" requires a result, but "${object.id}" resolves to ${object.kind === "array" ? "an" : "a"} ${object.kind}.`,
          "reference.wrong-kind",
          `${context.path}.objectId`,
        );
      }
      if (action.property !== "status") {
        return failure(
          context,
          `Action "set" only supports the status property of a result object.`,
          "reference.invalid",
          `${context.path}.property`,
        );
      }
      if (!["pending", "found", "not-found"].includes(String(action.value))) {
        return failure(
          context,
          `Result status must be pending, found, or not-found.`,
          "reference.invalid",
          `${context.path}.value`,
        );
      }
      const status = action.value as "pending" | "found" | "not-found";
      const currentComparison =
        status === "pending"
          ? undefined
          : resolveCurrentV1Comparison(state, context);
      if (currentComparison && !currentComparison.ok) return currentComparison;
      let result: SemanticSnapshot["result"];
      if (status === "found") {
        const indices = state.comparisonIndices;
        const pointerIds = state.comparisonPointerIds;
        if (
          state.comparison?.relation !== "equal" ||
          indices === undefined ||
          pointerIds === undefined
        ) {
          return failure(
            context,
            `A found result requires a preceding equal comparison.`,
            "reference.invalid",
            `${context.path}.value`,
          );
        }
        if (
          state.pointers[pointerIds[0]] !== indices[0] ||
          state.pointers[pointerIds[1]] !== indices[1]
        ) {
          return failure(
            context,
            `A found result requires an equal comparison at the current pointer positions.`,
            "reference.invalid",
            `${context.path}.value`,
          );
        }
        if (indices[0] === indices[1]) {
          return failure(
            context,
            `A found result requires two distinct pointer indices.`,
            "reference.invalid",
            `${context.path}.value`,
          );
        }
        result = { kind: "found", indices };
      } else if (status === "not-found" && currentComparison?.ok) {
        const { actual, leftIndex, rightIndex, target } =
          currentComparison.value;
        if (leftIndex !== rightIndex && actual === target) {
          return failure(
            context,
            `A not-found result cannot discard a current distinct equal pair.`,
            "reference.invalid",
            `${context.path}.value`,
          );
        }
        if (leftIndex < rightIndex) {
          return failure(
            context,
            `A not-found result requires exhausted or crossed pointers (left >= right).`,
            "reference.invalid",
            `${context.path}.value`,
          );
        }
        result = { kind: "not-found" };
      } else {
        result = undefined;
      }
      replaceObject(state, { ...object, status });
      state.result = result;
      return { ok: true, value: state };
    }
    case "show":
    case "hide": {
      replaceObject(state, { ...object, visible: action.type === "show" });
      return { ok: true, value: state };
    }
    case "connect":
      return failure(
        context,
        `Action "connect" has no compatible V1 connection primitive for "${object.id}".`,
        "reference.invalid",
        `${context.path}.objectId`,
      );
    case "disconnect":
      return failure(
        context,
        `Action "disconnect" has no compatible V1 connection primitive for "${object.id}".`,
        "reference.invalid",
        `${context.path}.objectId`,
      );
    case "enqueue":
      return failure(
        context,
        `Action "enqueue" has no compatible V1 queue primitive for "${object.id}".`,
        "reference.invalid",
        `${context.path}.objectId`,
      );
    case "dequeue":
      return failure(
        context,
        `Action "dequeue" has no compatible V1 queue primitive for "${object.id}".`,
        "reference.invalid",
        `${context.path}.objectId`,
      );
  }
}
