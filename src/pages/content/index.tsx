import React, { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Box, CircularProgress, Divider, Typography } from '@mui/material'
import { Components } from 'react-markdown'

type FrontMatter = {
  title?: string
  deck?: string
  date?: string
}

type ContentPageProps = {
  src: string
}

function parseFrontmatter(text: string): { data: FrontMatter; content: string } {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) return { data: {}, content: text }

  const yaml = match[1]
  const content = match[2]
  const data: FrontMatter = {}

  for (const line of yaml.split('\n')) {
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue
    const key = line.slice(0, colonIdx).trim()
    const value = line.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, '')
    if (key === 'title' || key === 'deck' || key === 'date') {
      data[key] = value
    }
  }

  return { data, content }
}

const markdownComponents: Components = {
  h2: ({ children }) => (
    <Typography variant="h5" fontWeight={700} sx={{ mt: 4, mb: 1 }}>
      {children}
    </Typography>
  ),
  h3: ({ children }) => (
    <Typography variant="h6" fontWeight={600} sx={{ mt: 3, mb: 0.5 }}>
      {children}
    </Typography>
  ),
  p: ({ children }) => (
    <Typography variant="body1" sx={{ mb: 2, color: 'text.secondary' }}>
      {children}
    </Typography>
  ),
  a: ({ href, children }) => (
    <a href={href} style={{ color: 'inherit' }}>
      {children}
    </a>
  ),
  ul: ({ children }) => (
    <Box component="ul" sx={{ pl: 3, mb: 2 }}>
      {children}
    </Box>
  ),
  ol: ({ children }) => (
    <Box component="ol" sx={{ pl: 3, mb: 2 }}>
      {children}
    </Box>
  ),
  li: ({ children }) => (
    <Typography component="li" variant="body1" sx={{ mb: 0.5, color: 'text.secondary' }}>
      {children}
    </Typography>
  ),
  img: ({ src, alt }) => (
    <Box
      component="img"
      src={src}
      alt={alt}
      sx={{ maxWidth: '100%', borderRadius: 1, my: 2, display: 'block' }}
    />
  ),
  hr: () => <Divider sx={{ my: 3 }} />,
}

export const ContentPage: React.FC<ContentPageProps> = ({ src }) => {
  const [frontmatter, setFrontmatter] = useState<FrontMatter>({})
  const [body, setBody] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch(src)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load ${src}`)
        return res.text()
      })
      .then((text) => {
        const parsed = parseFrontmatter(text)
        setFrontmatter(parsed.data)
        setBody(parsed.content)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [src])

  if (loading) {
    return (
      <Box sx={{ minHeight: '100%', bgcolor: 'background.wrapper', display: 'flex', justifyContent: 'center', pt: 8, borderRadius: 1 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ minHeight: '100%', bgcolor: 'background.wrapper', p: 4 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ minHeight: '100%', bgcolor: 'background.wrapper', borderRadius: 1, py: 4 }}>
      <Box sx={{ maxWidth: '96ch', px: { xs: 2, md: 4 } }}>
        {frontmatter.title && (
          <Typography variant="h1" fontFamily="Outfit Variable" fontWeight={700} sx={{ mb: 1, fontSize: '2.2rem' }}>
            {frontmatter.title}
          </Typography>
        )}
        {frontmatter.deck && (
          <Typography fontFamily="Outfit Variable" fontWeight={200} variant="deck" sx={{ display: 'block', mb: frontmatter.date ? 1 : 3, color: 'text.secondary' }}>
            {frontmatter.deck}
          </Typography>
        )}
        {frontmatter.date && (
          <Typography variant="caption" sx={{ display: 'block', mb: 3, color: 'text.disabled' }}>
            {new Date(frontmatter.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Typography>
        )}
      </Box>
      <Box sx={{ maxWidth: '80ch', px: { xs: 2, md: 4 }, py: 0 }}>
        <ReactMarkdown components={markdownComponents}>{body}</ReactMarkdown>
      </Box>
    </Box>
  )
}
