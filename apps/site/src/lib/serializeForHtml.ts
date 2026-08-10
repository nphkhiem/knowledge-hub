const LINE_SEPARATOR = "\u2028";
const PARAGRAPH_SEPARATOR = "\u2029";

/**
 * Serializes a value for embedding in a `<script type="application/json">`
 * block. Angle brackets and ampersands are escaped so the text can never end
 * the surrounding element or introduce markup, and the two Unicode line
 * separators are escaped because a JavaScript parser treats them as newlines
 * even though JSON allows them unescaped inside a string.
 */
export function serializeForHtml(value: unknown): string {
  return JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026")
    .replaceAll(LINE_SEPARATOR, "\\u2028")
    .replaceAll(PARAGRAPH_SEPARATOR, "\\u2029");
}
