import { expect, test } from "vitest";
import { validTwoPointersSource } from "../test-fixtures/validLessonSource.js";
import { migrateLessonSource, validateLessonSource } from "./index.js";

test("rejects an unsupported schema version with a stable diagnostic", () => {
  const result = validateLessonSource(
    { ...validTwoPointersSource, schemaVersion: 99 },
    "lesson.yaml",
  );

  expect(result).toEqual({
    ok: false,
    diagnostics: [
      {
        code: "schema.unsupported-version",
        file: "lesson.yaml",
        path: "schemaVersion",
        message: "Supported schema version: 1.",
      },
    ],
  });
});

test("requires the lesson id to match its canonical domain and slug", () => {
  const result = validateLessonSource(
    { ...validTwoPointersSource, id: "dsa.wrong-slug" },
    "lesson.yaml",
  );

  expect(result).toEqual({
    ok: false,
    diagnostics: [
      {
        code: "identity.mismatch",
        file: "lesson.yaml",
        path: "id",
        message: 'Lesson id must equal "dsa.two-pointers".',
      },
    ],
  });
});

test("rejects an executable action with a stable diagnostic", () => {
  const result = validateLessonSource(
    {
      ...validTwoPointersSource,
      timeline: [
        {
          id: "bad",
          narration: "Do not execute lesson-authored code.",
          terminal: true,
          actions: [{ type: "eval", code: "alert(1)" }],
        },
      ],
    },
    "lesson.yaml",
  );

  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.diagnostics).toContainEqual({
      code: "action.unsupported",
      file: "lesson.yaml",
      path: "timeline[0].actions[0].type",
      message:
        "Supported actions: show, hide, set, move, highlight, compare, connect, disconnect, enqueue, dequeue.",
    });
  }
});

test("requires one Model Check", () => {
  const withoutModelCheck = Object.fromEntries(
    Object.entries(validTwoPointersSource).filter(
      ([property]) => property !== "modelCheck",
    ),
  );
  const result = validateLessonSource(withoutModelCheck, "lesson.yaml");

  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.diagnostics).toContainEqual({
      code: "model-check.required",
      file: "lesson.yaml",
      path: "modelCheck",
      message: "Every lesson requires one Model Check.",
    });
  }
});

test("treats an explicitly undefined Model Check as missing", () => {
  const result = validateLessonSource(
    { ...validTwoPointersSource, modelCheck: undefined },
    "lesson.yaml",
  );

  expect(result).toEqual({
    ok: false,
    diagnostics: [
      {
        code: "model-check.required",
        file: "lesson.yaml",
        path: "modelCheck",
        message: "Every lesson requires one Model Check.",
      },
    ],
  });
});

test("requires at least one evidence source", () => {
  const result = validateLessonSource(
    {
      ...validTwoPointersSource,
      evidence: { ...validTwoPointersSource.evidence, sources: [] },
    },
    "lesson.yaml",
  );

  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.diagnostics).toContainEqual({
      code: "evidence.source-count",
      file: "lesson.yaml",
      path: "evidence.sources",
      message: "Evidence requires at least one source.",
    });
  }
});

test("rejects a primitive outside the V1 catalog", () => {
  const result = validateLessonSource(
    {
      ...validTwoPointersSource,
      scene: {
        ...validTwoPointersSource.scene,
        objects: [{ id: "scripted", kind: "canvas", draw: "arbitrary" }],
      },
    },
    "lesson.yaml",
  );

  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.diagnostics).toContainEqual({
      code: "primitive.unsupported",
      file: "lesson.yaml",
      path: "scene.objects[0].kind",
      message:
        "Supported primitives: array, pointer, label, comparison, result.",
    });
  }
});

test("keeps action contracts closed to lesson-authored fields", () => {
  const result = validateLessonSource(
    {
      ...validTwoPointersSource,
      timeline: [
        {
          ...validTwoPointersSource.timeline[0],
          actions: [
            {
              ...validTwoPointersSource.timeline[0].actions[0],
              code: "alert(1)",
            },
          ],
        },
      ],
    },
    "lesson.yaml",
  );

  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.diagnostics).toContainEqual({
      code: "schema.invalid",
      file: "lesson.yaml",
      path: "timeline[0].actions[0].code",
      message: "The field is not part of the V1 lesson contract.",
    });
  }
});

