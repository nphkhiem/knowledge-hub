import { fileURLToPath } from "node:url";
import {
  migrateLessonSource,
  type LessonSourceV1,
} from "@knowledge-hub/lesson-schema";
import { expect, test } from "vitest";
import { validTwoPointersSource } from "../../lesson-schema/test-fixtures/validLessonSource.js";
import {
  compileLesson,
  compileLessonPackage,
  type CompiledContent,
} from "./index.js";

const twoPointersDirectory = fileURLToPath(
  new URL("../../../lessons/dsa/two-pointers/", import.meta.url),
);

const compiledContent: CompiledContent = {
  quickUnderstanding: { html: "<p>Quick Understanding</p>" },
  realWorldApplications: [],
};

function sourceWithPointersInReverseOrder(): LessonSourceV1 {
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
          {
            ...comparison,
            rightPointerId: "right-pointer",
          },
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
  if (!migrated.ok) {
    throw new Error("Expected the compiler test source to be valid.");
  }
  return migrated.value;
}

function sourceWithTerminalAction(action: unknown): LessonSourceV1 {
  const migrated = migrateLessonSource(
    {
      ...validTwoPointersSource,
      timeline: [
        {
          id: "terminal-step",
          narration: "Apply one semantic action.",
          terminal: true,
          actions: [action],
        },
      ],
    },
    "lesson.yaml",
  );
  if (!migrated.ok) {
    throw new Error("Expected the compiler action fixture to be valid.");
  }
  return migrated.value;
}

function sourceWithTwoPointersAndTerminalAction(
  action: unknown,
): LessonSourceV1 {
  const source = sourceWithPointersInReverseOrder();
  const migrated = migrateLessonSource(
    {
      ...source,
      timeline: [
        {
          id: "terminal-step",
          narration: "Apply one semantic action.",
          terminal: true,
          actions: [action],
        },
      ],
    },
    "lesson.yaml",
  );
  if (!migrated.ok) {
    throw new Error("Expected the two-pointer action fixture to be valid.");
  }
  return migrated.value;
}

test("compiles the inward-pointer trace to the first matching pair", async () => {
  const lesson = await compileLessonPackage(twoPointersDirectory);

  expect(
    lesson.snapshots.map((snapshot) => [
      snapshot.pointers.left,
      snapshot.pointers.right,
      snapshot.comparison?.relation,
    ]),
  ).toEqual([
    [0, 5, undefined],
    [0, 5, "greater"],
    [0, 4, undefined],
    [0, 4, "less"],
    [1, 4, undefined],
    [1, 4, "less"],
    [2, 4, undefined],
    [2, 4, "equal"],
    [2, 4, undefined],
  ]);
  expect(lesson.snapshots.at(-1)?.terminal).toBe(true);
  expect(lesson.snapshots.at(-1)?.result).toEqual({
    kind: "found",
    indices: [2, 4],
  });
  expect(
    lesson.snapshots.at(-1)?.objects.find(({ id }) => id === "pair-result"),
  ).toMatchObject({ status: "found" });
});

function isDeeplyFrozen(value: unknown): boolean {
  if (typeof value !== "object" || value === null) return true;
  return Object.isFrozen(value) && Object.values(value).every(isDeeplyFrozen);
}

test("publishes a deeply frozen compiled lesson", async () => {
  const lesson = await compileLessonPackage(twoPointersDirectory);

  expect(isDeeplyFrozen(lesson)).toBe(true);
});

test("sorts semantic identifier maps by key", () => {
  const compiled = compileLesson(
    sourceWithPointersInReverseOrder(),
    compiledContent,
  );

  expect(compiled.ok).toBe(true);
  if (!compiled.ok) return;
  expect(Object.keys(compiled.value.snapshots[0]!.pointers)).toEqual([
    "left-pointer",
    "right-pointer",
  ]);
});

