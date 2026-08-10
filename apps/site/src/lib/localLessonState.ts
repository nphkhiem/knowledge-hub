export interface LearnerStateV1 {
  readonly version: 1;
  readonly bookmarks: readonly string[];
  readonly completed: readonly string[];
  readonly pathPositions: Readonly<Record<string, string>>;
}

export interface LocalLessonStateAdapter {
  getSnapshot(): LearnerStateV1;
  toggleBookmark(lessonId: string): LearnerStateV1;
  markCompleted(lessonId: string): LearnerStateV1;
  setPathPosition(pathId: string, lessonId: string): LearnerStateV1;
  subscribe(listener: (state: LearnerStateV1) => void): () => void;
}

export const STORAGE_KEY = "knowledge-hub:v1:learner-state";

const EMPTY_STATE: LearnerStateV1 = Object.freeze({
  bookmarks: Object.freeze([]),
  completed: Object.freeze([]),
  pathPositions: Object.freeze({}),
  version: 1,
});

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}

function normalizeIds(value: unknown): readonly string[] {
  if (!isStringArray(value)) return [];
  return Object.freeze([...new Set(value)].sort());
}

function normalizePositions(value: unknown): Readonly<Record<string, string>> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return EMPTY_STATE.pathPositions;
  }
  const entries = Object.entries(value).filter(
    ([, lessonId]) => typeof lessonId === "string",
  ) as [string, string][];
  return Object.freeze(Object.fromEntries(entries.sort()));
}

/**
 * Reads whatever is in storage and returns something usable no matter what.
 *
 * Anything unrecognized is treated as absent: a different version, a corrupt
 * string, the wrong shape, or a key that is not there. Learner state is a
 * convenience, so a bad value must never surface as an error or block a lesson.
 * Validation is hand-written rather than delegated to a schema library because
 * this is the only client-side parser on the page and the performance budget
 * does not justify shipping one for three fields.
 */
function parseState(raw: string | null): LearnerStateV1 {
  if (raw === null) return EMPTY_STATE;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return EMPTY_STATE;

    const candidate = parsed as Record<string, unknown>;
    if (candidate.version !== 1) return EMPTY_STATE;

    return Object.freeze({
      bookmarks: normalizeIds(candidate.bookmarks),
      completed: normalizeIds(candidate.completed),
      pathPositions: normalizePositions(candidate.pathPositions),
      version: 1,
    });
  } catch {
    return EMPTY_STATE;
  }
}

function readStorage(storage: Storage | undefined): string | null {
  try {
    return storage?.getItem(STORAGE_KEY) ?? null;
  } catch {
    return null;
  }
}

function toggle(ids: readonly string[], id: string): readonly string[] {
  const next = ids.includes(id)
    ? ids.filter((existing) => existing !== id)
    : [...ids, id];
  return normalizeIds(next);
}

export function createLocalLessonState(
  storage?: Storage,
): LocalLessonStateAdapter {
  let snapshot = parseState(readStorage(storage));
  const listeners = new Set<(state: LearnerStateV1) => void>();

  /** A failed write is not an error the learner needs to see; memory still holds. */
  function commit(next: LearnerStateV1): LearnerStateV1 {
    snapshot = Object.freeze(next);
    try {
      storage?.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      /* The in-memory snapshot remains authoritative for this page. */
    }
    for (const listener of listeners) listener(snapshot);
    return snapshot;
  }

  return {
    getSnapshot: () => snapshot,

    markCompleted: (lessonId) =>
      snapshot.completed.includes(lessonId)
        ? snapshot
        : commit({
            ...snapshot,
            completed: normalizeIds([...snapshot.completed, lessonId]),
          }),

    setPathPosition: (pathId, lessonId) =>
      commit({
        ...snapshot,
        pathPositions: Object.freeze({
          ...snapshot.pathPositions,
          [pathId]: lessonId,
        }),
      }),

    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    toggleBookmark: (lessonId) =>
      commit({
        ...snapshot,
        bookmarks: toggle(snapshot.bookmarks, lessonId),
      }),
  };
}
