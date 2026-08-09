import type { CompiledSceneObject } from "@knowledge-hub/lesson-compiler";
import { definePrimitive } from "../definePrimitive.js";
import { escapeText, formatCoordinate } from "../escapeMarkup.js";
import { ARRAY_BOTTOM, cellCenter, clampTextCenter } from "../geometry.js";
import { renderGroup } from "../renderGroup.js";
import { ordinalAmongKind, pointerIndex, pointerValue } from "../scene.js";
import type { PrimitiveRenderContext } from "../types.js";

type PointerObject = Extract<CompiledSceneObject, { kind: "pointer" }>;

const TEXT_FONT_SIZE = 16;
const MARKER_HALF_WIDTH = 9;
const ABOVE = {
  apex: 158,
  base: 146,
  lineEnd: 120,
  textBaseline: 112,
} as const;
const BELOW = {
  apex: ARRAY_BOTTOM + 2,
  base: ARRAY_BOTTOM + 14,
  lineEnd: ARRAY_BOTTOM + 40,
  textBaseline: ARRAY_BOTTOM + 64,
} as const;

function describePointer(
  object: PointerObject,
  context: PrimitiveRenderContext,
): string {
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
  const stroke = [
    `stroke="var(--color-visual-active-stroke)"`,
    ` stroke-width="var(--visual-active-stroke-width)"`,
  ].join("");
  const slot = band === "above" ? ABOVE : BELOW;

  return [
    `<polygon points="${left},${slot.base} ${right},${slot.base} ${x},${slot.apex}"`,
    ` fill="var(--color-visual-active-stroke)"/>`,
    `<line x1="${x}" y1="${slot.base}" x2="${x}" y2="${slot.lineEnd}" ${stroke}/>`,
  ].join("");
}

export const pointerPrimitive = definePrimitive("pointer", {
  describe: describePointer,

  render: (object, context) => {
    /** Pointers alternate above and below so a shared index still reads as two. */
    const band =
      ordinalAmongKind(context.snapshot, object) % 2 === 0 ? "above" : "below";
    const center = cellCenter(
      context.geometry,
      pointerIndex(context.snapshot, object),
    );
    const description = describePointer(object, context);
    const textBaseline =
      band === "above" ? ABOVE.textBaseline : BELOW.textBaseline;
    const textCenter = clampTextCenter(center, description, TEXT_FONT_SIZE);

    return renderGroup(object, context, "lesson-pointer", description, [
      renderMarker(center, band),
      [
        `<text x="${formatCoordinate(textCenter)}" y="${textBaseline}"`,
        ` text-anchor="middle" font-size="${TEXT_FONT_SIZE}"`,
        ` fill="var(--color-visual-active-text)">${escapeText(description)}</text>`,
      ].join(""),
    ]);
  },
});
