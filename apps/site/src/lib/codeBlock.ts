import type { CompiledExample } from "@knowledge-hub/lesson-compiler";
import { highlightSyntax } from "./syntaxHighlight";

type ExampleLanguage = CompiledExample["language"];

/**
 * Builds the inner markup of a `<pre>` code block.
 *
 * The element is written as a single self-closing `<pre set:html>` so no source
 * formatter can insert indentation inside it. Whitespace between `<pre>` and
 * `<code>` is significant and would appear in the rendered sample.
 */
export function renderCodeBlock(
  code: string,
  language: ExampleLanguage,
): string {
  return `<code>${highlightSyntax(code.trimEnd(), language)}</code>`;
}
