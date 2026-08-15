export {
  compileLessonCatalog,
  getCompiledLesson,
  getCompiledLessons,
} from "./catalog.js";
export {
  compileLessonPackage,
  loadLessonPackage,
} from "./loadLessonPackage.js";
export { compileLesson } from "./compileLesson.js";
/**
 * Re-exported so the renderer can size a stack without taking a dependency on
 * the schema package. The renderer's only edge is to this one, and a single
 * shared constant is not worth widening that.
 */
export { STACK_CAPACITY } from "@knowledge-hub/lesson-schema";
export {
  LessonPackageError,
  type CompiledAccessibility,
  type CompiledContent,
  type CompiledEvidenceRecord,
  type CompiledEvidenceSource,
  type CompiledExample,
  type CompiledLesson,
  type CompiledLessonContent,
  type CompiledMarkdown,
  type CompiledModelCheck,
  type CompiledRealWorldApplication,
  type CompiledSceneObject,
  type LessonPackageDiagnostic,
  type LoadedLessonPackage,
  type SemanticSnapshot,
} from "./types.js";
