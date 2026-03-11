export type RetryOptions = {
  /** max number of attempts including the first attempt */
  retries?: number
  /** base delay in ms (exponential backoff uses 2^n * baseDelay) */
  baseDelayMs?: number
  /** max delay in ms */
  maxDelayMs?: number
  /** add jitter (0..baseDelay) to spread requests */
  jitter?: boolean
  /** status codes to retry */
  retryOnStatuses?: number[]
  /** optional abort signal */
  signal?: AbortSignal
}

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }

    const onAbort = () => {
      cleanup()
      reject(new DOMException('Aborted', 'AbortError'))
    }

    const cleanup = () => {
      signal?.removeEventListener('abort', onAbort)
    }

    const id = setTimeout(() => {
      cleanup()
      resolve()
    }, ms)

    signal?.addEventListener('abort', onAbort)

    // If aborted, stop waiting immediately.
    signal?.addEventListener('abort', () => clearTimeout(id), { once: true })
  })

const getStatus = (err: any): number | undefined =>
  err?.status ?? err?.response?.status ?? err?.data?.status

export const withRetry = async <T>(
  fn: (attempt: number) => Promise<T>,
  {
    retries = 3,
    baseDelayMs = 350,
    maxDelayMs = 4000,
    jitter = true,
    retryOnStatuses = [429, 502, 503, 504],
    signal,
  }: RetryOptions = {}
): Promise<T> => {
  let lastError: any

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')

    try {
      return await fn(attempt)
    } catch (err: any) {
      lastError = err
      const status = getStatus(err)
      const shouldRetry =
        attempt < retries &&
        (status === undefined || retryOnStatuses.includes(status))

      if (!shouldRetry) break

      const exp = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1))
      const delay = jitter ? exp + Math.floor(Math.random() * baseDelayMs) : exp
      await sleep(delay, signal)
    }
  }

  throw lastError
}
