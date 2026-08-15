import type { CompiledSceneObject } from "@knowledge-hub/lesson-compiler";
import { definePrimitive } from "../definePrimitive.js";
import { escapeText, formatCoordinate } from "../escapeMarkup.js";
import { LOGICAL_WIDTH, clampTextStart, fitFontSize } from "../geometry.js";
import { renderGroup } from "../renderGroup.js";

/**
 * A line of named entries drawn left to right, with only the front reachable.
 *
 * Deliberately horizontal where the stack is vertical. The two lessons exist to
 * contrast the ends they serve, and a reader who has just seen a pile should
 * not have to work out from the captions alone that this one behaves the other
 * way round. Both ends are captioned in words, never by position alone.
 */
type QueueObject = Extract<CompiledSceneObject, { kind: "queue" }>;

/**
 * How many entries the figure reserves room for.
 *
 * A renderer constant, pinned to the schema's `QUEUE_CAPACITY` by a test. It is
 * not imported from there: every import this package takes from the compiler is
 * a type, erased at build, and a runtime value pulls the whole compiler graph
 * into the browser bundle. See the same note on the stack primitive.
 */
export const DRAWN_WIDTH = 6;

const ENTRY_WIDTH = 130;
const ENTRY_HEIGHT = 56;
const ENTRY_GAP = 6;
const ENTRY_RADIUS = 6;
const LABEL_FONT_SIZE = 18;
const LABEL_OFFSET_ABOVE_TOP = 112;
const CAPTION_FONT_SIZE = 14;
const CAPTION_DROP = 26;

/** The line starts at a fixed left edge, so arrivals extend it rightward. */
function leftEdge(): number {
  const span = DRAWN_WIDTH * ENTRY_WIDTH + (DRAWN_WIDTH - 1) * ENTRY_GAP;
  return (LOGICAL_WIDTH - span) / 2;
}

function describeQueue(object: QueueObject): string {
  if (object.entries.length === 0) {
    return `${object.label}: empty`;
  }
  const count = object.entries.length;
  return `${object.label}: ${count} ${count === 1 ? "entry" : "entries"}, front to back: ${object.entries.join(", ")}`;
}

export const queuePrimitive = definePrimitive("queue", {
  describe: describeQueue,

  render: (object, context) => {
    const geometry = context.geometryFor(object.id);
    const left = leftEdge();
    const top = geometry.top;
    const entryFontSize = fitFontSize(ENTRY_WIDTH, 18, 10, 0.14);
    const backIndex = object.entries.length - 1;

    const entries = object.entries.map((entry, index) => {
      const x = left + index * (ENTRY_WIDTH + ENTRY_GAP);
      const center = x + ENTRY_WIDTH / 2;
      const isFront = index === 0;
      const isBack = index === backIndex;
      const caption = isFront ? "front, next out" : isBack ? "back" : "";

      return [
        `<rect data-entry-index="${index}" x="${formatCoordinate(x)}"`,
        ` y="${formatCoordinate(top)}" width="${ENTRY_WIDTH}"`,
        ` height="${ENTRY_HEIGHT}" rx="${ENTRY_RADIUS}"`,
        ` fill="var(${isFront ? "--color-visual-active-fill" : "--color-visual-object-fill"})"`,
        ` stroke="var(${isFront ? "--color-visual-active-stroke" : "--color-visual-object-stroke"})"`,
        ` stroke-width="var(${isFront ? "--visual-active-stroke-width" : "--visual-object-stroke-width"})"/>`,
        `<text x="${formatCoordinate(center)}"`,
        ` y="${formatCoordinate(top + ENTRY_HEIGHT / 2 + 6)}" text-anchor="middle"`,
        ` font-size="${formatCoordinate(entryFontSize)}"`,
        ` fill="var(--color-visual-object-text)">${escapeText(entry)}</text>`,
        caption === ""
          ? ""
          : [
              `<text x="${formatCoordinate(center)}"`,
              ` y="${formatCoordinate(top + ENTRY_HEIGHT + CAPTION_DROP)}"`,
              ` text-anchor="middle" font-size="${CAPTION_FONT_SIZE}"`,
              ` fill="var(${isFront ? "--color-visual-active-text" : "--color-visual-object-text"})">${caption}</text>`,
            ].join(""),
      ].join("");
    });

    /** An empty line still shows where an arrival would land, and says so. */
    const emptyNotice =
      object.entries.length === 0
        ? [
            `<text x="${formatCoordinate(left + ENTRY_WIDTH / 2)}"`,
            ` y="${formatCoordinate(top + ENTRY_HEIGHT / 2 + 6)}"`,
            ` text-anchor="middle" font-size="${CAPTION_FONT_SIZE}"`,
            ` fill="var(--color-visual-object-text)">empty</text>`,
          ].join("")
        : "";

    const labelX = clampTextStart(left, object.label, LABEL_FONT_SIZE);

    return renderGroup(object, context, "lesson-queue", describeQueue(object), [
      [
        `<text x="${formatCoordinate(labelX)}"`,
        ` y="${formatCoordinate(top - LABEL_OFFSET_ABOVE_TOP)}"`,
        ` text-anchor="start" font-size="${LABEL_FONT_SIZE}"`,
        ` fill="var(--color-visual-object-text)">${escapeText(object.label)}</text>`,
      ].join(""),
      ...entries,
      emptyNotice,
    ]);
  },
});
