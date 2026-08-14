import type { CompiledSceneObject } from "@knowledge-hub/lesson-compiler";
import { definePrimitive } from "../definePrimitive.js";
import { escapeText, formatCoordinate } from "../escapeMarkup.js";
import { clampTextCenter } from "../geometry.js";
import { renderGroup } from "../renderGroup.js";
import { findArrayObjectById } from "../scene.js";
import type { ArrayGeometry, PrimitiveRenderContext } from "../types.js";

/**
 * A frame around an inclusive range of one array's cells.
 *
 * The frame is drawn outside the cells rather than filling them, so a window
 * and a highlight can occupy the same cell and still read as two separate
 * statements. Its label names the covered indices and their values in text,
 * because a reader who cannot see the frame must still learn what it covers.
 */
type WindowObject = Extract<CompiledSceneObject, { kind: "window" }>;

/** How far the frame sits outside the cells it covers. */
const FRAME_INSET = 8;
const FRAME_RADIUS = 10;
const LABEL_FONT_SIZE = 16;
/**
 * The label sits between the array's own label, 112 above the row, and the text
 * of a pointer above it, 48 above the row, so all three can coexist.
 */
const LABEL_OFFSET_ABOVE_TOP = 80;
/**
 * Past this many cells a read-aloud list of values stops being comprehensible,
 * and the count carries the meaning instead. It also keeps the drawn label
 * inside the figure at every array length.
 */
const MOST_LISTED_VALUES = 6;

function describeWindow(
  object: WindowObject,
  context: PrimitiveRenderContext,
): string {
  const width = object.end - object.start + 1;
  const range = `${object.label}: covers ${width === 1 ? "index" : "indices"} ${object.start} to ${object.end}`;
  const array = findArrayObjectById(context.snapshot, object.targetObjectId);
  const covered = array?.values.slice(object.start, object.end + 1) ?? [];

  if (covered.length === 0) return range;
  return covered.length <= MOST_LISTED_VALUES
    ? `${range}, ${covered.length === 1 ? "value" : "values"} ${covered.join(", ")}`
    : `${range}, ${covered.length} values`;
}

function frameFor(object: WindowObject, geometry: ArrayGeometry) {
  const width = object.end - object.start + 1;
  return {
    x: geometry.left + object.start * geometry.cellWidth - FRAME_INSET,
    y: geometry.top - FRAME_INSET,
    width: width * geometry.cellWidth + FRAME_INSET * 2,
    height: geometry.height + FRAME_INSET * 2,
  };
}

export const windowPrimitive = definePrimitive("window", {
  describe: describeWindow,

  render: (object, context) => {
    // The band belongs to the array this window covers, not to the first.
    const geometry = context.geometryFor(object.targetObjectId);
    const frame = frameFor(object, geometry);
    const description = describeWindow(object, context);
    const center = frame.x + frame.width / 2;
    const textCenter = clampTextCenter(center, description, LABEL_FONT_SIZE);

    return renderGroup(object, context, "lesson-window", description, [
      [
        `<rect data-window-start="${object.start}" data-window-end="${object.end}"`,
        ` x="${formatCoordinate(frame.x)}" y="${formatCoordinate(frame.y)}"`,
        ` width="${formatCoordinate(frame.width)}" height="${formatCoordinate(frame.height)}"`,
        ` rx="${FRAME_RADIUS}" fill="none"`,
        ` stroke="var(--color-visual-active-stroke)"`,
        ` stroke-width="var(--visual-active-stroke-width)"/>`,
      ].join(""),
      [
        `<text x="${formatCoordinate(textCenter)}"`,
        ` y="${geometry.top - LABEL_OFFSET_ABOVE_TOP}" text-anchor="middle"`,
        ` font-size="${LABEL_FONT_SIZE}"`,
        ` fill="var(--color-visual-active-text)">${escapeText(description)}</text>`,
      ].join(""),
    ]);
  },
});
