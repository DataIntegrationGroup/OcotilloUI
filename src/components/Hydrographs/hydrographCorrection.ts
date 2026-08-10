import { inflateRaw } from 'pako'

export interface HydrographPoint {
  time: Date
  value: number
  // Sensor temperature in the source's units (°C for Wellntel exports).
  // Reflections correlate with high sensor temperature, so the reflection
  // tools can use it as a supporting signal.
  temperature?: number
  // Per-observation audit note set when a correction replaces this
  // reading's value (e.g. a spurious reflection interpolated away). Carried
  // through later edits, shown in the data table, and uploaded with the
  // observation.
  correctionNote?: string
}

export interface HydrographRange {
  startTime: Date
  endTime: Date
}

// 'water_head' measurements are the height of the water column above the
// sensor (Diver Office pressure-transducer exports) and must be converted to
// depth to water below ground surface with convertWaterHeadToDepthToWater
// before they are comparable to Ocotillo observations. 'depth_to_water'
// measurements (wellpy workbooks, Wellntel acoustic exports) are used as-is.
export type HydrographValueKind = 'depth_to_water' | 'water_head'

export interface ParsedHydrographUpload {
  pointId: string | null
  detectedDelimiter: string
  detectedValueColumn: string
  detectedTimeColumn: string
  valueKind: HydrographValueKind
  measurements: HydrographPoint[]
  // Non-fatal quality observations surfaced during parsing (e.g. a field
  // logger reporting low battery voltage).
  warnings?: string[]
}

const DELIMITER_CANDIDATES = ['\t', ',', ';', '|']

const POINT_ID_PATTERNS = [
  /thing\.name\s*[:=]\s*([A-Za-z0-9._-]+)/i,
  /point(?:\s|_|-)?id\s*[:=]\s*([A-Za-z0-9._-]+)/i,
  /well(?:\s|_|-)?name\s*[:=]\s*([A-Za-z0-9._-]+)/i,
  /site(?:\s|_|-)?id\s*[:=]\s*([A-Za-z0-9._-]+)/i,
  // Diver Office metadata identifies the well as `Location =sa-0231`.
  // Restricted to point-id-shaped values so prose location names (e.g.
  // wellpy workbook "Location=Aztec MW") fall through to other sources.
  /^\s*location\s*[:=]\s*([A-Za-z]{1,4}[-_ ]?\d{3,6})\b/im,
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
  /^depth$/i,
]

const WATER_HEAD_COLUMN_PATTERN = /head/i

const DATE_ONLY_PATTERN = /date/i
const TIME_ONLY_PATTERN = /^time$/i

const toUnixTime = (value: Date) => value.getTime()

// "2024/02/20 12:00:00", "2024-02-20T12:00", with optional seconds and
// fractional seconds, and no timezone designator.
const NAIVE_TIMESTAMP_PATTERN =
  /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.(\d{1,3}))?$/

/**
 * Parse a timestamp, reading one without a timezone as UTC.
 *
 * Logger exports carry naive wall-clock timestamps, and Ocotillo ingests them
 * as UTC — the stored observations for a file come back as the same wall-clock
 * time with a `Z`. `new Date()` instead reads a naive string in the browser's
 * timezone, so an upload plotted against its own already-stored observations
 * appeared shifted by the viewer's UTC offset (8 hours in US Pacific).
 * Timestamps that do declare a zone are honoured as written.
 */
export const parseObservationTimestamp = (value: string | Date) => {
  if (value instanceof Date) return value

  const candidate = String(value).trim()
  const naive = NAIVE_TIMESTAMP_PATTERN.exec(candidate)
  if (!naive) return new Date(candidate)

  const [, year, month, day, hour, minute, second, milli] = naive
  return new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second ?? 0),
      Number((milli ?? '').padEnd(3, '0') || 0)
    )
  )
}

// Every operation that changes a point's value appends a clause to its
// correctionNote, so any corrected observation carries a full account of
// what happened to it.
const appendCorrectionNote = (
  point: HydrographPoint,
  note?: string
): HydrographPoint =>
  note
    ? {
        ...point,
        correctionNote: point.correctionNote
          ? `${point.correctionNote}; ${note}`
          : note,
      }
    : point

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

// Compact ids like "AR0209" normalize to the canonical dashed form
// ("AR-0209") used by Ocotillo well names.
const expandCompactPointId = (value: string) => {
  const compact = value.match(/^([A-Za-z]{1,4})[-_ ]?(\d{3,6})$/)
  return compact ? `${compact[1]}-${compact[2]}` : value
}

