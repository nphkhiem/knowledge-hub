import {
  INTERVAL_CAPACITY,
  QUEUE_CAPACITY,
  STACK_CAPACITY,
  type CompiledSceneObject,
  type SemanticSnapshot,
} from "@knowledge-hub/lesson-compiler";
import {
  compiledTwoPointersLesson,
  runPrimitiveConformance,
  type PrimitiveConformanceContract,
} from "@knowledge-hub/lesson-testing";
import { describe, expect, test } from "vitest";
import { createRenderContext } from "../geometry.js";
import { primitiveContracts } from "../renderSnapshot.js";
import { DRAWN_DEPTH } from "./stack.js";
import { DRAWN_WIDTH } from "./queue.js";
import { DRAWN_ROWS } from "./intervals.js";

const untrustedText = "<script>alert(1)</script>";
const escapedText = "&lt;script&gt;alert(1)&lt;/script&gt;";

function snapshotFor(stepId: string): SemanticSnapshot {
  const snapshot = compiledTwoPointersLesson.snapshots.find(
    (candidate) => candidate.stepId === stepId,
  );
  if (snapshot === undefined) {
    throw new Error(`The fixture lesson has no ${stepId} snapshot.`);
  }
  return snapshot;
}

/**
 * No step of this lesson both compares and resolves, so the state in which all
 * five primitives render is assembled here: the terminal step plus the equal
 * comparison of the step before it, which addresses the same two pointers.
 */
const equalComparison = snapshotFor("compare-four-eleven").comparison;
if (equalComparison === undefined) {
  throw new Error("The compare-four-eleven snapshot has no comparison.");
}

const resolvedSnapshot: SemanticSnapshot = {
  ...snapshotFor("pair-found"),
  comparison: equalComparison,
};

/**
 * Buckets get their own scene rather than joining the Two Pointers one. Adding
 * them there would make that figure two rows tall, and the bounds this contract
 * checks are the single-row ones.
 */
const bucketsObject: CompiledSceneObject = {
  id: "slots",
  kind: "buckets",
  visible: true,
  label: "Buckets",
  slotCount: 4,
  entries: [
    { key: "alpha", slot: 0 },
    { key: "beta", slot: 2 },
    { key: "gamma", slot: 2 },
  ],
};

/** The same primitive at its widest, for the narrow-geometry check. */
const wideBuckets: CompiledSceneObject = {
  ...bucketsObject,
  slotCount: 12,
} as CompiledSceneObject;

const bucketsSnapshot: SemanticSnapshot = {
  ...resolvedSnapshot,
  objects: [bucketsObject],
  highlights: { slots: [2] },
};

/**
 * A window draws over an array's own band instead of claiming a row, so its
 * scene must hold the array it covers. It gets a dedicated one rather than
 * joining Two Pointers, so the covered values stay short enough to state.
 */
const windowArray: CompiledSceneObject = {
  id: "readings",
  kind: "array",
  visible: true,
  label: "Readings",
  values: [4, 2, 7, 1, 9, 3],
};

const windowObject: CompiledSceneObject = {
  id: "frame",
  kind: "window",
  visible: true,
  label: "Window",
  targetObjectId: "readings",
  start: 1,
  end: 3,
};

/** The widest window over the longest array, for the narrow-geometry check. */
const wideWindowArray: CompiledSceneObject = {
  ...windowArray,
  values: Array.from({ length: 40 }, (_, at) => at + 1),
};

const wideWindow: CompiledSceneObject = {
  ...windowObject,
  start: 0,
  end: 39,
};

const untrustedWindow: CompiledSceneObject = {
  ...windowObject,
  label: untrustedText,
};

function windowSceneOf(
  array: CompiledSceneObject,
  frame: CompiledSceneObject,
): SemanticSnapshot {
  return { ...resolvedSnapshot, objects: [array, frame], highlights: {} };
}

const windowSnapshot = windowSceneOf(windowArray, windowObject);

