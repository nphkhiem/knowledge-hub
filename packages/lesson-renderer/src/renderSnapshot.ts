import type {
  CompiledSceneObject,
  SemanticSnapshot,
} from "@knowledge-hub/lesson-compiler";
import { describeSnapshot } from "./describeSnapshot.js";
import { asSafeMarkup, escapeId, escapeText } from "./escapeMarkup.js";
import {
  logicalHeightFor,
  LOGICAL_WIDTH,
  createRenderContext,
} from "./geometry.js";
import { arrayPrimitive } from "./primitives/array.js";
import { comparisonPrimitive } from "./primitives/comparison.js";
import { labelPrimitive } from "./primitives/label.js";
import { pointerPrimitive } from "./primitives/pointer.js";
import { resultPrimitive } from "./primitives/result.js";
import type {
  PrimitiveContract,
  PrimitivePresentation,
  RenderedSnapshot,
} from "./types.js";

export const primitiveContracts: Readonly<
  Record<CompiledSceneObject["kind"], PrimitiveContract>
> = {
  array: arrayPrimitive,
  comparison: comparisonPrimitive,
  label: labelPrimitive,
  pointer: pointerPrimitive,
  result: resultPrimitive,
};

export function renderView(
  snapshot: SemanticSnapshot,
  presentation: PrimitivePresentation,
): RenderedSnapshot {
  const context = createRenderContext(snapshot, presentation);
  const logicalHeight = logicalHeightFor(context.rowCount);
  const description = describeSnapshot(snapshot);
  const titleId = `snapshot-${escapeId(snapshot.stepId)}-title`;
  const objects = snapshot.objects.map((object) =>
    primitiveContracts[object.kind].render(object, context),
  );

  return {
    description,
    logicalHeight,
    logicalWidth: LOGICAL_WIDTH,
    markup: asSafeMarkup(
      [
        `<svg viewBox="0 0 ${LOGICAL_WIDTH} ${logicalHeight}" role="img"`,
        ` aria-labelledby="${titleId}">`,
        `<title id="${titleId}">${escapeText(description)}</title>`,
        ...objects,
        "</svg>",
      ].join(""),
    ),
  };
}

/** The live figure the Visual Brief mounts, with per-object hooks. */
export function renderSnapshot(snapshot: SemanticSnapshot): RenderedSnapshot {
  return renderView(snapshot, "interactive");
}
