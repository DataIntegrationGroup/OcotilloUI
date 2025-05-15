export const removeEmptyFields = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(removeEmptyFields)
  } else if (typeof obj === 'object' && obj !== null) {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([, value]) => value !== '' && value !== null)
        .map(([key, value]) => [key, removeEmptyFields(value)])
    )
  }
  return obj
}
