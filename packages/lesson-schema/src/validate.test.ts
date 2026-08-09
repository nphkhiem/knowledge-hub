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
        target: 15,
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

test("accepts the exact ten V1 action contracts", () => {
  const result = validateLessonSource(
    {
      ...validTwoPointersSource,
      timeline: [
        {
          id: "all-actions",
          narration: "Exercise the complete declarative action vocabulary.",
          terminal: true,
          actions: [
            { type: "show", objectId: "values" },
            { type: "hide", objectId: "values" },
            {
              type: "set",
              objectId: "pair-result",
              property: "status",
              value: "found",
            },
            { type: "move", objectId: "left-pointer", toIndex: 1 },
            {
              type: "highlight",
              objectId: "values",
              indices: [0, 1],
              tone: "compare",
            },
            { type: "compare", objectId: "pair-comparison" },
            {
              type: "connect",
              objectId: "values",
              fromObjectId: "left-pointer",
              toObjectId: "pair-result",
            },
            { type: "disconnect", objectId: "values" },
            { type: "enqueue", objectId: "values", value: 21 },
            { type: "dequeue", objectId: "values" },
          ],
        },
      ],
    },
    "lesson.yaml",
  );

  expect(result.ok).toBe(true);
});
