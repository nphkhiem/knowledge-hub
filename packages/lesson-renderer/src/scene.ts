import type {
  CompiledSceneObject,
  SemanticSnapshot,
} from "@knowledge-hub/lesson-compiler";

type ArrayObject = Extract<CompiledSceneObject, { kind: "array" }>;
type PointerObject = Extract<CompiledSceneObject, { kind: "pointer" }>;
type ComparisonObject = Extract<CompiledSceneObject, { kind: "comparison" }>;

export function findArrayObject(
  snapshot: SemanticSnapshot,
): ArrayObject | undefined {
  for (const object of snapshot.objects) {
    if (object.kind === "array") return object;
  }
  return undefined;
}

export function findArrayObjectById(
  snapshot: SemanticSnapshot,
  objectId: string,
): ArrayObject | undefined {
  for (const object of snapshot.objects) {
    if (object.kind === "array" && object.id === objectId) return object;
  }
  return undefined;
}

export function findPointerObject(
  snapshot: SemanticSnapshot,
  objectId: string,
): PointerObject | undefined {
  for (const object of snapshot.objects) {
    if (object.kind === "pointer" && object.id === objectId) return object;
  }
  return undefined;
}

export function findComparisonObject(
  snapshot: SemanticSnapshot,
): ComparisonObject | undefined {
  for (const object of snapshot.objects) {
    if (object.kind === "comparison") return object;
  }
  return undefined;
}

/**
 * The index a pointer addresses, held inside its own array so the marker and
 * the label it carries can never disagree.
 */
export function pointerIndex(
  snapshot: SemanticSnapshot,
  pointer: PointerObject,
): number {
  const requested = snapshot.pointers[pointer.id] ?? pointer.index;
  const values = findArrayObjectById(snapshot, pointer.targetObjectId);
  if (values === undefined || values.values.length === 0) return requested;
  return Math.max(0, Math.min(requested, values.values.length - 1));
}

export function pointerValue(
  snapshot: SemanticSnapshot,
  pointer: PointerObject,
): number | undefined {
  const values = findArrayObjectById(snapshot, pointer.targetObjectId);
  return values?.values[pointerIndex(snapshot, pointer)];
}

/**
 * The authored position of an object among the objects of its own kind. Layout
 * uses it to place repeated primitives in stable, non-overlapping slots.
 */
export function ordinalAmongKind(
  snapshot: SemanticSnapshot,
  object: CompiledSceneObject,
): number {
  const sameKind = snapshot.objects.filter(
    (candidate) => candidate.kind === object.kind,
  );
  const position = sameKind.findIndex(
    (candidate) => candidate.id === object.id,
  );
  return position < 0 ? 0 : position;
}

export interface CurrentComparison {
  readonly actual: number;
  readonly target: number;
  readonly relation: "less" | "equal" | "greater";
  readonly leftLabel: string;
  readonly leftValue: number;
  /** Both absent when the comparison weighs one probed value, not a pair. */
  readonly rightLabel?: string | undefined;
  readonly rightValue?: number | undefined;
}

/**
 * A compiled comparison outlives the step that produced it, so it may describe
 * pointer positions that have since moved. Only a comparison whose sum still
 * matches the addressed values may be stated.
 */
export function currentComparison(
  snapshot: SemanticSnapshot,
): CurrentComparison | undefined {
  const comparison = snapshot.comparison;
  const scene = findComparisonObject(snapshot);
  if (comparison === undefined || scene === undefined) return undefined;

  const left = findPointerObject(snapshot, scene.leftPointerId);
  if (left === undefined) return undefined;
  const leftValue = pointerValue(snapshot, left);
  if (leftValue === undefined) return undefined;

  /**
   * A comparison with no second pointer weighs the one value its pointer
   * addresses. The staleness rule is the same either way: the recorded total
   * must still match what the pointers currently address, or the comparison
   * describes a position the figure has already moved past.
   */
  if (scene.rightPointerId === undefined) {
    if (leftValue !== comparison.actual) return undefined;
    return {
      actual: comparison.actual,
      leftLabel: left.label,
      leftValue,
      relation: comparison.relation,
      target: comparison.target,
    };
  }

  const right = findPointerObject(snapshot, scene.rightPointerId);
  if (right === undefined) return undefined;

  const rightValue = pointerValue(snapshot, right);
  if (rightValue === undefined) return undefined;
  if (leftValue + rightValue !== comparison.actual) return undefined;

  return {
    actual: comparison.actual,
    leftLabel: left.label,
    leftValue,
    relation: comparison.relation,
    rightLabel: right.label,
    rightValue,
    target: comparison.target,
  };
}

export function relationPhrase(
  relation: CurrentComparison["relation"],
): string {
  switch (relation) {
    case "less":
      return "less than";
    case "equal":
      return "equal to";
    case "greater":
      return "greater than";
  }
}