export const extractPointIdFromText = (text: string) => {
  for (const pattern of POINT_ID_PATTERNS) {
    const match = text.match(pattern)
    if (match?.[1]) {
      return normalizePointId(expandCompactPointId(match[1]))
    }
  }

  return null
}

// Sample well past any metadata preamble: real Diver Office exports open
// with ~50 lines of metadata containing stray pipes but no commas, which a
// 20-line sample mis-sniffed as pipe-delimited.
const detectDelimiter = (lines: string[]) => {
  const sample = lines.slice(0, 500).join('\n')

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

  const parsed = parseObservationTimestamp(candidate)
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
    /^depth$/i,
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
  const temperatureIndex = headers.findIndex(
    (header, index) => index !== valueIndex && /temp/i.test(header.trim())
  )

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

    const parsedTemperature =
      temperatureIndex >= 0
        ? Number.parseFloat(row[temperatureIndex] ?? '')
        : Number.NaN

    measurements.push({
      time: parsedDate,
      value: parsedValue,
      ...(Number.isFinite(parsedTemperature)
        ? { temperature: parsedTemperature }
        : {}),
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

// Diver Office pressure-transducer CSV exports have no header row: a block
// of metadata lines (including `Serial number=...` and `Location=...`), then
// bare data rows of `date,water head,temperature[,conductivity]`, terminated
// by an `END OF DATA` line. The head values are the water column above the
// sensor in feet, mirroring wellpy's `DataModel._load_csv`.
const DIVER_OFFICE_LOCATION_PATTERN = /^Location\s*[:=](.+)$/i
const DIVER_OFFICE_SERIAL_PATTERN = /^Serial number\s*[:=](.+)$/i

const looksLikeDiverOfficeUpload = (text: string) =>
  text
    .split(/\r?\n/)
    .some((line) => DIVER_OFFICE_SERIAL_PATTERN.test(line.trim())) ||
  /^END OF DATA/im.test(text)

export const parseDiverOfficeUpload = (
  text: string
): ParsedHydrographUpload => {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  let pointId: string | null = null
  const measurements: HydrographPoint[] = []

  for (const line of lines) {
    if (/^END OF DATA/i.test(line)) break

    const locationMatch = line.match(DIVER_OFFICE_LOCATION_PATTERN)
    if (locationMatch) {
      pointId = normalizePointId(locationMatch[1])
      continue
    }

    const cells = splitRow(line, ',')
    if (cells.length !== 3 && cells.length !== 4) continue

    const parsedDate = maybeParseDate(cells[0])
    const parsedHead = Number.parseFloat(cells[1])
    if (!parsedDate || !Number.isFinite(parsedHead)) continue

    const parsedTemperature = Number.parseFloat(cells[2] ?? '')
    measurements.push({
      time: parsedDate,
      value: parsedHead,
      ...(Number.isFinite(parsedTemperature)
        ? { temperature: parsedTemperature }
        : {}),
    })
  }

  if (measurements.length === 0) {
    throw new Error(
      'No data rows could be parsed from the Diver Office export.'
    )
  }

  return {
    pointId,
    detectedDelimiter: ',',
    detectedTimeColumn: 'Date/time',
    detectedValueColumn: 'Water head (ft)',
    valueKind: 'water_head',
    measurements: measurements.sort(
      (a, b) => toUnixTime(a.time) - toUnixTime(b.time)
    ),
  }
}

// NMBGMR field data logger telemetry: one space-delimited record per line,
// no header, depth to water already computed.
//   2024/11/19 18:54:05   ID 009  D  151.02  T  51.2  B 13.9  G 218  R 0001
// D = depth to water (ft bgs), T = temperature (F), B = battery voltage,
// G = signal, R = restart flag.
const FIELD_LOGGER_ROW_PATTERN =
  /^(\d{4}\/\d{2}\/\d{2}\s+\d{2}:\d{2}:\d{2})\s+ID\s+(\S+)\s+D\s+(-?\d+(?:\.\d+)?)\s+T\s+(-?\d+(?:\.\d+)?)\s+B\s+(-?\d+(?:\.\d+)?)/

const FIELD_LOGGER_LOW_BATTERY_VOLTS = 12

export const parseFieldLoggerUpload = (
  text: string,
  fileName?: string | null
): ParsedHydrographUpload => {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  const measurements: HydrographPoint[] = []
  let stationId: string | null = null
  let lastBattery: number | null = null
  let minBattery: number | null = null

  for (const line of lines) {
    const match = line.match(FIELD_LOGGER_ROW_PATTERN)
    if (!match) continue

    const parsedDate = maybeParseDate(match[1])
    const depth = Number.parseFloat(match[3])
    if (!parsedDate || !Number.isFinite(depth)) continue

    if (!stationId) stationId = match[2]
    const battery = Number.parseFloat(match[5])
    if (Number.isFinite(battery)) {
      lastBattery = battery
      minBattery = minBattery === null ? battery : Math.min(minBattery, battery)
    }

    const temperature = Number.parseFloat(match[4])
    measurements.push({
      time: parsedDate,
      value: depth,
      ...(Number.isFinite(temperature) ? { temperature } : {}),
    })
  }

  if (measurements.length === 0) {
    throw new Error(
      'No data rows could be parsed from the field data logger file.'
    )
  }

  // The filename usually carries the well id ("2025-11-25_MG009.txt");
  // fall back to the numeric ID token from the records.
  const fileToken = (fileName ?? '')
    .replace(/\.[^.]+$/, '')
    .split(/[_\-\s]+/)
    .map((token) => token.match(/^([A-Za-z]{1,4})(\d{3,6})$/))
    .find(Boolean)
  const pointId = fileToken
    ? normalizePointId(`${fileToken[1]}-${fileToken[2]}`)
    : stationId
      ? normalizePointId(stationId)
      : null

  const warnings: string[] = []
  if (lastBattery !== null && lastBattery < FIELD_LOGGER_LOW_BATTERY_VOLTS) {
    warnings.push(
      `Field logger battery is low: last reading ${lastBattery.toFixed(1)} V (minimum ${minBattery?.toFixed(1)} V). The methodology recommends replacing declining loggers.`
    )
  }

  return {
    pointId,
    detectedDelimiter: 'field-logger',
    detectedTimeColumn: 'Date/time',
    detectedValueColumn: 'D (depth to water, ft)',
    valueKind: 'depth_to_water',
    measurements: measurements.sort(
      (a, b) => toUnixTime(a.time) - toUnixTime(b.time)
    ),
    ...(warnings.length > 0 ? { warnings } : {}),
  }
}

export const parseHydrographUpload = (
  text: string,
  fileName?: string | null
): ParsedHydrographUpload => {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length === 0) {
    throw new Error('Uploaded file is empty.')
  }

  if (FIELD_LOGGER_ROW_PATTERN.test(lines[0])) {
    return parseFieldLoggerUpload(text, fileName)
  }

  const detectedDelimiter = detectDelimiter(lines)
  const rows = lines.map((line) => splitRow(line, detectedDelimiter))
  const headerIndex = resolveHeaderRow(rows)

  if (headerIndex < 0) {
    if (looksLikeDiverOfficeUpload(text)) {
      return parseDiverOfficeUpload(text)
    }

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
    valueKind: WATER_HEAD_COLUMN_PATTERN.test(parsed.detectedValueColumn)
      ? 'water_head'
      : 'depth_to_water',
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
    valueKind: 'depth_to_water',
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

/**
 * The series' value at `time`, linearly interpolated between the readings on
 * either side of it.
 *
 * A manual water level is measured whenever the technician is on site, which
 * is almost never one of the logger's own timestamps — a 6-hour cadence puts
 * the reading up to 3 hours away from the measurement. Comparing against, or
 * anchoring to, that reading builds the sampling offset into the correction:
 * on a trace that is moving, the further the sample the larger the error.
 * Reading the series at the measurement's own instant removes it.
 *
 * Returns null when `time` falls outside the series. There is no line there to
 * read, and extrapolating a transducer trace past its own record would invent
 * data; callers decide what to do about it.
 */
export const interpolateSeriesValueAt = (
  series: HydrographPoint[],
  time: Date
): number | null => {
  if (series.length === 0) return null

  const target = toUnixTime(time)
  const sorted = [...series].sort((a, b) => toUnixTime(a.time) - toUnixTime(b.time))

  const first = toUnixTime(sorted[0].time)
  const last = toUnixTime(sorted[sorted.length - 1].time)
  if (target < first || target > last) return null
  if (target === first) return sorted[0].value
  if (target === last) return sorted[sorted.length - 1].value

  // Binary search for the last reading at or before the target. Manual
  // measurements are few but the transducer series runs to tens of thousands
  // of readings, so a scan per manual is worth avoiding.
  let low = 0
  let high = sorted.length - 1
  while (high - low > 1) {
    const mid = (low + high) >> 1
    if (toUnixTime(sorted[mid].time) <= target) {
      low = mid
    } else {
      high = mid
    }
  }

  const before = sorted[low]
  const after = sorted[high]
  const span = toUnixTime(after.time) - toUnixTime(before.time)
  // Duplicate timestamps leave nothing to interpolate across.
  if (span === 0) return before.value

  const fraction = (target - toUnixTime(before.time)) / span
  return before.value + (after.value - before.value) * fraction
}

/** The reading closest in time to `time`, or null for an empty series. */
const nearestReading = (
  series: HydrographPoint[],
  time: Date
): HydrographPoint | null => {
  if (series.length === 0) return null
  return [...series].sort(
    (a, b) =>
      Math.abs(toUnixTime(a.time) - toUnixTime(time)) -
      Math.abs(toUnixTime(b.time) - toUnixTime(time))
  )[0]
}

// The methodology's key QC test: the converted series should pass through
// the bounding manual measurements. A large misfit at a manual means the
// logger (or its barometer) is drifting and the data should not be
// published without review. Reports the misfit at every manual that has a
// converted reading within maxGapMs.
export interface DriftAssessment {
  anchorTime: Date
  manualValue: number
  seriesValue: number
  misfit: number
}

export const assessDriftAtManualObservations = (
  converted: HydrographPoint[],
  manualPoints: HydrographPoint[],
  { maxGapMs = 12 * 60 * 60 * 1000 }: { maxGapMs?: number } = {}
): DriftAssessment[] => {
  if (converted.length === 0) return []

  return manualPoints
    .map((manual) => {
      const nearest = nearestReading(converted, manual.time)
      if (
        !nearest ||
        Math.abs(toUnixTime(nearest.time) - toUnixTime(manual.time)) > maxGapMs
      ) {
        return null
      }

      // Read the series at the manual's own instant so the misfit is the
      // logger's drift and not the gap to the nearest sample. A manual taken
      // just outside the record — the download-day reading, measured after the
      // logger was pulled — cannot be interpolated, so it falls back to the
      // nearest reading; the maxGapMs guard above keeps that honest.
      const seriesValue =
        interpolateSeriesValueAt(converted, manual.time) ?? nearest.value

      return {
        anchorTime: manual.time,
        manualValue: manual.value,
        seriesValue: Number(seriesValue.toFixed(4)),
        misfit: Number((seriesValue - manual.value).toFixed(4)),
      }
    })
    .filter((assessment): assessment is DriftAssessment => assessment !== null)
}

// A Diver pushed past its pressure range records its maximum — a
// flat-topped plateau at the series max. Reports the longest such run
// when it reaches minRunLength consecutive readings.
export const detectOverpressureClipping = (
  measurements: HydrographPoint[],
  minRunLength = 6
): { start: Date; end: Date; value: number; count: number } | null => {
  if (measurements.length === 0) return null

  const max = Math.max(...measurements.map((point) => point.value))
  let best: { start: number; count: number } | null = null
  let runStart = -1

  measurements.forEach((point, index) => {
    if (Math.abs(point.value - max) < 0.001) {
      if (runStart < 0) runStart = index
      const count = index - runStart + 1
      if (!best || count > best.count) best = { start: runStart, count }
    } else {
      runStart = -1
    }
  })

  if (!best) return null
  const { start, count } = best as { start: number; count: number }
  if (count < minRunLength) return null

  return {
    start: measurements[start].time,
    end: measurements[start + count - 1].time,
    value: max,
    count,
  }
}

// Port of wellpy's `Model.calculate_depth_to_water` for pressure-transducer
// data. Water head is the height of the water column above the sensor, so
// depth to water = sensor depth (L) - head. The sensor depth is anchored by
// manual observations: within each pair of consecutive manual observations
// (d0 at t0, d1 at t1), L1 = d1 + head at the end of the bin and
// L0 = d0 + head at the start. Without drift correction the whole bin uses
// L1; with it, L is interpolated linearly from L0 to L1.
//
// Wellpy leaves measurements outside manual coverage at zero; here the
// nearest bin's sensor depth is extended instead so the full trace stays
// plottable.
export const convertWaterHeadToDepthToWater = ({
  measurements,
  manualPoints,
  correctDrift = false,
}: {
  measurements: HydrographPoint[]
  manualPoints: HydrographPoint[]
  correctDrift?: boolean
}): HydrographPoint[] => {
  if (manualPoints.length === 0) {
    throw new Error(
      'At least one manual observation is required to convert water head to depth to water.'
    )
  }

  // Single anchor (the methodology's "Snap to Selected" flow, eq. 2/3):
  // calculated hanging point = manual DTW + head at the manual's time,
  // applied as a constant across the whole series. The common case for
  // annual site visits, where only the download-day manual exists.
  if (manualPoints.length === 1) {
    const anchor = manualPoints[0]
    const sortedSingle = measurements
      .filter((point) => point.value !== 0)
      .sort((a, b) => toUnixTime(a.time) - toUnixTime(b.time))
    if (sortedSingle.length === 0) {
      throw new Error('No non-zero water-head measurements to convert.')
    }

    // Head at the manual's own instant, so the converted trace passes through
    // the manual measurement at the time it was taken. Falls back to the
    // nearest reading only when the manual lies outside the record entirely.
    const headAtAnchor =
      interpolateSeriesValueAt(sortedSingle, anchor.time) ??
      nearestReading(sortedSingle, anchor.time)!.value
    const hangingPoint = anchor.value + headAtAnchor

    return sortedSingle.map((point) => ({
      time: point.time,
      value: Number((hangingPoint - point.value).toFixed(4)),
    }))
  }

  // Zero head means the sensor was out of the water; converting it would
  // chart the bare sensor depth as a false reading, so drop those rows.
  const sorted = measurements
    .filter((point) => point.value !== 0)
    .sort((a, b) => toUnixTime(a.time) - toUnixTime(b.time))
  const manual = [...manualPoints].sort(
    (a, b) => toUnixTime(a.time) - toUnixTime(b.time)
  )

  const sensorDepths: Array<number | null> = sorted.map(() => null)
  let firstBinStartDepth: number | null = null
  let lastBinEndDepth: number | null = null
  for (let i = 0; i < manual.length - 1; i += 1) {
    const m0 = manual[i]
    const m1 = manual[i + 1]
    const indices: number[] = []

    sorted.forEach((point, index) => {
      const t = toUnixTime(point.time)
      if (t >= toUnixTime(m0.time) && t < toUnixTime(m1.time)) {
        indices.push(index)
      }
    })

    if (indices.length === 0) continue

    const firstIndex = indices[0]
    const lastIndex = indices[indices.length - 1]

    // Anchor each sensor depth on the head at the manual's own timestamp, not
    // on the bin's first and last readings. Those are simply the samples that
    // happen to bracket the visit, up to one logging interval away; anchoring
    // on them makes the converted trace pass through the manual's value at a
    // sample's time instead of at the measurement's time.
    //
    // A manual outside the logged period has no head to anchor on. Deriving
    // one from the closest reading invents a sensor depth at a moment the
    // logger never covered, and the whole bin then rides on it — which is how
    // a trace ends up offset from the one manual that is inside the record.
    // Such an end is left unanchored and the other end carries the bin.
    const head0 = interpolateSeriesValueAt(sorted, m0.time)
    const head1 = interpolateSeriesValueAt(sorted, m1.time)
    const l0 = head0 === null ? null : m0.value + head0
    const l1 = head1 === null ? null : m1.value + head1

    // Both ends unanchored: nothing in this bin is pinned to a measurement, so
    // the closing manual and the nearest reading are all there is to go on.
    const start = l0 ?? l1 ?? m0.value + sorted[firstIndex].value
    const end = l1 ?? l0 ?? m1.value + sorted[lastIndex].value

    if (firstBinStartDepth === null) {
      firstBinStartDepth = start
    }
    lastBinEndDepth = end

    // Drift is interpolated between the manual timestamps for the same reason.
    // It can only be measured when both ends are anchored; with one end the
    // sensor depth is held constant at it rather than ramped toward a value
    // that was never observed.
    const t0 = toUnixTime(m0.time)
    const t1 = toUnixTime(m1.time)
    const span = t1 - t0
    const canRamp = correctDrift && span > 0 && l0 !== null && l1 !== null

    for (const index of indices) {
      const l = canRamp
        ? start + ((end - start) * (toUnixTime(sorted[index].time) - t0)) / span
        : end
      sensorDepths[index] = l
    }
  }

  if (firstBinStartDepth === null || lastBinEndDepth === null) {
    throw new Error(
      'The manual observations do not overlap the uploaded water-head data.'
    )
  }

  return sorted.map((point, index) => {
    let sensorDepth = sensorDepths[index]
    if (sensorDepth === null) {
      sensorDepth =
        toUnixTime(point.time) < toUnixTime(manual[0].time)
          ? firstBinStartDepth
          : lastBinEndDepth
    }

    return {
      time: point.time,
      value: Number((sensorDepth - point.value).toFixed(4)),
    }
  })

}

const OFFSET_WINDOW_HALF_WIDTH = 5

// "Remove Offsets/Zeros": drop zero readings (sensor out of water) and
// cancel sustained level shifts (sensor repositioning / cable slip) by
// re-leveling the trace after each step.
//
// This replaces wellpy's `fix_data`, whose single-sample diff detection
// mistook isolated spikes for offsets and estimated the step size from two
// noisy samples. Here a step boundary is a point where the median of the
// window before it and the median of the window after it differ by at
// least the threshold — a single spurious spike cannot move either median,
// so spikes are left for the reflection tool. Consecutive flagged
// boundaries around one step are collapsed to the boundary with the
// largest raw sample-to-sample jump (localization), while the step size
// comes from the median difference (noise-robust magnitude). Each detected
// step shifts everything after it, cumulatively, so multiple slips
// re-level correctly; steps closer together than the window may blur into
// one. With a brush range, only boundaries inside it are corrected.
export const removeOffsetsAndZeros = (
  measurements: HydrographPoint[],
  threshold: number,
  range?: HydrographRange | null
): HydrographPoint[] => {
  const kept = measurements.filter(
    (point) => !(point.value === 0 && includesTime(point.time, range))
  )
  const n = kept.length
  if (n < 2) return kept.map((point) => ({ ...point }))

  const values = kept.map((point) => point.value)
  const half = Math.min(OFFSET_WINDOW_HALF_WIDTH, Math.floor(n / 2))

  const candidates: Array<{ index: number; delta: number }> = []
  for (let i = half; i <= n - half; i += 1) {
    const before = median(values.slice(i - half, i))
    const after = median(values.slice(i, i + half))
    const delta = after - before
    if (Math.abs(delta) >= threshold && includesTime(kept[i].time, range)) {
      candidates.push({ index: i, delta })
    }
  }

  // One step produces a run of consecutive flagged boundaries; keep the one
  // sitting on the largest raw jump.
  const steps: Array<{ index: number; delta: number }> = []
  let run: typeof candidates = []
  const flushRun = () => {
    if (run.length === 0) return
    let best = run[0]
    for (const candidate of run) {
      if (
        Math.abs(values[candidate.index] - values[candidate.index - 1]) >
        Math.abs(values[best.index] - values[best.index - 1])
      ) {
        best = candidate
      }
    }
    steps.push(best)
    run = []
  }
  for (const candidate of candidates) {
    if (run.length > 0 && candidate.index !== run[run.length - 1].index + 1) {
      flushRun()
    }
    run.push(candidate)
  }
  flushRun()

  let cumulativeOffset = 0
  let nextStep = 0
  const appliedOffsets = values.map((_value, index) => {
    if (nextStep < steps.length && index === steps[nextStep].index) {
      cumulativeOffset += steps[nextStep].delta
      nextStep += 1
    }
    return cumulativeOffset
  })

  return kept.map((point, index) => {
    const applied = appliedOffsets[index]
    const updated = {
      ...point,
      value: Number((point.value - applied).toFixed(4)),
    }
    return applied === 0
      ? updated
      : appendCorrectionNote(
          updated,
          `level offset removed (${applied > 0 ? '-' : '+'}${Math.abs(applied).toFixed(4)} ft)`
        )
  })
}

const REFLECTION_WINDOW_HALF_WIDTH = 3

// Lower median: for even-length windows (truncated at the series edges),
// averaging the two middle values can land between two genuine water
// levels and flag every point in the window; picking an actual observed
// value cannot.
const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor((sorted.length - 1) / 2)]
}

// Wellntel acoustic sensors occasionally record spurious reflections: an
// echo off a casing joint or other obstruction produces a reading offset
// from the true depth to water. Reflections can be positive or negative
// (longer or shorter echo path) and can land near the true depth (1x) or
// near twice it (2x double-bounce), so magnitude is unbounded. A point is
// flagged when it departs from the median of its surrounding window by at
// least the threshold; a flagged point survives only if it agrees with an
// immediate neighbor within the threshold, which preserves genuine steps
// (sustained excursions) while dropping reflections even when two
// different ones land side by side. This is the workbench analog of
// wellpy's acoustic upspike removal.
const findSpuriousReflectionIndices = (
  measurements: HydrographPoint[],
  threshold: number,
  range?: HydrographRange | null
) => {
  const spurious = new Set<number>()

  measurements.forEach((point, index) => {
    if (!includesTime(point.time, range)) return

    const windowValues = measurements
      .slice(
        Math.max(0, index - REFLECTION_WINDOW_HALF_WIDTH),
        index + REFLECTION_WINDOW_HALF_WIDTH + 1
      )
      .map((neighbor) => neighbor.value)

    if (Math.abs(point.value - median(windowValues)) < threshold) {
      return
    }

    const previous = measurements[index - 1]
    const next = measurements[index + 1]
    const agreesWithPrevious =
      previous !== undefined &&
      Math.abs(point.value - previous.value) < threshold
    const agreesWithNext =
      next !== undefined && Math.abs(point.value - next.value) < threshold

    if (!agreesWithPrevious && !agreesWithNext) {
      spurious.add(index)
    }
  })

  return spurious
}

// Detection strategies for spurious reflections:
// - 'median': isolated-echo detection (median window + neighbor-agreement
//   rescue). Robust for scattered reflections; defeated when spurious
//   readings arrive in dense runs that rescue each other.
// - 'baseline': running-baseline rejection for dense ONE-SIDED clusters,
//   the behavior real Wellntel wells exhibit (echoes always read deeper).
//   Port of wellpy's remove_up_spikes normal mode: track the last accepted
//   value and reject anything more than the threshold above it, seeded
//   from the lower median of the first window. Handles arbitrarily long
//   spurious runs; the tradeoff is that a genuine sustained upward step
//   larger than the threshold is also rejected, so scope it with the
//   brush when the trace has real steps.
export type ReflectionDetectionMethod = 'median' | 'baseline'

const BASELINE_WINDOW = 15
const BASELINE_QUANTILE = 0.25

const lowerQuantile = (values: number[], quantile: number) => {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(quantile * (sorted.length - 1))]
}

// The baseline is the trailing lower quantile of the last BASELINE_WINDOW
// readings (spurious included — the quantile ignores them as long as they
// are a minority of the window). Unlike a last-accepted-value baseline,
// this follows genuine level changes: a real seasonal rise fills the
// window and pulls the quantile up within ~a window of samples, while
// dense one-sided reflection clusters stay above it and get flagged.
const findBaselineSpuriousIndices = (
  measurements: HydrographPoint[],
  threshold: number,
  range?: HydrographRange | null
) => {
  const spurious = new Set<number>()
  const inRange: number[] = []
  measurements.forEach((point, index) => {
    if (includesTime(point.time, range)) inRange.push(index)
  })
  if (inRange.length === 0) return spurious

  inRange.forEach((index, position) => {
    const windowStart = Math.max(0, position - BASELINE_WINDOW)
    const window = inRange
      .slice(windowStart, position)
      .map((i) => measurements[i].value)
    if (window.length < 3) return

    const baseline = lowerQuantile(window, BASELINE_QUANTILE)
    if (measurements[index].value - baseline > threshold) {
      spurious.add(index)
    }
  })

  return spurious
}

// Reflections correlate with high sensor temperature (real Wellntel data
// shows the spurious population arriving overwhelmingly on warm readings).
// The temperature assist flags readings that are only marginally above the
// value baseline (half the threshold) when their sensor temperature is
// also well above the trailing temperature median — supporting evidence
// that lets marginal echoes be caught without loosening the value
// threshold for everything. Temperatures are compared in the source's
// units.
const TEMPERATURE_ASSIST_DELTA = 5
const TEMPERATURE_ASSIST_VALUE_FACTOR = 0.5

const findTemperatureAssistedIndices = (
  measurements: HydrographPoint[],
  threshold: number,
  range?: HydrographRange | null
) => {
  const flagged = new Set<number>()
  const inRange: number[] = []
  measurements.forEach((point, index) => {
    if (includesTime(point.time, range)) inRange.push(index)
  })

  inRange.forEach((index, position) => {
    const point = measurements[index]
    if (point.temperature === undefined) return

    const windowIndices = inRange.slice(
      Math.max(0, position - BASELINE_WINDOW),
      position
    )
    const windowValues = windowIndices.map((i) => measurements[i].value)
    const windowTemperatures = windowIndices
      .map((i) => measurements[i].temperature)
      .filter((temperature): temperature is number => temperature !== undefined)
    if (windowValues.length < 3 || windowTemperatures.length < 3) return

    const valueBaseline = lowerQuantile(windowValues, BASELINE_QUANTILE)
    const temperatureMedian = median(windowTemperatures)

    if (
      point.value - valueBaseline > threshold * TEMPERATURE_ASSIST_VALUE_FACTOR &&
      point.temperature - temperatureMedian > TEMPERATURE_ASSIST_DELTA
    ) {
      flagged.add(index)
    }
  })

  return flagged
}

export interface ReflectionOptions {
  useTemperature?: boolean
}

const findReflectionIndices = (
  measurements: HydrographPoint[],
  threshold: number,
  range: HydrographRange | null | undefined,
  method: ReflectionDetectionMethod,
  options?: ReflectionOptions
) => {
  const spurious =
    method === 'baseline'
      ? findBaselineSpuriousIndices(measurements, threshold, range)
      : findSpuriousReflectionIndices(measurements, threshold, range)

  if (options?.useTemperature) {
    for (const index of findTemperatureAssistedIndices(
      measurements,
      threshold,
      range
    )) {
      spurious.add(index)
    }
  }

  return spurious
}

export const removeSpuriousReflections = (
  measurements: HydrographPoint[],
  threshold: number,
  range?: HydrographRange | null,
  method: ReflectionDetectionMethod = 'median',
  options?: ReflectionOptions
): HydrographPoint[] => {
  const spurious = findReflectionIndices(
    measurements,
    threshold,
    range,
    method,
    options
  )
  return measurements.filter((_point, index) => !spurious.has(index))
}

// Same detection as removeSpuriousReflections, but instead of deleting the
// spurious readings this keeps the sampling cadence and replaces each one
// with a linear interpolation in time between the nearest surviving
// readings on either side (nearest single side at the series edges).
export const interpolateSpuriousReflections = (
  measurements: HydrographPoint[],
  threshold: number,
  range?: HydrographRange | null,
  method: ReflectionDetectionMethod = 'median',
  options?: ReflectionOptions
): HydrographPoint[] => {
  const spurious = findReflectionIndices(
    measurements,
    threshold,
    range,
    method,
    options
  )

  return measurements.map((point, index) => {
    if (!spurious.has(index)) return point

    let previousIndex = index - 1
    while (previousIndex >= 0 && spurious.has(previousIndex)) previousIndex -= 1
    let nextIndex = index + 1
    while (nextIndex < measurements.length && spurious.has(nextIndex))
      nextIndex += 1

    const previous = previousIndex >= 0 ? measurements[previousIndex] : null
    const next = nextIndex < measurements.length ? measurements[nextIndex] : null

    if (!previous && !next) return point

    let value: number
    if (previous && next) {
      const span = toUnixTime(next.time) - toUnixTime(previous.time)
      value =
        span > 0
          ? previous.value +
            ((next.value - previous.value) *
              (toUnixTime(point.time) - toUnixTime(previous.time))) /
              span
          : previous.value
    } else {
      value = (previous ?? next)!.value
    }

    return {
      ...point,
      value: Number(value.toFixed(4)),
      correctionNote: `spurious reflection removed; value interpolated from neighbors (was ${point.value})`,
    }
  })
}

export const applyOffsetToRange = (
  measurements: HydrographPoint[],
  offset: number,
  range?: HydrographRange | null,
  note?: string
) =>
  measurements.map((measurement) =>
    includesTime(measurement.time, range)
      ? appendCorrectionNote(
          {
            ...measurement,
            value: Number((measurement.value + offset).toFixed(4)),
          },
          note
        )
      : measurement
  )

export interface SnapOffset {
  offset: number
  /**
   * `interpolated` — the manual falls inside the trace, so the offset was
   * measured against the trace's value at the manual's own instant and the
   * corrected line passes exactly through it.
   *
   * `clamped` — the manual falls outside the trace, where there is no line to
   * pass through, so the nearest end of it was used instead.
   */
  method: 'interpolated' | 'clamped'
  /** The trace value the offset was measured against. */
  anchorValue: number
}

/**
 * How far to move the trace so it passes through `target`.
 *
 * The offset is measured against the trace's value at the manual measurement's
 * own timestamp, interpolated between the readings on either side — not
 * against the nearest reading. A logger on a 6-hour cadence puts its nearest
 * sample up to 3 hours from the measurement, and on a trace that is moving
 * that gap becomes error in the correction: the line ends up passing through
 * the manual's value at the sample's time rather than at the manual's time.
 */
export const calculateSnapOffset = ({
  measurements,
  target,
  range,
}: {
  measurements: HydrographPoint[]
  target: HydrographPoint
  range?: HydrographRange | null
}): SnapOffset => {
  const candidates = measurements.filter((measurement) =>
    includesTime(measurement.time, range)
  )

  if (candidates.length === 0) {
    throw new Error('No uploaded measurements fall inside the selected range.')
  }

  const interpolated = interpolateSeriesValueAt(candidates, target.time)
  if (interpolated !== null) {
    return {
      offset: Number((target.value - interpolated).toFixed(4)),
      method: 'interpolated',
      anchorValue: Number(interpolated.toFixed(4)),
    }
  }

  // The manual sits outside the trace being corrected — before it starts or
  // after it ends, or outside the brushed range. Nothing can pass through that
  // instant, so the nearest end is the only defined anchor. The caller is told
  // which happened so it can be recorded and shown.
  const nearest = nearestReading(candidates, target.time)!
  return {
    offset: Number((target.value - nearest.value).toFixed(4)),
    method: 'clamped',
    anchorValue: nearest.value,
  }
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
