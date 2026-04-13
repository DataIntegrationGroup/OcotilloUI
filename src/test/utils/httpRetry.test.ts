import { describe, it, expect, vi } from 'vitest'
import { withRetry } from '@/utils/httpRetry'

describe('withRetry', () => {
  it('retries on 429 and eventually succeeds', async () => {
    vi.useFakeTimers()

    let calls = 0
    const promise = withRetry(
      async () => {
        calls += 1
        if (calls < 3) {
          const err: any = new Error('rate limited')
          err.response = { status: 429 }
          throw err
        }
        return 'ok'
      },
      { retries: 3, baseDelayMs: 10, maxDelayMs: 20, jitter: false }
    )

    // attempt 1 fails -> waits 10ms, attempt 2 fails -> waits 20ms
    await vi.advanceTimersByTimeAsync(10 + 20)

    await expect(promise).resolves.toBe('ok')
    expect(calls).toBe(3)

    vi.useRealTimers()
  })

  it('does not retry on 400', async () => {
    let calls = 0
    await expect(
      withRetry(
        async () => {
          calls += 1
          const err: any = new Error('bad request')
          err.response = { status: 400 }
          throw err
        },
        { retries: 3, jitter: false, baseDelayMs: 1 }
      )
    ).rejects.toThrow('bad request')

    expect(calls).toBe(1)
  })
})

