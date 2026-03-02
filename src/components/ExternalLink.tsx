import { Link, LinkProps, Box } from '@mui/material'
import { OpenInNew } from '@mui/icons-material'
import { ReactNode } from 'react'

type ExternalLinkProps = Omit<LinkProps, 'href' | 'target' | 'rel'> & {
  href: `https://${string}` | `http://${string}`
  children?: ReactNode
  ariaLabel?: string
  showIcon?: boolean
  iconSx?: LinkProps['sx']
}

export const ExternalLink = ({
  href,
  children,
  ariaLabel,
  showIcon = true,
  iconSx,
  sx,
  ...props
}: ExternalLinkProps) => {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={
        ariaLabel ?? (typeof children === 'string' ? children : 'External link')
      }
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        ...sx,
      }}
      {...props}
    >
      {children ?? 'Link'}

      {showIcon && (
        <Box
          component={OpenInNew}
          sx={{
            fontSize: '0.9em',
            opacity: 0.8,
            transition: 'opacity 0.2s',
            ...iconSx,
          }}
        />
      )}
    </Link>
  )
}
