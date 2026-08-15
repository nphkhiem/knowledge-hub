import type { CompiledSceneObject } from "@knowledge-hub/lesson-compiler";
import { definePrimitive } from "../definePrimitive.js";
import { escapeText, formatCoordinate } from "../escapeMarkup.js";
import { LOGICAL_WIDTH, clampTextStart, fitFontSize } from "../geometry.js";
import { renderGroup } from "../renderGroup.js";

/**
 * A pile of named entries drawn bottom up, with only the top reachable.
 *
 * The base sits still and the pile grows toward the label, which is what makes
 * a push and a pop read as the same end moving. The top entry is captioned in
 * words rather than distinguished by color, and the description states the
 * order outright, because the order is the entire subject.
 */
type StackObject = Extract<CompiledSceneObject, { kind: "stack" }>;

/**
 * How many entries the figure reserves room for.
 *
 * Deliberately a renderer constant rather than the schema's `STACK_CAPACITY`,
 * even though the two must agree and a test pins them together. Everything this
 * package imports from the compiler is a type, erased at build; importing a
 * runtime value from there pulls the compiler's whole graph, yaml and the
 * markdown toolchain included, into the browser bundle. It took the script
 * payload from 15 kB to 239 kB and the performance budget caught it.
 */
export const DRAWN_DEPTH = 6;

const ENTRY_HEIGHT = 40;
const COLUMN_WIDTH = 220;
const ENTRY_RADIUS = 6;
const LABEL_FONT_SIZE = 18;
const LABEL_OFFSET_ABOVE_TOP = 112;
const CAPTION_FONT_SIZE = 14;
const CAPTION_GAP = 16;
const BASE_STROKE_WIDTH = 3;

/** The pile hangs from a base that never moves, however deep it gets. */
function baseline(top: number): number {
  return top + DRAWN_DEPTH * ENTRY_HEIGHT;
}

function describeStack(object: StackObject): string {
  if (object.entries.length === 0) {
    return `${object.label}: empty`;
  }
  const topDown = [...object.entries].reverse().join(", ");
  const count = object.entries.length;
  return `${object.label}: ${count} ${count === 1 ? "entry" : "entries"}, top to bottom: ${topDown}`;
}

export const stackPrimitive = definePrimitive("stack", {
  describe: describeStack,

  render: (object, context) => {
    const geometry = context.geometryFor(object.id);
    const base = baseline(geometry.top);
    const left = (LOGICAL_WIDTH - COLUMN_WIDTH) / 2;
    const center = left + COLUMN_WIDTH / 2;
    const entryFontSize = fitFontSize(COLUMN_WIDTH, 18, 10, 0.09);
    const topIndex = object.entries.length - 1;

    const entries = object.entries.map((entry, index) => {
      const y = base - (index + 1) * ENTRY_HEIGHT;
      const isTop = index === topIndex;
      const caption = isTop
        ? [
            `<text x="${formatCoordinate(left + COLUMN_WIDTH + CAPTION_GAP)}"`,
            ` y="${y + ENTRY_HEIGHT / 2 + 5}" text-anchor="start"`,
            ` font-size="${CAPTION_FONT_SIZE}"`,
            ` fill="var(--color-visual-active-text)">top, next out</text>`,
          ].join("")
        : "";

      return [
        `<rect data-entry-index="${index}" x="${formatCoordinate(left)}"`,
        ` y="${formatCoordinate(y)}" width="${COLUMN_WIDTH}"`,
        ` height="${ENTRY_HEIGHT}" rx="${ENTRY_RADIUS}"`,
        ` fill="var(${isTop ? "--color-visual-active-fill" : "--color-visual-object-fill"})"`,
        ` stroke="var(${isTop ? "--color-visual-active-stroke" : "--color-visual-object-stroke"})"`,
        ` stroke-width="var(${isTop ? "--visual-active-stroke-width" : "--visual-object-stroke-width"})"/>`,
        `<text x="${formatCoordinate(center)}"`,
        ` y="${formatCoordinate(y + ENTRY_HEIGHT / 2 + 6)}" text-anchor="middle"`,
        ` font-size="${formatCoordinate(entryFontSize)}"`,
        ` fill="var(--color-visual-object-text)">${escapeText(entry)}</text>`,
        caption,
      ].join("");
    });

    /** An empty pile still shows where entries would land, and says so. */
    const emptyNotice =
      object.entries.length === 0
        ? [
            `<text x="${formatCoordinate(center)}"`,
            ` y="${formatCoordinate(base - ENTRY_HEIGHT / 2)}"`,
            ` text-anchor="middle" font-size="${CAPTION_FONT_SIZE}"`,
            ` fill="var(--color-visual-object-text)">empty</text>`,
          ].join("")
        : "";

    const labelX = clampTextStart(left, object.label, LABEL_FONT_SIZE);

    return renderGroup(object, context, "lesson-stack", describeStack(object), [
      [
        `<text x="${formatCoordinate(labelX)}"`,
        ` y="${formatCoordinate(geometry.top - LABEL_OFFSET_ABOVE_TOP)}"`,
        ` text-anchor="start" font-size="${LABEL_FONT_SIZE}"`,
        ` fill="var(--color-visual-object-text)">${escapeText(object.label)}</text>`,
      ].join(""),
      [
        `<line x1="${formatCoordinate(left)}" y1="${formatCoordinate(base)}"`,
        ` x2="${formatCoordinate(left + COLUMN_WIDTH)}" y2="${formatCoordinate(base)}"`,
        ` stroke="var(--color-visual-object-stroke)"`,
        ` stroke-width="${BASE_STROKE_WIDTH}"/>`,
      ].join(""),
      ...entries,
      emptyNotice,
    ]);
  },
});
