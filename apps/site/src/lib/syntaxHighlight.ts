import type { CompiledExample } from "@knowledge-hub/lesson-compiler";

type ExampleLanguage = CompiledExample["language"];

/**
 * A minimal, curated highlighter: exactly four token classes (keyword,
 * string, number, comment), matching the four `--color-code-*` tokens the
 * design system already defines. This is deliberately not a full grammar
 * (no distinct classes for types, functions, or operators) so every
 * language reads with the same restrained palette instead of one language
 * looking busier than another.
 */

interface LanguageSyntax {
  readonly keywords: ReadonlySet<string>;
  /** Regex source (no flags) for comments, tried before strings/numbers. */
  readonly commentPattern?: string;
  /** Regex source for string/char literals, tried before numbers. */
  readonly stringPattern: string;
}

const PY_KEYWORDS = [
  "False",
  "None",
  "True",
  "and",
  "as",
  "assert",
  "async",
  "await",
  "break",
  "class",
  "continue",
  "def",
  "del",
  "elif",
  "else",
  "except",
  "finally",
  "for",
  "from",
  "global",
  "if",
  "import",
  "in",
  "is",
  "lambda",
  "nonlocal",
  "not",
  "or",
  "pass",
  "raise",
  "return",
  "try",
  "while",
  "with",
  "yield",
];

const TS_KEYWORDS = [
  "any",
  "as",
  "async",
  "await",
  "boolean",
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "declare",
  "default",
  "delete",
  "do",
  "else",
  "enum",
  "export",
  "extends",
  "false",
  "finally",
  "for",
  "from",
  "function",
  "if",
  "implements",
  "import",
  "in",
  "instanceof",
  "interface",
  "let",
  "namespace",
  "never",
  "new",
  "null",
  "number",
  "object",
  "of",
  "private",
  "protected",
  "public",
  "readonly",
  "return",
  "static",
  "string",
  "super",
  "switch",
  "this",
  "throw",
  "true",
  "try",
  "type",
  "typeof",
  "undefined",
  "unknown",
  "var",
  "void",
  "while",
  "yield",
];

const JAVA_KEYWORDS = [
  "abstract",
  "assert",
  "boolean",
  "break",
  "byte",
  "case",
  "catch",
  "char",
  "class",
  "const",
  "continue",
  "default",
  "do",
  "double",
  "else",
  "enum",
  "extends",
  "false",
  "final",
  "finally",
  "float",
  "for",
  "goto",
  "if",
  "implements",
  "import",
  "instanceof",
  "int",
  "interface",
  "long",
  "native",
  "new",
  "null",
  "package",
  "private",
  "protected",
  "public",
  "return",
  "short",
  "static",
  "strictfp",
  "super",
  "switch",
  "synchronized",
  "this",
  "throw",
  "throws",
  "transient",
  "true",
  "try",
  "void",
  "volatile",
  "while",
];

const CPP_KEYWORDS = [
  "auto",
  "bool",
  "break",
  "case",
  "catch",
  "char",
  "class",
  "const",
  "constexpr",
  "continue",
  "default",
  "delete",
  "do",
  "double",
  "else",
  "enum",
  "explicit",
  "extern",
  "false",
  "float",
  "for",
  "friend",
  "if",
  "inline",
  "int",
  "long",
  "namespace",
  "new",
  "noexcept",
  "nullptr",
  "operator",
  "private",
  "protected",
  "public",
  "return",
  "short",
  "signed",
  "sizeof",
  "static",
  "struct",
  "switch",
  "template",
  "this",
  "throw",
  "true",
  "try",
  "typedef",
  "typename",
  "union",
  "unsigned",
  "using",
  "virtual",
  "void",
  "volatile",
  "while",
];

const GO_KEYWORDS = [
  "bool",
  "break",
  "byte",
  "case",
  "chan",
  "const",
  "continue",
  "default",
  "defer",
  "else",
  "error",
  "fallthrough",
  "false",
  "float64",
  "for",
  "func",
  "go",
  "if",
  "import",
  "int",
  "interface",
  "map",
  "nil",
  "package",
  "range",
  "return",
  "select",
  "string",
  "struct",
  "switch",
  "true",
  "type",
  "var",
];