test("diagnoses a move action targeting a non-pointer", () => {
  const compiled = compileLesson(
    sourceWithTerminalAction({
      type: "move",
      objectId: "values",
      toIndex: 1,
    }),
    compiledContent,
  );

  expect(compiled).toEqual({
    ok: false,
    diagnostics: [
      {
        code: "reference.wrong-kind",
        file: "lesson.yaml",
        path: "timeline[0].actions[0].objectId",
        message:
          'Action "move" requires a pointer, but "values" resolves to an array.',
      },
    ],
  });
});

test("diagnoses a highlight action targeting a non-array", () => {
  const compiled = compileLesson(
    sourceWithTerminalAction({
      type: "highlight",
      objectId: "left-pointer",
      indices: [0],
      tone: "compare",
    }),
    compiledContent,
  );

  expect(compiled).toEqual({
    ok: false,
    diagnostics: [
      {
        code: "reference.wrong-kind",
        file: "lesson.yaml",
        path: "timeline[0].actions[0].objectId",
        message:
          'Action "highlight" requires an array, but "left-pointer" resolves to a pointer.',
      },
    ],
  });
});

test("diagnoses a compare action targeting a non-comparison", () => {
  const compiled = compileLesson(
    sourceWithTerminalAction({
      type: "compare",
      objectId: "target-label",
    }),
    compiledContent,
  );

  expect(compiled).toEqual({
    ok: false,
    diagnostics: [
      {
        code: "reference.wrong-kind",
        file: "lesson.yaml",
        path: "timeline[0].actions[0].objectId",
        message:
          'Action "compare" requires a comparison, but "target-label" resolves to a label.',
      },
    ],
  });
});

test("diagnoses a set action targeting a non-result", () => {
  const compiled = compileLesson(
    sourceWithTerminalAction({
      type: "set",
      objectId: "values",
      property: "status",
      value: "found",
    }),
    compiledContent,
  );

  expect(compiled).toEqual({
    ok: false,
    diagnostics: [
      {
        code: "reference.wrong-kind",
        file: "lesson.yaml",
        path: "timeline[0].actions[0].objectId",
        message:
          'Action "set" requires a result, but "values" resolves to an array.',
      },
    ],
  });
});

test("diagnoses a result property outside the set allowlist", () => {
  const compiled = compileLesson(
    sourceWithTerminalAction({
      type: "set",
      objectId: "pair-result",
      property: "label",
      value: "found",
    }),
    compiledContent,
  );

  expect(compiled).toEqual({
    ok: false,
    diagnostics: [
      {
        code: "reference.invalid",
        file: "lesson.yaml",
        path: "timeline[0].actions[0].property",
        message:
          'Action "set" only supports the status property of a result object.',
      },
    ],
  });
});

test("diagnoses a result status outside the set allowlist", () => {
  const compiled = compileLesson(
    sourceWithTerminalAction({
      type: "set",
      objectId: "pair-result",
      property: "status",
      value: "celebrating",
    }),
    compiledContent,
  );

  expect(compiled).toEqual({
    ok: false,
    diagnostics: [
      {
        code: "reference.invalid",
        file: "lesson.yaml",
        path: "timeline[0].actions[0].value",
        message: "Result status must be pending, found, or not-found.",
      },
    ],
  });
});

test.each([
  { label: "pending", value: ["pending"] },
  { label: "found", value: ["found"] },
  { label: "not-found", value: ["not-found"] },
  { label: "numeric", value: 1 },
])("rejects a $label non-string result status", ({ value }) => {
  const compiled = compileLesson(
    sourceWithTerminalAction({
      type: "set",
      objectId: "pair-result",
      property: "status",
      value,
    }),
    compiledContent,
  );

  expect(compiled).toEqual({
    ok: false,
    diagnostics: [
      {
        code: "reference.invalid",
        file: "lesson.yaml",
        path: "timeline[0].actions[0].value",
        message: "Result status must be pending, found, or not-found.",
      },
    ],
  });
});

