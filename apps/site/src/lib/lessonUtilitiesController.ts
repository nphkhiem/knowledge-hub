import type { LocalLessonStateAdapter } from "./localLessonState";

const LABELS = {
  bookmarkAdd: "Bookmark",
  bookmarkRemove: "Remove bookmark",
  completedDone: "Completed",
  completedMark: "Mark completed",
} as const;

const STATUS = {
  bookmarkAdded: "Lesson bookmarked.",
  bookmarkRemoved: "Bookmark removed.",
  completed: "Lesson marked as completed.",
  shareCopied: "Lesson link copied.",
  shareManual: "Copy the address from your browser to share this lesson.",
  shared: "Lesson shared.",
} as const;

/**
 * The sharing and clipboard capabilities, injected so every fallback path can
 * be driven in a test. Both are absent on plenty of real browsers, so neither
 * may be assumed present.
 */
export interface LessonUtilitiesEnvironment {
  readonly canonicalUrl: string;
  readonly share?: (data: { title: string; url: string }) => Promise<void>;
  readonly writeText?: (text: string) => Promise<void>;
}

export function mountLessonUtilities(
  root: HTMLElement,
  adapter: LocalLessonStateAdapter,
  environment: LessonUtilitiesEnvironment,
): () => void {
  const lessonId = root.dataset.lessonId ?? "";
  const title = root.dataset.lessonTitle ?? "";
  const bookmark = root.querySelector("[data-utility-bookmark]");
  const complete = root.querySelector("[data-utility-complete]");
  const share = root.querySelector("[data-utility-share]");
  const status = root.querySelector("[data-utility-status]");

  function announce(message: string): void {
    if (status instanceof HTMLElement) status.textContent = message;
  }

  function render(): void {
    const snapshot = adapter.getSnapshot();
    const bookmarked = snapshot.bookmarks.includes(lessonId);
    const completed = snapshot.completed.includes(lessonId);

    if (bookmark instanceof HTMLElement) {
      bookmark.textContent = bookmarked
        ? LABELS.bookmarkRemove
        : LABELS.bookmarkAdd;
      bookmark.setAttribute("aria-pressed", String(bookmarked));
      bookmark.hidden = false;
    }
    if (complete instanceof HTMLButtonElement) {
      complete.textContent = completed
        ? LABELS.completedDone
        : LABELS.completedMark;
      complete.disabled = completed;
      complete.hidden = false;
    }
    if (share instanceof HTMLElement) share.hidden = false;
  }

  function onBookmark(): void {
    const next = adapter.toggleBookmark(lessonId);
    render();
    announce(
      next.bookmarks.includes(lessonId)
        ? STATUS.bookmarkAdded
        : STATUS.bookmarkRemoved,
    );
  }

  function onComplete(): void {
    adapter.markCompleted(lessonId);
    render();
    announce(STATUS.completed);
  }

  /** Native sharing first, then the clipboard, then plain instructions. */
  async function onShare(): Promise<void> {
    if (environment.share !== undefined) {
      try {
        await environment.share({ title, url: environment.canonicalUrl });
        announce(STATUS.shared);
        return;
      } catch {
        /* A declined or failed share falls through to copying. */
      }
    }
    if (environment.writeText !== undefined) {
      try {
        await environment.writeText(environment.canonicalUrl);
        announce(STATUS.shareCopied);
        return;
      } catch {
        /* Clipboard permission can be refused; say what to do instead. */
      }
    }
    announce(STATUS.shareManual);
  }

  function onShareClick(): void {
    void onShare();
  }

  bookmark?.addEventListener("click", onBookmark);
  complete?.addEventListener("click", onComplete);
  share?.addEventListener("click", onShareClick);
  const releaseAdapter = adapter.subscribe(() => {
    render();
  });
  render();

  return () => {
    bookmark?.removeEventListener("click", onBookmark);
    complete?.removeEventListener("click", onComplete);
    share?.removeEventListener("click", onShareClick);
    releaseAdapter();
  };
}
