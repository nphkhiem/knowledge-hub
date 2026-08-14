import { z } from "zod";

export const domainIdSchema = z.enum(["dsa", "networking", "system-design"]);

export const difficultySchema = z.enum(["easy", "medium", "hard"]);

const objectIdSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const actionTargetSchema = { objectId: objectIdSchema };

export const primitiveKindSchema = z.enum([
  "array",
  "buckets",
  "pointer",
  "window",
  "label",
  "comparison",
  "result",
]);

export const arrayPrimitiveSchema = z.strictObject({
  id: objectIdSchema,
  kind: z.literal("array"),
  label: z.string().min(1),
  values: z.array(z.number()).min(1),
});
export const pointerPrimitiveSchema = z.strictObject({
  id: objectIdSchema,
  kind: z.literal("pointer"),
  label: z.string().min(1),
  targetObjectId: objectIdSchema,
  index: z.number().int().min(0),
});
/**
 * An inclusive range of an array's indices, held as its own object.
 *
 * A window is a range rather than a start and a width, so a lesson that grows
 * or shrinks one can extend this shape instead of replacing it. What keeps a
 * window fixed is the slide action, which refuses to change its width.
 *
 * Both bounds are checked against the array the window covers by the compiler,
 * the way a pointer's index is, because the schema cannot see the array here.
 */
export const windowPrimitiveSchema = z.strictObject({
  id: objectIdSchema,
  kind: z.literal("window"),
  label: z.string().min(1),
  targetObjectId: objectIdSchema,
  start: z.number().int().min(0),
  end: z.number().int().min(0),
});
export const labelPrimitiveSchema = z.strictObject({
  id: objectIdSchema,
  kind: z.literal("label"),
  text: z.string().min(1),
});
/**
 * A value weighed against a target.
 *
 * With both pointers it compares their sum, which is what a pair-sum search
 * asks. With only `leftPointerId` it compares the single value that pointer
 * addresses, which is what a search that probes one position at a time asks.
 * The second pointer is optional rather than a second primitive because the
 * question is the same either way: is this less than, equal to, or greater
 * than the target.
 */
export const comparisonPrimitiveSchema = z.strictObject({
  id: objectIdSchema,
  kind: z.literal("comparison"),
  arrayObjectId: objectIdSchema,
  leftPointerId: objectIdSchema,
  rightPointerId: objectIdSchema.optional(),
  target: z.number(),
});
/**
 * A row of slots, each holding zero or more named entries.
 *
 * The first primitive that is not about a numeric array. Buckets exist to show
 * what a hash trades: a key names its slot directly, so a lookup goes to one
 * place instead of scanning, and two keys naming the same slot is the cost.
 */
export const bucketsPrimitiveSchema = z.strictObject({
  id: objectIdSchema,
  kind: z.literal("buckets"),
  label: z.string().min(1),
  slotCount: z.number().int().min(2).max(12),
  entries: z
    .array(
      z.strictObject({
        key: z.string().min(1).max(24),
        slot: z.number().int().min(0),
      }),
    )
    .max(24),
});
export const resultPrimitiveSchema = z.strictObject({
  id: objectIdSchema,
  kind: z.literal("result"),
  status: z.literal("pending"),
});

export const primitiveSchema = z.discriminatedUnion("kind", [
  arrayPrimitiveSchema,
  bucketsPrimitiveSchema,
  pointerPrimitiveSchema,
  windowPrimitiveSchema,
  labelPrimitiveSchema,
  comparisonPrimitiveSchema,
  resultPrimitiveSchema,
]);

export const sceneSchema = z.strictObject({
  objects: z.array(primitiveSchema).min(1),
});

export const showActionSchema = z.strictObject({
  type: z.literal("show"),
  ...actionTargetSchema,
});
export const hideActionSchema = z.strictObject({
  type: z.literal("hide"),
  ...actionTargetSchema,
});
export const setActionSchema = z.strictObject({
  type: z.literal("set"),
  ...actionTargetSchema,
  property: z.string().min(1),
  value: z.json(),
});
export const moveActionSchema = z.strictObject({
  type: z.literal("move"),
  ...actionTargetSchema,
  toIndex: z.number().int().min(0),
});
export const highlightActionSchema = z.strictObject({
  type: z.literal("highlight"),
  ...actionTargetSchema,
  indices: z.array(z.number().int().min(0)).min(1),
  tone: z.enum(["compare", "success"]),
});
export const compareActionSchema = z.strictObject({
  type: z.literal("compare"),
  ...actionTargetSchema,
});
export const connectActionSchema = z.strictObject({
  type: z.literal("connect"),
  ...actionTargetSchema,
  fromObjectId: objectIdSchema,
  toObjectId: objectIdSchema,
});
export const disconnectActionSchema = z.strictObject({
  type: z.literal("disconnect"),
  ...actionTargetSchema,
});
export const enqueueActionSchema = z.strictObject({
  type: z.literal("enqueue"),
  ...actionTargetSchema,
  value: z.json(),
});
export const dequeueActionSchema = z.strictObject({
  type: z.literal("dequeue"),
  ...actionTargetSchema,
});
/** Places a named entry into one slot of a buckets object. */
export const insertActionSchema = z.strictObject({
  type: z.literal("insert"),
  ...actionTargetSchema,
  key: z.string().min(1).max(24),
  slot: z.number().int().min(0),
});
/**
 * Moves a window to a new inclusive range.
 *
 * The range is absolute rather than a step count, so a step reads as the
 * position it produces and cannot drift from an accumulated offset. The
 * compiler rejects a slide that changes the window's width.
 */
