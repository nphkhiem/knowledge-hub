export type DiagnosticCode =
  | "accessibility.incomplete"
  | "action.unsupported"
  | "catalog.duplicate-id"
  | "catalog.duplicate-order"
  | "catalog.duplicate-route"
  | "evidence.source-count"
  | "evidence.source-locator"
  | "evidence.source-scheme"
  | "file.missing"
  | "file.unsafe"
  | "identity.mismatch"
  | "identity.directory-mismatch"
  | "identifier.duplicate"
  | "markdown.application-count"
  | "markdown.application-content"
  | "markdown.application-id"
  | "markdown.application-structure"
  | "markdown.compile"
  | "markdown.quick-understanding-content"
  | "markdown.quick-understanding-structure"
  | "model-check.required"
  | "primitive.unsupported"
  | "reference.broken"
  | "reference.invalid"
  | "reference.wrong-kind"
  | "schema.invalid"
  | "schema.unsupported-version"
  | "timeline.narration-required"
  | "timeline.cycle"
  | "timeline.terminal-edge"
  | "timeline.terminal-required"
  | "timeline.unreachable"
  | "yaml.alias"
  | "yaml.directive"
  | "yaml.duplicate-key"
  | "yaml.embedded-html"
  | "yaml.merge"
  | "yaml.multiple-documents"
  | "yaml.plain-string"
  | "yaml.syntax"
  | "yaml.tag"
  | "yaml.warning";

export interface LessonDiagnostic {
  readonly code: DiagnosticCode;
  readonly file: string;
  readonly path: string;
  readonly message: string;
}

export type ValidationResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly diagnostics: readonly LessonDiagnostic[] };

export function compareCodeUnits(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

export function sortDiagnostics(
  diagnostics: readonly LessonDiagnostic[],
): readonly LessonDiagnostic[] {
  return [...diagnostics].sort((left, right) =>
    compareCodeUnits(
      `${left.file}\0${left.path}\0${left.code}`,
      `${right.file}\0${right.path}\0${right.code}`,
    ),
  );
}
