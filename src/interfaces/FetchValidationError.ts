import { PydanticValidationError } from '@/interfaces'

export type FetchValidationError = Error & {
  status?: number
  data?: PydanticValidationError
}
