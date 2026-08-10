/**
 * Turns a stack of prerendered code samples into a tab switcher.
 *
 * The markup ships with every sample visible, so a learner without scripting
 * can still read all of them. Enhancement is what introduces the tabs, and it
 * only does so when there is more than one sample to switch between.
 */
export function mountExampleTabs(root: HTMLElement): void {
  const panels = [
    ...root.querySelectorAll<HTMLElement>("[data-example-panel]"),
  ];
  if (panels.length < 2) return;

  const tablist = document.createElement("div");
  tablist.setAttribute("role", "tablist");
  tablist.className = "example-tablist";

  const tabs = panels.map((panel, index) => {
    const language = panel.dataset.language ?? String(index);
    const tab = document.createElement("button");
    tab.type = "button";
    tab.id = `example-tab-${language}`;
    tab.className = "example-tab";
    tab.setAttribute("role", "tab");
    tab.textContent = panel.dataset.languageLabel ?? language;

    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", tab.id);
    /** The tab now carries this label, so the heading would repeat it. */
    const heading = panel.querySelector<HTMLElement>("[data-example-heading]");
    if (heading !== null) heading.hidden = true;

    tablist.append(tab);
    return tab;
  });

  function select(index: number, moveFocus: boolean): void {
    const target = (index + tabs.length) % tabs.length;
    tabs.forEach((tab, at) => {
      const selected = at === target;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      const panel = panels[at];
      if (panel !== undefined) panel.hidden = !selected;
    });
    if (moveFocus) tabs[target]?.focus();
  }

  function selectedIndex(): number {
    const found = tabs.findIndex(
      (tab) => tab.getAttribute("aria-selected") === "true",
    );
    return found < 0 ? 0 : found;
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => {
      select(index, false);
    });
  });

  tablist.addEventListener("keydown", (event) => {
    const moves: Readonly<Record<string, number>> = {
      ArrowLeft: selectedIndex() - 1,
      ArrowRight: selectedIndex() + 1,
      End: tabs.length - 1,
      Home: 0,
    };
    const next = moves[event.key];
    if (next === undefined) return;
    event.preventDefault();
    select(next, true);
  });

  root.prepend(tablist);
  select(0, false);
}
