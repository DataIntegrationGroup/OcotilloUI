import { inflateRaw } from 'pako'

export interface HydrographPoint {
  time: Date
  value: number
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

    measurements.push({ time: parsedDate, value: parsedHead })
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

    measurements.push({ time: parsedDate, value: depth })
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

    const nearest = [...sortedSingle].sort(
      (a, b) =>
        Math.abs(toUnixTime(a.time) - toUnixTime(anchor.time)) -
        Math.abs(toUnixTime(b.time) - toUnixTime(anchor.time))
    )[0]
    const hangingPoint = anchor.value + nearest.value

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
    const l0 = m0.value + sorted[firstIndex].value
    const l1 = m1.value + sorted[lastIndex].value

    if (firstBinStartDepth === null) {
      firstBinStartDepth = l0
    }
    lastBinEndDepth = l1

    const t0 = toUnixTime(sorted[firstIndex].time)
    const t1 = toUnixTime(sorted[lastIndex].time)
    const span = t1 - t0

    for (const index of indices) {
      const l =
        correctDrift && span > 0
          ? l0 + ((l1 - l0) * (toUnixTime(sorted[index].time) - t0)) / span
          : l1
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

const findReflectionIndices = (
  measurements: HydrographPoint[],
  threshold: number,
  range: HydrographRange | null | undefined,
  method: ReflectionDetectionMethod
) =>
  method === 'baseline'
    ? findBaselineSpuriousIndices(measurements, threshold, range)
    : findSpuriousReflectionIndices(measurements, threshold, range)

export const removeSpuriousReflections = (
  measurements: HydrographPoint[],
  threshold: number,
  range?: HydrographRange | null,
  method: ReflectionDetectionMethod = 'median'
): HydrographPoint[] => {
  const spurious = findReflectionIndices(measurements, threshold, range, method)
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
  method: ReflectionDetectionMethod = 'median'
): HydrographPoint[] => {
  const spurious = findReflectionIndices(measurements, threshold, range, method)

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
      time: point.time,
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
