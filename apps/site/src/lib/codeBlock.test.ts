import { expect, test } from "vitest";
import { renderCodeBlock } from "./codeBlock";

test("preserves the sample exactly, with no leading whitespace of its own", () => {
  const code = "def f(values):\n    return values[0]\n";

  expect(renderCodeBlock(code, "python")).toBe(
    '<code><span class="tok-keyword">def</span> f(values):\n    <span class="tok-keyword">return</span> values[<span class="tok-number">0</span>]</code>',
  );
});

test("escapes markup so a sample cannot break out of its block", () => {
  expect(
    renderCodeBlock('if (a < b && c > d) return "</pre>";', "typescript"),
  ).toBe(
    '<code><span class="tok-keyword">if</span> (a &lt; b &amp;&amp; c &gt; d) <span class="tok-keyword">return</span> <span class="tok-string">"&lt;/pre&gt;"</span>;</code>',
  );
});

test("keeps internal indentation untouched", () => {
  const nested = "class A:\n    def b(self):\n        return 1";

  expect(renderCodeBlock(nested, "python")).toContain(
    '\n        <span class="tok-keyword">return</span> <span class="tok-number">1</span>',
  );
});
