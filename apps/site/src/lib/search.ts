import type { CompiledLesson } from "@knowledge-hub/lesson-compiler";

import { domainLabel } from "./collection.js";

const DOMAINS = ["dsa", "networking", "system-design"] as const;

/** One lesson as the static search index carries it. */
export interface SearchRecord {
  readonly slug: string;
  readonly difficulty: CompiledLesson["difficulty"];
  readonly domain: CompiledLesson["domain"];
  readonly collection: string;
  readonly order: number;
  readonly title: string;
  readonly objective: string;
  readonly durationMinutes: number;
  /** Recognition signals, which are how a learner names a concept they half know. */
  readonly terms: readonly string[];
  /**
   * Unique words from the lesson's prose.
   *
   * Stored as unique words rather than as the prose itself because this index
   * ships inside the page and the payload is budgeted. A term central to a
   * lesson is usually in its body rather than its title: before this existed,
   * searching `scan` returned nothing though a whole lesson is about scans.
   */
  readonly prose: string;
}

const SHORTEST_INDEXED_WORD = 3;
/**
 * Words indexed per lesson.
 *
 * The index ships inside the page, so its size is the whole collection's, not
 * one lesson's. Uncapped, two lessons cost 2.5 kB each and thirty-three would
 * cost about 81 kB of payload on a page with a performance budget. A cap keeps
 * that growth bounded and predictable; the words it drops are the tail of a
 * lesson's prose, which is where a search term is least likely to be decisive.
 */
const MOST_INDEXED_WORDS = 90;

/** Reduces compiled markup to the unique words worth searching. */
export function proseTerms(...html: readonly string[]): string {
  const seen = new Set<string>();
  const words: string[] = [];

  for (const word of html
    .join(" ")
    .replace(/<[^>]*>/g, " ")
    .toLowerCase()
    .split(/[^a-z0-9]+/)) {
    if (word.length < SHORTEST_INDEXED_WORD || seen.has(word)) continue;
    seen.add(word);
    words.push(word);
    if (words.length === MOST_INDEXED_WORDS) break;
  }

  return words.join(" ");
}

export interface SearchFilters {
  readonly query?: string;
  readonly domain?: CompiledLesson["domain"];
  readonly path?: string;
}

/** Builds the static index. Runs at build time, never in the browser. */
export function toSearchRecord(lesson: CompiledLesson): SearchRecord {
  return {
    slug: lesson.slug,
    difficulty: lesson.difficulty,
    domain: lesson.domain,
    collection: lesson.collection,
    order: lesson.order,
    title: lesson.title,
    objective: lesson.objective,
    durationMinutes: lesson.durationMinutes,
    terms: lesson.recognitionSignals,
    // Ordered by signal, because the cap truncates the tail. Application
    // titles are short and name concrete situations a learner searches for,
    // so they are indexed before the bodies they head.
    prose: proseTerms(
      ...lesson.content.realWorldApplications.map(
        (application) => application.title,
      ),
      lesson.content.quickUnderstanding.html,
      ...lesson.content.realWorldApplications.map(
        (application) => application.html,
      ),
      lesson.content.deepDive?.html ?? "",
    ),
  };
}

function isDomain(value: string): value is CompiledLesson["domain"] {
  return (DOMAINS as readonly string[]).includes(value);
}

/**
 * Reads filters from a query string.
 *
 * Unknown parameters are dropped rather than rejected, so a link shared before
 * a filter was removed still opens something sensible. `saved=1` is the live
 * example: it filtered to bookmarks before the site stopped keeping any.
 */
export function parseFilters(params: URLSearchParams): SearchFilters {
  const filters: {
    query?: string;
    domain?: CompiledLesson["domain"];
    path?: string;
  } = {};

  const query = params.get("q")?.trim();
  if (query !== undefined && query !== "") filters.query = query;

  const domain = params.get("domain")?.trim();
  if (domain !== undefined && isDomain(domain)) filters.domain = domain;

  const path = params.get("path")?.trim();
  if (path !== undefined && path !== "") filters.path = path;

  return filters;
}

/** Serializes filters back to a query string, omitting anything empty. */
export function toQueryString(filters: SearchFilters): string {
  const params = new URLSearchParams();
  if (filters.query !== undefined) params.set("q", filters.query);
  if (filters.domain !== undefined) params.set("domain", filters.domain);
  if (filters.path !== undefined) params.set("path", filters.path);
  const serialized = params.toString();
  return serialized === "" ? "" : `?${serialized}`;
}

/**
 * Scores one record against a query. Higher is more relevant.
 *
 * The weighting is deliberate and matches the approved ranking rule: a title or
 * exact concept match outranks a recognition signal, which outranks body text.
 * Popularity plays no part because no analytics exist to supply it.
 */
function score(record: SearchRecord, query: string): number {
  // Normalized here rather than only in `parseFilters`, so a caller that builds
  // filters by hand gets the same matching as one that read them from a URL.
  const needle = query.trim().toLowerCase();
  if (needle === "") return 1;
  const title = record.title.toLowerCase();

  if (title === needle) return 100;
  if (title.includes(needle)) return 50;
  if (record.terms.some((term) => term.toLowerCase().includes(needle)))
    return 20;
  if (record.objective.toLowerCase().includes(needle)) return 10;
  // The body is the weakest signal: a word appearing somewhere in the prose
  // says far less than the same word in a title or a recognition signal.
  if (record.prose.includes(needle)) return 5;
  return 0;
}

/**
 * Filters and ranks the index.
 *
 * Ties break on reading order rather than on the order the catalog happened to
 * supply, so the same filters always produce the same list.
 */
export function searchLessons(
  records: readonly SearchRecord[],
  filters: SearchFilters,
): readonly SearchRecord[] {
  const matched = records.filter((record) => {
    if (filters.domain !== undefined && record.domain !== filters.domain)
      return false;
    if (filters.path !== undefined && record.collection !== filters.path)
      return false;
    if (filters.query !== undefined && score(record, filters.query) === 0)
      return false;
    return true;
  });

  return [...matched].sort((left, right) => {
    if (filters.query !== undefined) {
      const difference =
        score(right, filters.query) - score(left, filters.query);
      if (difference !== 0) return difference;
    }
    return left.order - right.order;
  });
}

/** Plain-language explanation of the current result set. */
export function describeFilters(filters: SearchFilters, count: number): string {
  const lessons = count === 1 ? "1 lesson" : `${count} lessons`;
  const inDomain =
    filters.domain === undefined ? "" : ` in ${domainLabel(filters.domain)}`;

  if (filters.query === undefined) {
    return filters.domain === undefined
      ? `Showing all ${lessons}.`
      : `${lessons}${inDomain}.`;
  }

  const matching = `matching "${filters.query}"`;
  return count === 0
    ? `No lessons ${matching}${inDomain}.`
    : `${lessons} ${matching}${inDomain}.`;
}
