type ErrorLike = {
  statusCode?: number
  status?: number
  response?: { status?: number }
  message?: string
  name?: string
}

export function getStatusCode(err: unknown): number | undefined {
  const e = err as ErrorLike | null
  return e?.statusCode ?? e?.status ?? e?.response?.status
}
