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
 * Re-exported so the renderer's tests can pin their own drawn depth to the
 * authored cap without the renderer package depending on the schema.
 *
 * Renderer source must not import this. Every other import it takes from this
 * package is a type, erased at build; a runtime value pulls the whole compiler
 * graph into the browser bundle. See DRAWN_DEPTH in primitives/stack.ts.
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
