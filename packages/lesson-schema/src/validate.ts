import { lessonSourceV1Schema, type LessonSourceV1 } from "./v1.js";
import {
  sortDiagnostics,
  type LessonDiagnostic,
  type ValidationResult,
} from "./diagnostics.js";

const supportedActions = [
  "show",
  "hide",
  "set",
  "move",
  "highlight",
  "compare",
  "connect",
  "disconnect",
  "enqueue",
  "dequeue",
  "insert",
  "slide",
  "narrow",
] as const;
const supportedPrimitives = [
  "array",
  "buckets",
  "pointer",
  "window",
  "label",
  "comparison",
  "result",
] as const;

function isPlainObject(input: unknown): input is Record<string, unknown> {
  if (typeof input !== "object" || input === null) return false;
  const prototype = Object.getPrototypeOf(input) as unknown;
  return prototype === Object.prototype || prototype === null;
}

type VersionOneInput = Readonly<Record<string, unknown>> & {
  readonly schemaVersion: 1;
};

function isVersionOne(input: unknown): input is VersionOneInput {
  return (
    typeof input === "object" &&
    input !== null &&
    "schemaVersion" in input &&
    input.schemaVersion === 1
  );
}

function unsupportedActionDiagnostic(input: VersionOneInput, file: string) {
  if (!isPlainObject(input) || !Array.isArray(input.timeline)) return undefined;

  for (const [stepIndex, step] of input.timeline.entries()) {
    if (!isPlainObject(step) || !Array.isArray(step.actions)) continue;
    for (const [actionIndex, action] of step.actions.entries()) {
      if (
        isPlainObject(action) &&
        typeof action.type === "string" &&
        !supportedActions.includes(
          action.type as (typeof supportedActions)[number],
        )
      ) {
        return {
          code: "action.unsupported" as const,
          file,
          path: `timeline[${stepIndex}].actions[${actionIndex}].type`,
          message:
            "Supported actions: show, hide, set, move, highlight, compare, connect, disconnect, enqueue, dequeue, insert, slide, narrow.",
        };
      }
    }
  }

  return undefined;
}

function unsupportedPrimitiveDiagnostic(input: VersionOneInput, file: string) {
  if (
    !isPlainObject(input) ||
    !isPlainObject(input.scene) ||
    !Array.isArray(input.scene.objects)
  ) {
    return undefined;
  }

  for (const [objectIndex, object] of input.scene.objects.entries()) {
    if (
      isPlainObject(object) &&
      typeof object.kind === "string" &&
      !supportedPrimitives.includes(
        object.kind as (typeof supportedPrimitives)[number],
      )
    ) {
      return {
        code: "primitive.unsupported" as const,
        file,
        path: `scene.objects[${objectIndex}].kind`,
        message:
          "Supported primitives: array, buckets, pointer, window, label, comparison, result.",
      };
    }
  }

  return undefined;
}

function toPath(segments: readonly PropertyKey[]): string {
  return segments.reduce<string>((path, segment) => {
    if (typeof segment === "number") return `${path}[${segment}]`;
    return path.length === 0 ? String(segment) : `${path}.${String(segment)}`;
  }, "");
}

export function validateLessonSource(
  input: unknown,
  file: string,
): ValidationResult<LessonSourceV1> {
  if (!isVersionOne(input)) {
    return {
      ok: false,
      diagnostics: [
        {
          code: "schema.unsupported-version",
          file,
          path: "schemaVersion",
          message: "Supported schema version: 1.",
        },
      ],
    };
  }

  const vocabularyDiagnostics = [
    unsupportedActionDiagnostic(input, file),
    unsupportedPrimitiveDiagnostic(input, file),
  ].filter((diagnostic) => diagnostic !== undefined);
  if (vocabularyDiagnostics.length > 0) {
    return {
      ok: false,
      diagnostics: sortDiagnostics(vocabularyDiagnostics),
    };
  }
  if (!("modelCheck" in input) || input.modelCheck === undefined) {
    return {
      ok: false,
      diagnostics: [
        {
          code: "model-check.required",
          file,
          path: "modelCheck",
          message: "Every lesson requires one Model Check.",
        },
      ],
    };
  }
  if (
    isPlainObject(input.evidence) &&
    Array.isArray(input.evidence.sources) &&
    input.evidence.sources.length === 0
  ) {
    return {
      ok: false,
      diagnostics: [
        {
          code: "evidence.source-count",
          file,
          path: "evidence.sources",
          message: "Evidence requires at least one source.",
        },
      ],
    };
  }

  const result = lessonSourceV1Schema.safeParse(input);
  if (!result.success) {
    const diagnostics = result.error.issues.flatMap<LessonDiagnostic>(
      (issue) => {
        if (issue.code === "unrecognized_keys") {
          return issue.keys.map((key) => ({
            code: "schema.invalid" as const,
            file,
            path: toPath([...issue.path, key]),
            message: "The field is not part of the V1 lesson contract.",
          }));
        }
        if (issue.path[0] === "accessibility") {
          return [
            {
              code: "accessibility.incomplete" as const,
              file,
              path: toPath(issue.path),
              message: "Accessibility descriptions must be non-empty.",
            },
          ];
        }
        if (
          issue.code === "custom" &&
          issue.path[0] === "evidence" &&
          issue.path[1] === "sources"
        ) {
          if (issue.path.at(-1) === "url") {
            return [
              {
                code: "evidence.source-scheme" as const,
                file,
                path: toPath(issue.path),
                message: "Evidence URLs must use HTTP or HTTPS.",
              },
            ];
          }
          return [
            {
              code: "evidence.source-locator" as const,
              file,
              path: toPath(issue.path),
              message:
                "An evidence source requires a URL or publication citation.",
            },
          ];
        }
        if (issue.path[0] === "timeline" && issue.path.at(-1) === "narration") {
          return [
            {
              code: "timeline.narration-required" as const,
              file,
              path: toPath(issue.path),
              message: "Every timeline step requires narration.",
            },
          ];
        }
        return [
          {
            code: "schema.invalid" as const,
            file,
            path: toPath(issue.path) || "$",
            message: "The value does not satisfy the V1 lesson contract.",
          },
        ];
      },
    );
    return { ok: false, diagnostics: sortDiagnostics(diagnostics) };
  }

  const canonicalId = `${result.data.domain}.${result.data.slug}`;
  if (result.data.id !== canonicalId) {
    return {
      ok: false,
      diagnostics: [
        {
          code: "identity.mismatch",
          file,
          path: "id",
          message: `Lesson id must equal "${canonicalId}".`,
        },
      ],
    };
  }

  return { ok: true, value: result.data };
}
