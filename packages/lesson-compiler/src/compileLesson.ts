import {
  compareCodeUnits,
  sortDiagnostics,
  validateLessonSource,
  type LessonSourceV1,
  type ValidationResult,
} from "@knowledge-hub/lesson-schema";
import { applyAction, type MutableSemanticState } from "./applyAction.js";
import type {
  CompiledContent,
  CompiledLesson,
  CompiledSceneObject,
  SemanticSnapshot,
} from "./types.js";
import { validateStaticActions } from "./preflightActions.js";
import { validateLessonSemantics } from "./validateSemantics.js";

function sortedEntries<T>(record: Readonly<Record<string, T>>): [string, T][] {
  return Object.entries(record).sort(([left], [right]) =>
    compareCodeUnits(left, right),
  );
}

function normalizeAndFreeze<T>(value: T): T {
  if (Array.isArray(value)) {
    return Object.freeze(value.map((item) => normalizeAndFreeze(item))) as T;
  }
  if (typeof value === "object" && value !== null) {
    return Object.freeze(
      Object.fromEntries(
        sortedEntries(value as Readonly<Record<string, unknown>>).map(
          ([key, item]) => [key, normalizeAndFreeze(item)],
        ),
      ),
    ) as T;
  }
  return value;
}

function toCompiledObject(
  object: LessonSourceV1["scene"]["objects"][number],
): CompiledSceneObject {
  return { ...object, visible: true };
}

function createInitialState(source: LessonSourceV1): MutableSemanticState {
  const objects = source.scene.objects.map(toCompiledObject);
  return {
    objectOrder: objects.map(({ id }) => id),
    objectsById: new Map(objects.map((object) => [object.id, object] as const)),
    pointers: Object.fromEntries(
      objects.flatMap((object) =>
        object.kind === "pointer" ? [[object.id, object.index]] : [],
      ),
    ),
    highlights: {},
  };
}

function snapshot(
  state: MutableSemanticState,
  stepId: string,
  narration: string,
  terminal: boolean,
): SemanticSnapshot {
  return {
    stepId,
    narration,
    terminal,
    objects: state.objectOrder.map((id) => {
      const object = state.objectsById.get(id);
      if (!object) throw new Error(`Missing compiled object: ${id}`);
      return object.kind === "array"
        ? { ...object, values: [...object.values] }
        : { ...object };
    }),
    pointers: Object.fromEntries(sortedEntries(state.pointers)),
    highlights: Object.fromEntries(
      sortedEntries(state.highlights).map(([id, indices]) => [
        id,
        [...indices],
      ]),
    ),
    ...(state.comparison ? { comparison: { ...state.comparison } } : {}),
    ...(state.result
      ? {
          result:
            state.result.kind === "found"
              ? {
                  ...state.result,
                  indices: [...state.result.indices] as [number, number],
                }
              : { ...state.result },
        }
      : {}),
  };
}

function compileValidatedLesson(
  source: LessonSourceV1,
  content: CompiledContent,
  file: string,
): ValidationResult<CompiledLesson> {
  const state = createInitialState(source);
  const snapshots: SemanticSnapshot[] = [
    snapshot(state, "initial", source.accessibility.initialDescription, false),
  ];

  for (const [stepIndex, step] of source.timeline.entries()) {
    /**
     * Highlights and comparisons describe what one step draws attention to, so
     * they are cleared before the step runs. Carrying them forward would let a
     * later step state a sum, or emphasize a cell, that its own pointers have
     * already contradicted. Object state and the result are not step-scoped.
     */
    state.highlights = {};
    delete state.comparison;

    for (const [actionIndex, action] of step.actions.entries()) {
      const applied = applyAction(state, action, {
        file,
        path: `timeline[${stepIndex}].actions[${actionIndex}]`,
      });
      if (!applied.ok) return applied;
    }
    snapshots.push(
      snapshot(state, step.id, step.narration, step.terminal === true),
    );
  }

  return {
    ok: true,
    value: normalizeAndFreeze({
      schemaVersion: 1,
      id: source.id,
      slug: source.slug,
      domain: source.domain,
      collection: source.collection,
      order: source.order,
      license: source.license,
      title: source.title,
      durationMinutes: source.durationMinutes,
      objective: source.objective,
      recognitionSignals: [...source.recognitionSignals],
      limitations: [...source.limitations],
      snapshots,
      content,
      modelCheck: source.modelCheck,
      accessibility: source.accessibility,
      evidence: source.evidence,
    }),
  };
}

export function compileLessonAtPath(
  source: LessonSourceV1,
  content: CompiledContent,
  file: string,
): ValidationResult<CompiledLesson> {
  const validated = validateLessonSource(source, file);
  if (!validated.ok) return validated;
  const diagnostics = [
    ...validateLessonSemantics(validated.value, file),
    ...validateStaticActions(validated.value, file),
  ];
  if (diagnostics.length > 0) {
    return { ok: false, diagnostics: sortDiagnostics(diagnostics) };
  }
  return compileValidatedLesson(validated.value, content, file);
}

export function compileLesson(
  source: LessonSourceV1,
  content: CompiledContent,
): ValidationResult<CompiledLesson> {
  return compileLessonAtPath(source, content, "lesson.yaml");
}
