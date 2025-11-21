import Papa from 'papaparse'

export function parseCSV<T extends Record<string, any>>(
  file: File,
  fieldNames: string[]
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase(),
      complete: (results) => {
        try {
          if (!results.data || results.data.length === 0) {
            reject(new Error('CSV must have at least a header row and one data row'))
            return
          }

          // Map CSV data to expected field names
          const rows: T[] = results.data.map((rawRow: any) => {
            const row: any = {}
            fieldNames.forEach((fieldName) => {
              const headerKey = fieldName.toLowerCase()
              const value = rawRow[headerKey]
              row[fieldName] = value ? String(value).trim() : ''
            })
            return row
          })

          resolve(rows)
        } catch (error) {
          reject(error)
        }
      },
      error: (error) => {
        reject(new Error(`Failed to parse CSV: ${error.message}`))
      },
    })
  })
}