test("accepts a scalar pending result status", () => {
  const compiled = compileLesson(
    sourceWithTerminalAction({
      type: "set",
      objectId: "pair-result",
      property: "status",
      value: "pending",
    }),
    compiledContent,
  );

  expect(compiled.ok).toBe(true);
  if (!compiled.ok) return;
  const finalSnapshot = compiled.value.snapshots.at(-1);
  expect(finalSnapshot?.result).toBeUndefined();
  expect(
    finalSnapshot?.objects.find(({ id }) => id === "pair-result"),
  ).toMatchObject({ status: "pending" });
});

test("diagnoses connect when V1 has no connection primitive", () => {
  const compiled = compileLesson(
    sourceWithTwoPointersAndTerminalAction({
      type: "connect",
      objectId: "target-label",
      fromObjectId: "left-pointer",
      toObjectId: "right-pointer",
    }),
    compiledContent,
  );

  expect(compiled).toEqual({
    ok: false,
    diagnostics: [
      {
        code: "reference.invalid",
        file: "lesson.yaml",
        path: "timeline[0].actions[0].objectId",
        message:
          'Action "connect" has no compatible V1 connection primitive for "target-label".',
      },
    ],
  });
});

test("diagnoses disconnect when V1 has no connection primitive", () => {
  const compiled = compileLesson(
    sourceWithTerminalAction({
      type: "disconnect",
      objectId: "target-label",
    }),
    compiledContent,
  );

  expect(compiled).toEqual({
    ok: false,
    diagnostics: [
      {
        code: "reference.invalid",
        file: "lesson.yaml",
        path: "timeline[0].actions[0].objectId",
        message:
          'Action "disconnect" has no compatible V1 connection primitive for "target-label".',
      },
    ],
  });
});

test("diagnoses enqueue when V1 has no queue primitive", () => {
  const compiled = compileLesson(
    sourceWithTerminalAction({
      type: "enqueue",
      objectId: "values",
      value: 21,
    }),
    compiledContent,
  );

  expect(compiled).toEqual({
    ok: false,
    diagnostics: [
      {
        code: "reference.invalid",
        file: "lesson.yaml",
        path: "timeline[0].actions[0].objectId",
        message:
          'Action "enqueue" has no compatible V1 queue primitive for "values".',
      },
    ],
  });
});

test("diagnoses dequeue when V1 has no queue primitive", () => {
  const compiled = compileLesson(
    sourceWithTerminalAction({
      type: "dequeue",
      objectId: "values",
    }),
    compiledContent,
  );

  expect(compiled).toEqual({
    ok: false,
    diagnostics: [
      {
        code: "reference.invalid",
        file: "lesson.yaml",
        path: "timeline[0].actions[0].objectId",
        message:
          'Action "dequeue" has no compatible V1 queue primitive for "values".',
      },
    ],
  });
});

test("diagnoses a pointer move outside its target array", () => {
  const compiled = compileLesson(
    sourceWithTerminalAction({
      type: "move",
      objectId: "left-pointer",
      toIndex: 6,
    }),
    compiledContent,
  );

  expect(compiled).toEqual({
    ok: false,
    diagnostics: [
      {
        code: "reference.invalid",
        file: "lesson.yaml",
        path: "timeline[0].actions[0].toIndex",
        message: 'Pointer index 6 is outside array "values".',
      },
    ],
  });
});

test("diagnoses a highlight outside its target array", () => {
  const compiled = compileLesson(
    sourceWithTerminalAction({
      type: "highlight",
      objectId: "values",
      indices: [0, 6],
      tone: "compare",
    }),
    compiledContent,
  );

  expect(compiled).toEqual({
    ok: false,
    diagnostics: [
      {
        code: "reference.invalid",
        file: "lesson.yaml",
        path: "timeline[0].actions[0].indices",
        message: 'Highlight indices must be inside array "values".',
      },
    ],
  });
});

