import { expect, test } from "vitest";
import {
  STORAGE_KEY,
  createLocalLessonState,
  type LearnerStateV1,
} from "./localLessonState";

const EMPTY: LearnerStateV1 = {
  bookmarks: [],
  completed: [],
  pathPositions: {},
  version: 1,
};

function memoryStorage(seed?: string): Storage {
  const map = new Map<string, string>();
  if (seed !== undefined) map.set(STORAGE_KEY, seed);
  return {
    clear: () => map.clear(),
    getItem: (key) => map.get(key) ?? null,
    key: (index) => [...map.keys()][index] ?? null,
    get length() {
      return map.size;
    },
    removeItem: (key) => {
      map.delete(key);
    },
    setItem: (key, value) => {
      map.set(key, value);
    },
  } satisfies Storage;
}

function throwingStorage(): Storage {
  const boom = (): never => {
    throw new Error("Storage is not available in this context.");
  };
  return {
    clear: boom,
    getItem: boom,
    key: boom,
    length: 0,
    removeItem: boom,
    setItem: boom,
  } satisfies Storage;
}

test.each([
  ["unavailable", undefined],
  ["throwing", throwingStorage()],
  ["corrupt", memoryStorage("{broken json")],
  [
    "a different version",
    memoryStorage(JSON.stringify({ version: 2, bookmarks: ["x"] })),
  ],
  [
    "the wrong shape",
    memoryStorage(JSON.stringify({ version: 1, bookmarks: "nope" })),
  ],
  ["not an object", memoryStorage("null")],
])("keeps lessons usable when storage is %s", (_name, storage) => {
  const adapter = createLocalLessonState(storage);

  expect({
    snapshot: adapter.getSnapshot(),
    toggleThrew: (() => {
      try {
        adapter.toggleBookmark("dsa.two-pointers");
        return false;
      } catch {
        return true;
      }
    })(),
  }).toEqual({ snapshot: EMPTY, toggleThrew: false });
});

test("adds and removes a bookmark", () => {
  const adapter = createLocalLessonState(memoryStorage());

  const added = adapter.toggleBookmark("dsa.two-pointers").bookmarks;
  const removed = adapter.toggleBookmark("dsa.two-pointers").bookmarks;

  expect({ added, removed }).toEqual({
    added: ["dsa.two-pointers"],
    removed: [],
  });
});

test("marks completed once and is not undone by repeating it", () => {
  const adapter = createLocalLessonState(memoryStorage());

  adapter.markCompleted("dsa.two-pointers");
  const after = adapter.markCompleted("dsa.two-pointers");

  expect(after.completed).toEqual(["dsa.two-pointers"]);
});

test("persists unique sorted arrays regardless of input order", () => {
  const storage = memoryStorage(
    JSON.stringify({
      bookmarks: ["b", "a", "b"],
      completed: ["z", "z"],
      pathPositions: {},
      version: 1,
    }),
  );

  const adapter = createLocalLessonState(storage);
  adapter.toggleBookmark("c");
  const written: unknown = JSON.parse(storage.getItem(STORAGE_KEY) ?? "{}");

  expect(written).toEqual({
    bookmarks: ["a", "b", "c"],
    completed: ["z"],
    pathPositions: {},
    version: 1,
  });
});

test("records a path position without disturbing the rest", () => {
  const adapter = createLocalLessonState(memoryStorage());
  adapter.toggleBookmark("dsa.two-pointers");

  const after = adapter.setPathPosition(
    "interview-foundations",
    "dsa.two-pointers",
  );

  expect(after).toEqual({
    bookmarks: ["dsa.two-pointers"],
    completed: [],
    pathPositions: { "interview-foundations": "dsa.two-pointers" },
    version: 1,
  });
});

test("keeps working in memory when writing fails", () => {
  const readable = memoryStorage();
  const writeOnlyFailure: Storage = {
    ...readable,
    getItem: (key) => readable.getItem(key),
    setItem: () => {
      throw new Error("Quota exceeded.");
    },
  };
  const adapter = createLocalLessonState(writeOnlyFailure);

  const after = adapter.toggleBookmark("dsa.two-pointers");

  expect({
    memory: after.bookmarks,
    persisted: readable.getItem(STORAGE_KEY),
  }).toEqual({ memory: ["dsa.two-pointers"], persisted: null });
});

test("notifies subscribers and stops after they unsubscribe", () => {
  const adapter = createLocalLessonState(memoryStorage());
  const seen: number[] = [];
  const release = adapter.subscribe((state) =>
    seen.push(state.bookmarks.length),
  );

  adapter.toggleBookmark("a");
  adapter.toggleBookmark("b");
  release();
  adapter.toggleBookmark("c");

  expect(seen).toEqual([1, 2]);
});

test("hands out frozen snapshots so a caller cannot corrupt them", () => {
  const adapter = createLocalLessonState(memoryStorage());
  const snapshot = adapter.getSnapshot();

  expect({
    frozen: Object.isFrozen(snapshot),
    mutationThrew: (() => {
      try {
        (snapshot.bookmarks as string[]).push("x");
        return false;
      } catch {
        return true;
      }
    })(),
  }).toEqual({ frozen: true, mutationThrew: true });
});
