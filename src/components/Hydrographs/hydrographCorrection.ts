import { inflateRaw } from 'pako'

export interface HydrographPoint {
  time: Date
  value: number
}

export interface HydrographRange {
  startTime: Date
  endTime: Date
}

export interface ParsedHydrographUpload {
  pointId: string | null
  detectedDelimiter: string
  detectedValueColumn: string
  detectedTimeColumn: string
  measurements: HydrographPoint[]
}

const DELIMITER_CANDIDATES = ['\t', ',', ';', '|']

const POINT_ID_PATTERNS = [
  /thing\.name\s*[:=]\s*([A-Za-z0-9._-]+)/i,
  /point(?:\s|_|-)?id\s*[:=]\s*([A-Za-z0-9._-]+)/i,
  /well(?:\s|_|-)?name\s*[:=]\s*([A-Za-z0-9._-]+)/i,
  /site(?:\s|_|-)?id\s*[:=]\s*([A-Za-z0-9._-]+)/i,
]

const TIME_COLUMN_PATTERNS = [
  /date\s*time/i,
  /datetime/i,
  /timestamp/i,
  /observation/i,
  /date/i,
]

const VALUE_COLUMN_PATTERNS = [
  /adjusted dtw/i,
  /\bdtw\b/i,
  /depth.*water/i,
  /water.*level/i,
  /water.*head/i,
  /level/i,
  /reading/i,
  /result/i,
  /value/i,
]

const DATE_ONLY_PATTERN = /date/i
const TIME_ONLY_PATTERN = /^time$/i

const toUnixTime = (value: Date) => value.getTime()

export const normalizePointId = (value?: string | null) =>
  (value ?? '').trim().toUpperCase()

export const extractPointIdFromFileName = (fileName: string) => {
  const baseName = fileName.replace(/\.[^.]+$/, '')
  const tokens = baseName
    .split(/[_-]+/)
    .map((token) => token.trim())
    .filter(Boolean)

  const leadingToken = tokens[0] ?? ''
  const compactPointIdMatch = leadingToken.match(/^([A-Za-z]{1,4})(\d{3,6})$/)
  if (compactPointIdMatch) {
    return normalizePointId(
      `${compactPointIdMatch[1]}-${compactPointIdMatch[2]}`
    )
  }

  const explicitPointIdMatch = leadingToken.match(
    /^([A-Za-z]{1,4})[-_ ]?(\d{3,6})$/
  )
  if (explicitPointIdMatch) {
    return normalizePointId(
      `${explicitPointIdMatch[1]}-${explicitPointIdMatch[2]}`
    )
  }

  return normalizePointId(baseName)
}

export const extractPointIdFromText = (text: string) => {
  for (const pattern of POINT_ID_PATTERNS) {
    const match = text.match(pattern)
    if (match?.[1]) {
      return normalizePointId(match[1])
    }
  }

  return null
}

const detectDelimiter = (lines: string[]) => {
  const sample = lines.slice(0, 20).join('\n')

  const ranked = DELIMITER_CANDIDATES.map((delimiter) => ({
    delimiter,
    score: sample.split(delimiter).length - 1,
  })).sort((a, b) => b.score - a.score)

  return ranked[0]?.score > 0 ? ranked[0].delimiter : ','
}

const splitRow = (line: string, delimiter: string) =>
  line
    .split(delimiter)
    .map((cell) => cell.trim().replace(/^"(.*)"$/, '$1'))

const maybeParseDate = (value: string) => {
  const candidate = value.trim()
  if (!candidate) return null

  const parsed = new Date(candidate)
  if (!Number.isNaN(parsed.getTime())) {
    return parsed
  }

  return null
}

const resolveHeaderRow = (rows: string[][]) => {
  return rows.findIndex((row) => {
    const hasTimeColumn = row.some((cell) =>
      TIME_COLUMN_PATTERNS.some((pattern) => pattern.test(cell))
    )
    const hasValueColumn = row.some((cell) =>
      VALUE_COLUMN_PATTERNS.some((pattern) => pattern.test(cell))
    )

    return hasTimeColumn && hasValueColumn
  })
}

const pickColumnIndex = (headers: string[], patterns: RegExp[]) =>
  headers.findIndex((header) =>
    patterns.some((pattern) => pattern.test(header.trim()))
  )

