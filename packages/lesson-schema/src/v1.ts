import { z } from "zod";

export const domainIdSchema = z.enum(["dsa", "networking", "system-design"]);

const objectIdSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const actionTargetSchema = { objectId: objectIdSchema };

export const primitiveKindSchema = z.enum([
  "array",
  "pointer",
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
export const labelPrimitiveSchema = z.strictObject({
  id: objectIdSchema,
  kind: z.literal("label"),
  text: z.string().min(1),
});
export const comparisonPrimitiveSchema = z.strictObject({
  id: objectIdSchema,
  kind: z.literal("comparison"),
  arrayObjectId: objectIdSchema,
  leftPointerId: objectIdSchema,
  rightPointerId: objectIdSchema,
  target: z.number(),
});
export const resultPrimitiveSchema = z.strictObject({
  id: objectIdSchema,
  kind: z.literal("result"),
  status: z.enum(["pending", "found", "not-found"]),
});

export const primitiveSchema = z.discriminatedUnion("kind", [
  arrayPrimitiveSchema,
  pointerPrimitiveSchema,
  labelPrimitiveSchema,
  comparisonPrimitiveSchema,
  resultPrimitiveSchema,
]);

export const sceneSchema = z.strictObject({
  target: z.number(),
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

export const lessonSourceV1Schema = z.strictObject({
  schemaVersion: z.literal(1),
  id: z.string().regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  domain: domainIdSchema,
  collection: z.literal("interview-foundations"),
  order: z.number().int().min(1).max(15),
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
  }),
  scene: sceneSchema,
  timeline: z.array(timelineStepSchema).min(1),
  modelCheck: modelCheckSchema,
  accessibility: accessibilitySchema,
  evidence: evidenceSchema,
});

export type LessonSourceV1 = z.infer<typeof lessonSourceV1Schema>;
