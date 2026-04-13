import { FrontMatter, parseFrontmatter } from '@/pages/content'

export type DocEntry = {
  id: string
  title: string
  path: string
  slug: string
  route: string
  content: string
  frontmatter: FrontMatter
}

const docModules = import.meta.glob('../../public/content/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const startCase = (value: string) =>
  value
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())

const normalizeDocPath = (modulePath: string) =>
  modulePath.replace(/^.*\/public\/content\//, '')

const toSlug = (docPath: string) => docPath.replace(/\.md$/i, '')

export const DOC_ENTRIES: DocEntry[] = Object.entries(docModules)
  .map(([modulePath, rawContent]) => {
    const path = normalizeDocPath(modulePath)
    const slug = toSlug(path)
    const parsed = parseFrontmatter(rawContent)
    const title = parsed.data.title?.trim() || startCase(slug.split('/').at(-1) || slug)

    return {
      id: slug,
      title,
      path,
      slug,
      route: `/${slug}`,
      content: parsed.content,
      frontmatter: {
        ...parsed.data,
        title,
      },
    }
  })
  .sort((a, b) => a.title.localeCompare(b.title))

const scoreDoc = (doc: DocEntry, normalizedTerm: string) => {
  if (!normalizedTerm) return 0

  const title = doc.title.toLowerCase()
  const path = doc.path.toLowerCase()
  const content = doc.content.toLowerCase()

  if (title === normalizedTerm) return 500
  if (title.startsWith(normalizedTerm)) return 400
  if (title.includes(normalizedTerm)) return 300
  if (path.includes(normalizedTerm)) return 200
  if (content.includes(normalizedTerm)) return 100

  return -1
}

export const searchDocs = (term: string): DocEntry[] => {
  const normalizedTerm = term.trim().toLowerCase()

  if (!normalizedTerm) return DOC_ENTRIES

  return DOC_ENTRIES
    .map((doc) => ({
      doc,
      score: scoreDoc(doc, normalizedTerm),
    }))
    .filter((entry) => entry.score >= 0)
    .sort((a, b) => b.score - a.score || a.doc.title.localeCompare(b.doc.title))
    .map((entry) => entry.doc)
}

export const findDocBySlug = (slug: string) =>
  DOC_ENTRIES.find((doc) => doc.slug === slug)
