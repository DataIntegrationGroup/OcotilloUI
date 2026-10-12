import { FormEvent, useState } from 'react'
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

export const buildSignupMailtoUrl = (name: string, email: string) => {
  const subject = 'Ocotillo account request'
  const body = [`Name: ${name}`, `Work email: ${email}`].join('\n')

  return `mailto:${SIGNUP_RECIPIENT}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

export const isNmtWorkEmail = (email: string) =>
  /^[^\s@]+@nmt\.edu$/i.test(email.trim())

export const SignupPage = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedName = name.trim()
    const trimmedEmail = email.trim()

    if (!isNmtWorkEmail(trimmedEmail)) {
      setEmailError('Use your NMT work email ending in @nmt.edu.')
      return
    }

    setEmailError('')
    window.location.href = buildSignupMailtoUrl(trimmedName, trimmedEmail)
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
              Complete the form to open a prefilled email request to the
              Ocotillo team. This is available to NMT work email holders.
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
                  onChange={(event) => setName(event.target.value)}
                />
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
                  aria-describedby={emailError ? 'signup-email-error' : undefined}
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value)
                    if (emailError) setEmailError('')
                  }}
                />
                {emailError ? (
                  <p id="signup-email-error" className="text-sm text-destructive">
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
                <Button asChild variant="outline">
                  <RouterLink to="/">Back to Ocotillo</RouterLink>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
