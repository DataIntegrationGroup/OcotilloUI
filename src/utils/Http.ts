type Obj = Record<string, unknown>

function isObject(value: unknown): value is Obj {
  return typeof value === 'object' && value !== null
}

function numberProp(o: Obj, key: string): number | undefined {
  const v = o[key]
  return typeof v === 'number' ? v : undefined
}

export function getStatusCode(err: unknown): number | undefined {
  if (!isObject(err)) return undefined

  return (
    numberProp(err, 'statusCode') ??
    numberProp(err, 'status') ??
    (isObject(err['response'])
      ? numberProp(err['response'], 'status')
      : undefined)
  )
}

export function hasError(value: unknown): value is { error: unknown } {
  return isObject(value) && 'error' in value
}
