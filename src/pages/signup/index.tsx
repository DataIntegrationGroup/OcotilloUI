import CheckIcon from "@mui/icons-material/Check";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { FormEvent, useEffect, useRef, useState } from "react";
import { LandingTopbar } from "@/components/LandingTopbar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardFooter,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { settings } from "@/settings";

const SIGNUP_RECIPIENT = settings.signup_recipient;

export const buildSignupMailtoUrl = (name: string, email: string): string => {
  const subject = "Ocotillo account request";
  const body = [`Name: ${name}`, `Work email: ${email}`].join("\n");

  return `mailto:${SIGNUP_RECIPIENT}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};

export const buildSignupGmailUrl = (name: string, email: string): string => {
  const mailto = new URL(buildSignupMailtoUrl(name, email));
  const params = new URLSearchParams({
    view: "cm",
    fs: "1",
    to: SIGNUP_RECIPIENT,
    su: mailto.searchParams.get("subject") ?? "",
    body: mailto.searchParams.get("body") ?? "",
  });

  return `https://mail.google.com/mail/u/0/?${params}`;
};

export const isNmtWorkEmail = (email: string) =>
  /^[^\s@]+@nmt\.edu$/i.test(email.trim());

export const SignupPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [nameError, setNameError] = useState("");
  const [request, setRequest] = useState<{
    name: string;
    email: string;
  } | null>(null);
  const [copyStatus, setCopyStatus] = useState("");
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(copyTimer.current), []);

  const clearRequest = () => {
    setRequest(null);
    setCopyStatus("");
    setCopied(false);
    clearTimeout(copyTimer.current);
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(SIGNUP_RECIPIENT);
      clearTimeout(copyTimer.current);
      setCopied(true);
      setCopyStatus("Email address copied.");
      copyTimer.current = setTimeout(() => {
        setCopied(false);
        setCopyStatus("");
      }, 1500);
    } catch {
      clearTimeout(copyTimer.current);
      setCopied(false);
      setCopyStatus("Unable to copy. Select and copy the email address above.");
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    clearRequest();
    setNameError(trimmedName ? "" : "Enter your full name.");
    if (!isNmtWorkEmail(trimmedEmail)) {
      setEmailError("Use your NMT work email ending in @nmt.edu.");
      return;
    }

    setEmailError("");
    if (!trimmedName) return;
    setRequest({ name: trimmedName, email: trimmedEmail });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingTopbar />

      <main className="mx-auto flex max-w-2xl justify-center px-4 py-12 sm:px-8 sm:py-20">
        <Card className="w-full">
          <CardHeader className="grid  gap-x-3 gap-y-1">
            <CardTitle className="font-heading text-3xl">
              Request an Ocotillo account
            </CardTitle>
            <CardDescription>
              Get access to the Ocotillo platform
            </CardDescription>
            <p className="pt-4">
              Enter your NMT information below. We'll prepare an account request
              email for you to send to the Ocotillo team.
            </p>
          </CardHeader>
          <CardContent>
            <form className="grid gap-5 py-4" onSubmit={handleSubmit}>
              <div className="grid gap-2">
                <Label htmlFor="signup-name">Full name</Label>
                <Input
                  id="signup-name"
                  name="name"
                  autoComplete="name"
                  required
                  value={name}
                  aria-invalid={nameError ? "true" : undefined}
                  aria-describedby={nameError ? "signup-name-error" : undefined}
                  onChange={(event) => {
                    setName(event.target.value);
                    setNameError("");
                    clearRequest();
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
                  aria-invalid={emailError ? "true" : undefined}
                  aria-describedby={
                    emailError ? "signup-email-error" : undefined
                  }
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    clearRequest();
                    if (emailError) setEmailError("");
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
                  <p className="flex items-center gap-1 text-sm text-muted-foreground">
                    <InfoOutlinedIcon aria-hidden="true" fontSize="inherit" />
                    Use your @nmt.edu email address
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Button
                  type="submit"
                  disabled={Boolean(request)}
                  className="w-full"
                >
                  Continue to email
                  <ArrowForwardIcon aria-hidden="true" />
                </Button>
                <p className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                  <InfoOutlinedIcon aria-hidden="true" fontSize="inherit" />
                  You'll review the email before sending it.
                </p>
              </div>
            </form>
            {request && (
              <section
                aria-label="Email request options"
                className="mt-6 grid min-w-0 gap-4 border-t pt-10"
              >
                <p role="status" className="text-sm text-muted-foreground">
                  Choose an email app, then send the prefilled email from that
                  app.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <Button asChild>
                    <a
                      href={buildSignupGmailUrl(request.name, request.email)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Gmail
                    </a>
                  </Button>
                  <Button asChild variant="outline" className="ml-auto">
                    <a href={buildSignupMailtoUrl(request.name, request.email)}>
                      Default client
                    </a>
                  </Button>
                </div>
              </section>
            )}
          </CardContent>
          <CardFooter className="flex min-w-0 flex-wrap items-center justify-between gap-4 border-t border-border bg-background text-sm text-foreground dark:border-white/10 dark:bg-[#080808] dark:text-white sm:px-6">
            <div className="min-w-0">
              <p className="font-medium">Need help? Email the team directly.</p>
              <a
                className="mt-1 block truncate text-muted-foreground transition-colors hover:text-foreground dark:text-white/65 dark:hover:text-white"
                href={`mailto:${SIGNUP_RECIPIENT}`}
              >
                {SIGNUP_RECIPIENT}
              </a>
            </div>
            <div className="flex min-w-0 items-center gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-8 w-fit max-w-full cursor-pointer gap-1 rounded-full border-border bg-transparent px-3 font-normal text-foreground shadow-none hover:bg-muted hover:text-foreground dark:border-white/25 dark:text-white dark:hover:bg-white/10 dark:hover:text-white"
                aria-label={
                  copied
                    ? `Email address copied: ${SIGNUP_RECIPIENT}`
                    : `Copy email address: ${SIGNUP_RECIPIENT}`
                }
                title="Copy email address"
                onClick={copyEmail}
              >
                {copied ? (
                  <CheckIcon fontSize="inherit" />
                ) : (
                  <ContentCopyIcon fontSize="inherit" />
                )}
                <span>{copied ? "Copied" : "Copy email"}</span>
              </Button>
              <p role="status" className="sr-only">
                {copyStatus}
              </p>
            </div>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
};
