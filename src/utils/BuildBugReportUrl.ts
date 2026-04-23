import { BUG_REPORT_FIELDS, BUG_REPORT_FORM_ID } from '@/config'

function formatReportedBy(name?: string, email?: string): string {
  const parts = [name, email ? `<${email}>` : ''].filter(Boolean)
  return parts.length > 0 ? parts.join(' ') : 'unknown'
}

export function buildBugReportUrl(context: {
  userName?: string
  userEmail?: string
}): string {
  const params = new URLSearchParams({
    [BUG_REPORT_FIELDS.pageUrl]: window.location.href,
    [BUG_REPORT_FIELDS.reportedBy]: formatReportedBy(
      context.userName,
      context.userEmail
    ),
    [BUG_REPORT_FIELDS.browser]: navigator.userAgent,
    [BUG_REPORT_FIELDS.timestamp]: new Date().toISOString(),
  })
  return `https://docs.google.com/forms/d/e/${BUG_REPORT_FORM_ID}/viewform?usp=pp_url&${params}`
}
