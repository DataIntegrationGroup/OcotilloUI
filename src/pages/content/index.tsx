import React, { useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import {
  Alert,
  Box,
  Divider,
  Link,
  Typography,
  IconButton,
  Tooltip,
  Stack,
  Chip,
} from '@mui/material'
import { ContentCopy } from '@mui/icons-material'
import { Components } from 'react-markdown'
import { settings } from '@/settings'
import { getContentByHref } from '@/utils/contentModules'

export type FrontMatter = {
  title?: string
  deck?: string
  date?: string
}

type ContentPageProps = {
  src: string
}

export function parseFrontmatter(text: string): {
  data: FrontMatter
  content: string
} {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) return { data: {}, content: text }

  const yaml = match[1]
  const content = match[2]
  const data: FrontMatter = {}

  for (const line of yaml.split('\n')) {
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue
    const key = line.slice(0, colonIdx).trim()
    const value = line
      .slice(colonIdx + 1)
      .trim()
      .replace(/^["']|["']$/g, '')
    if (key === 'title' || key === 'deck' || key === 'date') {
      data[key] = value
    }
  }

  return { data, content }
}

export const markdownComponents: Components = {
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
    <Link href={href} target="_blank" rel="noreferrer">
      {children}
    </Link>
  ),
  blockquote: ({ children }) => {
    const text = React.Children.toArray(children)
      .map((child) => {
        if (React.isValidElement(child)) {
          return React.Children.toArray(child.props.children).join('')
        }

        return String(child)
      })
      .join('')
      .trim()

    const alertMatch = text.match(
      /^\[!(WARNING|INFO|ERROR|SUCCESS)\]\s*([\s\S]*)$/i
    )

    if (alertMatch) {
      const severityMap = {
        WARNING: 'warning',
        INFO: 'info',
        ERROR: 'error',
        SUCCESS: 'success',
      } as const

      const alertType = alertMatch[1].toUpperCase() as keyof typeof severityMap
      const alertBody = alertMatch[2].trim()

      return (
        <Alert severity={severityMap[alertType]} sx={{ my: 3 }}>
          {alertBody}
        </Alert>
      )
    }

    return (
      <Box
        component="blockquote"
        sx={{
          borderLeft: 4,
          borderColor: 'divider',
          pl: 2,
          my: 3,
          color: 'text.secondary',
          fontStyle: 'italic',
        }}
      >
        {children}
      </Box>
    )
  },
  code: ({ children, className }) => {
    const value = String(children).replace(/\n$/, '')

    if (className) {
      return <CopyCodeBlock value={value} />
    }

    return (
      <Typography component="code" sx={{ bgcolor: 'action.hover', px: 0.5 }}>
        {children}
      </Typography>
    )
  },
  ul: ({ children, node }) => {
    const getListItemText = (listItem: any): string => {
      return (
        listItem?.children
          ?.map((child: any) => child.value ?? '')
          ?.join('')
          ?.trim() ?? ''
      )
    }

    const listItems =
      node?.children?.filter(
        (child: any) => child.type === 'element' && child.tagName === 'li'
      ) ?? []
    const firstItemText = getListItemText(listItems[0])

    if (firstItemText === '[!CHIPS]') {
      return (
        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          flexWrap="wrap"
          sx={{ mb: 2 }}
        >
          {listItems.slice(1).map((item: any, index: number) => {
            const label = getListItemText(item)

            return (
              <Chip
                key={`${label}-${index}`}
                label={label}
                variant="outlined"
                color="default"
              />
            )
          })}
        </Stack>
      )
    }

    return (
      <Box component="ul" sx={{ pl: 3, mb: 2 }}>
        {children}
      </Box>
    )
  },
  ol: ({ children }) => (
    <Box component="ol" sx={{ pl: 3, mb: 2 }}>
      {children}
    </Box>
  ),
  li: ({ children }) => (
    <Typography
      component="li"
      variant="body1"
      sx={{ mb: 0.75, color: 'text.secondary' }}
    >
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

type MarkdownPageProps = {
  frontmatter: FrontMatter
  body: string
}

export const MarkdownPage: React.FC<MarkdownPageProps> = ({
  frontmatter,
  body,
}) => {
  return (
    <Box
      sx={{
        minHeight: '100%',
        bgcolor: 'background.wrapper',
        borderRadius: 1,
        py: 4,
      }}
    >
      <Box sx={{ maxWidth: '96ch', px: { xs: 2, md: 4 } }}>
        {frontmatter.title && (
          <Typography
            variant="h1"
            fontFamily="Outfit Variable"
            fontWeight={700}
            sx={{ mb: 1, fontSize: '2.2rem' }}
          >
            {frontmatter.title}
          </Typography>
        )}
        {frontmatter.deck && (
          <Typography
            fontFamily="Outfit Variable"
            fontWeight={200}
            variant="deck"
            sx={{
              display: 'block',
              mb: frontmatter.date ? 1 : 3,
              color: 'text.secondary',
            }}
          >
            {frontmatter.deck}
          </Typography>
        )}
        {frontmatter.date && (
          <Typography
            variant="caption"
            sx={{ display: 'block', mb: 3, color: 'text.disabled' }}
          >
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

export const ContentPage: React.FC<ContentPageProps> = ({ src }) => {
  const page = useMemo(() => {
    const raw = getContentByHref(src)
    if (raw === undefined) return null

    // Replace template placeholders like {{ key }} in the markdown text
    // with corresponding values from the `settings` object.
    //
    // Example:
    //   "https://{{ ocotillo_api_url }}/ogcapi"
    //   → "https://actual-value/ogcapi"
    //
    const hydratedText = raw.replace(/{{\s*([\w]+)\s*}}/g, (_, key: string) => {
      const value = (settings as Record<string, any>)[key]

      if (typeof value === 'string') {
        return value.replace(/\/+$/, '')
      }

      // if key not found or not string → reinsert key name
      return `{{ ${key} }}`
    })

    return parseFrontmatter(hydratedText)
  }, [src])

  if (!page) {
    return (
      <Box sx={{ minHeight: '100%', bgcolor: 'background.wrapper', p: 4 }}>
        <Typography color="error">{`Failed to load ${src}`}</Typography>
      </Box>
    )
  }

  return <MarkdownPage frontmatter={page.data} body={page.content} />
}

const CopyCodeBlock = ({ value }: { value: string }) => {
  const handleCopy = async () => {
    await navigator.clipboard.writeText(value)
  }

  return (
    <Box sx={{ position: 'relative', mb: 2 }}>
      <Typography
        component="code"
        variant="body2"
        sx={{
          px: 1.25,
          py: 1.25,
          pr: 6,
          borderRadius: 1,
          bgcolor: 'action.hover',
          overflowWrap: 'anywhere',
          display: 'block',
          color: 'text.primary',
        }}
      >
        {value}
      </Typography>

      <Tooltip title="Copy">
        <IconButton
          size="small"
          onClick={handleCopy}
          sx={{
            position: 'absolute',
            top: 6,
            right: 6,
          }}
          aria-label="Copy code block"
        >
          <ContentCopy fontSize="inherit" />
        </IconButton>
      </Tooltip>
    </Box>
  )
}