test("diagnoses comparison pointers targeting different arrays", () => {
  const source = sourceWithTwoPointersAndTerminalAction({
    type: "compare",
    objectId: "pair-comparison",
  });
  const migrated = migrateLessonSource(
    {
      ...source,
      scene: {
        ...source.scene,
        objects: [
          ...source.scene.objects.map((object) =>
            object.id === "right-pointer"
              ? { ...object, targetObjectId: "other-values" }
              : object,
          ),
          {
            id: "other-values",
            kind: "array",
            label: "Other values",
            values: [1, 2, 4, 7, 11, 15],
          },
        ],
      },
    },
    "lesson.yaml",
  );
  if (!migrated.ok) {
    throw new Error("Expected the comparison fixture to be valid.");
  }

  const compiled = compileLesson(migrated.value, compiledContent);

  expect(compiled).toEqual({
    ok: false,
    diagnostics: [
      {
        code: "reference.invalid",
        file: "lesson.yaml",
        path: "timeline[0].actions[0].objectId",
        message:
          'Comparison "pair-comparison" requires two pointers targeting array "values".',
      },
    ],
  });
});

test("diagnoses a found result without an equal comparison", () => {
  const compiled = compileLesson(
    sourceWithTerminalAction({
      type: "set",
      objectId: "pair-result",
      property: "status",
      value: "found",
    }),
    compiledContent,
  );

  expect(compiled).toEqual({
    ok: false,
    diagnostics: [
      {
        code: "reference.invalid",
        file: "lesson.yaml",
        path: "timeline[0].actions[0].value",
        message: "A found result requires a preceding equal comparison.",
      },
    ],
  });
});

test("tracks show and hide actions as semantic visibility", () => {
  const migrated = migrateLessonSource(
    {
      ...validTwoPointersSource,
      timeline: [
        {
          id: "hide-label",
          narration: "Hide the target label.",
          actions: [{ type: "hide", objectId: "target-label" }],
        },
        {
          id: "show-label",
          narration: "Show the target label.",
          terminal: true,
          actions: [{ type: "show", objectId: "target-label" }],
        },
      ],
    },
    "lesson.yaml",
  );
  if (!migrated.ok) {
    throw new Error("Expected the visibility fixture to be valid.");
  }

  const compiled = compileLesson(migrated.value, compiledContent);

  expect(compiled.ok).toBe(true);
  if (!compiled.ok) return;
  expect(
    compiled.value.snapshots.map(
      (snapshot) =>
        snapshot.objects.find(({ id }) => id === "target-label")?.visible,
    ),
  ).toEqual([true, false, true]);
});

test("diagnoses a found result after a pointer moves away from equality", () => {
  const source = sourceWithPointersInReverseOrder();
  const migrated = migrateLessonSource(
    {
      ...source,
      scene: {
        ...source.scene,
        objects: source.scene.objects.map((object) => {
          if (object.id === "left-pointer") return { ...object, index: 2 };
          if (object.id === "right-pointer") return { ...object, index: 4 };
          return object;
        }),
      },
      timeline: [
        {
          id: "compare-equal",
          narration: "Compare an equal pair.",
          actions: [{ type: "compare", objectId: "pair-comparison" }],
        },
        {
          id: "move-away",
          narration: "Move away from the equal pair.",
          actions: [{ type: "move", objectId: "left-pointer", toIndex: 3 }],
        },
        {
          id: "stale-result",
          narration: "Try to reuse the stale comparison.",
          terminal: true,
          actions: [
            {
              type: "set",
              objectId: "pair-result",
              property: "status",
              value: "found",
            },
          ],
        },
      ],
    },
    "lesson.yaml",
  );
  if (!migrated.ok) {
    throw new Error("Expected the stale-comparison fixture to be valid.");
  }

  const compiled = compileLesson(migrated.value, compiledContent);

  expect(compiled).toEqual({
    ok: false,
    diagnostics: [
      {
        code: "reference.invalid",
        file: "lesson.yaml",
        path: "timeline[2].actions[0].value",
        message:
          "A found result requires an equal comparison at the current pointer positions.",
      },
    ],
  });
});

