import type { SafeMarkup } from "./types.js";

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