const C_STYLE_COMMENT = String.raw`//.*|/\*[\s\S]*?\*/`;
const DOUBLE_QUOTED = String.raw`"(?:\\.|[^"\\])*"`;
const SINGLE_QUOTED = String.raw`'(?:\\.|[^'\\])*'`;
/**
 * No backslash-escape awareness: Go raw strings genuinely have none, and
 * TypeScript template literals are treated as a single opaque string span
 * here anyway (no `${}` interpolation highlighting), so this stays simple.
 */
const BACKTICK_QUOTED = "`[^`]*`";

const LANGUAGE_SYNTAX: Readonly<Record<ExampleLanguage, LanguageSyntax>> = {
  cpp: {
    commentPattern: C_STYLE_COMMENT,
    keywords: new Set(CPP_KEYWORDS),
    stringPattern: `${DOUBLE_QUOTED}|${SINGLE_QUOTED}`,
  },
  go: {
    commentPattern: C_STYLE_COMMENT,
    keywords: new Set(GO_KEYWORDS),
    stringPattern: `${DOUBLE_QUOTED}|${BACKTICK_QUOTED}|${SINGLE_QUOTED}`,
  },
  java: {
    commentPattern: C_STYLE_COMMENT,
    keywords: new Set(JAVA_KEYWORDS),
    stringPattern: `${DOUBLE_QUOTED}|${SINGLE_QUOTED}`,
  },
  python: {
    commentPattern: String.raw`#.*`,
    keywords: new Set(PY_KEYWORDS),
    // Triple-quoted strings must be tried before single-character quotes,
    // since both start with the same quote character.
    stringPattern: String.raw`"""[\s\S]*?"""|'''[\s\S]*?'''|${DOUBLE_QUOTED}|${SINGLE_QUOTED}`,
  },
  typescript: {
    commentPattern: C_STYLE_COMMENT,
    keywords: new Set(TS_KEYWORDS),
    stringPattern: `${DOUBLE_QUOTED}|${SINGLE_QUOTED}|${BACKTICK_QUOTED}`,
  },
};

const NUMBER_PATTERN = String.raw`\b0[xX][0-9a-fA-F_]+\b|\b\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?[a-zA-Z]*\b`;
const IDENTIFIER_PATTERN = String.raw`[A-Za-z_]\w*`;

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function wrap(tokenClass: string, text: string): string {
  return `<span class="tok-${tokenClass}">${escapeHtml(text)}</span>`;
}

/**
 * Tokenizes `code` for `language` and returns HTML: keyword, string, number,
 * and comment runs wrapped in `<span class="tok-*">`, everything else
 * (including every wrapped run's own text) HTML-escaped so the sample can
 * never break out of its `<code>` block.
 */
export function highlightSyntax(
  code: string,
  language: ExampleLanguage,
): string {
  const syntax = LANGUAGE_SYNTAX[language];
  const groups = [
    syntax.commentPattern !== undefined
      ? `(?<comment>${syntax.commentPattern})`
      : undefined,
    `(?<string>${syntax.stringPattern})`,
    `(?<number>${NUMBER_PATTERN})`,
    `(?<identifier>${IDENTIFIER_PATTERN})`,
  ].filter((group): group is string => group !== undefined);
  const scanner = new RegExp(groups.join("|"), "g");

  let output = "";
  let cursor = 0;
  for (const match of code.matchAll(scanner)) {
    const start = match.index;
    if (start > cursor) output += escapeHtml(code.slice(cursor, start));

    const groupsMatched = match.groups ?? {};
    if (groupsMatched["comment"] !== undefined) {
      output += wrap("comment", match[0]);
    } else if (groupsMatched["string"] !== undefined) {
      output += wrap("string", match[0]);
    } else if (groupsMatched["number"] !== undefined) {
      output += wrap("number", match[0]);
    } else if (syntax.keywords.has(match[0])) {
      output += wrap("keyword", match[0]);
    } else {
      output += escapeHtml(match[0]);
    }
    cursor = start + match[0].length;
  }
  if (cursor < code.length) output += escapeHtml(code.slice(cursor));

  return output;
}
