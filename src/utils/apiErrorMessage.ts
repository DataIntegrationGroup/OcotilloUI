import axios from 'axios'

type PydanticIssue = { loc?: Array<string | number>; msg?: string }

/**
 * A readable message for a failed Ocotillo API call.
 *
 * Axios reports only the status ("Request failed with status code 422"),
 * which hides why the API refused. FastAPI puts the reason in `detail`: a
 * string, or a list of pydantic-style issues with a `loc` path and `msg`.
 */
export const getApiErrorMessage = (
  error: unknown,
  fallback = 'The request failed.'
): string => {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail as
      | string
      | PydanticIssue[]
      | undefined

    if (typeof detail === 'string' && detail) return detail

    if (Array.isArray(detail)) {
      const messages = detail
        .filter((issue) => issue?.msg)
        .map((issue) => {
          const field = (issue.loc ?? [])
            .filter((part) => part !== 'body')
            .join('.')
          return field ? `${field}: ${issue.msg}` : String(issue.msg)
        })
      if (messages.length > 0) return messages.join('; ')
    }
  }

  if (error instanceof Error && error.message) return error.message
  return fallback
}