const pickPreferredValueColumnIndex = (headers: string[]) => {
  const priorities = [
    /adjusted dtw/i,
    /\bdtw\b/i,
    /depth.*water/i,
    /water.*level/i,
    /water.*head/i,
    /level/i,
    /reading/i,
    /result/i,
    /value/i,
  ]

  for (const pattern of priorities) {
    const index = headers.findIndex((header) => pattern.test(header.trim()))
    if (index >= 0) {
      return index
    }
  }

  return -1
}

const parseMeasurementRows = ({
  rows,
  headerIndex,
  delimiter,
}: {
  rows: string[][]
  headerIndex: number
  delimiter: string
}) => {
  const headers = rows[headerIndex].map((header) => header.trim())

  const pointIdIndex =
    pickColumnIndex(headers, [/thing\.name/i, /point(?:\s|_|-)?id/i]) ?? -1
  const datetimeIndex = headers.findIndex((header) => {
    const trimmed = header.trim()
    const isCombinedDateTime =
      /date/i.test(trimmed) && /time/i.test(trimmed) && !TIME_ONLY_PATTERN.test(trimmed)
    const isStandaloneDateColumn =
      DATE_ONLY_PATTERN.test(trimmed) && !/time/i.test(trimmed)

    if (isCombinedDateTime) return true
    if (isStandaloneDateColumn) return false

    return TIME_COLUMN_PATTERNS.some((pattern) => pattern.test(trimmed))
  })
  const valueIndex = pickPreferredValueColumnIndex(headers)
  const dateIndex = pickColumnIndex(headers, [DATE_ONLY_PATTERN])
  const timeIndex = pickColumnIndex(headers, [TIME_ONLY_PATTERN])

  if (valueIndex < 0) {
    throw new Error('Unable to find a water-level column in the uploaded file.')
  }

  if (datetimeIndex < 0 && dateIndex < 0) {
    throw new Error('Unable to find a timestamp column in the uploaded file.')
  }

  const measurements: HydrographPoint[] = []
  let pointId: string | null = null

  for (const row of rows.slice(headerIndex + 1)) {
    if (row.length === 0 || row.every((cell) => cell === '')) {
      continue
    }

    const rawPointId = pointIdIndex >= 0 ? row[pointIdIndex] : null
    if (!pointId && rawPointId) {
      pointId = normalizePointId(rawPointId)
    }

    const rawDateTime =
      datetimeIndex >= 0
        ? row[datetimeIndex]
        : [row[dateIndex], timeIndex >= 0 ? row[timeIndex] : '']
            .filter(Boolean)
            .join(' ')

    const parsedDate = maybeParseDate(rawDateTime)
    const parsedValue = Number.parseFloat(row[valueIndex] ?? '')

    if (!parsedDate || !Number.isFinite(parsedValue)) {
      continue
    }

    measurements.push({
      time: parsedDate,
      value: parsedValue,
    })
  }

  if (measurements.length === 0) {
    const fallbackRows = rows
      .slice(headerIndex + 1)
      .map((row) => row.join(delimiter))
      .join('\n')
    throw new Error(
      `No hydrograph rows could be parsed from the uploaded file.\n${fallbackRows.slice(0, 200)}`
    )
  }

  return {
    pointId,
    measurements: measurements.sort(
      (a, b) => toUnixTime(a.time) - toUnixTime(b.time)
    ),
    detectedValueColumn: headers[valueIndex],
    detectedTimeColumn:
      datetimeIndex >= 0
        ? headers[datetimeIndex]
        : [headers[dateIndex], timeIndex >= 0 ? headers[timeIndex] : '']
            .filter(Boolean)
            .join(' + '),
  }
}

export const parseHydrographUpload = (text: string): ParsedHydrographUpload => {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length === 0) {
    throw new Error('Uploaded file is empty.')
  }

  const detectedDelimiter = detectDelimiter(lines)
  const rows = lines.map((line) => splitRow(line, detectedDelimiter))
  const headerIndex = resolveHeaderRow(rows)

  if (headerIndex < 0) {
    throw new Error(
      'Unable to detect a header row with timestamp and water-level columns.'
    )
  }

  const parsed = parseMeasurementRows({
    rows,
    headerIndex,
    delimiter: detectedDelimiter,
  })

  return {
    pointId: parsed.pointId ?? extractPointIdFromText(text),
    detectedDelimiter,
    detectedValueColumn: parsed.detectedValueColumn,
    detectedTimeColumn: parsed.detectedTimeColumn,
    measurements: parsed.measurements,
  }
}

const decodeXmlEntities = (value: string) =>
  value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")

