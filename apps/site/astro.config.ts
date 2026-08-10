import { defineConfig } from "astro/config";

export default defineConfig({
  output: "static",
  /**
   * Published as a GitHub project site, so everything lives under a path
   * rather than at the domain root. `site` gives absolute URLs somewhere to
   * anchor; `base` prefixes generated routes and assets. Hand written internal
   * links are not rewritten by Astro, so they go through `href` in
   * `src/lib/routes.ts`.
   */
  site: "https://nphkhiem.github.io",
  base: "/knowledge-hub",
});