test("keeps all five primitive contracts closed", () => {
  const [arrayObject, ...remainingObjects] =
    validTwoPointersSource.scene.objects;
  const result = validateLessonSource(
    {
      ...validTwoPointersSource,
      scene: {
        ...validTwoPointersSource.scene,
        objects: [
          { ...arrayObject, arbitraryRendererCode: "draw()" },
          ...remainingObjects,
        ],
      },
    },
    "lesson.yaml",
  );

  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.diagnostics).toContainEqual({
      code: "schema.invalid",
      file: "lesson.yaml",
      path: "scene.objects[0].arbitraryRendererCode",
      message: "The field is not part of the V1 lesson contract.",
    });
  }
});

test("rejects a negative initial pointer index", () => {
  const [arrayObject, pointerObject, ...remainingObjects] =
    validTwoPointersSource.scene.objects;
  const result = validateLessonSource(
    {
      ...validTwoPointersSource,
      scene: {
        ...validTwoPointersSource.scene,
        objects: [
          arrayObject,
          { ...pointerObject, index: -1 },
          ...remainingObjects,
        ],
      },
    },
    "lesson.yaml",
  );

  expect(result).toEqual({
    ok: false,
    diagnostics: [
      {
        code: "schema.invalid",
        file: "lesson.yaml",
        path: "scene.objects[1].index",
        message: "The value does not satisfy the V1 lesson contract.",
      },
    ],
  });
});

test("rejects an authored result that starts found", () => {
  const result = validateLessonSource(
    {
      ...validTwoPointersSource,
      scene: {
        ...validTwoPointersSource.scene,
        objects: validTwoPointersSource.scene.objects.map((object) =>
          object.kind === "result" ? { ...object, status: "found" } : object,
        ),
      },
    },
    "lesson.yaml",
  );

  expect(result).toEqual({
    ok: false,
    diagnostics: [
      {
        code: "schema.invalid",
        file: "lesson.yaml",
        path: "scene.objects[4].status",
        message: "The value does not satisfy the V1 lesson contract.",
      },
    ],
  });
});

test("rejects an authored result that starts not-found", () => {
  const result = validateLessonSource(
    {
      ...validTwoPointersSource,
      scene: {
        ...validTwoPointersSource.scene,
        objects: validTwoPointersSource.scene.objects.map((object) =>
          object.kind === "result"
            ? { ...object, status: "not-found" }
            : object,
        ),
      },
    },
    "lesson.yaml",
  );

  expect(result).toEqual({
    ok: false,
    diagnostics: [
      {
        code: "schema.invalid",
        file: "lesson.yaml",
        path: "scene.objects[4].status",
        message: "The value does not satisfy the V1 lesson contract.",
      },
    ],
  });
});

test("validates the complete Model Check contract", () => {
  const result = validateLessonSource(
    {
      ...validTwoPointersSource,
      modelCheck: { ...validTwoPointersSource.modelCheck, explanation: "" },
    },
    "lesson.yaml",
  );

  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.diagnostics).toContainEqual({
      code: "schema.invalid",
      file: "lesson.yaml",
      path: "modelCheck.explanation",
      message: "The value does not satisfy the V1 lesson contract.",
    });
  }
});

test("requires complete accessibility descriptions", () => {
  const result = validateLessonSource(
    {
      ...validTwoPointersSource,
      accessibility: {
        ...validTwoPointersSource.accessibility,
        initialDescription: "",
      },
    },
    "lesson.yaml",
  );

  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.diagnostics).toContainEqual({
      code: "accessibility.incomplete",
      file: "lesson.yaml",
      path: "accessibility.initialDescription",
      message: "Accessibility descriptions must be non-empty.",
    });
  }
});

test("requires an evidence URL or publication citation", () => {
  const result = validateLessonSource(
    {
      ...validTwoPointersSource,
      evidence: {
        ...validTwoPointersSource.evidence,
        sources: [
          {
            title: "Source without a locator",
            publisher: "Example University",
            accessedOn: "2026-08-09",
            supports: ["One scoped claim."],
          },
        ],
      },
    },
    "lesson.yaml",
  );

  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.diagnostics).toContainEqual({
      code: "evidence.source-locator",
      file: "lesson.yaml",
      path: "evidence.sources[0]",
      message: "An evidence source requires a URL or publication citation.",
    });
  }
});