const getZipEntries = (arrayBuffer: ArrayBuffer) => {
  const bytes = new Uint8Array(arrayBuffer)
  const view = new DataView(arrayBuffer)
  const decoder = new TextDecoder()
  const entries = new Map<string, Uint8Array>()
  let offset = 0

  while (offset + 4 <= view.byteLength) {
    const signature = view.getUint32(offset, true)
    if (signature !== 0x04034b50) break

    const compressionMethod = view.getUint16(offset + 8, true)
    const compressedSize = view.getUint32(offset + 18, true)
    const fileNameLength = view.getUint16(offset + 26, true)
    const extraFieldLength = view.getUint16(offset + 28, true)
    const fileNameStart = offset + 30
    const dataStart = fileNameStart + fileNameLength + extraFieldLength
    const fileName = decoder.decode(bytes.slice(fileNameStart, fileNameStart + fileNameLength))
    const compressedData = bytes.slice(dataStart, dataStart + compressedSize)

    let content: Uint8Array
    if (compressionMethod === 0) {
      content = compressedData
    } else if (compressionMethod === 8) {
      content = inflateRaw(compressedData)
    } else {
      throw new Error(`Unsupported XLSX compression method: ${compressionMethod}`)
    }

    entries.set(fileName, content)
    offset = dataStart + compressedSize
  }

  return entries
}

const getXmlText = (entries: Map<string, Uint8Array>, path: string) => {
  const content = entries.get(path)
  if (!content) return ''
  return new TextDecoder().decode(content)
}

const extractSharedStrings = (xml: string) => {
  const values: string[] = []
  const siRegex = /<si\b[^>]*>([\s\S]*?)<\/si>/g

  for (const match of xml.matchAll(siRegex)) {
    const text = [...match[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)]
      .map((part) => decodeXmlEntities(part[1]))
      .join('')
    values.push(text)
  }

  return values
}

const extractWorkbookSheetTargets = (workbookXml: string, relsXml: string) => {
  const relMap = new Map<string, string>()
  for (const match of relsXml.matchAll(/<Relationship\b[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g)) {
    relMap.set(match[1], match[2])
  }

  const targets: string[] = []
  for (const match of workbookXml.matchAll(/<sheet\b[^>]*name="([^"]+)"[^>]*r:id="([^"]+)"/g)) {
    const target = relMap.get(match[2])
    if (target) {
      targets.push(target.startsWith('xl/') ? target : `xl/${target.replace(/^\//, '')}`)
    }
  }

  return targets
}

const columnRefToIndex = (ref: string) => {
  const letters = ref.replace(/[0-9]/g, '')
  let index = 0
  for (const char of letters) {
    index = index * 26 + (char.charCodeAt(0) - 64)
  }
  return index - 1
}

const excelSerialToDate = (serial: number) => {
  return new Date(Date.UTC(1899, 11, 30) + serial * 86400 * 1000)
}

type XlsxRow = string[]

const extractWorksheetRows = (worksheetXml: string, sharedStrings: string[]) => {
  const rows: XlsxRow[] = []
  const rowRegex = /<row\b[^>]*>([\s\S]*?)<\/row>/g
  const cellRegex = /<c\b([^>]*)>([\s\S]*?)<\/c>/g

  for (const rowMatch of worksheetXml.matchAll(rowRegex)) {
    const cells: string[] = []
    for (const cellMatch of rowMatch[1].matchAll(cellRegex)) {
      const attrs = cellMatch[1]
      const body = cellMatch[2]
      const ref = attrs.match(/\br="([A-Z]+[0-9]+)"/)?.[1]
      if (!ref) continue

      const type = attrs.match(/\bt="([^"]+)"/)?.[1]
      const inlineString = body.match(/<t\b[^>]*>([\s\S]*?)<\/t>/)?.[1]
      const valueText = body.match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? ''
      let value = ''

      if (type === 's') {
        value = sharedStrings[Number.parseInt(valueText, 10)] ?? ''
      } else if (type === 'inlineStr') {
        value = decodeXmlEntities(inlineString ?? '')
      } else {
        value = decodeXmlEntities(valueText)
      }

      cells[columnRefToIndex(ref)] = value
    }

    rows.push(cells.map((cell) => cell ?? ''))
  }

  return rows
}

