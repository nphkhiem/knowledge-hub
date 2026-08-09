import type { CompiledSceneObject } from "@knowledge-hub/lesson-compiler";
import { asSafeMarkup, escapeAttribute, escapeText } from "./escapeMarkup.js";
import type { PrimitiveRenderContext, SafeMarkup } from "./types.js";

/**
 * Wraps one primitive's shapes in a named group. Interactive figures carry the
 * object hook the site controller targets; static steps carry none.
 */
export function renderGroup(
  object: CompiledSceneObject,
  context: PrimitiveRenderContext,
  className: string,
  description: string,
  children: readonly string[],
): SafeMarkup {
  const hook =
    context.presentation === "interactive"
      ? ` data-object-id="${escapeAttribute(object.id)}"`
      : "";

  return asSafeMarkup(
    `<g class="${className}"${hook}><title>${escapeText(description)}</title>${children.join("")}</g>`,
  );
}
