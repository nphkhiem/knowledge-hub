export type DiagnosticCode =
  | "accessibility.incomplete"
  | "action.unsupported"
  | "evidence.source-count"
  | "evidence.source-locator"
  | "file.missing"
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
  | "schema.invalid"
  | "schema.unsupported-version"
  | "timeline.narration-required"
  | "timeline.cycle"
  | "timeline.terminal-required"
  | "timeline.unreachable"
  | "yaml.alias"
  | "yaml.directive"
  | "yaml.duplicate-key"
  | "yaml.embedded-html"
  | "yaml.merge"
  | "yaml.multiple-documents"
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

export function sortDiagnostics(
  diagnostics: readonly LessonDiagnostic[],
): readonly LessonDiagnostic[] {
  return [...diagnostics].sort((left, right) =>
    `${left.file}\0${left.path}\0${left.code}`.localeCompare(
      `${right.file}\0${right.path}\0${right.code}`,
    ),
  );
}
