export {
  domainIdSchema,
  lessonSourceV1Schema,
  type LessonSourceV1,
} from "./v1.js";
export {
  type DiagnosticCode,
  type LessonDiagnostic,
  type ValidationResult,
} from "./diagnostics.js";
export { validateLessonSource } from "./validate.js";
export { migrateLessonSource } from "./migrations.js";
