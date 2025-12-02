import { z } from 'zod'

export const optionalBoolean = z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return undefined
      if (typeof val === 'boolean') return val
      const str = String(val).toLowerCase()
      return str === 'true' || str === '1' || str === 'yes'
    },
    z.boolean().optional()
  )