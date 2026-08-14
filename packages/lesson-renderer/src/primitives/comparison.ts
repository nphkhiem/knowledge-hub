import { definePrimitive } from "../definePrimitive.js";
import { asSafeMarkup, escapeText, formatCoordinate } from "../escapeMarkup.js";
import { LOGICAL_WIDTH, clampTextCenter } from "../geometry.js";
import { renderGroup } from "../renderGroup.js";
import {
  currentComparison,
  relationPhrase,
  type CurrentComparison,
} from "../scene.js";
import type { PrimitiveRenderContext } from "../types.js";

const GLYPH_BASELINE = 340;
const GLYPH_FONT_SIZE = 26;
const TEXT_BASELINE = 364;
const TEXT_FONT_SIZE = 18;

const relationGlyphs: Readonly<Record<CurrentComparison["relation"], string>> =
  {
    equal: "=",
    greater: ">",
    less: "<",
  };

function describeComparison(context: PrimitiveRenderContext): string {
  const comparison = currentComparison(context.snapshot);
  if (comparison === undefined) return "";
  // A pair states a sum. A single probed value states itself.
  const subject =
    comparison.rightLabel === undefined
      ? `Value ${comparison.actual}`
      : `Sum ${comparison.actual}`;
  return [
    `${subject} is ${relationPhrase(comparison.relation)}`,
    ` target ${comparison.target}`,
  ].join("");
}

export const comparisonPrimitive = definePrimitive("comparison", {
  describe: (_object, context) => describeComparison(context),

  render: (object, context) => {
    const comparison = currentComparison(context.snapshot);
    if (comparison === undefined) return asSafeMarkup("");

    const description = describeComparison(context);
    const center = LOGICAL_WIDTH / 2;
    const glyph = relationGlyphs[comparison.relation];

    return renderGroup(object, context, "lesson-comparison", description, [
      [
        `<text x="${formatCoordinate(clampTextCenter(center, glyph, GLYPH_FONT_SIZE))}"`,
        ` y="${GLYPH_BASELINE}" text-anchor="middle" font-size="${GLYPH_FONT_SIZE}"`,
        ` fill="var(--color-visual-compare-stroke)">${escapeText(glyph)}</text>`,
      ].join(""),
      [
        `<text x="${formatCoordinate(clampTextCenter(center, description, TEXT_FONT_SIZE))}"`,
        ` y="${TEXT_BASELINE}" text-anchor="middle" font-size="${TEXT_FONT_SIZE}"`,
        ` fill="var(--color-visual-object-text)">${escapeText(description)}</text>`,
      ].join(""),
    ]);
  },
});