test.each([
  ["executable", "javascript:alert(1)"],
  ["embedded data", "data:text/html,unsafe"],
  ["local file", "file:///etc/passwd"],
] as const)("rejects %s evidence URL schemes", (_label, url) => {
  const result = validateLessonSource(
    {
      ...validTwoPointersSource,
      evidence: {
        ...validTwoPointersSource.evidence,
        sources: [
          {
            ...validTwoPointersSource.evidence.sources[0],
            url,
          },
        ],
      },
    },
    "lesson.yaml",
  );

  expect(result).toEqual({
    ok: false,
    diagnostics: [
      {
        code: "evidence.source-scheme",
        file: "lesson.yaml",
        path: "evidence.sources[0].url",
        message: "Evidence URLs must use HTTP or HTTPS.",
      },
    ],
  });
});

test.each(["https://example.com/source", "http://example.com/source"])(
  "accepts an HTTP evidence URL: %s",
  (url) => {
    const result = validateLessonSource(
      {
        ...validTwoPointersSource,
        evidence: {
          ...validTwoPointersSource.evidence,
          sources: [
            {
              ...validTwoPointersSource.evidence.sources[0],
              url,
            },
          ],
        },
      },
      "lesson.yaml",
    );

    expect(result.ok).toBe(true);
  },
);

test("keeps unsupported versions behind the migration result boundary", () => {
  expect(migrateLessonSource({ schemaVersion: 2 }, "future.yaml")).toEqual({
    ok: false,
    diagnostics: [
      {
        code: "schema.unsupported-version",
        file: "future.yaml",
        path: "schemaVersion",
        message: "Supported schema version: 1.",
      },
    ],
  });
});

test("returns independent diagnostics in stable file-path-code order", () => {
  const result = validateLessonSource(
    {
      ...validTwoPointersSource,
      scene: {
        objects: [{ id: "custom", kind: "canvas" }],
      },
      timeline: [
        {
          id: "scripted",
          narration: "Reject executable authoring data.",
          terminal: true,
          actions: [{ type: "eval" }],
        },
      ],
    },
    "lesson.yaml",
  );

  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.diagnostics.map(({ code, path }) => [path, code])).toEqual([
      ["scene.objects[0].kind", "primitive.unsupported"],
      ["timeline[0].actions[0].type", "action.unsupported"],
    ]);
  }
});

test.each([
  ["array", { id: "array", kind: "array", label: "Values", values: [1] }],
  [
    "pointer",
    {
      id: "pointer",
      kind: "pointer",
      label: "Left",
      targetObjectId: "array",
      index: 0,
    },
  ],
  ["label", { id: "label", kind: "label", text: "Target" }],
  [
    "comparison",
    {
      id: "comparison",
      kind: "comparison",
      arrayObjectId: "array",
      leftPointerId: "pointer",
      rightPointerId: "pointer",
      target: 1,
    },
  ],
  ["result", { id: "result", kind: "result", status: "pending" }],
] as const)("accepts the %s primitive contract", (_kind, primitive) => {
  const result = validateLessonSource(
    {
      ...validTwoPointersSource,
      scene: { objects: [primitive] },
    },
    "lesson.yaml",
  );

  expect(result.ok).toBe(true);
});

test.each([
  ["show", { type: "show", objectId: "values" }],
  ["hide", { type: "hide", objectId: "values" }],
  [
    "set",
    {
      type: "set",
      objectId: "pair-result",
      property: "status",
      value: "found",
    },
  ],
  ["move", { type: "move", objectId: "left-pointer", toIndex: 1 }],
  [
    "highlight",
    {
      type: "highlight",
      objectId: "values",
      indices: [0, 1],
      tone: "compare",
    },
  ],
  ["compare", { type: "compare", objectId: "pair-comparison" }],
  [
    "connect",
    {
      type: "connect",
      objectId: "values",
      fromObjectId: "left-pointer",
      toObjectId: "pair-result",
    },
  ],
  ["disconnect", { type: "disconnect", objectId: "values" }],
  ["enqueue", { type: "enqueue", objectId: "values", value: 21 }],
  ["dequeue", { type: "dequeue", objectId: "values" }],
] as const)("accepts the %s action contract", (_type, action) => {
  const result = validateLessonSource(
    {
      ...validTwoPointersSource,
      timeline: [
        {
          id: "valid-action",
          narration: "Exercise one declarative action contract.",
          terminal: true,
          actions: [action],
        },
      ],
    },
    "lesson.yaml",
  );

  expect(result.ok).toBe(true);
});

