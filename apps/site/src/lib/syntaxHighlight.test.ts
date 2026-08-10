import { expect, test } from "vitest";
import { highlightSyntax } from "./syntaxHighlight";

/**
 * Returns the fragments NOT found in `html`, so a failure names exactly
 * which token was mis-highlighted instead of collapsing to a bare boolean.
 */
function missingFragments(
  html: string,
  expected: readonly string[],
): readonly string[] {
  return expected.filter((fragment) => !html.includes(fragment));
}

test("highlights keyword, string, number, and comment tokens per language", () => {
  const samples = {
    cpp: {
      code: '// Adds two numbers\nint add(int a, int b) {\n    std::string label = "sum";\n    return a + 42;\n}',
      expected: [
        '<span class="tok-comment">// Adds two numbers</span>',
        '<span class="tok-keyword">int</span>',
        '<span class="tok-keyword">return</span>',
        '<span class="tok-string">"sum"</span>',
        '<span class="tok-number">42</span>',
      ],
    },
    go: {
      code: '// Adds two numbers\nfunc add(a int, b int) int {\n    label := "sum"\n    return a + 42\n}',
      expected: [
        '<span class="tok-comment">// Adds two numbers</span>',
        '<span class="tok-keyword">func</span>',
        '<span class="tok-keyword">return</span>',
        '<span class="tok-string">"sum"</span>',
        '<span class="tok-number">42</span>',
      ],
    },
    java: {
      code: '// Adds two numbers\npublic static int add(int a, int b) {\n    String label = "sum";\n    return a + 42;\n}',
      expected: [
        '<span class="tok-comment">// Adds two numbers</span>',
        '<span class="tok-keyword">public</span>',
        '<span class="tok-keyword">static</span>',
        '<span class="tok-keyword">return</span>',
        '<span class="tok-string">"sum"</span>',
        '<span class="tok-number">42</span>',
      ],
    },
    python: {
      code: '# Adds two numbers\ndef add(a, b):\n    label = "sum"\n    return a + 42',
      expected: [
        '<span class="tok-comment"># Adds two numbers</span>',
        '<span class="tok-keyword">def</span>',
        '<span class="tok-keyword">return</span>',
        '<span class="tok-string">"sum"</span>',
        '<span class="tok-number">42</span>',
      ],
    },
    typescript: {
      code: '// Adds two numbers\nfunction add(a: number, b: number): number {\n  const label = "sum";\n  return a + 42;\n}',
      expected: [
        '<span class="tok-comment">// Adds two numbers</span>',
        '<span class="tok-keyword">function</span>',
        '<span class="tok-keyword">const</span>',
        '<span class="tok-keyword">return</span>',
        '<span class="tok-string">"sum"</span>',
        '<span class="tok-number">42</span>',
      ],
    },
  } as const;

  const missing = {
    cpp: missingFragments(
      highlightSyntax(samples.cpp.code, "cpp"),
      samples.cpp.expected,
    ),
    go: missingFragments(
      highlightSyntax(samples.go.code, "go"),
      samples.go.expected,
    ),
    java: missingFragments(
      highlightSyntax(samples.java.code, "java"),
      samples.java.expected,
    ),
    python: missingFragments(
      highlightSyntax(samples.python.code, "python"),
      samples.python.expected,
    ),
    typescript: missingFragments(
      highlightSyntax(samples.typescript.code, "typescript"),
      samples.typescript.expected,
    ),
  };

  expect(missing).toEqual({
    cpp: [],
    go: [],
    java: [],
    python: [],
    typescript: [],
  });
});

test("recognizes Python's triple-quoted docstrings as one string span", () => {
  const code = 'def f():\n    """Explains what f does."""\n    return None';

  expect(highlightSyntax(code, "python")).toContain(
    '<span class="tok-string">"""Explains what f does."""</span>',
  );
});

test("escapes markup even inside a string literal, not only around it", () => {
  const code = 'label = "<script>&</script>"';

  expect(highlightSyntax(code, "python")).toBe(
    'label = <span class="tok-string">"&lt;script&gt;&amp;&lt;/script&gt;"</span>',
  );
});

test("does not treat a non-keyword identifier as a token", () => {
  expect(highlightSyntax("total_count", "python")).toBe("total_count");
});
