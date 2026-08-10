/**
 * Builds the inner markup of a `<pre>` code block.
 *
 * The element is written as a single self-closing `<pre set:html>` so no source
 * formatter can insert indentation inside it. Whitespace between `<pre>` and
 * `<code>` is significant and would appear in the rendered sample.
 */
export function renderCodeBlock(code: string): string {
  const escaped = code
    .trimEnd()
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
  return `<code>${escaped}</code>`;
}
