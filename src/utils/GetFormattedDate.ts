export const getFormattedDate = (inputDate?: string | Date | null) => {
  const date = inputDate ? new Date(inputDate) : new Date()

  if (isNaN(date.getTime())) return null // guard against invalid dates

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0') // months are 0-based
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}
