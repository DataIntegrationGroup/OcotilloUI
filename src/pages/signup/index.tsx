import CheckIcon from '@mui/icons-material/Check'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import { FormEvent, useEffect, useRef, useState } from 'react'
import { Link as RouterLink } from 'react-router'
import { LandingTopbar } from '@/components/LandingTopbar'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const SIGNUP_RECIPIENT = 'nmbg-ocotillo@nmt.edu'

export const buildSignupMailtoUrl = (name: string, email: string): string => {
  const subject = 'Ocotillo account request'
  const body = [`Name: ${name}`, `Work email: ${email}`].join('\n')

  return `mailto:${SIGNUP_RECIPIENT}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

export const buildSignupGmailUrl = (name: string, email: string): string => {
  const mailto = new URL(buildSignupMailtoUrl(name, email))
  const params = new URLSearchParams({
    view: 'cm',
    fs: '1',
    to: SIGNUP_RECIPIENT,
    su: mailto.searchParams.get('subject') ?? '',
    body: mailto.searchParams.get('body') ?? '',
  })

  return `https://mail.google.com/mail/?${params}`
}

export const isNmtWorkEmail = (email: string) =>
  /^[^\s@]+@nmt\.edu$/i.test(email.trim())

export const SignupPage = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [nameError, setNameError] = useState('')
  const [request, setRequest] = useState<{
    name: string
    email: string
  } | null>(null)
  const [copyStatus, setCopyStatus] = useState('')
  const [copied, setCopied] = useState(false)
  const copyTimer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => () => clearTimeout(copyTimer.current), [])

  const clearRequest = () => {
    setRequest(null)
    setCopyStatus('')
    setCopied(false)
    clearTimeout(copyTimer.current)
  }

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(SIGNUP_RECIPIENT)
      clearTimeout(copyTimer.current)
      setCopied(true)
      setCopyStatus('Email address copied.')
      copyTimer.current = setTimeout(() => {
        setCopied(false)
        setCopyStatus('')
      }, 1500)
    } catch {
      clearTimeout(copyTimer.current)
      setCopied(false)
      setCopyStatus('Unable to copy. Select and copy the email address above.')
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedName = name.trim()
    const trimmedEmail = email.trim()

    clearRequest()
    setNameError(trimmedName ? '' : 'Enter your full name.')
    if (!isNmtWorkEmail(trimmedEmail)) {
      setEmailError('Use your NMT work email ending in @nmt.edu.')
      return
    }

    setEmailError('')
    if (!trimmedName) return
    setRequest({ name: trimmedName, email: trimmedEmail })
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingTopbar />

      <main className="mx-auto flex max-w-2xl justify-center px-4 py-12 sm:px-8 sm:py-20">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="font-heading text-2xl">
              Request an Ocotillo account
            </CardTitle>
            <CardDescription>
              Complete the form to prepare an email request to the Ocotillo
              team. This is available to NMT work email holders.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-5" onSubmit={handleSubmit}>
              <div className="grid gap-2">
                <Label htmlFor="signup-name">Full name</Label>
                <Input
                  id="signup-name"
                  name="name"
                  autoComplete="name"
                  required
                  value={name}
                  aria-invalid={nameError ? 'true' : undefined}
                  aria-describedby={nameError ? 'signup-name-error' : undefined}
                  onChange={(event) => {
                    setName(event.target.value)
                    setNameError('')
                    clearRequest()
                  }}
                />
                {nameError && (
                  <p
                    id="signup-name-error"
                    className="text-sm text-destructive"
                  >
                    {nameError}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="signup-email">NMT work email</Label>
                <Input
                  id="signup-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  aria-invalid={emailError ? 'true' : undefined}
                  aria-describedby={
                    emailError ? 'signup-email-error' : undefined
                  }
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value)
                    clearRequest()
                    if (emailError) setEmailError('')
                  }}
                />
                {emailError ? (
                  <p
                    id="signup-email-error"
                    className="text-sm text-destructive"
                  >
                    {emailError}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Your address must end in @nmt.edu.
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit">Open email request</Button>
                <Button asChild variant="outline" className="ml-auto">
                  <RouterLink to="/">Back to Ocotillo</RouterLink>
                </Button>
              </div>
            </form>
            {request && (
              <section
                aria-label="Email request options"
                className="mt-6 grid min-w-0 gap-4 border-t pt-6"
              >
                <p role="status" className="text-sm text-muted-foreground">
                  Your request is ready. Choose an email app, then send the
                  prefilled email from that app.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <Button asChild>
                    <a
                      href={buildSignupGmailUrl(request.name, request.email)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Send via Gmail
                    </a>
                  </Button>
                  <Button asChild variant="outline" className="ml-auto">
                    <a href={buildSignupMailtoUrl(request.name, request.email)}>
                      Send email with default client
                    </a>
                  </Button>
                </div>
                <div className="grid min-w-0 gap-2 text-sm">
                  <p className="text-muted-foreground">
                    Or email the Ocotillo team directly:
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <code className="break-all rounded bg-muted px-3 py-1">
                      {SIGNUP_RECIPIENT}
                    </code>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label={
                        copied ? 'Email address copied' : 'Copy email address'
                      }
                      title={
                        copied ? 'Email address copied' : 'Copy email address'
                      }
                      onClick={copyEmail}
                    >
                      {copied ? (
                        <CheckIcon fontSize="small" />
                      ) : (
                        <ContentCopyIcon fontSize="small" />
                      )}
                    </Button>
                    <p role="status" className="text-sm text-muted-foreground">
                      {copyStatus}
                    </p>
                  </div>
                </div>
              </section>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
