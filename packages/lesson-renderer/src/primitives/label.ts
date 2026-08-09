import type { CompiledSceneObject } from "@knowledge-hub/lesson-compiler";
import {
  asSafeMarkup,
  escapeText,
  formatCoordinate,
  renderGroup,
} from "../escapeMarkup.js";
import { LOGICAL_WIDTH, ordinalAmongKind } from "../scene.js";
import type {
  PrimitiveContract,
  PrimitiveRenderContext,
  SafeMarkup,
} from "../types.js";

const RIGHT_MARGIN = 60;
const FIRST_BASELINE = 48;
const LINE_HEIGHT = 30;

function accepts(object: CompiledSceneObject): boolean {
  return object.kind === "label";
}

function describe(object: CompiledSceneObject): string {
  return object.kind === "label" ? object.text : "";
}

function render(
  object: CompiledSceneObject,
  context: PrimitiveRenderContext,
): SafeMarkup {
  if (object.kind !== "label" || !object.visible) return asSafeMarkup("");

  const baseline =
    FIRST_BASELINE + ordinalAmongKind(context.snapshot, object) * LINE_HEIGHT;

  return renderGroup(object, context, "lesson-label", object.text, [
    [
      `<text x="${formatCoordinate(LOGICAL_WIDTH - RIGHT_MARGIN)}" y="${baseline}"`,
      ` text-anchor="end" font-size="18" fill="var(--color-visual-object-text)">`,
      `${escapeText(object.text)}</text>`,
    ].join(""),
  ]);
}

export const labelPrimitive: PrimitiveContract = {
  accepts,
  describe,
  kind: "label",
  render,
};
