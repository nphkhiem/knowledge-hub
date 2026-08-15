import {
  QUEUE_CAPACITY,
  STACK_CAPACITY,
  type DiagnosticCode,
  type LessonDiagnostic,
  type LessonSourceV1,
  type ValidationResult,
} from "@knowledge-hub/lesson-schema";
import { isResultStatus } from "./resultStatus.js";
import type { CompiledSceneObject, SemanticSnapshot } from "./types.js";

type LessonActionV1 = LessonSourceV1["timeline"][number]["actions"][number];

export interface MutableSemanticState {
  readonly objectOrder: readonly string[];
  readonly objectsById: Map<string, CompiledSceneObject>;
  readonly pointers: Record<string, number>;
  highlights: Record<string, readonly number[]>;
  /** What the current step draws attention to. Cleared before each step. */
  comparison?: SemanticSnapshot["comparison"];
  /**
   * The most recent comparison, kept across steps so a later step can prove a
   * found result followed an equal comparison at the same pointer positions.
   * This is compiler bookkeeping and never reaches a snapshot.
   *
   * One or two positions, because a comparison may weigh a single probed value
   * rather than a pair sum. The V1 result action still requires a pair and
   * rejects the single-value form rather than inventing a meaning for it.
   */
  lastComparison?: Readonly<{
    relation: "less" | "equal" | "greater";
    indices: readonly number[];
    pointerIds: readonly string[];
  }>;
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

type PointerObject = Extract<CompiledSceneObject, { kind: "pointer" }>;

/**
 * The pointer `id` names, but only when it really is a pointer into `array`.
 * Returning undefined for every other case keeps the narrowing in one place
 * rather than repeating a four-clause guard at each call site.
 */
function pointerInto(
  state: MutableSemanticState,
  id: string | undefined,
  array: CompiledSceneObject | undefined,
): PointerObject | undefined {
  if (id === undefined || array === undefined || array.kind !== "array") {
    return undefined;
  }
  const candidate = state.objectsById.get(id);
  return candidate?.kind === "pointer" && candidate.targetObjectId === array.id
    ? candidate
    : undefined;
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
  /**
   * A V1 result names a pair, so it needs a pair comparison. A comparison that
   * weighs one probed value is rejected here rather than given an invented
   * meaning: a lesson that ends on a single position needs a different result
   * shape than this one, and should not borrow this one silently.
   */
  const rightPointer =
    comparison.rightPointerId === undefined
      ? undefined
      : state.objectsById.get(comparison.rightPointerId);
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
    case "slide": {
      if (object.kind !== "window") {
        return failure(
          context,
          `Action "slide" requires a window, but "${object.id}" resolves to ${object.kind === "array" ? "an" : "a"} ${object.kind}.`,
          "reference.wrong-kind",
          `${context.path}.objectId`,
        );
      }
      const target = state.objectsById.get(object.targetObjectId);
      if (!target || target.kind !== "array") {
        return failure(
          context,
          `Window "${object.id}" requires an array target.`,
        );
      }
      if (action.toEnd < action.toStart) {
        return failure(
          context,
          `Window "${object.id}" cannot end at ${action.toEnd}, before its start ${action.toStart}.`,
          "reference.invalid",
          `${context.path}.toEnd`,
        );
      }
      if (action.toEnd >= target.values.length) {
        return failure(
          context,
          `Window range ${action.toStart} to ${action.toEnd} is outside array "${target.id}".`,
          "reference.invalid",
          `${context.path}.toEnd`,
        );
      }
      /**
       * A slide moves a window; it does not resize one. Letting the width drift
       * would let a lesson claim a fixed window while showing a growing one,
       * which is the single thing this primitive exists to show honestly. A
       * lesson that needs a changing width needs its own action, not this one.
       */
      const width = object.end - object.start;
      const requested = action.toEnd - action.toStart;
      if (requested !== width) {
        return failure(
          context,
          `Action "slide" keeps the width of "${object.id}". It covers ${width + 1} cells, but ${action.toStart} to ${action.toEnd} covers ${requested + 1}.`,
          "reference.invalid",
          `${context.path}.toEnd`,
        );
      }
      replaceObject(state, {
        ...object,
        start: action.toStart,
        end: action.toEnd,
      });
      return { ok: true, value: state };
    }
    case "narrow": {
      if (object.kind !== "window") {
        return failure(
          context,
          `Action "narrow" requires a window, but "${object.id}" resolves to ${object.kind === "array" ? "an" : "a"} ${object.kind}.`,
          "reference.wrong-kind",
          `${context.path}.objectId`,
        );
      }
      if (action.toEnd < action.toStart) {
        return failure(
          context,
          `Window "${object.id}" cannot end at ${action.toEnd}, before its start ${action.toStart}.`,
          "reference.invalid",
          `${context.path}.toEnd`,
        );
      }
      /**
       * Narrowing may not escape the range it starts from, on either side. A
       * window that could widen would not be converging, which is the whole
       * claim a halving search makes. Standing still is allowed: halving an odd
       * range leaves one bound where it was.
       */
      if (action.toStart < object.start || action.toEnd > object.end) {
        return failure(
          context,
          `Action "narrow" must land inside "${object.id}", which covers ${object.start} to ${object.end}, but ${action.toStart} to ${action.toEnd} does not.`,
          "reference.invalid",
          `${context.path}.toEnd`,
        );
      }
      replaceObject(state, {
        ...object,
        start: action.toStart,
        end: action.toEnd,
      });
      return { ok: true, value: state };
    }
    case "push": {
      if (object.kind !== "stack") {
        return failure(
          context,
          `Action "push" requires a stack, but "${object.id}" resolves to ${object.kind === "array" ? "an" : "a"} ${object.kind}.`,
          "reference.wrong-kind",
          `${context.path}.objectId`,
        );
      }
      // Repeated entries are ordinary here, unlike a buckets key: recursion
      // pushes the same frame shape over and over. Only depth is bounded.
      if (object.entries.length >= STACK_CAPACITY) {
        return failure(
          context,
          `Stack "${object.id}" already holds ${STACK_CAPACITY} entries, which is all the figure can show.`,
          "reference.invalid",
          `${context.path}.key`,
        );
      }
      replaceObject(state, {
        ...object,
        entries: [...object.entries, action.key],
      });
      return { ok: true, value: state };
    }
    case "pop": {
      if (object.kind !== "stack") {
        return failure(
          context,
          `Action "pop" requires a stack, but "${object.id}" resolves to ${object.kind === "array" ? "an" : "a"} ${object.kind}.`,
          "reference.wrong-kind",
          `${context.path}.objectId`,
        );
      }
      const top = object.entries.at(-1);
      if (top === undefined) {
        return failure(
          context,
          `Action "pop" requires a non-empty stack, but "${object.id}" is empty.`,
          "reference.invalid",
          `${context.path}.expect`,
        );
      }
      /**
       * Which entry comes back is the one thing this primitive exists to show,
       * so a step has to name it and the compiler has to agree. Without this a
       * lesson could narrate first-in-first-out over a pile that does the
       * opposite, and every test would still pass.
       */
      if (top !== action.expect) {
        return failure(
          context,
          `Action "pop" expected "${action.expect}" from "${object.id}", but the top holds "${top}".`,
          "reference.invalid",
          `${context.path}.expect`,
        );
      }
      replaceObject(state, {
        ...object,
        entries: object.entries.slice(0, -1),
      });
      return { ok: true, value: state };
    }
    case "insert": {
      if (object.kind !== "buckets") {
        return failure(
          context,
          `Action "insert" requires a buckets object, but "${object.id}" resolves to ${object.kind === "array" ? "an" : "a"} ${object.kind}.`,
          "reference.wrong-kind",
          `${context.path}.objectId`,
        );
      }
      if (action.slot >= object.slotCount) {
        return failure(
          context,
          `Slot ${action.slot} is outside "${object.id}", which has ${object.slotCount} slots.`,
          "reference.invalid",
          `${context.path}.slot`,
        );
      }
      if (object.entries.some((entry) => entry.key === action.key)) {
        return failure(
          context,
          `Key "${action.key}" is already in "${object.id}". A repeated insert would misrepresent what a lookup finds.`,
          "reference.invalid",
          `${context.path}.key`,
        );
      }
      replaceObject(state, {
        ...object,
        entries: [...object.entries, { key: action.key, slot: action.slot }],
      });
      return { ok: true, value: state };
    }
    case "highlight": {
      // Highlight emphasizes a position in something indexed, so it accepts
      // both kinds that have positions. Buckets rendered highlights from the
      // start; without this no action could ever produce one.
      if (object.kind !== "array" && object.kind !== "buckets") {
        return failure(
          context,
          `Action "highlight" requires an array or buckets, but "${object.id}" resolves to a ${object.kind}.`,
          "reference.wrong-kind",
          `${context.path}.objectId`,
        );
      }
      const positions =
        object.kind === "array" ? object.values.length : object.slotCount;
      if (action.indices.some((index) => index >= positions)) {
        return failure(
          context,
          `Highlight indices must be inside "${object.id}".`,
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
      const leftPointer = pointerInto(state, object.leftPointerId, array);
      /**
       * A comparison without a second pointer weighs the one value its pointer
       * addresses. With a second it weighs the pair's sum. Everything after
       * this point asks the same question of the same target.
       */
      const wantsPair = object.rightPointerId !== undefined;
      const rightPointer = wantsPair
        ? pointerInto(state, object.rightPointerId, array)
        : undefined;
      if (
        !array ||
        array.kind !== "array" ||
        !leftPointer ||
        (wantsPair && !rightPointer)
      ) {
        return failure(
          context,
          wantsPair
            ? `Comparison "${object.id}" requires two pointers targeting array "${object.arrayObjectId}".`
            : `Comparison "${object.id}" requires a pointer targeting array "${object.arrayObjectId}".`,
          "reference.invalid",
          `${context.path}.objectId`,
        );
      }
      const leftValue = array.values[leftPointer.index];
      const rightValue = rightPointer && array.values[rightPointer.index];
      if (
        leftValue === undefined ||
        (rightPointer !== undefined && rightValue === undefined)
      ) {
        return failure(
          context,
          `Comparison "${object.id}" references an out-of-bounds pointer.`,
        );
      }
      const actual = leftValue + (rightValue ?? 0);
      const relation =
        actual < object.target
          ? "less"
          : actual > object.target
            ? "greater"
            : "equal";
      state.comparison = { actual, target: object.target, relation };
      state.lastComparison = {
        indices: rightPointer
          ? [leftPointer.index, rightPointer.index]
          : [leftPointer.index],
        pointerIds: rightPointer
          ? [leftPointer.id, rightPointer.id]
          : [leftPointer.id],
        relation,
      };
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
      if (!isResultStatus(action.value)) {
        return failure(
          context,
          `Result status must be pending, found, or not-found.`,
          "reference.invalid",
          `${context.path}.value`,
        );
      }
      const status = action.value;
      const currentComparison =
        status === "pending"
          ? undefined
          : resolveCurrentV1Comparison(state, context);
      if (currentComparison && !currentComparison.ok) return currentComparison;
      let result: SemanticSnapshot["result"];
      if (status === "found") {
        const lastComparison = state.lastComparison;
        if (
          lastComparison === undefined ||
          lastComparison.relation !== "equal"
        ) {
          return failure(
            context,
            `A found result requires a preceding equal comparison.`,
            "reference.invalid",
            `${context.path}.value`,
          );
        }
        const { indices, pointerIds } = lastComparison;
        const [leftId, rightId] = pointerIds;
        const [leftAt, rightAt] = indices;
        /**
         * A V1 found result names a pair. A comparison that weighed a single
         * probed value cannot produce one, and is rejected rather than padded
         * out into a pair that the lesson never stated.
         */
        if (
          leftId === undefined ||
          rightId === undefined ||
          leftAt === undefined ||
          rightAt === undefined
        ) {
          return failure(
            context,
            `A found result requires a comparison of two pointers.`,
            "reference.invalid",
            `${context.path}.value`,
          );
        }
        if (
          state.pointers[leftId] !== leftAt ||
          state.pointers[rightId] !== rightAt
        ) {
          return failure(
            context,
            `A found result requires an equal comparison at the current pointer positions.`,
            "reference.invalid",
            `${context.path}.value`,
          );
        }
        if (leftAt === rightAt) {
          return failure(
            context,
            `A found result requires two distinct pointer indices.`,
            "reference.invalid",
            `${context.path}.value`,
          );
        }
        result = { kind: "found", indices: [leftAt, rightAt] };
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
    case "enqueue": {
      if (object.kind !== "queue") {
        return failure(
          context,
          `Action "enqueue" requires a queue, but "${object.id}" resolves to ${object.kind === "array" ? "an" : "a"} ${object.kind}.`,
          "reference.wrong-kind",
          `${context.path}.objectId`,
        );
      }
      if (object.entries.length >= QUEUE_CAPACITY) {
        return failure(
          context,
          `Queue "${object.id}" already holds ${QUEUE_CAPACITY} entries, which is all the figure can show.`,
          "reference.invalid",
          `${context.path}.key`,
        );
      }
      // Arrivals join the back. Repeated names are ordinary, as they are for a
      // stack: two requests can carry the same label.
      replaceObject(state, {
        ...object,
        entries: [...object.entries, action.key],
      });
      return { ok: true, value: state };
    }
    case "dequeue": {
      if (object.kind !== "queue") {
        return failure(
          context,
          `Action "dequeue" requires a queue, but "${object.id}" resolves to ${object.kind === "array" ? "an" : "a"} ${object.kind}.`,
          "reference.wrong-kind",
          `${context.path}.objectId`,
        );
      }
      const front = object.entries[0];
      if (front === undefined) {
        return failure(
          context,
          `Action "dequeue" requires a non-empty queue, but "${object.id}" is empty.`,
          "reference.invalid",
          `${context.path}.expect`,
        );
      }
      /**
       * The mirror of pop's rule. Which end is served is the only thing
       * separating a queue from a stack, so a step that names the wrong entry
       * would teach the other lesson by accident.
       */
      if (front !== action.expect) {
        return failure(
          context,
          `Action "dequeue" expected "${action.expect}" from "${object.id}", but the front holds "${front}".`,
          "reference.invalid",
          `${context.path}.expect`,
        );
      }
      replaceObject(state, { ...object, entries: object.entries.slice(1) });
      return { ok: true, value: state };
    }
  }
}
