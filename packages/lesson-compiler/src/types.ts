import type { LessonSourceV1 } from "@knowledge-hub/lesson-schema";

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

export interface LessonPackageDiagnostic {
  readonly file: string;
  readonly message: string;
}

export class LessonPackageError extends Error {
  readonly diagnostics: readonly LessonPackageDiagnostic[];

  constructor(diagnostics: readonly LessonPackageDiagnostic[]) {
    super(
      diagnostics.map(({ file, message }) => `${file}: ${message}`).join("\n"),
    );
    this.name = "LessonPackageError";
    this.diagnostics = diagnostics;
  }
}