/**
 * A stack claims a row of its own, so it needs its own scene rather than
 * joining Two Pointers: adding it there would make that figure two rows tall
 * and break the single-row bounds this contract checks.
 */
const stackObject: CompiledSceneObject = {
  id: "calls",
  kind: "stack",
  visible: true,
  label: "Calls",
  entries: ["outer", "middle", "inner"],
};

/** The same primitive at its deepest, for the bounds check. */
const fullStack: CompiledSceneObject = {
  ...stackObject,
  entries: ["one", "two", "three", "four", "five", "six"],
};

/** And at its emptiest, which draws a different thing entirely. */
const emptyStack: CompiledSceneObject = { ...stackObject, entries: [] };

const untrustedStack: CompiledSceneObject = {
  ...stackObject,
  label: untrustedText,
  entries: [untrustedText.slice(0, 24)],
};

function stackSceneOf(stack: CompiledSceneObject): SemanticSnapshot {
  return { ...resolvedSnapshot, objects: [stack], highlights: {} };
}

const stackSnapshot = stackSceneOf(stackObject);

/** A queue claims a row of its own, so it gets its own scene like the stack. */
const queueObject: CompiledSceneObject = {
  id: "line",
  kind: "queue",
  visible: true,
  label: "Waiting",
  entries: ["ada", "grace", "alan"],
};

/** The same primitive at its longest, for the bounds check. */
const fullQueue: CompiledSceneObject = {
  ...queueObject,
  entries: ["one", "two", "three", "four", "five", "six"],
};

const emptyQueue: CompiledSceneObject = { ...queueObject, entries: [] };

const untrustedQueue: CompiledSceneObject = {
  ...queueObject,
  label: untrustedText,
  entries: [untrustedText.slice(0, 24)],
};

function queueSceneOf(queue: CompiledSceneObject): SemanticSnapshot {
  return { ...resolvedSnapshot, objects: [queue], highlights: {} };
}

const queueSnapshot = queueSceneOf(queueObject);

/** Intervals claim a row and draw their own bars, so they get their own scene. */
const intervalsObject: CompiledSceneObject = {
  id: "bookings",
  kind: "intervals",
  visible: true,
  label: "Bookings",
  span: 12,
  entries: [
    { start: 1, end: 3 },
    { start: 2, end: 6 },
    { start: 8, end: 10 },
  ],
};

/** The same primitive at its fullest and widest, for the bounds check. */
const fullIntervals: CompiledSceneObject = {
  ...intervalsObject,
  span: 40,
  entries: [
    { start: 0, end: 40 },
    { start: 5, end: 39 },
    { start: 10, end: 38 },
    { start: 15, end: 37 },
    { start: 20, end: 36 },
    { start: 25, end: 35 },
  ],
} as CompiledSceneObject;

const emptyIntervals: CompiledSceneObject = {
  ...intervalsObject,
  entries: [],
} as CompiledSceneObject;

const untrustedIntervals: CompiledSceneObject = {
  ...intervalsObject,
  label: untrustedText,
} as CompiledSceneObject;

function intervalsSceneOf(node: CompiledSceneObject): SemanticSnapshot {
  return { ...resolvedSnapshot, objects: [node], highlights: {} };
}

const intervalsSnapshot = intervalsSceneOf(intervalsObject);

function objectOfKind(
  snapshot: SemanticSnapshot,
  kind: CompiledSceneObject["kind"],
): CompiledSceneObject {
  const object = snapshot.objects.find((candidate) => candidate.kind === kind);
  if (object === undefined) {
    throw new Error(`The ${snapshot.stepId} snapshot has no ${kind} object.`);
  }
  return object;
}

function mapObjects(
  snapshot: SemanticSnapshot,
  map: (object: CompiledSceneObject) => CompiledSceneObject,
): SemanticSnapshot {
  return { ...snapshot, objects: snapshot.objects.map(map) };
}