export const slideActionSchema = z.strictObject({
  type: z.literal("slide"),
  ...actionTargetSchema,
  toStart: z.number().int().min(0),
  toEnd: z.number().int().min(0),
});
/**
 * Shrinks a window to a range inside the one it already covers.
 *
 * The counterpart to slide: that action moves a window and keeps its width,
 * this one changes the width and cannot escape the current range. A search that
 * could widen would not be converging on anything, so the compiler rejects it.
 */
export const narrowActionSchema = z.strictObject({
  type: z.literal("narrow"),
  ...actionTargetSchema,
  toStart: z.number().int().min(0),
  toEnd: z.number().int().min(0),
});

export const actionSchema = z.discriminatedUnion("type", [
  showActionSchema,
  hideActionSchema,
  setActionSchema,
  moveActionSchema,
  highlightActionSchema,
  compareActionSchema,
  connectActionSchema,
  disconnectActionSchema,
  enqueueActionSchema,
  dequeueActionSchema,
  insertActionSchema,
  slideActionSchema,
  narrowActionSchema,
]);

export const timelineStepSchema = z.strictObject({
  id: objectIdSchema,
  narration: z.string().min(1),
  actions: z.array(actionSchema).min(1),
  nextStepId: objectIdSchema.optional(),
  terminal: z.literal(true).optional(),
});

export const modelCheckSchema = z.strictObject({
  prompt: z.string().min(1),
  options: z
    .array(
      z.strictObject({
        id: objectIdSchema,
        label: z.string().min(1),
      }),
    )
    .min(2)
    .max(4),
  correctOptionId: objectIdSchema,
  explanation: z.string().min(1),
});

export const accessibilitySchema = z.strictObject({
  summary: z.string().min(1),
  initialDescription: z.string().min(1),
  motionEquivalentLabel: z.string().min(1),
});

const evidenceSourceSchema = z
  .strictObject({
    title: z.string().min(1),
    url: z
      .url()
      .refine((url) => ["http:", "https:"].includes(new URL(url).protocol), {
        message: "Evidence URLs must use HTTP or HTTPS.",
      })
      .optional(),
    citation: z.string().min(1).optional(),
    publisher: z.string().min(1),
    accessedOn: z.iso.date(),
    supports: z.array(z.string().min(1)).min(1),
  })
  .refine(
    (source) => source.url !== undefined || source.citation !== undefined,
    { message: "An evidence source requires a locator." },
  );

export const evidenceSchema = z.strictObject({
  verifiedOn: z.iso.date(),
  scope: z.string().min(1),
  sources: z.array(evidenceSourceSchema).min(1),
});

/**
 * Languages a lesson may publish an implementation in. A language belongs here
 * only once the test suite can execute it, because an untested sample must not
 * ship. See docs/adr/0004.
 */
export const EXAMPLE_LANGUAGES = [
  "python",
  "typescript",
  "java",
  "cpp",
  "go",
] as const;

export type ExampleLanguage = (typeof EXAMPLE_LANGUAGES)[number];

const exampleFileExtensions: Readonly<Record<ExampleLanguage, string>> = {
  cpp: ".cpp",
  go: ".go",
  java: ".java",
  python: ".py",
  typescript: ".ts",
};

export const exampleSchema = z.strictObject({
  language: z.enum(EXAMPLE_LANGUAGES),
  file: z
    .string()
    .regex(
      /^examples\/[A-Za-z0-9][A-Za-z0-9_-]*\.(py|ts|java|cpp|go)$/,
      "An example file must sit directly in examples/ and end in .py, .ts, .java, .cpp, or .go.",
    ),
});

export const examplesSchema = z
  .array(exampleSchema)
  .min(1)
  .max(EXAMPLE_LANGUAGES.length)
  .refine(
    (examples) =>
      new Set(examples.map(({ language }) => language)).size ===
      examples.length,
    { message: "Each language may declare at most one example." },
  )
  .refine(
    (examples) =>
      examples.every(({ file, language }) =>
        file.endsWith(exampleFileExtensions[language]),
      ),
    { message: "An example file extension must match its declared language." },
  )
  .refine(
    (examples) =>
      examples.every(
        ({ file }) =>
          !file.includes("/test_") &&
          !file.endsWith(".test.ts") &&
          !file.endsWith("Test.java") &&
          !file.endsWith("_test.cpp") &&
          !file.endsWith("_test.go"),
      ),
    { message: "Declare the implementation, not its test file." },
  );

export const lessonSourceV1Schema = z.strictObject({
  schemaVersion: z.literal(1),
  id: z.string().regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  domain: domainIdSchema,
  collection: z.literal("interview-foundations"),
  /**
   * Difficulty is metadata, never a route segment. A lesson that is regraded
   * keeps its canonical address, so a published link never moves.
   */
  difficulty: difficultySchema,
  /**
   * Position within the collection. The ceiling was fifteen while Interview
   * Foundations was the whole roadmap; the DSA curriculum alone is larger, so
   * the bound now only rejects values that cannot be a position at all.
   */
  order: z.number().int().min(1).max(200),
  license: z.literal("CC-BY-4.0"),
  title: z.string().min(1),
  durationMinutes: z.number().int().min(3).max(5),
  objective: z.string().min(1),
  recognitionSignals: z.array(z.string().min(1)).min(1).max(5),
  limitations: z.array(z.string().min(1)).min(1).max(3),
  content: z.strictObject({
    quickUnderstanding: z.literal("quick-understanding.md"),
    realWorldApplications: z.literal("real-world-applications.md"),
    deepDive: z.literal("deep-dive.md").optional(),
    examples: examplesSchema.optional(),
  }),
  scene: sceneSchema,
  timeline: z.array(timelineStepSchema).min(1),
  modelCheck: modelCheckSchema,
  accessibility: accessibilitySchema,
  evidence: evidenceSchema,
});

export type LessonSourceV1 = z.infer<typeof lessonSourceV1Schema>;