test("diagnoses an initial pointer at the target array length", () => {
  const source = sourceWithPointersInReverseOrder();
  const rightPointer = source.scene.objects[1];
  if (rightPointer?.kind !== "pointer") {
    throw new Error(
      "Expected the compiler fixture to contain a right pointer.",
    );
  }
  const compiled = compileLesson(
    {
      ...source,
      scene: {
        ...source.scene,
        objects: [
          source.scene.objects[0]!,
          { ...rightPointer, index: 6 },
          ...source.scene.objects.slice(2),
        ],
      },
    },
    compiledContent,
  );

  expect(compiled).toEqual({
    ok: false,
    diagnostics: [
      {
        code: "reference.invalid",
        file: "lesson.yaml",
        path: "scene.objects[1].index",
        message:
          'Pointer "right-pointer" index 6 is outside target array "values" (length 6).',
      },
    ],
  });
});

test("diagnoses a found result using the same array index twice", () => {
  const source = sourceWithPointersInReverseOrder();
  const migrated = migrateLessonSource(
    {
      ...source,
      scene: {
        ...source.scene,
        target: 22,
        objects: source.scene.objects.map((object) => {
          if (object.kind === "pointer") return { ...object, index: 4 };
          if (object.kind === "comparison") return { ...object, target: 22 };
          return object;
        }),
      },
      timeline: [
        {
          id: "compare-same-index",
          narration: "Compare the same index through both pointers.",
          actions: [{ type: "compare", objectId: "pair-comparison" }],
        },
        {
          id: "invalid-found-result",
          narration: "Try to publish one index as a pair.",
          terminal: true,
          actions: [
            {
              type: "set",
              objectId: "pair-result",
              property: "status",
              value: "found",
            },
          ],
        },
      ],
    },
    "lesson.yaml",
  );
  if (!migrated.ok) {
    throw new Error(
      "Expected the same-index fixture to be valid authoring data.",
    );
  }

  const compiled = compileLesson(migrated.value, compiledContent);

  expect(compiled).toEqual({
    ok: false,
    diagnostics: [
      {
        code: "reference.invalid",
        file: "lesson.yaml",
        path: "timeline[1].actions[0].value",
        message: "A found result requires two distinct pointer indices.",
      },
    ],
  });
});

test("rejects an authored found result at the direct compiler boundary", () => {
  const source = sourceWithPointersInReverseOrder();
  const authoredFound = {
    ...source,
    scene: {
      ...source.scene,
      objects: source.scene.objects.map((object) =>
        object.kind === "result" ? { ...object, status: "found" } : object,
      ),
    },
  } as unknown as LessonSourceV1;

  const compiled = compileLesson(authoredFound, compiledContent);

  expect(compiled).toEqual({
    ok: false,
    diagnostics: [
      {
        code: "schema.invalid",
        file: "lesson.yaml",
        path: "scene.objects[5].status",
        message: "The value does not satisfy the V1 lesson contract.",
      },
    ],
  });
});

test("rejects the synthetic initial snapshot id in authored steps", () => {
  const source = sourceWithPointersInReverseOrder();
  const firstStep = source.timeline[0];
  if (!firstStep) throw new Error("Expected a compiler fixture timeline.");

  const compiled = compileLesson(
    {
      ...source,
      timeline: [{ ...firstStep, id: "initial", terminal: true }],
    },
    compiledContent,
  );

  expect(compiled).toEqual({
    ok: false,
    diagnostics: [
      {
        code: "reference.invalid",
        file: "lesson.yaml",
        path: "timeline[0].id",
        message:
          'Timeline step id "initial" is reserved for the synthetic initial snapshot.',
      },
    ],
  });
});