const narrowSnapshot = mapObjects(resolvedSnapshot, (object) =>
  object.kind === "array"
    ? { ...object, values: Array.from({ length: 40 }, (_, at) => at + 1) }
    : object,
);

const untrustedSnapshot = mapObjects(resolvedSnapshot, (object) => {
  switch (object.kind) {
    case "array":
    case "buckets":
    case "pointer":
    case "window":
    case "stack":
    case "queue":
    case "intervals":
      return { ...object, label: untrustedText };
    case "label":
      return { ...object, text: untrustedText };
    case "comparison":
    case "result":
      return object;
  }
});

const untrustedBuckets: CompiledSceneObject = {
  ...bucketsObject,
  label: untrustedText,
  entries: [{ key: untrustedText.slice(0, 24), slot: 0 }],
};

/** Only these primitives draw an author-controlled string of their own. */
const authorTextKinds: ReadonlySet<CompiledSceneObject["kind"]> = new Set([
  "array",
  "buckets",
  "pointer",
  "window",
  "stack",
  "queue",
  "intervals",
  "label",
]);

/** The hostile counterpart of a scene object, so the payload is really rendered. */
const untrustedObjects = new Map(
  untrustedSnapshot.objects.map((object) => [object.id, object]),
);

function contractFor(
  kind: CompiledSceneObject["kind"],
): PrimitiveConformanceContract {
  const primitive = primitiveContracts[kind];
  if (kind === "buckets") {
    const scene = createRenderContext(bucketsSnapshot, "interactive");
    const wide = createRenderContext(
      { ...bucketsSnapshot, objects: [wideBuckets] },
      "interactive",
    );
    const hostile = createRenderContext(
      { ...bucketsSnapshot, objects: [untrustedBuckets] },
      "interactive",
    );
    return {
      accepts: (object) => primitive.accepts(object),
      describe: (object) => primitive.describe(object, scene),
      kind,
      renderInteractive: (object) => primitive.render(object, scene),
      renderNarrow: () => primitive.render(wideBuckets, wide),
      renderStatic: (object) =>
        primitive.render(
          object,
          createRenderContext(bucketsSnapshot, "static"),
        ),
      renderUntrusted: () => primitive.render(untrustedBuckets, hostile),
    };
  }
  if (kind === "intervals") {
    const scene = createRenderContext(intervalsSnapshot, "interactive");
    const widest = createRenderContext(
      intervalsSceneOf(fullIntervals),
      "interactive",
    );
    const hostile = createRenderContext(
      intervalsSceneOf(untrustedIntervals),
      "interactive",
    );
    return {
      accepts: (object) => primitive.accepts(object),
      describe: (object) => primitive.describe(object, scene),
      kind,
      renderInteractive: (object) => primitive.render(object, scene),
      renderNarrow: () => primitive.render(fullIntervals, widest),
      renderStatic: (object) =>
        primitive.render(
          object,
          createRenderContext(intervalsSnapshot, "static"),
        ),
      renderUntrusted: () => primitive.render(untrustedIntervals, hostile),
    };
  }
  if (kind === "queue") {
    const scene = createRenderContext(queueSnapshot, "interactive");
    const longest = createRenderContext(queueSceneOf(fullQueue), "interactive");
    const hostile = createRenderContext(
      queueSceneOf(untrustedQueue),
      "interactive",
    );
    return {
      accepts: (object) => primitive.accepts(object),
      describe: (object) => primitive.describe(object, scene),
      kind,
      renderInteractive: (object) => primitive.render(object, scene),
      renderNarrow: () => primitive.render(fullQueue, longest),
      renderStatic: (object) =>
        primitive.render(object, createRenderContext(queueSnapshot, "static")),
      renderUntrusted: () => primitive.render(untrustedQueue, hostile),
    };
  }
  if (kind === "stack") {
    const scene = createRenderContext(stackSnapshot, "interactive");
    const deep = createRenderContext(stackSceneOf(fullStack), "interactive");
    const hostile = createRenderContext(
      stackSceneOf(untrustedStack),
      "interactive",
    );
    return {
      accepts: (object) => primitive.accepts(object),
      describe: (object) => primitive.describe(object, scene),
      kind,
      renderInteractive: (object) => primitive.render(object, scene),
      renderNarrow: () => primitive.render(fullStack, deep),
      renderStatic: (object) =>
        primitive.render(object, createRenderContext(stackSnapshot, "static")),
      renderUntrusted: () => primitive.render(untrustedStack, hostile),
    };
  }
  if (kind === "window") {
    const scene = createRenderContext(windowSnapshot, "interactive");
    const wide = createRenderContext(
      windowSceneOf(wideWindowArray, wideWindow),
      "interactive",
    );
    const hostile = createRenderContext(
      windowSceneOf(windowArray, untrustedWindow),
      "interactive",
    );
    return {
      accepts: (object) => primitive.accepts(object),
      describe: (object) => primitive.describe(object, scene),
      kind,
      renderInteractive: (object) => primitive.render(object, scene),
      renderNarrow: () => primitive.render(wideWindow, wide),
      renderStatic: (object) =>
        primitive.render(object, createRenderContext(windowSnapshot, "static")),
      renderUntrusted: () => primitive.render(untrustedWindow, hostile),
    };
  }
  const interactive = createRenderContext(resolvedSnapshot, "interactive");
  const staticView = createRenderContext(resolvedSnapshot, "static");
  const narrow = createRenderContext(narrowSnapshot, "interactive");
  const untrusted = createRenderContext(untrustedSnapshot, "interactive");

  return {
    accepts: (object) => primitive.accepts(object),
    describe: (object) => primitive.describe(object, interactive),
    kind,
    renderInteractive: (object) => primitive.render(object, interactive),
    renderNarrow: (object) => primitive.render(object, narrow),
    renderStatic: (object) => primitive.render(object, staticView),
    renderUntrusted: (object) =>
      primitive.render(untrustedObjects.get(object.id) ?? object, untrusted),
  };
}

