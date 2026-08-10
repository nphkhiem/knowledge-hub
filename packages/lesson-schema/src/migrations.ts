import type { ValidationResult } from "./diagnostics.js";
import { validateLessonSource } from "./validate.js";
import type { LessonSourceV1 } from "./v1.js";

export function migrateLessonSource(
  input: unknown,
  file: string,
): ValidationResult<LessonSourceV1> {
  return validateLessonSource(input, file);
}
