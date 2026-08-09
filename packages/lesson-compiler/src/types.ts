import type {
  LessonDiagnostic,
  LessonSourceV1,
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
    const sortedDiagnostics = [...diagnostics].sort((left, right) =>
      `${left.file}\0${left.path}\0${left.code}`.localeCompare(
        `${right.file}\0${right.path}\0${right.code}`,
      ),
    );
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
