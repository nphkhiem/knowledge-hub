import { migrateLessonSource } from "@knowledge-hub/lesson-schema";
import fc from "fast-check";
import { expect, test } from "vitest";
import { validTwoPointersSource } from "../../lesson-schema/test-fixtures/validLessonSource.js";
import {
  compileLesson,
  type CompiledContent,
  type CompiledLesson,
} from "./index.js";

function validSourceForCompilation() {
  const [values, leftPointer, label, comparison, result] =
    validTwoPointersSource.scene.objects;
  const migrated = migrateLessonSource(
    {
      ...validTwoPointersSource,
      scene: {
        ...validTwoPointersSource.scene,
        objects: [
          values,
          {
            id: "right-pointer",
            kind: "pointer",
            label: "Right",
            targetObjectId: "values",
            index: 5,
          },
          leftPointer,
          label,
          { ...comparison, rightPointerId: "right-pointer" },
          result,
        ],
      },
      timeline: [
        {
          id: "exhaust-left",
          narration: "Move the left pointer to the right edge.",
          actions: [{ type: "move", objectId: "left-pointer", toIndex: 5 }],
        },
        {
          id: "cross-right",
          narration: "Move the right pointer across the left pointer.",
          actions: [{ type: "move", objectId: "right-pointer", toIndex: 4 }],
        },
        {
          id: "publish-not-found",
          narration: "Publish not-found after exhausting the search.",
          terminal: true,
          actions: [
            {
              type: "set",
              objectId: "pair-result",
              property: "status",
              value: "not-found",
            },
          ],
        },
      ],
    },
    "lesson.yaml",
  );
  if (!migrated.ok) throw new Error("Expected a valid compiler test source.");
  return migrated.value;
}

function contentWithOrder(reverse: boolean): CompiledContent {
  const entries = [
    ["quickUnderstanding", { html: "<p>Quick Understanding</p>" }],
    ["realWorldApplications", []],
  ] as const;
  return Object.fromEntries(
    reverse ? [...entries].reverse() : entries,
  ) as unknown as CompiledContent;
}

function compiledValue(
  result: ReturnType<typeof compileLesson>,
): CompiledLesson {
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error("Expected lesson compilation to succeed.");
  return result.value;
}

function isDeeplyUnfrozen(value: unknown): boolean {
  if (typeof value !== "object" || value === null) return true;
  return (
    !Object.isFrozen(value) && Object.values(value).every(isDeeplyUnfrozen)
  );
}

test("normalizes repeated compilation to byte-identical JSON", () => {
  fc.assert(
    fc.property(fc.boolean(), (reverseContentKeys) => {
      const source = validSourceForCompilation();
      const canonical = compiledValue(
        compileLesson(source, contentWithOrder(false)),
      );
      const repeated = compiledValue(
        compileLesson(source, contentWithOrder(reverseContentKeys)),
      );

      expect(JSON.stringify(repeated)).toBe(JSON.stringify(canonical));
    }),
  );
});

test("does not mutate or freeze authoring inputs", () => {
  fc.assert(
    fc.property(fc.boolean(), (reverseContentKeys) => {
      const source = validSourceForCompilation();
      const content = contentWithOrder(reverseContentKeys);
      const sourceBefore = structuredClone(source);
      const contentBefore = structuredClone(content);

      compiledValue(compileLesson(source, content));

      expect({
        content,
        contentUnfrozen: isDeeplyUnfrozen(content),
        source,
        sourceUnfrozen: isDeeplyUnfrozen(source),
      }).toEqual({
        content: contentBefore,
        contentUnfrozen: true,
        source: sourceBefore,
        sourceUnfrozen: true,
      });
    }),
  );
});
