/**
 * How the pager observes and moves, injected so the behavior can be driven in
 * a test. jsdom has no IntersectionObserver and no scrolling, so neither may be
 * reached for directly.
 */
export interface PagerEnvironment {
  readonly observeActive: (
    items: readonly HTMLElement[],
    onActive: (index: number) => void,
  ) => () => void;
  readonly scrollToItem: (item: HTMLElement) => void;
}

export function createBrowserPagerEnvironment(): PagerEnvironment {
  return {
    observeActive: (items, onActive) => {
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const index = items.indexOf(entry.target as HTMLElement);
            if (index >= 0) onActive(index);
          }
        },
        { threshold: 0.6 },
      );
      for (const item of items) observer.observe(item);
      return () => {
        observer.disconnect();
      };
    },
    scrollToItem: (item) => {
      item.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "start",
      });
    },
  };
}

/**
 * Turns a horizontally scrolling track into a pager with indicator bars.
 *
 * The track scrolls natively, so without this script a learner can still reach
 * every item by swiping or scrolling. Enhancement adds the bars, which are real
 * buttons: they name where they move to, they are keyboard operable, and they
 * never depend on hover.
 *
 * The caller supplies the vocabulary through data attributes, so the same pager
 * serves applications, steps, or anything else without knowing what it holds.
 */
export function mountPager(
  root: HTMLElement,
  environment: PagerEnvironment = createBrowserPagerEnvironment(),
): () => void {
  const items = [...root.querySelectorAll<HTMLElement>("[data-pager-item]")];
  if (items.length < 2) return () => undefined;

  const noun = root.dataset.pagerNoun ?? "Item";
  const indicators = document.createElement("div");
  indicators.className = "pager-indicators";
  indicators.setAttribute("role", "group");
  indicators.setAttribute(
    "aria-label",
    root.dataset.pagerGroupLabel ?? `Choose a ${noun.toLowerCase()}`,
  );

  const buttons = items.map((item, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "pager-indicator";
    button.dataset.pagerIndicator = String(index);
    const title =
      item.dataset.pagerItemLabel ??
      item.querySelector("h3, h4")?.textContent?.trim() ??
      "";
    const position = `${noun} ${index + 1} of ${items.length}`;
    button.setAttribute(
      "aria-label",
      title === "" ? position : `${position}: ${title}`,
    );
    indicators.append(button);
    return button;
  });

  function setActive(index: number): void {
    buttons.forEach((button, at) => {
      button.setAttribute("aria-current", String(at === index));
    });
    root.dataset.pagerActive = String(index);
  }

  function show(index: number, moveFocus: boolean): void {
    const target = Math.max(0, Math.min(index, items.length - 1));
    const item = items[target];
    if (item === undefined) return;
    environment.scrollToItem(item);
    setActive(target);
    if (moveFocus) buttons[target]?.focus();
  }

  function activeIndex(): number {
    const found = buttons.findIndex(
      (button) => button.getAttribute("aria-current") === "true",
    );
    return found < 0 ? 0 : found;
  }

  buttons.forEach((button, index) => {
    button.addEventListener("click", () => {
      show(index, false);
    });
  });

  indicators.addEventListener("keydown", (event) => {
    const moves: Readonly<Record<string, number>> = {
      ArrowLeft: activeIndex() - 1,
      ArrowRight: activeIndex() + 1,
      End: items.length - 1,
      Home: 0,
    };
    const next = moves[event.key];
    if (next === undefined) return;
    event.preventDefault();
    show(next, true);
  });

  root.append(indicators);
  const release = environment.observeActive(items, setActive);
  setActive(0);

  return () => {
    release();
    indicators.remove();
  };
}
