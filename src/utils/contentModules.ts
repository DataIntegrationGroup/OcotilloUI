/**
 * Markdown pages, bundled at build time.
 *
 * These used to live in `public/` and be fetched at runtime, but the docs
 * search also glob-imported them from there, which Vite warns about: assets in
 * `public/` are not meant to be imported from JavaScript. Keeping the files in
 * `src/` gives the search and the page renderer one source, and drops a
 * network round trip per page.
 */
const modules = import.meta.glob('../content/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const toContentPath = (modulePath: string) =>
  modulePath.replace(/^.*\/content\//, '')

/** Raw markdown keyed by path below the content root, e.g. `about.md`. */
export const CONTENT_BY_PATH: Record<string, string> = Object.fromEntries(
  Object.entries(modules).map(([modulePath, raw]) => [
    toContentPath(modulePath),
    raw,
  ])
)

/**
 * Looks up a page by the `/content/<name>.md` form the routes still use, so
 * call sites read the same as when these were fetched by URL.
 */
export const getContentByHref = (href: string): string | undefined =>
  CONTENT_BY_PATH[href.replace(/^\/?content\//, '')]
