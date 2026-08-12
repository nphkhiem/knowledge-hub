import type { SemanticSnapshot } from "@knowledge-hub/lesson-compiler";

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

/**
 * Vertical distance between two arrays.
 *
 * One array's band runs from its own label, 112 above its top, to the text of a
 * pointer below it, 160 beneath its top. The stride clears that 272 with room
 * left, so a second array can never draw over the first.
 */
export const ROW_STRIDE = 320;

/** A figure grows downward for each array it carries. */
export function logicalHeightFor(rowCount: number): number {
  return LOGICAL_HEIGHT + Math.max(0, rowCount - 1) * ROW_STRIDE;
}

const HORIZONTAL_PADDING = 60;
const MIN_CELL_WIDTH = 72;
const MAX_CELL_WIDTH = 140;
/**
 * Kept deliberately generous: clamping must reserve at least as much room as
 * any checker assumes, or a label that measures as fitting still overflows.
 */
const CHARACTER_WIDTH_RATIO = 0.62;

/**
 * Cells share the available width. They stay within a legible range while the
 * item count allows it, and shrink below it rather than leave the viewBox.
 */
export function computeArrayGeometry(
  cellCount: number,
  rowIndex = 0,
): ArrayGeometry {
  const available = LOGICAL_WIDTH - HORIZONTAL_PADDING * 2;
  const fitted = cellCount > 0 ? available / cellCount : available;
  const cellWidth =
    fitted < MIN_CELL_WIDTH ? fitted : Math.min(MAX_CELL_WIDTH, fitted);

  return {
    cellCount,
    cellWidth,
    height: ARRAY_HEIGHT,
    left: (LOGICAL_WIDTH - cellWidth * cellCount) / 2,
    top: ARRAY_TOP + rowIndex * ROW_STRIDE,
  };
}

export function cellCenter(geometry: ArrayGeometry, index: number): number {
  const clamped = Math.max(0, Math.min(index, geometry.cellCount - 1));
  return geometry.left + (clamped + 0.5) * geometry.cellWidth;
}

/** Glyph advance is unavailable without a font, so estimate conservatively. */
export function estimateTextWidth(text: string, fontSize: number): number {
  return text.length * fontSize * CHARACTER_WIDTH_RATIO;
}

/**
 * Keeps a middle-anchored label inside the figure. A label wider than the
 * figure settles in the center, which is the least-clipped position available.
 */
export function clampTextCenter(
  center: number,
  text: string,
  fontSize: number,
): number {
  const half = estimateTextWidth(text, fontSize) / 2;
  const lowest = Math.min(LOGICAL_WIDTH / 2, half);
  const highest = Math.max(LOGICAL_WIDTH / 2, LOGICAL_WIDTH - half);
  return Math.max(lowest, Math.min(center, highest));
}

/** Keeps a start-anchored label from running off the right edge. */
export function clampTextStart(
  x: number,
  text: string,
  fontSize: number,
): number {
  const widest =
    LOGICAL_WIDTH - HORIZONTAL_PADDING - estimateTextWidth(text, fontSize);
  return Math.max(0, Math.min(x, Math.max(0, widest)));
}

/** Keeps an end-anchored label from running off the left edge. */
export function clampTextEnd(
  x: number,
  text: string,
  fontSize: number,
): number {
  const narrowest = Math.min(
    LOGICAL_WIDTH,
    estimateTextWidth(text, fontSize) + HORIZONTAL_PADDING,
  );
  return Math.min(LOGICAL_WIDTH, Math.max(x, narrowest));
}

/** Cell text shrinks with the cells so neighboring values cannot collide. */
export function fitFontSize(
  cellWidth: number,
  ideal: number,
  smallest: number,
  ratio: number,
): number {
  return Math.min(ideal, Math.max(smallest, cellWidth * ratio));
}

export function createRenderContext(
  snapshot: SemanticSnapshot,
  presentation: PrimitivePresentation,
): PrimitiveRenderContext {
  /**
   * Every array gets its own band, in scene order. Sharing one geometry made
   * two arrays draw on top of each other and sized the second one's cells for
   * the first one's length.
   */
  const arrays = snapshot.objects.filter((object) => object.kind === "array");
  const geometries = new Map<string, ArrayGeometry>(
    arrays.map((object, rowIndex) => [
      object.id,
      computeArrayGeometry(object.values.length, rowIndex),
    ]),
  );
  const first = computeArrayGeometry(arrays[0]?.values.length ?? 0);

  return {
    geometry: first,
    geometryFor: (objectId: string) => geometries.get(objectId) ?? first,
    rowCount: arrays.length,
    presentation,
    snapshot,
  };
}
