// Highlight matched text
export const highlight = (text: string, query: string) => {
  if (!query) return text
  const idx = text?.toLowerCase()?.indexOf(query?.toLowerCase())
  if (idx === -1) return text

  return (
    <>
      {text?.substring(0, idx)}
      <strong style={{ color: '#1976d2' }}>
        {text?.substring(idx, idx + query.length)}
      </strong>
      {text?.substring(idx + query.length)}
    </>
  )
}
