import type { CompiledSceneObject } from "@knowledge-hub/lesson-compiler";
import { definePrimitive } from "../definePrimitive.js";
import { escapeText, formatCoordinate } from "../escapeMarkup.js";
import { cellCenter, clampTextCenter } from "../geometry.js";
import type { ArrayGeometry } from "../types.js";
import { renderGroup } from "../renderGroup.js";
import { ordinalAmongKind, pointerIndex, pointerValue } from "../scene.js";
import type { PrimitiveRenderContext } from "../types.js";

type PointerObject = Extract<CompiledSceneObject, { kind: "pointer" }>;

const TEXT_FONT_SIZE = 16;
const MARKER_HALF_WIDTH = 9;
/**
 * Marker slots are measured from the array the pointer targets rather than from
 * a module constant, so a pointer into a second array follows that array down
 * the figure instead of drawing over the first one.
 */
function slotsFor(geometry: ArrayGeometry) {
  const top = geometry.top;
  const bottom = geometry.top + geometry.height;
  return {
    above: {
      apex: top - 2,
      base: top - 14,
      lineEnd: top - 40,
      textBaseline: top - 48,
    },
    below: {
      apex: bottom + 2,
      base: bottom + 14,
      lineEnd: bottom + 40,
      textBaseline: bottom + 64,
    },
  } as const;
}

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

function renderMarker(
  center: number,
  band: "above" | "below",
  geometry: ArrayGeometry,
): string {
  const x = formatCoordinate(center);
  const left = formatCoordinate(center - MARKER_HALF_WIDTH);
  const right = formatCoordinate(center + MARKER_HALF_WIDTH);
  const stroke = [
    `stroke="var(--color-visual-active-stroke)"`,
    ` stroke-width="var(--visual-active-stroke-width)"`,
  ].join("");
  const slot = slotsFor(geometry)[band];

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
    // The band belongs to the array this pointer targets, not to the first.
    const geometry = context.geometryFor(object.targetObjectId);
    const center = cellCenter(geometry, pointerIndex(context.snapshot, object));
    const description = describePointer(object, context);
    const textBaseline = slotsFor(geometry)[band].textBaseline;
    const textCenter = clampTextCenter(center, description, TEXT_FONT_SIZE);

    return renderGroup(object, context, "lesson-pointer", description, [
      renderMarker(center, band, geometry),
      [
        `<text x="${formatCoordinate(textCenter)}" y="${textBaseline}"`,
        ` text-anchor="middle" font-size="${TEXT_FONT_SIZE}"`,
        ` fill="var(--color-visual-active-text)">${escapeText(description)}</text>`,
      ].join(""),
    ]);
  },
});
