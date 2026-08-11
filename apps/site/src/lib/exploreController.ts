import {
  describeFilters,
  parseFilters,
  searchLessons,
  toQueryString,
  type SearchFilters,
  type SearchRecord,
} from "./search.js";

export interface ExploreElements {
  readonly form: HTMLFormElement;
  readonly queryInput: HTMLInputElement;
  readonly domainSelect: HTMLSelectElement;
  readonly summary: HTMLElement;
  readonly results: HTMLElement;
  readonly empty: HTMLElement;
}

/**
 * Every source of ambient state is injected, so the controller is driven
 * deterministically in tests rather than reaching for globals.
 */
export interface ExploreEnvironment {
  readonly readLocation: () => string;
  readonly writeLocation: (url: string) => void;
}

/**
 * Filters the prerendered catalog in place.
 *
 * The page ships every lesson as real markup, so a visitor without scripting
 * gets the complete catalog rather than an empty shell. This only hides and
 * reveals what is already there, which is also why filtering cannot fail into a
 * blank page: the rows exist whatever happens here.
 */
export function mountExplore(
  elements: ExploreElements,
  records: readonly SearchRecord[],
  environment: ExploreEnvironment,
): () => void {
  const rows = new Map<string, HTMLElement>();
  for (const row of elements.results.querySelectorAll<HTMLElement>(
    "[data-lesson-slug]",
  )) {
    const slug = row.dataset["lessonSlug"];
    if (slug !== undefined) rows.set(slug, row);
  }

  function apply(filters: SearchFilters, pushUrl: boolean): void {
    const matches = searchLessons(records, filters);
    const visible = new Set(matches.map((record) => record.slug));

    for (const [slug, row] of rows) {
      row.hidden = !visible.has(slug);
    }

    // Reordering the DOM keeps the visual order equal to the ranked order,
    // which a hidden-only approach would silently break.
    for (const record of matches) {
      const row = rows.get(record.slug);
      if (row !== undefined) elements.results.append(row);
    }

    elements.summary.textContent = describeFilters(filters, matches.length);
    elements.empty.hidden = matches.length > 0;

    if (pushUrl) {
      // The literal attribute, not `form.action`, which the DOM resolves to an
      // absolute URL and would put the origin into every shared address.
      const base = elements.form.getAttribute("action") ?? "";
      environment.writeLocation(`${base}${toQueryString(filters)}`);
    }
  }

  function readFromControls(): SearchFilters {
    const params = new URLSearchParams();
    if (elements.queryInput.value.trim() !== "")
      params.set("q", elements.queryInput.value);
    if (elements.domainSelect.value !== "")
      params.set("domain", elements.domainSelect.value);
    return parseFilters(params);
  }

  function onInput(): void {
    apply(readFromControls(), true);
  }

  function onSubmit(event: Event): void {
    // The form works without scripting by navigating; with scripting the same
    // filtering happens in place, so the navigation is redundant.
    event.preventDefault();
    apply(readFromControls(), true);
  }

  elements.queryInput.addEventListener("input", onInput);
  elements.domainSelect.addEventListener("change", onInput);
  elements.form.addEventListener("submit", onSubmit);

  // Adopt whatever the shared URL asked for, so a link carrying filters opens
  // showing them rather than showing everything.
  const initial = parseFilters(
    new URLSearchParams(new URL(environment.readLocation()).search),
  );
  elements.queryInput.value = initial.query ?? "";
  elements.domainSelect.value = initial.domain ?? "";
  apply(initial, false);

  return () => {
    elements.queryInput.removeEventListener("input", onInput);
    elements.domainSelect.removeEventListener("change", onInput);
    elements.form.removeEventListener("submit", onSubmit);
  };
}
