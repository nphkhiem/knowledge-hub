import type { SemanticSnapshot } from "@knowledge-hub/lesson-compiler";
import { compiledTwoPointersLesson } from "@knowledge-hub/lesson-testing";
import { expect, test } from "vitest";
import { describeSnapshot } from "./index.js";

function snapshotAt(index: number): SemanticSnapshot {
  const snapshot = compiledTwoPointersLesson.snapshots[index];
  if (snapshot === undefined) {
    throw new Error(`The fixture lesson has no snapshot ${index}.`);
  }
  return snapshot;
}

test("describes a comparison from the values the pointers currently address", () => {
  expect(describeSnapshot(snapshotAt(1))).toBe(
    "Compare 1 at the left pointer with 15 at the right pointer. Their sum is 16, greater than the target 15.",
  );
});

test("describes a sum below the target with its own relation wording", () => {
  expect(describeSnapshot(snapshotAt(3))).toBe(
    "Compare 1 at the left pointer with 11 at the right pointer. Their sum is 12, less than the target 15.",
  );
});

test("falls back to authored narration when no comparison describes the current pointers", () => {
  expect({
    afterMove: describeSnapshot(snapshotAt(2)),
    initial: describeSnapshot(snapshotAt(0)),
  }).toEqual({
    afterMove:
      "Move the right pointer left because the current sum is too large.",
    initial:
      "The left pointer starts at value 1 and the right pointer starts at value 15. The target is 15.",
  });
});

test("adds the outcome sentence once the result resolves", () => {
  expect(describeSnapshot(snapshotAt(8))).toBe(
    "Compare 4 at the left pointer with 11 at the right pointer. Their sum is 15, equal to the target 15. The pair at indices 2 and 4 sums to the target.",
  );
});

test("states no sum on the steps that only move a pointer", () => {
  const moveStepDescriptions = [2, 4, 6].map((index) => ({
    stepId: snapshotAt(index).stepId,
    statesASum: describeSnapshot(snapshotAt(index)).includes("Their sum is"),
  }));

  expect(moveStepDescriptions).toEqual([
    { stepId: "move-right", statesASum: false },
    { stepId: "move-left-to-two", statesASum: false },
    { stepId: "move-left-to-four", statesASum: false },
  ]);
});