test("rejects not-found for a current distinct equal pair", () => {
  const source = sourceWithPointersInReverseOrder();
  const migrated = migrateLessonSource(
    {
      ...source,
      scene: {
        ...source.scene,
        objects: source.scene.objects.map((object) => {
          if (object.id === "left-pointer") return { ...object, index: 2 };
          if (object.id === "right-pointer") return { ...object, index: 4 };
          return object;
        }),
      },
      timeline: [
        {
          id: "compare-equal-pair",
          narration: "Compare the current distinct equal pair.",
          actions: [{ type: "compare", objectId: "pair-comparison" }],
        },
        {
          id: "invalid-not-found",
          narration: "Try to publish not-found for the equal pair.",
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
  if (!migrated.ok) {
    throw new Error(
      "Expected the equal-pair fixture to be valid authoring data.",
    );
  }

  const compiled = compileLesson(migrated.value, compiledContent);

  expect(compiled).toEqual({
    ok: false,
    diagnostics: [
      {
        code: "reference.invalid",
        file: "lesson.yaml",
        path: "timeline[1].actions[0].value",
        message:
          "A not-found result cannot discard a current distinct equal pair.",
      },
    ],
  });
});

test("rejects not-found before pointers are exhausted", () => {
  const source = sourceWithPointersInReverseOrder();
  const migrated = migrateLessonSource(
    {
      ...source,
      timeline: [
        {
          id: "immediate-not-found",
          narration: "Try to publish not-found before exhausting the search.",
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
  if (!migrated.ok) {
    throw new Error("Expected the before-exhaustion fixture to be valid.");
  }

  const compiled = compileLesson(migrated.value, compiledContent);

  expect(compiled).toEqual({
    ok: false,
    diagnostics: [
      {
        code: "reference.invalid",
        file: "lesson.yaml",
        path: "timeline[0].actions[0].value",
        message:
          "A not-found result requires exhausted or crossed pointers (left >= right).",
      },
    ],
  });
});

test("publishes not-found after pointers cross without an equal pair", () => {
  const source = sourceWithPointersInReverseOrder();
  const migrated = migrateLessonSource(
    {
      ...source,
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
  if (!migrated.ok) {
    throw new Error("Expected the crossed-pointer fixture to be valid.");
  }

  const compiled = compileLesson(migrated.value, compiledContent);

  expect(compiled.ok).toBe(true);
  if (!compiled.ok) return;
  expect(compiled.value.snapshots.at(-1)).toMatchObject({
    pointers: { "left-pointer": 5, "right-pointer": 4 },
    result: { kind: "not-found" },
    terminal: true,
  });
  expect(
    compiled.value.snapshots
      .at(-1)
      ?.objects.find(({ id }) => id === "pair-result"),
  ).toMatchObject({ status: "not-found" });
});

test("rejects ambiguous result association for multiple comparisons", () => {
  const source = sourceWithPointersInReverseOrder();
  const migrated = migrateLessonSource(
    {
      ...source,
      scene: {
        ...source.scene,
        objects: [
          ...source.scene.objects,
          {
            id: "other-comparison",
            kind: "comparison",
            arrayObjectId: "values",
            leftPointerId: "left-pointer",
            rightPointerId: "right-pointer",
            target: 15,
          },
        ],
      },
    },
    "lesson.yaml",
  );
  if (!migrated.ok) {
    throw new Error("Expected the ambiguous-result fixture to be valid.");
  }

  const compiled = compileLesson(migrated.value, compiledContent);

  expect(compiled).toEqual({
    ok: false,
    diagnostics: [
      {
        code: "reference.invalid",
        file: "lesson.yaml",
        path: "timeline[2].actions[0].objectId",
        message:
          "A result action requires exactly one V1 comparison object; found 2.",
      },
    ],
  });
});

test("aggregates independent action diagnostics in canonical path order", () => {
  const source = sourceWithPointersInReverseOrder();
  const timeline = [
    {
      id: "invalid-actions",
      narration: "Exercise independent incompatible actions.",
      terminal: true as const,
      actions: [
        { type: "move" as const, objectId: "values", toIndex: 1 },
        {
          type: "highlight" as const,
          objectId: "left-pointer",
          indices: [0],
          tone: "compare" as const,
        },
      ],
    },
  ];
  const forward = compileLesson({ ...source, timeline }, compiledContent);
  const reversed = compileLesson(
    {
      ...source,
      scene: { ...source.scene, objects: [...source.scene.objects].reverse() },
      timeline,
    },
    compiledContent,
  );
  const expected = {
    ok: false,
    diagnostics: [
      {
        code: "reference.wrong-kind",
        file: "lesson.yaml",
        path: "timeline[0].actions[0].objectId",
        message:
          'Action "move" requires a pointer, but "values" resolves to an array.',
      },
      {
        code: "reference.wrong-kind",
        file: "lesson.yaml",
        path: "timeline[0].actions[1].objectId",
        message:
          'Action "highlight" requires an array, but "left-pointer" resolves to a pointer.',
      },
    ],
  };

  expect(forward).toEqual(expected);
  expect(reversed).toEqual(expected);
});

test("scopes highlights and comparisons to the step that sets them", async () => {
  const lesson = await compileLessonPackage(twoPointersDirectory);

  expect(
    lesson.snapshots.map((snapshot) => ({
      stepId: snapshot.stepId,
      highlights: snapshot.highlights,
      comparedSum: snapshot.comparison?.actual ?? null,
    })),
  ).toEqual([
    { stepId: "initial", highlights: {}, comparedSum: null },
    { stepId: "compare-ends", highlights: { values: [0, 5] }, comparedSum: 16 },
    { stepId: "move-right", highlights: {}, comparedSum: null },
    {
      stepId: "compare-one-eleven",
      highlights: { values: [0, 4] },
      comparedSum: 12,
    },
    { stepId: "move-left-to-two", highlights: {}, comparedSum: null },
    {
      stepId: "compare-two-eleven",
      highlights: { values: [1, 4] },
      comparedSum: 13,
    },
    { stepId: "move-left-to-four", highlights: {}, comparedSum: null },
    {
      stepId: "compare-four-eleven",
      highlights: { values: [2, 4] },
      comparedSum: 15,
    },
    { stepId: "pair-found", highlights: { values: [2, 4] }, comparedSum: null },
  ]);
});

test("compiles each declared implementation with its own source text", async () => {
  const lesson = await compileLessonPackage(twoPointersDirectory);
  const examples = lesson.content.examples ?? [];

  function declaredNamingConvention(code: string): string {
    if (code.includes("find_pair_with_sum")) return "snake_case";
    if (code.includes("findPairWithSum")) return "camelCase";
    if (code.includes("FindPairWithSum")) return "PascalCase";
    return "missing";
  }

  expect(
    examples.map(({ code, file, language }) => ({
      declaresFunction: declaredNamingConvention(code),
      file,
      language,
    })),
  ).toEqual([
    {
      declaresFunction: "snake_case",
      file: "examples/find_pair_with_sum.py",
      language: "python",
    },
    {
      declaresFunction: "camelCase",
      file: "examples/find-pair-with-sum.ts",
      language: "typescript",
    },
    {
      declaresFunction: "camelCase",
      file: "examples/FindPairWithSum.java",
      language: "java",
    },
    {
      declaresFunction: "snake_case",
      file: "examples/find_pair_with_sum.cpp",
      language: "cpp",
    },
    {
      declaresFunction: "PascalCase",
      file: "examples/find_pair_with_sum.go",
      language: "go",
    },
  ]);
});
