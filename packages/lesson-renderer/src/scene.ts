import type {
  CompiledSceneObject,
  SemanticSnapshot,
} from "@knowledge-hub/lesson-compiler";
import type {
  ArrayGeometry,
  PrimitivePresentation,
  PrimitiveRenderContext,
} from "./types.js";

export const LOGICAL_WIDTH = 960;
export const LOGICAL_HEIGHT = 420;
export const ARRAY_TOP = 160;
export const ARRAY_HEIGHT = 96;
export const ARRAY_BOTTOM = ARRAY_TOP + ARRAY_HEIGHT;

const HORIZONTAL_PADDING = 60;
const MIN_CELL_WIDTH = 72;
const MAX_CELL_WIDTH = 140;

type ArrayObject = Extract<CompiledSceneObject, { kind: "array" }>;
type PointerObject = Extract<CompiledSceneObject, { kind: "pointer" }>;
type ComparisonObject = Extract<CompiledSceneObject, { kind: "comparison" }>;

/**
 * Cells share the available width. They stay within a legible range while the
 * item count allows it, and shrink below it rather than leave the viewBox.
 */
export function computeArrayGeometry(cellCount: number): ArrayGeometry {
  const available = LOGICAL_WIDTH - HORIZONTAL_PADDING * 2;
  const fitted = cellCount > 0 ? available / cellCount : available;
  const cellWidth =
    fitted < MIN_CELL_WIDTH ? fitted : Math.min(MAX_CELL_WIDTH, fitted);

  return {
    cellCount,
    cellWidth,
    height: ARRAY_HEIGHT,
    left: (LOGICAL_WIDTH - cellWidth * cellCount) / 2,
    top: ARRAY_TOP,
  };
}

export function cellCenter(geometry: ArrayGeometry, index: number): number {
  const clamped = Math.max(0, Math.min(index, geometry.cellCount - 1));
  return geometry.left + (clamped + 0.5) * geometry.cellWidth;
}

export function createRenderContext(
  snapshot: SemanticSnapshot,
  presentation: PrimitivePresentation,
): PrimitiveRenderContext {
  const values = findArrayObject(snapshot);

  return {
    geometry: computeArrayGeometry(values?.values.length ?? 0),
    presentation,
    snapshot,
  };
}

export function findArrayObject(
  snapshot: SemanticSnapshot,
  objectId?: string,
): ArrayObject | undefined {
  for (const object of snapshot.objects) {
    if (object.kind !== "array") continue;
    if (objectId === undefined || object.id === objectId) return object;
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

/** The index a pointer currently addresses, preferring the snapshot record. */
export function pointerIndex(
  snapshot: SemanticSnapshot,
  pointer: PointerObject,
): number {
  return snapshot.pointers[pointer.id] ?? pointer.index;
}

export function pointerValue(
  snapshot: SemanticSnapshot,
  pointer: PointerObject,
): number | undefined {
  const values = findArrayObject(snapshot, pointer.targetObjectId);
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
  readonly rightLabel: string;
  readonly rightValue: number;
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
  const right = findPointerObject(snapshot, scene.rightPointerId);
  if (left === undefined || right === undefined) return undefined;

  const leftValue = pointerValue(snapshot, left);
  const rightValue = pointerValue(snapshot, right);
  if (leftValue === undefined || rightValue === undefined) return undefined;
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