const foreignKinds: Readonly<
  Record<CompiledSceneObject["kind"], CompiledSceneObject["kind"]>
> = {
  array: "pointer",
  buckets: "array",
  comparison: "result",
  label: "array",
  pointer: "label",
  window: "array",
  stack: "array",
  queue: "array",
  intervals: "array",
  result: "comparison",
};

const fixtureObjects: Partial<
  Record<CompiledSceneObject["kind"], CompiledSceneObject>
> = {
  buckets: bucketsObject,
  window: windowObject,
  stack: stackObject,
  queue: queueObject,
  intervals: intervalsObject,
};

for (const kind of [
  "array",
  "buckets",
  "pointer",
  "window",
  "stack",
  "queue",
  "intervals",
  "label",
  "comparison",
  "result",
] as const) {
  describe(`${kind} primitive`, () => {
    runPrimitiveConformance(contractFor(kind), {
      emitsAuthorText: authorTextKinds.has(kind),
      escapedText,
      foreignObject: objectOfKind(resolvedSnapshot, foreignKinds[kind]),
      logicalHeight: 420,
      logicalWidth: 960,
      object: fixtureObjects[kind] ?? objectOfKind(resolvedSnapshot, kind),
      untrustedText,
    });
  });
}

describe("stack primitive, beyond the shared contract", () => {
  const scene = createRenderContext(stackSnapshot, "interactive");
  const stack = primitiveContracts.stack;

  test("names the top entry in words rather than by color alone", () => {
    const markup = stack.render(stackObject, scene);

    expect({
      captionsTheTop: markup.includes("top, next out"),
      // The caption must appear once. Two would mean every entry claims to be
      // the one that comes back next.
      captions: markup.split("top, next out").length - 1,
    }).toEqual({ captionsTheTop: true, captions: 1 });
  });

  test("states the order top down, which is the whole subject", () => {
    expect(stack.describe(stackObject, scene)).toBe(
      "Calls: 3 entries, top to bottom: inner, middle, outer",
    );
  });

  test("reserves room for exactly as many entries as an author may write", () => {
    // The renderer keeps its own constant so that no runtime value is imported
    // from the compiler into the browser bundle. This is what keeps the two
    // honest instead of the import that used to.
    expect(DRAWN_DEPTH).toBe(STACK_CAPACITY);
  });

  test("says an empty stack is empty instead of drawing nothing", () => {
    const emptyScene = createRenderContext(
      stackSceneOf(emptyStack),
      "interactive",
    );

    expect({
      describes: stack.describe(emptyStack, emptyScene),
      saysSo: stack.render(emptyStack, emptyScene).includes(">empty<"),
    }).toEqual({ describes: "Calls: empty", saysSo: true });
  });
});

