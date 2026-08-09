import { compiledTwoPointersLesson } from "@knowledge-hub/lesson-testing";
import { expect, test } from "vitest";
import { renderMotionEquivalent, renderSnapshot } from "./index.js";

test("turns every compiled snapshot into one ordered, numbered step", () => {
  const steps = renderMotionEquivalent(compiledTwoPointersLesson);

  expect({
    count: steps.length,
    firstStep: {
      narration: steps[0]?.narration,
      stepId: steps[0]?.stepId,
      stepNumber: steps[0]?.stepNumber,
    },
    lastStep: {
      narration: steps.at(-1)?.narration,
      stepId: steps.at(-1)?.stepId,
      stepNumber: steps.at(-1)?.stepNumber,
    },
    stepNumbers: steps.map((step) => step.stepNumber),
  }).toEqual({
    count: 9,
    firstStep: {
      narration:
        "The left pointer starts at value 1 and the right pointer starts at value 15. The target is 15.",
      stepId: "initial",
      stepNumber: 1,
    },
    lastStep: {
      narration: "The pointers found the result at indices 2 and 4.",
      stepId: "pair-found",
      stepNumber: 9,
    },
    stepNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  });
});

test("keeps each step's description aligned with its own snapshot", () => {
  const steps = renderMotionEquivalent(compiledTwoPointersLesson);

  expect([
    steps[0]?.description,
    steps[1]?.description,
    steps[8]?.description,
  ]).toEqual([
    "The left pointer starts at value 1 and the right pointer starts at value 15. The target is 15.",
    "Compare 1 at the left pointer with 15 at the right pointer. Their sum is 16, greater than the target 15.",
    "Compare 4 at the left pointer with 11 at the right pointer. Their sum is 15, equal to the target 15. The pair at indices 2 and 4 sums to the target.",
  ]);
});

test("renders static steps without the interactive object hooks", () => {
  const steps = renderMotionEquivalent(compiledTwoPointersLesson);

  expect({
    interactiveHooks: steps.filter((step) =>
      step.markup.includes("data-object-id"),
    ).length,
    staticFigures: steps.filter((step) => step.markup.startsWith("<svg"))
      .length,
  }).toEqual({ interactiveHooks: 0, staticFigures: 9 });
});

test("exposes the interactive object hooks on the live figure", () => {
  const comparedSnapshot = compiledTwoPointersLesson.snapshots.find(
    (snapshot) => snapshot.stepId === "compare-ends",
  );
  if (comparedSnapshot === undefined) {
    throw new Error("The fixture lesson has no compare-ends snapshot.");
  }
  const rendered = renderSnapshot(comparedSnapshot);

  expect(
    [...rendered.markup.matchAll(/data-object-id="([^"]+)"/g)].map(
      (match) => match[1],
    ),
  ).toEqual(["values", "left", "right", "target-label", "pair-comparison"]);
});
