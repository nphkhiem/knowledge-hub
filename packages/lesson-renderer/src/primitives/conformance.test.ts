import type {
  CompiledSceneObject,
  SemanticSnapshot,
} from "@knowledge-hub/lesson-compiler";
import {
  compiledTwoPointersLesson,
  runPrimitiveConformance,
  type PrimitiveConformanceContract,
} from "@knowledge-hub/lesson-testing";
import { describe, expect, test } from "vitest";
import { createRenderContext } from "../geometry.js";
import { primitiveContracts } from "../renderSnapshot.js";

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
  result: "comparison",
};

const fixtureObjects: Partial<
  Record<CompiledSceneObject["kind"], CompiledSceneObject>
> = {
  buckets: bucketsObject,
  window: windowObject,
  stack: stackObject,
};

for (const kind of [
  "array",
  "buckets",
  "pointer",
  "window",
  "stack",
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
