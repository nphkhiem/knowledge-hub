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

test("lets the authored narration stand alone on the terminal step", () => {
  expect(describeSnapshot(snapshotAt(8))).toBe(
    "The pointers found the result at indices 2 and 4.",
  );
});

test("adds the outcome sentence when a step both compares and resolves", () => {
  const resolved = snapshotAt(8);
  const compared = snapshotAt(7);
  if (compared.comparison === undefined) {
    throw new Error("The compare-four-eleven snapshot has no comparison.");
  }

  expect(
    describeSnapshot({ ...resolved, comparison: compared.comparison }),
  ).toBe(
    "Compare 4 at the left pointer with 11 at the right pointer. Their sum is 15, equal to the target 15. The pair at indices 2 and 4 sums to the target.",
  );
});

test("refuses to state a sum that the current pointers contradict", () => {
  const compared = snapshotAt(1);
  if (compared.comparison === undefined) {
    throw new Error("The compare-ends snapshot has no comparison.");
  }
  const stale = {
    ...snapshotAt(2),
    comparison: compared.comparison,
  };

  expect({
    stale: describeSnapshot(stale),
    honest: describeSnapshot(compared),
  }).toEqual({
    stale: "Move the right pointer left because the current sum is too large.",
    honest:
      "Compare 1 at the left pointer with 15 at the right pointer. Their sum is 16, greater than the target 15.",
  });
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
