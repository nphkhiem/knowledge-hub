import { afterEach, expect, test } from "vitest";
import {
  mountLessonUtilities,
  type LessonUtilitiesEnvironment,
} from "./lessonUtilitiesController";
import { createLocalLessonState } from "./localLessonState";

/** Lets every queued microtask settle, however deep the fallback chain goes. */
async function flush(): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

const LESSON_ID = "dsa.two-pointers";
const CANONICAL_URL = "https://example.test/lessons/dsa/two-pointers/";

let release: (() => void) | undefined;

function memoryStorage(): Storage {
  const map = new Map<string, string>();
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

interface Fixture {
  readonly root: HTMLElement;
  readonly button: (
    name: "bookmark" | "complete" | "share",
  ) => HTMLButtonElement;
  readonly status: () => string;
  readonly copied: () => string[];
  readonly shared: () => string[];
}

/** Explicit `undefined` is meaningful here: it models an absent capability. */
interface FixtureOptions {
  readonly canonicalUrl?: string | undefined;
  readonly share?: LessonUtilitiesEnvironment["share"] | undefined;
  readonly writeText?: LessonUtilitiesEnvironment["writeText"] | undefined;
  readonly shareRejects?: boolean | undefined;
  readonly copyRejects?: boolean | undefined;
}

function createFixture(environment: FixtureOptions = {}): Fixture {
  const root = document.createElement("div");
  root.dataset.lessonId = LESSON_ID;
  root.dataset.lessonTitle = "Two Pointers";
  root.innerHTML = [
    '<button type="button" data-utility-bookmark hidden></button>',
    '<button type="button" data-utility-complete hidden></button>',
    '<button type="button" data-utility-share hidden>Share</button>',
    '<p role="status" data-utility-status></p>',
  ].join("");
  document.body.append(root);

  const copied: string[] = [];
  const shared: string[] = [];
  const defaultShare: LessonUtilitiesEnvironment["share"] = async ({ url }) => {
    if (environment.shareRejects === true) {
      throw new Error("The learner dismissed the share sheet.");
    }
    shared.push(url);
    return Promise.resolve();
  };
  const defaultWriteText: LessonUtilitiesEnvironment["writeText"] = async (
    text,
  ) => {
    if (environment.copyRejects === true) {
      throw new Error("Clipboard permission denied.");
    }
    copied.push(text);
    return Promise.resolve();
  };

  /** An absent capability is omitted, never set to undefined. */
  const share = "share" in environment ? environment.share : defaultShare;
  const writeText =
    "writeText" in environment ? environment.writeText : defaultWriteText;
  const resolved: LessonUtilitiesEnvironment = {
    canonicalUrl: environment.canonicalUrl ?? CANONICAL_URL,
    ...(share === undefined ? {} : { share }),
    ...(writeText === undefined ? {} : { writeText }),
  };

  release = mountLessonUtilities(
    root,
    createLocalLessonState(memoryStorage()),
    resolved,
  );

  return {
    button: (name) => {
      const found = root.querySelector(`[data-utility-${name}]`);
      if (!(found instanceof HTMLButtonElement)) {
        throw new Error(`The fixture has no ${name} button.`);
      }
      return found;
    },
    copied: () => copied,
    root,
    shared: () => shared,
    status: () =>
      root.querySelector("[data-utility-status]")?.textContent?.trim() ?? "",
  };
}

afterEach(() => {
  release?.();
  release = undefined;
  document.body.innerHTML = "";
});

test("toggles a bookmark and says what happened", () => {
  const fixture = createFixture();
  const initial = fixture.button("bookmark").textContent;

  fixture.button("bookmark").click();
  const added = {
    label: fixture.button("bookmark").textContent,
    pressed: fixture.button("bookmark").getAttribute("aria-pressed"),
    status: fixture.status(),
  };
  fixture.button("bookmark").click();

  expect({
    added,
    initial,
    removed: {
      label: fixture.button("bookmark").textContent,
      pressed: fixture.button("bookmark").getAttribute("aria-pressed"),
      status: fixture.status(),
    },
  }).toEqual({
    added: {
      label: "Remove bookmark",
      pressed: "true",
      status: "Lesson bookmarked.",
    },
    initial: "Bookmark",
    removed: {
      label: "Bookmark",
      pressed: "false",
      status: "Bookmark removed.",
    },
  });
});

test("marks completed once and then reports the state rather than repeating", () => {
  const fixture = createFixture();

  fixture.button("complete").click();

  expect({
    disabled: fixture.button("complete").disabled,
    label: fixture.button("complete").textContent,
    status: fixture.status(),
  }).toEqual({
    disabled: true,
    label: "Completed",
    status: "Lesson marked as completed.",
  });
});

test("shares natively when the browser offers it", async () => {
  const fixture = createFixture();

  fixture.button("share").click();
  await flush();

  expect({ shared: fixture.shared(), status: fixture.status() }).toEqual({
    shared: [CANONICAL_URL],
    status: "Lesson shared.",
  });
});

test("uses copy fallback when Web Share is unavailable", async () => {
  const fixture = createFixture({ share: undefined });

  fixture.button("share").click();
  await flush();

  expect({ copied: fixture.copied(), status: fixture.status() }).toEqual({
    copied: [CANONICAL_URL],
    status: "Lesson link copied.",
  });
});

test("falls through to copying when sharing is dismissed", async () => {
  const fixture = createFixture({ shareRejects: true });

  fixture.button("share").click();
  await flush();

  expect({ copied: fixture.copied(), status: fixture.status() }).toEqual({
    copied: [CANONICAL_URL],
    status: "Lesson link copied.",
  });
});

test("tells the learner what to do when neither sharing nor copying works", async () => {
  const fixture = createFixture({ share: undefined, copyRejects: true });

  fixture.button("share").click();
  await flush();

  expect(fixture.status()).toBe(
    "Copy the address from your browser to share this lesson.",
  );
});

test("shares the canonical address with no fragment or query", () => {
  const fixture = createFixture({
    canonicalUrl: CANONICAL_URL,
  });

  expect({
    hasFragment: CANONICAL_URL.includes("#"),
    hasQuery: CANONICAL_URL.includes("?"),
    root: fixture.root.dataset.lessonId,
  }).toEqual({ hasFragment: false, hasQuery: false, root: LESSON_ID });
});

test("promises no account, sync, or durability", () => {
  const fixture = createFixture();
  fixture.button("bookmark").click();
  fixture.button("complete").click();

  expect(
    /account|sign in|sync|synced|cloud|saved forever|score|streak/i.test(
      fixture.root.textContent ?? "",
    ),
  ).toBe(false);
});

test("reveals its controls only once they can work", () => {
  const root = document.createElement("div");
  root.dataset.lessonId = LESSON_ID;
  root.innerHTML = [
    '<button type="button" data-utility-bookmark hidden></button>',
    '<button type="button" data-utility-complete hidden></button>',
    '<button type="button" data-utility-share hidden>Share</button>',
    '<p role="status" data-utility-status></p>',
  ].join("");
  document.body.append(root);
  const before = [...root.querySelectorAll<HTMLElement>("button")].every(
    (button) => button.hidden,
  );

  release = mountLessonUtilities(
    root,
    createLocalLessonState(memoryStorage()),
    { canonicalUrl: CANONICAL_URL },
  );

  expect({
    after: [...root.querySelectorAll<HTMLElement>("button")].some(
      (button) => button.hidden,
    ),
    before,
  }).toEqual({ after: false, before: true });
});
