import type { CompiledSceneObject } from "@knowledge-hub/lesson-compiler";
import {
  asSafeMarkup,
  escapeText,
  formatCoordinate,
  renderGroup,
} from "../escapeMarkup.js";
import { LOGICAL_WIDTH } from "../scene.js";
import type {
  PrimitiveContract,
  PrimitiveRenderContext,
  SafeMarkup,
} from "../types.js";

const CHIP_WIDTH = 420;
const CHIP_HEIGHT = 40;
const TEXT_BASELINE = 404;
const CHIP_TOP = TEXT_BASELINE - 28;
const CHIP_RADIUS = 8;

function accepts(object: CompiledSceneObject): boolean {
  return object.kind === "result";
}

function describe(
  object: CompiledSceneObject,
  context: PrimitiveRenderContext,
): string {
  if (object.kind !== "result" || object.status === "pending") return "";

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

function render(
  object: CompiledSceneObject,
  context: PrimitiveRenderContext,
): SafeMarkup {
  if (object.kind !== "result" || !object.visible) return asSafeMarkup("");

  const description = describe(object, context);
  if (description === "") return asSafeMarkup("");

  /** Found and unresolved outcomes differ by stroke pattern, not color alone. */
  const found = object.status === "found";
  const palette = found ? "success" : "error";
  const dash = found ? "" : ` stroke-dasharray="6 4"`;

  return renderGroup(object, context, "lesson-result", description, [
    [
      `<rect x="${formatCoordinate((LOGICAL_WIDTH - CHIP_WIDTH) / 2)}" y="${CHIP_TOP}"`,
      ` width="${CHIP_WIDTH}" height="${CHIP_HEIGHT}" rx="${CHIP_RADIUS}"`,
      ` fill="var(--color-visual-${palette}-fill)" stroke="var(--color-visual-${palette}-stroke)"`,
      ` stroke-width="var(--visual-active-stroke-width)"${dash}/>`,
    ].join(""),
    [
      `<text x="${formatCoordinate(LOGICAL_WIDTH / 2)}" y="${TEXT_BASELINE}"`,
      ` text-anchor="middle" font-size="18" font-weight="600"`,
      ` fill="var(--color-visual-object-text)">${escapeText(description)}</text>`,
    ].join(""),
  ]);
}

export const resultPrimitive: PrimitiveContract = {
  accepts,
  describe,
  kind: "result",
  render,
};
