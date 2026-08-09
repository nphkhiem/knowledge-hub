import { z } from "zod";

export const domainIdSchema = z.enum(["dsa", "networking", "system-design"]);

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
  scene: z.unknown(),
  timeline: z.array(z.unknown()).min(1),
  modelCheck: z.unknown(),
  accessibility: z.unknown(),
  evidence: z.unknown(),
});

export type LessonSourceV1 = z.infer<typeof lessonSourceV1Schema>;
