import type { CompiledSceneObject } from "@knowledge-hub/lesson-compiler";
import type { PrimitiveRenderContext, SafeMarkup } from "./types.js";

const textEscapes: Readonly<Record<string, string>> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/** Escapes lesson text for a character-data or attribute position. */
export function escapeText(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) => textEscapes[character] ?? character,
  );
}

export function escapeAttribute(value: string): string {
  return escapeText(value);
}

/** Reduces lesson identifiers to characters that are safe as fragment targets. */
export function escapeId(value: string): string {
  return value.replace(/[^A-Za-z0-9_-]+/g, "-");
}

/** Only serializers in this package may promote a string to SafeMarkup. */
export function asSafeMarkup(value: string): SafeMarkup {
  return value as SafeMarkup;
}

export function formatCoordinate(value: number): string {
  return Number.isFinite(value) ? String(Number(value.toFixed(2))) : "0";
}

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
