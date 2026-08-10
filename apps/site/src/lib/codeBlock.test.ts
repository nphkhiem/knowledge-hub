import { expect, test } from "vitest";
import { renderCodeBlock } from "./codeBlock";

test("preserves the sample exactly, with no leading whitespace of its own", () => {
  const code = "def f(values):\n    return values[0]\n";

  expect(renderCodeBlock(code)).toBe(
    "<code>def f(values):\n    return values[0]</code>",
  );
});

test("escapes markup so a sample cannot break out of its block", () => {
  expect(renderCodeBlock('if (a < b && c > d) return "</pre>";')).toBe(
    '<code>if (a &lt; b &amp;&amp; c &gt; d) return "&lt;/pre&gt;";</code>',
  );
});

test("keeps internal indentation untouched", () => {
  const nested = "class A:\n    def b(self):\n        return 1";

  expect(renderCodeBlock(nested)).toContain("\n        return 1");
});