test("rejects example declarations that would publish untestable code", () => {
  const withExamples = (
    examples: readonly Record<string, string>[],
  ): unknown => ({
    ...validTwoPointersSource,
    content: { ...validTwoPointersSource.content, examples },
  });

  const outcomes = {
    duplicateLanguage: validateLessonSource(
      withExamples([
        { language: "python", file: "examples/a.py" },
        { language: "python", file: "examples/b.py" },
      ]),
      "lesson.yaml",
    ).ok,
    mismatchedExtension: validateLessonSource(
      withExamples([{ language: "python", file: "examples/a.ts" }]),
      "lesson.yaml",
    ).ok,
    newLanguagesValid: validateLessonSource(
      withExamples([
        { language: "java", file: "examples/A.java" },
        { language: "cpp", file: "examples/a.cpp" },
        { language: "go", file: "examples/a.go" },
      ]),
      "lesson.yaml",
    ).ok,
    newLanguageTestFileDeclared: validateLessonSource(
      withExamples([{ language: "java", file: "examples/ATest.java" }]),
      "lesson.yaml",
    ).ok,
    outsideExamplesDirectory: validateLessonSource(
      withExamples([{ language: "python", file: "src/a.py" }]),
      "lesson.yaml",
    ).ok,
    testFileDeclared: validateLessonSource(
      withExamples([{ language: "python", file: "examples/test_a.py" }]),
      "lesson.yaml",
    ).ok,
    unsupportedLanguage: validateLessonSource(
      withExamples([{ language: "rust", file: "examples/a.rs" }]),
      "lesson.yaml",
    ).ok,
    valid: validateLessonSource(
      withExamples([{ language: "python", file: "examples/a.py" }]),
      "lesson.yaml",
    ).ok,
  };

  expect(outcomes).toEqual({
    duplicateLanguage: false,
    mismatchedExtension: false,
    newLanguageTestFileDeclared: false,
    newLanguagesValid: true,
    outsideExamplesDirectory: false,
    testFileDeclared: false,
    unsupportedLanguage: false,
    valid: true,
  });
});

test("requires a difficulty grade", () => {
  const withoutDifficulty: Record<string, unknown> = {
    ...validTwoPointersSource,
  };
  delete withoutDifficulty["difficulty"];

  expect(validateLessonSource(withoutDifficulty, "lesson.yaml").ok).toBe(false);
});

test("accepts only the three declared difficulty grades", () => {
  const grades = ["easy", "medium", "hard", "trivial", "Easy", ""];

  expect(
    grades.filter(
      (difficulty) =>
        validateLessonSource(
          { ...validTwoPointersSource, difficulty },
          "lesson.yaml",
        ).ok,
    ),
  ).toEqual(["easy", "medium", "hard"]);
});

test("allows an order beyond the first fifteen lessons", () => {
  // The collection grew past Interview Foundations' fifteen. A ceiling of 15
  // would reject every DSA lesson after it.
  expect(
    [1, 15, 16, 40, 99].filter(
      (order) =>
        validateLessonSource(
          { ...validTwoPointersSource, order },
          "lesson.yaml",
        ).ok,
    ),
  ).toEqual([1, 15, 16, 40, 99]);
});

test("still rejects an order outside any sane range", () => {
  expect(
    [0, -1, 1000].filter(
      (order) =>
        validateLessonSource(
          { ...validTwoPointersSource, order },
          "lesson.yaml",
        ).ok,
    ),
  ).toEqual([]);
});

test("a scene needs no target of its own", () => {
  // Nothing ever read scene.target: the compiler copies only scene.objects, and
  // a comparison carries its own target. It forced every author to invent a
  // number that no code consumed.
  const scene = { objects: validTwoPointersSource.scene.objects };

  expect(
    validateLessonSource({ ...validTwoPointersSource, scene }, "lesson.yaml")
      .ok,
  ).toBe(true);
});

test("a scene still carrying a target is rejected rather than ignored", () => {
  const scene = {
    objects: validTwoPointersSource.scene.objects,
    target: 15,
  };

  // Silently ignoring it would leave copies of the old shape spreading.
  expect(
    validateLessonSource({ ...validTwoPointersSource, scene }, "lesson.yaml")
      .ok,
  ).toBe(false);
});
