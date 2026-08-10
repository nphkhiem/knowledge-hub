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

export const ROUTES = {
  home: "/",
  twoPointers: "/lessons/dsa/two-pointers/",
} as const;
