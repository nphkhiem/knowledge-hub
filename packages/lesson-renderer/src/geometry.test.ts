import { expect, test } from "vitest";

import type { SemanticSnapshot } from "@knowledge-hub/lesson-compiler";

import {
  ARRAY_TOP,
  ROW_STRIDE,
  createRenderContext,
  logicalHeightFor,
} from "./geometry.js";

function snapshotWith(
  arrays: readonly { id: string; values: number[] }[],
): SemanticSnapshot {
  return {
    stepId: "only",
    narration: "",
    terminal: true,
    highlights: {},
    pointers: {},
    objects: arrays.map((array) => ({
      id: array.id,
      kind: "array",
      label: array.id,
      values: array.values,
    })),
  } as unknown as SemanticSnapshot;
}

const presentation = {} as never;

test("each array gets its own vertical band", () => {
  const context = createRenderContext(
    snapshotWith([
      { id: "input", values: [1, 2, 3, 4] },
      { id: "budget", values: [1, 2, 3, 4, 5, 6, 7, 8] },
    ]),
    presentation,
  );

  expect({
    input: context.geometryFor("input").top,
    budget: context.geometryFor("budget").top,
  }).toEqual({ input: ARRAY_TOP, budget: ARRAY_TOP + ROW_STRIDE });
});

test("each array sizes its cells from its own length", () => {
  const context = createRenderContext(
    snapshotWith([
      { id: "input", values: [1, 2, 3, 4] },
      { id: "budget", values: [1, 2, 3, 4, 5, 6, 7, 8] },
    ]),
    presentation,
  );

  const input = context.geometryFor("input");
  const budget = context.geometryFor("budget");

  // Sharing one geometry sized the wider array's cells for the narrower one,
  // which pushed its last cells outside the figure.
  expect({
    inputCells: input.cellCount,
    budgetCells: budget.cellCount,
    budgetNarrower: budget.cellWidth < input.cellWidth,
    budgetFits: budget.left + budget.cellWidth * budget.cellCount <= 960,
  }).toEqual({
    inputCells: 4,
    budgetCells: 8,
    budgetNarrower: true,
    budgetFits: true,
  });
});

test("two arrays never overlap vertically", () => {
  const context = createRenderContext(
    snapshotWith([
      { id: "first", values: [1] },
      { id: "second", values: [1] },
    ]),
    presentation,
  );

  const first = context.geometryFor("first");
  const second = context.geometryFor("second");
  // The first band reaches 160 below its top for a pointer's text; the second
  // begins its label 112 above its own top.
  expect(second.top - 112).toBeGreaterThan(first.top + first.height + 64);
});

test("the figure grows only when it carries more than one array", () => {
  expect({
    one: logicalHeightFor(1),
    two: logicalHeightFor(2),
    three: logicalHeightFor(3),
  }).toEqual({ one: 420, two: 420 + ROW_STRIDE, three: 420 + ROW_STRIDE * 2 });
});

test("an unknown object falls back to the first array's band", () => {
  const context = createRenderContext(
    snapshotWith([{ id: "only", values: [1, 2] }]),
    presentation,
  );

  expect(context.geometryFor("missing")).toEqual(context.geometry);
});
