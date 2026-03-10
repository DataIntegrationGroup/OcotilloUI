export const formatTitle = (title: string) => {
  if (title.endsWith(':') || title.endsWith('?')) {
    return title
  }
  return `${title}:`
}
