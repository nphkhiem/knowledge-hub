import type {
  CompiledSceneObject,
  SemanticSnapshot,
} from "@knowledge-hub/lesson-compiler";
import {
  compiledTwoPointersLesson,
  runPrimitiveConformance,
  type PrimitiveConformanceContract,
} from "@knowledge-hub/lesson-testing";
import { describe } from "vitest";
import { createRenderContext } from "../geometry.js";
import { primitiveContracts } from "../renderSnapshot.js";

const untrustedText = "<script>alert(1)</script>";
const escapedText = "&lt;script&gt;alert(1)&lt;/script&gt;";

/** The terminal snapshot is the one state in which every primitive renders. */
const resolvedSnapshot = (() => {
  const snapshot = compiledTwoPointersLesson.snapshots.find(
    (candidate) => candidate.stepId === "pair-found",
  );
  if (snapshot === undefined) {
    throw new Error("The fixture lesson has no pair-found snapshot.");
  }
  return snapshot;
})();

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
    case "pointer":
      return { ...object, label: untrustedText };
    case "label":
      return { ...object, text: untrustedText };
    case "comparison":
    case "result":
      return object;
  }
});

/** Only these primitives draw an author-controlled string of their own. */
const authorTextKinds: ReadonlySet<CompiledSceneObject["kind"]> = new Set([
  "array",
  "pointer",
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
  comparison: "result",
  label: "array",
  pointer: "label",
  result: "comparison",
};

for (const kind of [
  "array",
  "pointer",
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
      object: objectOfKind(resolvedSnapshot, kind),
      untrustedText,
    });
  });
}