const parseXlsxWorksheet = (rows: XlsxRow[], fileName: string): ParsedHydrographUpload => {
  const metadataText = rows.flat().filter(Boolean).join('\n')
  const locationValue = metadataText.match(/Location\s*=\s*([^\n\r]+)/i)?.[1]?.trim() ?? null
  const headerIndex = rows.findIndex((row) =>
    row.some((cell) => /date\/?time/i.test(cell)) &&
    row.some((cell) => /\bdtw\b|depth.*water|adjusted dtw/i.test(cell))
  )

  if (headerIndex < 0) {
    throw new Error('Unable to detect the data header row in the uploaded workbook.')
  }

  const headers = rows[headerIndex]
  const timeIndex = headers.findIndex((header) => /date\/?time/i.test(header))
  const valueIndex = pickPreferredValueColumnIndex(headers)

  if (timeIndex < 0 || valueIndex < 0) {
    throw new Error('Unable to locate time and DTW columns in the uploaded workbook.')
  }

  const measurements: HydrographPoint[] = []
  for (const row of rows.slice(headerIndex + 1)) {
    const rawTime = row[timeIndex]
    const rawValue = row[valueIndex]
    if (!rawTime || !rawValue) continue

    const serial = Number.parseFloat(rawTime)
    const value = Number.parseFloat(rawValue)
    if (!Number.isFinite(serial) || !Number.isFinite(value)) continue

    measurements.push({
      time: excelSerialToDate(serial),
      value,
    })
  }

  if (measurements.length === 0) {
    throw new Error('No hydrograph rows could be parsed from the uploaded workbook.')
  }

  const filePointId = extractPointIdFromFileName(fileName)
  const metadataPointId =
    extractPointIdFromText(metadataText) ??
    filePointId ??
    (locationValue ? normalizePointId(locationValue) : null)

  return {
    pointId: metadataPointId || null,
    detectedDelimiter: 'xlsx',
    detectedTimeColumn: headers[timeIndex],
    detectedValueColumn: headers[valueIndex],
    measurements: measurements.sort(
      (a, b) => toUnixTime(a.time) - toUnixTime(b.time)
    ),
  }
}

export const parseHydrographWorkbookUpload = (
  arrayBuffer: ArrayBuffer,
  fileName: string
) => {
  const entries = getZipEntries(arrayBuffer)
  const sharedStrings = extractSharedStrings(
    getXmlText(entries, 'xl/sharedStrings.xml')
  )
  const sheetTargets = extractWorkbookSheetTargets(
    getXmlText(entries, 'xl/workbook.xml'),
    getXmlText(entries, 'xl/_rels/workbook.xml.rels')
  )

  for (const target of sheetTargets) {
    const worksheetXml = getXmlText(entries, target)
    if (!worksheetXml) continue
    const rows = extractWorksheetRows(worksheetXml, sharedStrings)
    try {
      return parseXlsxWorksheet(rows, fileName)
    } catch {
      continue
    }
  }

  throw new Error('Unable to parse a supported hydrograph worksheet from the uploaded workbook.')
}

const includesTime = (time: Date, range?: HydrographRange | null) => {
  if (!range) return true

  const target = toUnixTime(time)
  return (
    target >= toUnixTime(range.startTime) && target <= toUnixTime(range.endTime)
  )
}

export const applyOffsetToRange = (
  measurements: HydrographPoint[],
  offset: number,
  range?: HydrographRange | null
) =>
  measurements.map((measurement) =>
    includesTime(measurement.time, range)
      ? {
          ...measurement,
          value: Number((measurement.value + offset).toFixed(4)),
        }
      : measurement
  )

export const calculateSnapOffset = ({
  measurements,
  target,
  range,
}: {
  measurements: HydrographPoint[]
  target: HydrographPoint
  range?: HydrographRange | null
}) => {
  const candidates = measurements.filter((measurement) =>
    includesTime(measurement.time, range)
  )

  if (candidates.length === 0) {
    throw new Error('No uploaded measurements fall inside the selected range.')
  }

  const nearest = [...candidates].sort(
    (a, b) =>
      Math.abs(toUnixTime(a.time) - toUnixTime(target.time)) -
      Math.abs(toUnixTime(b.time) - toUnixTime(target.time))
  )[0]

  return Number((target.value - nearest.value).toFixed(4))
}

export const buildCsvFromMeasurements = (measurements: HydrographPoint[]) => {
  const rows = [
    ['observation_datetime', 'value'],
    ...measurements.map((measurement) => [
      measurement.time.toISOString(),
      measurement.value.toString(),
    ]),
  ]

  return rows.map((row) => row.join(',')).join('\n')
}
