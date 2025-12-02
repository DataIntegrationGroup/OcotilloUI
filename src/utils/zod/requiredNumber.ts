import { z } from 'zod'

export const requiredNumber = (message: string) =>
    z.preprocess(
      (val) => {
        if (val === '' || val === null || val === undefined) return NaN
        return val
      },
      z.coerce.number().refine((val) => !isNaN(val), { message })
    )