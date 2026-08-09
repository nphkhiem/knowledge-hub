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
  const migrated = migrateLessonSource(
    {
      ...validTwoPointersSource,
      timeline: [
        {
          ...validTwoPointersSource.timeline[0],
          actions: [
            {
              ...validTwoPointersSource.timeline[0].actions[0],
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
