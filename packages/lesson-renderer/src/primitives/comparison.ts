import type { CompiledSceneObject } from "@knowledge-hub/lesson-compiler";
import {
  asSafeMarkup,
  escapeText,
  formatCoordinate,
  renderGroup,
} from "../escapeMarkup.js";
import {
  LOGICAL_WIDTH,
  currentComparison,
  relationPhrase,
  type CurrentComparison,
} from "../scene.js";
import type {
  PrimitiveContract,
  PrimitiveRenderContext,
  SafeMarkup,
} from "../types.js";

const GLYPH_BASELINE = 340;
const TEXT_BASELINE = 364;

const relationGlyphs: Readonly<Record<CurrentComparison["relation"], string>> =
  {
    equal: "=",
    greater: ">",
    less: "<",
  };

function accepts(object: CompiledSceneObject): boolean {
  return object.kind === "comparison";
}

function describe(
  object: CompiledSceneObject,
  context: PrimitiveRenderContext,
): string {
  if (object.kind !== "comparison") return "";

  const comparison = currentComparison(context.snapshot);
  if (comparison === undefined) return "";
  return `Sum ${comparison.actual} is ${relationPhrase(comparison.relation)} target ${comparison.target}`;
}

function render(
  object: CompiledSceneObject,
  context: PrimitiveRenderContext,
): SafeMarkup {
  if (object.kind !== "comparison" || !object.visible) return asSafeMarkup("");

  const comparison = currentComparison(context.snapshot);
  if (comparison === undefined) return asSafeMarkup("");

  const center = formatCoordinate(LOGICAL_WIDTH / 2);
  const description = describe(object, context);

  return renderGroup(object, context, "lesson-comparison", description, [
    [
      `<text x="${center}" y="${GLYPH_BASELINE}" text-anchor="middle" font-size="26"`,
      ` fill="var(--color-visual-compare-stroke)">`,
      `${escapeText(relationGlyphs[comparison.relation])}</text>`,
    ].join(""),
    [
      `<text x="${center}" y="${TEXT_BASELINE}" text-anchor="middle" font-size="18"`,
      ` fill="var(--color-visual-object-text)">${escapeText(description)}</text>`,
    ].join(""),
  ]);
}

export const comparisonPrimitive: PrimitiveContract = {
  accepts,
  describe,
  kind: "comparison",
  render,
};
