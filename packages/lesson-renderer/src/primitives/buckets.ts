import type { CompiledSceneObject } from "@knowledge-hub/lesson-compiler";
import { definePrimitive } from "../definePrimitive.js";
import { escapeText, formatCoordinate } from "../escapeMarkup.js";
import {
  ARRAY_HEIGHT,
  LOGICAL_WIDTH,
  clampTextStart,
  fitFontSize,
} from "../geometry.js";
import { renderGroup } from "../renderGroup.js";
import { emphasizedCell, plainCell } from "./array.js";

const HORIZONTAL_PADDING = 60;
const LABEL_OFFSET_ABOVE_TOP = 112;
const SLOT_RADIUS = 6;
const LABEL_FONT_SIZE = 18;
const INDEX_OFFSET = 20;
const FIRST_ENTRY_OFFSET = 48;
const ENTRY_LINE_HEIGHT = 24;

/**
 * A row of slots holding named entries.
 *
 * Buckets borrow the array band rather than inventing their own vertical
 * system, so a figure mixing the two lines them up. Entries stack downward
 * inside a slot, which is what makes a collision visible: two keys in one slot
 * read as two lines in one box rather than as a color.
 */
type BucketsObject = Extract<CompiledSceneObject, { kind: "buckets" }>;

function describeBuckets(object: BucketsObject): string {
  const filled = object.entries.length;
  const occupied = new Set(object.entries.map((entry) => entry.slot)).size;
  const collisions = filled - occupied;

  const shape =
    collisions > 0
      ? `, ${collisions} sharing a slot with another key`
      : ", none sharing a slot";

  return `${object.label}: ${filled} ${filled === 1 ? "key" : "keys"} across ${object.slotCount} slots${filled > 0 ? shape : ""}`;
}

export const bucketsPrimitive = definePrimitive("buckets", {
  describe: describeBuckets,

  render: (object, context) => {
    const geometry = context.geometryFor(object.id);
    const available = LOGICAL_WIDTH - HORIZONTAL_PADDING * 2;
    const slotWidth = available / object.slotCount;
    const left = (LOGICAL_WIDTH - slotWidth * object.slotCount) / 2;
    const highlighted = new Set(context.snapshot.highlights[object.id] ?? []);
    const keyFontSize = fitFontSize(slotWidth, 16, 8, 0.22);
    const indexFontSize = fitFontSize(slotWidth, 14, 7, 0.2);

    const slots = Array.from({ length: object.slotCount }, (_, slot) => {
      const appearance = highlighted.has(slot) ? emphasizedCell : plainCell;
      const x = left + slot * slotWidth;
      const center = x + slotWidth / 2;
      const held = object.entries.filter((entry) => entry.slot === slot);

      const keys = held.map((entry, line) =>
        [
          `<text x="${formatCoordinate(center)}"`,
          ` y="${geometry.top + FIRST_ENTRY_OFFSET + line * ENTRY_LINE_HEIGHT}"`,
          ` text-anchor="middle" font-size="${formatCoordinate(keyFontSize)}"`,
          ` fill="var(--color-visual-object-text)">${escapeText(entry.key)}</text>`,
        ].join(""),
      );

      return [
        `<rect data-slot-index="${slot}" x="${formatCoordinate(x)}"`,
        ` y="${geometry.top}" width="${formatCoordinate(slotWidth)}"`,
        ` height="${ARRAY_HEIGHT}" rx="${SLOT_RADIUS}"`,
        ` fill="var(${appearance.fill})" stroke="var(${appearance.stroke})"`,
        ` stroke-width="var(${appearance.strokeWidth})"/>`,
        `<text x="${formatCoordinate(center)}"`,
        ` y="${geometry.top + INDEX_OFFSET}" text-anchor="middle"`,
        ` font-size="${formatCoordinate(indexFontSize)}"`,
        ` fill="var(--color-visual-object-text)">${slot}</text>`,
        ...keys,
      ].join("");
    });

    const labelX = clampTextStart(left, object.label, LABEL_FONT_SIZE);

    return renderGroup(
      object,
      context,
      "lesson-buckets",
      describeBuckets(object),
      [
        [
          `<text x="${formatCoordinate(labelX)}"`,
          ` y="${geometry.top - LABEL_OFFSET_ABOVE_TOP}" text-anchor="start"`,
          ` font-size="${LABEL_FONT_SIZE}"`,
          ` fill="var(--color-visual-object-text)">${escapeText(object.label)}</text>`,
        ].join(""),
        ...slots,
      ],
    );
  },
});
