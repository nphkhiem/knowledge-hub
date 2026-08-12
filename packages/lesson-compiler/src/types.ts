import {
  sortDiagnostics,
  type ExampleLanguage,
  type LessonDiagnostic,
} from "@knowledge-hub/lesson-schema";
import type { ResultStatus } from "./resultStatus.js";

export interface CompiledMarkdown {
  readonly html: string;
}

export interface CompiledRealWorldApplication extends CompiledMarkdown {
  readonly id: string;
  readonly title: string;
}

/** One published implementation of the lesson's concept. */
export interface CompiledExample {
  readonly language: ExampleLanguage;
  readonly file: string;
  readonly code: string;
}

export interface CompiledLessonContent {
  readonly quickUnderstanding: CompiledMarkdown;
  readonly realWorldApplications: readonly CompiledRealWorldApplication[];
  readonly deepDive?: CompiledMarkdown;
  readonly examples?: readonly CompiledExample[];
}

export type CompiledContent = CompiledLessonContent;

interface CompiledSceneObjectBase {
  readonly id: string;
  readonly visible: boolean;
}

export type CompiledSceneObject =
  | (CompiledSceneObjectBase & {
      readonly kind: "array";
      readonly label: string;
      readonly values: readonly number[];
    })
  | (CompiledSceneObjectBase & {
      readonly kind: "pointer";
      readonly label: string;
      readonly targetObjectId: string;
      readonly index: number;
    })
  | (CompiledSceneObjectBase & {
      readonly kind: "label";
      readonly text: string;
    })
  | (CompiledSceneObjectBase & {
      readonly kind: "comparison";
      readonly arrayObjectId: string;
      readonly leftPointerId: string;
      readonly rightPointerId: string;
      readonly target: number;
    })
  | (CompiledSceneObjectBase & {
      readonly kind: "result";
      readonly status: ResultStatus;
    });

export interface SemanticSnapshot {
  readonly stepId: string;
  readonly narration: string;
  readonly terminal: boolean;
  readonly objects: readonly CompiledSceneObject[];
  readonly pointers: Readonly<Record<string, number>>;
  readonly highlights: Readonly<Record<string, readonly number[]>>;
  readonly comparison?: Readonly<{
    actual: number;
    target: number;
    relation: "less" | "equal" | "greater";
  }>;
  readonly result?: Readonly<
    | { kind: "found"; indices: readonly [number, number] }
    | { kind: "not-found" }
  >;
}

export interface CompiledModelCheck {
  readonly prompt: string;
  readonly options: readonly Readonly<{ id: string; label: string }>[];
  readonly correctOptionId: string;
  readonly explanation: string;
}

export interface CompiledEvidenceSource {
  readonly title: string;
  readonly url?: string | undefined;
  readonly citation?: string | undefined;
  readonly publisher: string;
  readonly accessedOn: string;
  readonly supports: readonly string[];
}

export interface CompiledEvidenceRecord {
  readonly verifiedOn: string;
  readonly scope: string;
  readonly sources: readonly CompiledEvidenceSource[];
}

export interface CompiledAccessibility {
  readonly summary: string;
  readonly initialDescription: string;
  readonly motionEquivalentLabel: string;
}

export interface CompiledLesson {
  readonly schemaVersion: 1;
  readonly id: string;
  readonly slug: string;
  readonly domain: "dsa" | "networking" | "system-design";
  readonly collection: "interview-foundations";
  readonly difficulty: "easy" | "medium" | "hard";
  readonly order: number;
  readonly license: "CC-BY-4.0";
  readonly title: string;
  readonly durationMinutes: number;
  readonly objective: string;
  readonly recognitionSignals: readonly string[];
  readonly limitations: readonly string[];
  readonly snapshots: readonly SemanticSnapshot[];
  readonly content: CompiledLessonContent;
  readonly modelCheck: CompiledModelCheck;
  readonly accessibility: CompiledAccessibility;
  readonly evidence: CompiledEvidenceRecord;
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
