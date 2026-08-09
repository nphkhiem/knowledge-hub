import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { compileLessonPackage } from "./index.js";

const lessonDirectory = fileURLToPath(
  new URL("../../../lessons/dsa/two-pointers/", import.meta.url),
);

describe("compileLessonPackage", () => {
  test("loads the canonical Two Pointers package for static rendering", async () => {
    const lesson = await compileLessonPackage(lessonDirectory);

    expect(lesson.id).toBe("dsa.two-pointers");
    expect(lesson.title).toBe("Two Pointers");
    expect(lesson.durationMinutes).toBe(4);
    expect(lesson.content.quickUnderstanding.html).toContain(
      "Recognition signals",
    );
    expect(lesson.content.realWorldApplications).toHaveLength(2);
  });
});
