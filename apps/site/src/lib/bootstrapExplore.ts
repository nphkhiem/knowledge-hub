import { mountExplore, type ExploreElements } from "./exploreController.js";
import type { SearchRecord } from "./search.js";

/**
 * The fail-open boundary for Explore.
 *
 * Every lesson is already prerendered on the page, so if anything here goes
 * wrong the visitor keeps the complete browsable catalog. That is the same
 * outcome as scripting being unavailable, which is why this never rethrows and
 * never reports a raw error to the page.
 */
export function bootstrapExplore(root: Document = document): void {
  try {
    const data = root.querySelector("[data-search-index]");
    const form = root.querySelector<HTMLFormElement>("[data-explore-form]");
    const queryInput = root.querySelector<HTMLInputElement>(
      "[data-explore-query]",
    );
    const domainSelect = root.querySelector<HTMLSelectElement>(
      "[data-explore-domain]",
    );
    const summary = root.querySelector<HTMLElement>("[data-explore-summary]");
    const results = root.querySelector<HTMLElement>("[data-explore-results]");
    const empty = root.querySelector<HTMLElement>("[data-explore-empty]");

    if (
      data === null ||
      form === null ||
      queryInput === null ||
      domainSelect === null ||
      summary === null ||
      results === null ||
      empty === null
    ) {
      return;
    }

    const records = JSON.parse(data.textContent ?? "") as SearchRecord[];
    if (!Array.isArray(records) || records.length === 0) return;

    const elements: ExploreElements = {
      form,
      queryInput,
      domainSelect,
      summary,
      results,
      empty,
    };

    mountExplore(elements, records, {
      readLocation: () => window.location.href,
      writeLocation: (url) => window.history.replaceState(null, "", url),
    });

    form.dataset["exploreState"] = "ready";
  } catch {
    // The prerendered catalog stands on its own.
  }
}