describe("queue primitive, beyond the shared contract", () => {
  const scene = createRenderContext(queueSnapshot, "interactive");
  const queue = primitiveContracts.queue;

  test("captions both ends in words rather than by position alone", () => {
    const markup = queue.render(queueObject, scene);

    expect({
      backs: markup.split(">back<").length - 1,
      fronts: markup.split("front, next out").length - 1,
    }).toEqual({ backs: 1, fronts: 1 });
  });

  test("states the order front to back, the reverse of the stack's", () => {
    expect(queue.describe(queueObject, scene)).toBe(
      "Waiting: 3 entries, front to back: ada, grace, alan",
    );
  });

  test("reserves room for exactly as many entries as an author may write", () => {
    expect(DRAWN_WIDTH).toBe(QUEUE_CAPACITY);
  });

  test("says an empty queue is empty instead of drawing nothing", () => {
    const emptyScene = createRenderContext(
      queueSceneOf(emptyQueue),
      "interactive",
    );

    expect({
      describes: queue.describe(emptyQueue, emptyScene),
      saysSo: queue.render(emptyQueue, emptyScene).includes(">empty<"),
    }).toEqual({ describes: "Waiting: empty", saysSo: true });
  });

  test("a single entry is both the front and the back", () => {
    const one = { ...queueObject, entries: ["only"] } as CompiledSceneObject;
    const markup = queue.render(
      one,
      createRenderContext(queueSceneOf(one), "interactive"),
    );

    expect({
      back: markup.includes(">back<"),
      front: markup.includes("front, next out"),
    }).toEqual({ back: false, front: true });
  });
});

describe("intervals primitive, beyond the shared contract", () => {
  const scene = createRenderContext(intervalsSnapshot, "interactive");
  const intervals = primitiveContracts.intervals;

  test("states every span in text, not only as a bar", () => {
    // Overlap is the subject, and a reader who cannot see the bars still has
    // to be able to tell that two of these overlap.
    expect(intervals.describe(intervalsObject, scene)).toBe(
      "Bookings: 3 intervals, 1 to 3, 2 to 6, 8 to 10",
    );
  });

  test("draws each interval on its own row so overlaps stay legible", () => {
    const markup = intervals.render(intervalsObject, scene);
    const rows = [
      ...markup.matchAll(/data-interval-index="(\d+)" x="[^"]*" y="([^"]*)"/g),
    ];

    expect({
      count: rows.length,
      distinctRows: new Set(rows.map((row) => row[2])).size,
    }).toEqual({ count: 3, distinctRows: 3 });
  });

  test("reserves room for exactly as many intervals as an author may write", () => {
    expect(DRAWN_ROWS).toBe(INTERVAL_CAPACITY);
  });

  test("says so when nothing is left rather than drawing a bare axis", () => {
    const emptyScene = createRenderContext(
      intervalsSceneOf(emptyIntervals),
      "interactive",
    );

    expect({
      describes: intervals.describe(emptyIntervals, emptyScene),
      saysSo: intervals
        .render(emptyIntervals, emptyScene)
        .includes(">nothing left<"),
    }).toEqual({ describes: "Bookings: nothing left", saysSo: true });
  });
});
