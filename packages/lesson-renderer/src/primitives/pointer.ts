import type { CompiledSceneObject } from "@knowledge-hub/lesson-compiler";
import {
  asSafeMarkup,
  escapeText,
  formatCoordinate,
  renderGroup,
} from "../escapeMarkup.js";
import {
  ARRAY_BOTTOM,
  cellCenter,
  ordinalAmongKind,
  pointerIndex,
  pointerValue,
} from "../scene.js";
import type {
  PrimitiveContract,
  PrimitiveRenderContext,
  SafeMarkup,
} from "../types.js";

const MARKER_HALF_WIDTH = 9;
const ABOVE = {
  apex: 158,
  base: 146,
  lineTop: 120,
  textBaseline: 112,
} as const;
const BELOW = {
  apex: ARRAY_BOTTOM + 2,
  base: ARRAY_BOTTOM + 14,
  lineBottom: ARRAY_BOTTOM + 40,
  textBaseline: ARRAY_BOTTOM + 64,
} as const;

function accepts(object: CompiledSceneObject): boolean {
  return object.kind === "pointer";
}

function describe(
  object: CompiledSceneObject,
  context: PrimitiveRenderContext,
): string {
  if (object.kind !== "pointer") return "";

  const index = pointerIndex(context.snapshot, object);
  const value = pointerValue(context.snapshot, object);
  return value === undefined
    ? `${object.label} pointer at index ${index}`
    : `${object.label} pointer at index ${index}, value ${value}`;
}

function renderMarker(center: number, band: "above" | "below"): string {
  const x = formatCoordinate(center);
  const left = formatCoordinate(center - MARKER_HALF_WIDTH);
  const right = formatCoordinate(center + MARKER_HALF_WIDTH);
  const stroke = `stroke="var(--color-visual-active-stroke)" stroke-width="var(--visual-active-stroke-width)"`;

  if (band === "above") {
    return [
      `<line x1="${x}" y1="${ABOVE.lineTop}" x2="${x}" y2="${ABOVE.base}" ${stroke}/>`,
      `<polygon points="${left},${ABOVE.base} ${right},${ABOVE.base} ${x},${ABOVE.apex}"`,
      ` fill="var(--color-visual-active-stroke)"/>`,
    ].join("");
  }
  return [
    `<polygon points="${left},${BELOW.base} ${right},${BELOW.base} ${x},${BELOW.apex}"`,
    ` fill="var(--color-visual-active-stroke)"/>`,
    `<line x1="${x}" y1="${BELOW.base}" x2="${x}" y2="${BELOW.lineBottom}" ${stroke}/>`,
  ].join("");
}

function render(
  object: CompiledSceneObject,
  context: PrimitiveRenderContext,
): SafeMarkup {
  if (object.kind !== "pointer" || !object.visible) return asSafeMarkup("");

  /** Pointers alternate above and below so a shared index still reads as two. */
  const band =
    ordinalAmongKind(context.snapshot, object) % 2 === 0 ? "above" : "below";
  const center = cellCenter(
    context.geometry,
    pointerIndex(context.snapshot, object),
  );
  const description = describe(object, context);
  const textBaseline =
    band === "above" ? ABOVE.textBaseline : BELOW.textBaseline;

  return renderGroup(object, context, "lesson-pointer", description, [
    renderMarker(center, band),
    [
      `<text x="${formatCoordinate(center)}" y="${textBaseline}" text-anchor="middle"`,
      ` font-size="16" fill="var(--color-visual-active-text)">`,
      `${escapeText(description)}</text>`,
    ].join(""),
  ]);
}

export const pointerPrimitive: PrimitiveContract = {
  accepts,
  describe,
  kind: "pointer",
  render,
};
