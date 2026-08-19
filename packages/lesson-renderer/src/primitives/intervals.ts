import type { CompiledSceneObject } from "@knowledge-hub/lesson-compiler";
import { definePrimitive } from "../definePrimitive.js";
import { escapeText, formatCoordinate } from "../escapeMarkup.js";
import { LOGICAL_WIDTH, clampTextStart } from "../geometry.js";
import { renderGroup } from "../renderGroup.js";

/**
 * Ranges on a shared axis, each drawn on its own row.
 *
 * The separate rows are the entire reason this is not a set of windows. A
 * window draws at one fixed height with its label at one fixed offset, so two
 * of them over one array collide precisely where the ranges overlap, which is
 * the case an interval lesson exists to show. Here overlap is visible because
 * the bars are stacked and their spans line up against a common axis.
 */
type IntervalsObject = Extract<CompiledSceneObject, { kind: "intervals" }>;

/**
 * How many rows the figure reserves room for.
 *
 * A renderer constant pinned to the schema's INTERVAL_CAPACITY by a test, not
 * imported from it: every import this package takes from the compiler is a
 * type, erased at build, and a runtime value pulls the compiler's whole graph
 * into the browser bundle. See the same note on the stack primitive.
 */
export const DRAWN_ROWS = 6;

const ROW_HEIGHT = 34;
const BAR_HEIGHT = 20;
const AXIS_INSET = 70;
const BAR_RADIUS = 4;
const LABEL_FONT_SIZE = 18;
const LABEL_OFFSET_ABOVE_TOP = 112;
const CAPTION_FONT_SIZE = 13;

function describeIntervals(object: IntervalsObject): string {
  if (object.entries.length === 0) {
    return `${object.label}: nothing left`;
  }
  const spans = object.entries
    .map((entry) => `${entry.start} to ${entry.end}`)
    .join(", ");
  const count = object.entries.length;
  return `${object.label}: ${count} ${count === 1 ? "interval" : "intervals"}, ${spans}`;
}

export const intervalsPrimitive = definePrimitive("intervals", {
  describe: describeIntervals,

  render: (object, context) => {
    const geometry = context.geometryFor(object.id);
    const top = geometry.top;
    const left = AXIS_INSET;
    const usable = LOGICAL_WIDTH - AXIS_INSET * 2;
    const unit = object.span > 0 ? usable / object.span : usable;

    const axis = [
      `<line x1="${formatCoordinate(left)}" y1="${formatCoordinate(top - 12)}"`,
      ` x2="${formatCoordinate(left + usable)}" y2="${formatCoordinate(top - 12)}"`,
      ` stroke="var(--color-visual-object-stroke)" stroke-width="2"/>`,
    ].join("");

    const bars = object.entries.map((entry, index) => {
      const y = top + index * ROW_HEIGHT;
      const x = left + entry.start * unit;
      // An interval covering a single unit still needs to be visible, so the
      // width has a floor rather than collapsing to nothing.
      const width = Math.max((entry.end - entry.start) * unit, 6);
      const caption = `${entry.start} to ${entry.end}`;

      return [
        `<rect data-interval-index="${index}" x="${formatCoordinate(x)}"`,
        ` y="${formatCoordinate(y)}" width="${formatCoordinate(width)}"`,
        ` height="${BAR_HEIGHT}" rx="${BAR_RADIUS}"`,
        ` fill="var(--color-visual-active-fill)"`,
        ` stroke="var(--color-visual-active-stroke)"`,
        ` stroke-width="var(--visual-active-stroke-width)"/>`,
        `<text x="${formatCoordinate(x + width + 8)}"`,
        ` y="${formatCoordinate(y + BAR_HEIGHT - 5)}" text-anchor="start"`,
        ` font-size="${CAPTION_FONT_SIZE}"`,
        ` fill="var(--color-visual-object-text)">${escapeText(caption)}</text>`,
      ].join("");
    });

    /** An empty figure still says so rather than drawing a bare axis. */
    const emptyNotice =
      object.entries.length === 0
        ? [
            `<text x="${formatCoordinate(left)}"`,
            ` y="${formatCoordinate(top + BAR_HEIGHT)}" text-anchor="start"`,
            ` font-size="${CAPTION_FONT_SIZE}"`,
            ` fill="var(--color-visual-object-text)">nothing left</text>`,
          ].join("")
        : "";

    const labelX = clampTextStart(left, object.label, LABEL_FONT_SIZE);

    return renderGroup(
      object,
      context,
      "lesson-intervals",
      describeIntervals(object),
      [
        [
          `<text x="${formatCoordinate(labelX)}"`,
          ` y="${formatCoordinate(top - LABEL_OFFSET_ABOVE_TOP)}"`,
          ` text-anchor="start" font-size="${LABEL_FONT_SIZE}"`,
          ` fill="var(--color-visual-object-text)">${escapeText(object.label)}</text>`,
        ].join(""),
        axis,
        ...bars,
        emptyNotice,
      ],
    );
  },
});
