import type { SemanticSnapshot } from "@knowledge-hub/lesson-compiler";
import {
  compiledTwoPointersLesson,
  findOutOfBoundsCoordinates,
} from "@knowledge-hub/lesson-testing";
import { expect, test } from "vitest";
import { renderSnapshot } from "./index.js";

function snapshotAt(index: number): SemanticSnapshot {
  const snapshot = compiledTwoPointersLesson.snapshots[index];
  if (snapshot === undefined) {
    throw new Error(`The fixture lesson has no snapshot ${index}.`);
  }
  return snapshot;
}

function withNarration(
  snapshot: SemanticSnapshot,
  narration: string,
): SemanticSnapshot {
  return { ...snapshot, narration };
}

test("renders a single probed value against its target, not a sum", () => {
  // The comparison primitive words itself separately from the snapshot
  // description, so the probe form needs its own check that it reaches markup.
  const probe: SemanticSnapshot = {
    stepId: "probe",
    narration: "Weigh the probed value.",
    terminal: false,
    objects: [
      {
        id: "readings",
        kind: "array",
        visible: true,
        label: "Readings",
        values: [2, 4, 8, 16, 32],
      },
      {
        id: "probe",
        kind: "pointer",
        visible: true,
        label: "Middle",
        targetObjectId: "readings",
        index: 2,
      },
      {
        id: "against-target",
        kind: "comparison",
        visible: true,
        arrayObjectId: "readings",
        leftPointerId: "probe",
        target: 20,
      },
    ],
    pointers: { probe: 2 },
    highlights: {},
    comparison: { actual: 8, target: 20, relation: "less" },
  };

  const markup = renderSnapshot(probe).markup;

  expect({
    claimsASum: markup.includes("Sum 8"),
    statesTheValue: markup.includes("Value 8 is less than target 20"),
  }).toEqual({ claimsASum: false, statesTheValue: true });
});

test("renders pointers as named SVG groups without color-only meaning", () => {
  const rendered = renderSnapshot(snapshotAt(1));

  expect({
    ariaLabelled: rendered.markup.includes('role="img"'),
    comparisonText: rendered.markup.includes(
      "Sum 16 is greater than target 15",
    ),
    description: rendered.description,
    leftPointerText: rendered.markup.includes(
      "Left pointer at index 0, value 1",
    ),
    rightPointerText: rendered.markup.includes(
      "Right pointer at index 5, value 15",
    ),
    svgRoot: rendered.markup.startsWith("<svg"),
  }).toEqual({
    ariaLabelled: true,
    comparisonText: true,
    description:
      "Compare 1 at the left pointer with 15 at the right pointer. Their sum is 16, greater than the target 15.",
    leftPointerText: true,
    rightPointerText: true,
    svgRoot: true,
  });
});

test("names the figure with its own description through aria-labelledby", () => {
  const rendered = renderSnapshot(snapshotAt(1));
  const titleId = /aria-labelledby="([^"]+)"/.exec(rendered.markup)?.[1];

  expect({
    hasTitleId: titleId !== undefined,
    titleCarriesDescription: rendered.markup.includes(
      `<title id="${titleId}">${rendered.description}</title>`,
    ),
  }).toEqual({ hasTitleId: true, titleCarriesDescription: true });
});

test("reports the fixed logical viewBox for every snapshot", () => {
  const rendered = compiledTwoPointersLesson.snapshots.map((snapshot) =>
    renderSnapshot(snapshot),
  );

  expect({
    heights: new Set(rendered.map((view) => view.logicalHeight)),
    viewBoxes: new Set(
      rendered.map(
        (view) => /viewBox="([^"]+)"/.exec(view.markup)?.[1] ?? "missing",
      ),
    ),
    widths: new Set(rendered.map((view) => view.logicalWidth)),
  }).toEqual({
    heights: new Set([420]),
    viewBoxes: new Set(["0 0 960 420"]),
    widths: new Set([960]),
  });
});

test("escapes lesson text before serializing controlled markup", () => {
  const snapshot = withNarration(snapshotAt(0), "<script>alert(1)</script>");
  const markup = renderSnapshot(snapshot).markup;

  expect({
    escaped: markup.includes("&lt;script&gt;alert(1)&lt;/script&gt;"),
    raw: markup.includes("<script>"),
  }).toEqual({ escaped: true, raw: false });
});

test("carries no literal color or animation timing into generated markup", () => {
  const markup = compiledTwoPointersLesson.snapshots
    .map((snapshot) => renderSnapshot(snapshot).markup)
    .join("");

  expect({
    animation: /animate|transition|@keyframes|dur=/i.test(markup),
    hexColors: markup.match(/#[0-9a-f]{3,8}\b/gi) ?? [],
    namedFills: markup.match(/(?:fill|stroke)="(?!var\()[^"]*"/g) ?? [],
  }).toEqual({ animation: false, hexColors: [], namedFills: [] });
});

test("omits the comparison group on steps that only move a pointer", () => {
  expect({
    afterMove: renderSnapshot(snapshotAt(2)).markup.includes("Sum 16"),
    whenCompared: renderSnapshot(snapshotAt(1)).markup.includes("Sum 16"),
  }).toEqual({ afterMove: false, whenCompared: true });
});

test("announces the resolved pair only on the terminal snapshot", () => {
  expect({
    beforeResult: renderSnapshot(snapshotAt(7)).markup.includes(
      "Pair found at indices 2 and 4",
    ),
    onResult: renderSnapshot(snapshotAt(8)).markup.includes(
      "Pair found at indices 2 and 4",
    ),
  }).toEqual({ beforeResult: false, onResult: true });
});

test("marks highlighted cells with a stroke weight rather than color alone", () => {
  const markup = renderSnapshot(snapshotAt(1)).markup;
  const cells = markup.match(/<rect[^>]*data-cell-index="\d+"[^>]*>/g) ?? [];
  const emphasized = cells.filter((cell) =>
    cell.includes('stroke-width="var(--visual-active-stroke-width)"'),
  );

  expect({
    cellCount: cells.length,
    emphasizedCount: emphasized.length,
  }).toEqual({ cellCount: 6, emphasizedCount: 2 });
});

test("keeps every shape and label inside the logical viewBox for a long array", () => {
  const values = Array.from({ length: 40 }, (_, index) => index + 1);
  const snapshot = snapshotAt(1);
  const objects = snapshot.objects.map((object) =>
    object.kind === "array" ? { ...object, values } : object,
  );
  const rendered = renderSnapshot({ ...snapshot, objects });

  expect(
    findOutOfBoundsCoordinates(
      rendered.markup,
      rendered.logicalWidth,
      rendered.logicalHeight,
    ),
  ).toEqual([]);
});

test("keeps every shape and label inside the logical viewBox for every snapshot", () => {
  const offenders = compiledTwoPointersLesson.snapshots.flatMap((snapshot) => {
    const rendered = renderSnapshot(snapshot);
    return findOutOfBoundsCoordinates(
      rendered.markup,
      rendered.logicalWidth,
      rendered.logicalHeight,
    ).map((offender) => `${snapshot.stepId}: ${offender}`);
  });

  expect(offenders).toEqual([]);
});
