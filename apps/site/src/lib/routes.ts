/**
 * Joins the site's base path to an internal path.
 *
 * The site is published under a project path, `/knowledge-hub/`, so a bare
 * `href="/"` would leave the site entirely. Astro rewrites the routes it
 * generates, but not links written by hand, so every internal link goes through
 * here. Kept separate from `href` below so the joining is testable without an
 * Astro environment.
 */
export function joinBase(base: string, path: string): string {
  const prefix = base.endsWith("/") ? base : `${base}/`;
  const rest = path.startsWith("/") ? path.slice(1) : path;
  return `${prefix}${rest}`;
}

/** The site-absolute URL for an internal path, base included. */
export function href(path: string): string {
  return joinBase(import.meta.env.BASE_URL, path);
}

/**
 * The canonical address of a lesson. Lowercase kebab-case with a trailing
 * slash, matching the approved route contract, and the only place that shape is
 * spelled out.
 */
export function lessonPath(domain: string, slug: string): string {
  return `/lessons/${domain}/${slug}/`;
}

export const ROUTES = {
  home: "/",
  explore: "/explore/",
  paths: "/paths/",
  about: "/about/",
  accessibility: "/accessibility/",
  twoPointers: "/lessons/dsa/two-pointers/",
} as const;
