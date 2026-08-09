import type { CompiledSceneObject } from "@knowledge-hub/lesson-compiler";
import { definePrimitive } from "../definePrimitive.js";
import { asSafeMarkup, escapeText, formatCoordinate } from "../escapeMarkup.js";
import { LOGICAL_WIDTH, clampTextCenter } from "../geometry.js";
import { renderGroup } from "../renderGroup.js";
import type { PrimitiveRenderContext } from "../types.js";

type ResultObject = Extract<CompiledSceneObject, { kind: "result" }>;

const CHIP_WIDTH = 420;
const CHIP_HEIGHT = 40;
const TEXT_BASELINE = 404;
const TEXT_FONT_SIZE = 18;
const CHIP_TOP = TEXT_BASELINE - 28;
const CHIP_RADIUS = 8;

function describeResult(
  object: ResultObject,
  context: PrimitiveRenderContext,
): string {
  if (object.status === "pending") return "";

  const result = context.snapshot.result;
  if (result?.kind === "found") {
    const [first, second] = result.indices;
    return `Pair found at indices ${first} and ${second}`;
  }
  if (result?.kind === "not-found" || object.status === "not-found") {
    return "No pair found";
  }
  return "Pair found";
}

export const resultPrimitive = definePrimitive("result", {
  describe: describeResult,

  render: (object, context) => {
    const description = describeResult(object, context);
    if (description === "") return asSafeMarkup("");

    /** Found and unresolved outcomes differ by stroke pattern, not color alone. */
    const found = object.status === "found";
    const palette = found ? "success" : "error";
    const dash = found ? "" : ` stroke-dasharray="6 4"`;
    const center = LOGICAL_WIDTH / 2;

    return renderGroup(object, context, "lesson-result", description, [
      [
        `<rect x="${formatCoordinate((LOGICAL_WIDTH - CHIP_WIDTH) / 2)}" y="${CHIP_TOP}"`,
        ` width="${CHIP_WIDTH}" height="${CHIP_HEIGHT}" rx="${CHIP_RADIUS}"`,
        ` fill="var(--color-visual-${palette}-fill)"`,
        ` stroke="var(--color-visual-${palette}-stroke)"`,
        ` stroke-width="var(--visual-active-stroke-width)"${dash}/>`,
      ].join(""),
      [
        `<text x="${formatCoordinate(clampTextCenter(center, description, TEXT_FONT_SIZE))}"`,
        ` y="${TEXT_BASELINE}" text-anchor="middle" font-size="${TEXT_FONT_SIZE}"`,
        ` font-weight="600" fill="var(--color-visual-object-text)">`,
        `${escapeText(description)}</text>`,
      ].join(""),
    ]);
  },
});
