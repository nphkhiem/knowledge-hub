import {
  sortDiagnostics,
  type LessonDiagnostic,
  type LessonSourceV1,
} from "@knowledge-hub/lesson-schema";

export interface CompiledMarkdown {
  readonly html: string;
}

export interface CompiledRealWorldApplication extends CompiledMarkdown {
  readonly id: string;
  readonly title: string;
}

export interface CompiledLessonContent {
  readonly quickUnderstanding: CompiledMarkdown;
  readonly realWorldApplications: readonly CompiledRealWorldApplication[];
  readonly deepDive?: CompiledMarkdown;
}

export interface CompiledLesson extends Omit<LessonSourceV1, "content"> {
  readonly content: CompiledLessonContent;
}

export type LoadedLessonPackage = CompiledLesson;

export type LessonPackageDiagnostic = LessonDiagnostic;

export class LessonPackageError extends Error {
  readonly diagnostics: readonly LessonPackageDiagnostic[];

  constructor(diagnostics: readonly LessonPackageDiagnostic[]) {
    const sortedDiagnostics = sortDiagnostics(diagnostics);
    super(
      sortedDiagnostics
        .map(
          ({ code, file, message, path }) =>
            `[${code}] ${file}:${path} ${message}`,
        )
        .join("\n"),
    );
    this.name = "LessonPackageError";
    this.diagnostics = sortedDiagnostics;
  }
}
