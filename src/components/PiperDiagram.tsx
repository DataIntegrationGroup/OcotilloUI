import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react'
import * as d3 from 'd3'
import {
  Circle as PdfCircle,
  Document,
  Page,
  Path as PdfPath,
  Svg,
  StyleSheet,
  Text as PdfText,
  View,
  pdf,
} from '@react-pdf/renderer'
import {
  Box,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { parseNumeric } from '@/utils/parseNumeric'
import { getFeatureId } from '@/utils/mapSelection'

type Point = {
  x: number
  y: number
}

type FeatureProperties = Record<string, unknown>

type GeoJsonFeature = {
  id?: string | number
  geometry?: {
    type?: string
  }
  properties?: FeatureProperties
}

export type PiperDiagramHandle = {
  exportPdf: () => Promise<void>
}

type TernaryMix = {
  left: number
  top: number
  right: number
}

type PiperPoint = {
  featureId: string
  name: string
  chemistryDate: string
  cation: {
    calcium: number
    magnesium: number
    sodiumPotassium: number
  }
  anion: {
    chloride: number
    sulfate: number
    bicarbonateCarbonate: number
  }
  cationPoint: Point
  anionPoint: Point
  diamondPoint: Point
}

const SQRT3 = Math.sqrt(3)
const BASE_TRIANGLE_HEIGHT = SQRT3 / 2
// Keep triangle and diamond side slopes identical so the axes remain parallel.
const SIDE_HEIGHT_SCALE = 1.32
const SIDE_HEIGHT = BASE_TRIANGLE_HEIGHT * SIDE_HEIGHT_SCALE
const TRIANGLE_HEIGHT = SIDE_HEIGHT
const DIAMOND_HEIGHT = SIDE_HEIGHT
const TRIANGLE_GAP_X = 0.22
const RIGHT_TRIANGLE_OFFSET = 1 + TRIANGLE_GAP_X
const DIAMOND_CENTER_X = (1 + RIGHT_TRIANGLE_OFFSET) / 2
const TRIANGLE_BASE_Y = TRIANGLE_HEIGHT * 0.18
const DIAMOND_BASE_Y = TRIANGLE_HEIGHT - TRIANGLE_HEIGHT * 0.48
const WORLD_X_MIN = 0
const WORLD_X_MAX = RIGHT_TRIANGLE_OFFSET + 1
const WORLD_Y_MIN = 0
const WORLD_Y_MAX = DIAMOND_BASE_Y + 2 * DIAMOND_HEIGHT

const SVG_WIDTH = 430
const SVG_HEIGHT = 404
const MARGIN = {
  top: 24,
  right: 26,
  bottom: 15,
  left: 26,
}

const EQUIVALENT_WEIGHTS = {
  calcium: 20.039,
  magnesium: 12.1525,
  sodium: 22.989769,
  potassium: 39.0983,
  chloride: 35.453,
  sulfate: 48.03,
  bicarbonate: 61.0168,
  carbonate: 30.00445,
} as const

const normalizeUnit = (unit: unknown): string =>
  typeof unit === 'string' ? unit.trim().toLowerCase() : ''

const toMilligramsPerLiter = (
  value: number,
  unit: string
): number | undefined => {
  if (!Number.isFinite(value)) return undefined
  if (!unit || unit.includes('mg/l') || unit === 'ppm') return value
  if (unit.includes('ug/l') || unit.includes('mcg/l')) return value / 1000
  return undefined
}

const toMilliequivalents = ({
  value,
  unit,
  equivalentWeight,
}: {
  value: unknown
  unit: unknown
  equivalentWeight: number
}): number | undefined => {
  const numericValue = parseNumeric(value)
  if (numericValue === undefined) return undefined

  const normalizedUnit = normalizeUnit(unit)
  if (normalizedUnit.includes('meq/l')) return numericValue

  const mgPerL = toMilligramsPerLiter(numericValue, normalizedUnit)
  if (mgPerL === undefined) return undefined

  return mgPerL / equivalentWeight
}

const roundPercent = (value: number): number => Math.round(value * 10) / 10
const formatPercent = (value: number): string => `${value.toFixed(1)}%`

const formatDate = (value: unknown): string => {
  if (typeof value !== 'string' || value.trim().length === 0) return ''
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(parsed)
}

const getName = (feature: GeoJsonFeature): string =>
  String(
    feature?.properties?.name ?? feature?.properties?.thing_name ?? 'Unnamed well'
  )

const ternaryToCartesian = (
  mix: TernaryMix,
  offsetX = 0
): Point => ({
  x: offsetX + mix.right + mix.top * 0.5,
  y: TRIANGLE_BASE_Y + mix.top * TRIANGLE_HEIGHT,
})

const diamondFromFractions = ({
  alkalisFraction,
  strongAcidsFraction,
}: {
  alkalisFraction: number
  strongAcidsFraction: number
}) => ({
  x: DIAMOND_CENTER_X + 0.5 * (strongAcidsFraction - alkalisFraction),
  y: DIAMOND_BASE_Y + DIAMOND_HEIGHT * (strongAcidsFraction + alkalisFraction),
})

const createPiperPoint = (feature: GeoJsonFeature): PiperPoint | null => {
  const properties = feature?.properties || {}
  const calcium = toMilliequivalents({
    value: properties.calcium,
    unit: properties.calcium_units,
    equivalentWeight: EQUIVALENT_WEIGHTS.calcium,
  })
  const magnesium = toMilliequivalents({
    value: properties.magnesium,
    unit: properties.magnesium_units,
    equivalentWeight: EQUIVALENT_WEIGHTS.magnesium,
  })
  const sodium = toMilliequivalents({
    value: properties.sodium,
    unit: properties.sodium_units,
    equivalentWeight: EQUIVALENT_WEIGHTS.sodium,
  })
  const potassium = toMilliequivalents({
    value: properties.potassium,
    unit: properties.potassium_units,
    equivalentWeight: EQUIVALENT_WEIGHTS.potassium,
  })
  const chloride = toMilliequivalents({
    value: properties.chloride,
    unit: properties.chloride_units,
    equivalentWeight: EQUIVALENT_WEIGHTS.chloride,
  })
  const sulfate = toMilliequivalents({
    value: properties.sulfate,
    unit: properties.sulfate_units,
    equivalentWeight: EQUIVALENT_WEIGHTS.sulfate,
  })
  const bicarbonate = toMilliequivalents({
    value: properties.bicarbonate,
    unit: properties.bicarbonate_units,
    equivalentWeight: EQUIVALENT_WEIGHTS.bicarbonate,
  })
  const carbonate = toMilliequivalents({
    value: properties.carbonate,
    unit: properties.carbonate_units,
    equivalentWeight: EQUIVALENT_WEIGHTS.carbonate,
  })

  const hasCompleteChemistry = [
    calcium,
    magnesium,
    sodium,
    potassium,
    chloride,
    sulfate,
    bicarbonate,
    carbonate,
  ].every((value) => value !== undefined)
  if (!hasCompleteChemistry) return null

  const calciumMeq = calcium as number
  const magnesiumMeq = magnesium as number
  const sodiumMeq = sodium as number
  const potassiumMeq = potassium as number
  const chlorideMeq = chloride as number
  const sulfateMeq = sulfate as number
  const bicarbonateMeq = bicarbonate as number
  const carbonateMeq = carbonate as number

  const sodiumPotassium = sodiumMeq + potassiumMeq
  const bicarbonateCarbonate = bicarbonateMeq + carbonateMeq

  const cationTotal = calciumMeq + magnesiumMeq + sodiumPotassium
  const anionTotal = chlorideMeq + sulfateMeq + bicarbonateCarbonate
  if (cationTotal <= 0 || anionTotal <= 0) return null

  const cation = {
    calcium: roundPercent((calciumMeq / cationTotal) * 100),
    magnesium: roundPercent((magnesiumMeq / cationTotal) * 100),
    sodiumPotassium: roundPercent((sodiumPotassium / cationTotal) * 100),
  }
  const cationMix = {
    left: calciumMeq / cationTotal,
    top: magnesiumMeq / cationTotal,
    right: sodiumPotassium / cationTotal,
  }
  const anion = {
    chloride: roundPercent((chlorideMeq / anionTotal) * 100),
    sulfate: roundPercent((sulfateMeq / anionTotal) * 100),
    bicarbonateCarbonate: roundPercent(
      (bicarbonateCarbonate / anionTotal) * 100
    ),
  }
  const anionMix = {
    left: chlorideMeq / anionTotal,
    top: sulfateMeq / anionTotal,
    right: bicarbonateCarbonate / anionTotal,
  }
  const alkalisFraction = sodiumPotassium / cationTotal
  const strongAcidsFraction = (chlorideMeq + sulfateMeq) / anionTotal

  const cationPoint = ternaryToCartesian(cationMix, 0)
  const anionPoint = ternaryToCartesian(anionMix, RIGHT_TRIANGLE_OFFSET)
  const diamondPoint = diamondFromFractions({
    alkalisFraction,
    strongAcidsFraction,
  })

  return {
    featureId: getFeatureId(feature),
    name: getName(feature),
    chemistryDate: formatDate(properties.latest_chemistry_date),
    cation,
    anion,
    cationPoint,
    anionPoint,
    diamondPoint,
  }
}

const xScale = d3
  .scaleLinear()
  .domain([WORLD_X_MIN, WORLD_X_MAX])
  .range([MARGIN.left, SVG_WIDTH - MARGIN.right])

const yScale = d3
  .scaleLinear()
  .domain([WORLD_Y_MIN, WORLD_Y_MAX])
  .range([SVG_HEIGHT - MARGIN.bottom, MARGIN.top])

const pathFromPoints = (points: Point[]) => {
  const path = d3.path()
  points.forEach((point, index) => {
    if (index === 0) {
      path.moveTo(xScale(point.x), yScale(point.y))
      return
    }
    path.lineTo(xScale(point.x), yScale(point.y))
  })
  path.closePath()
  return path.toString()
}

const buildLinePath = (points: Point[]) => {
  const path = d3.path()
  points.forEach((point, index) => {
    if (index === 0) {
      path.moveTo(xScale(point.x), yScale(point.y))
      return
    }
    path.lineTo(xScale(point.x), yScale(point.y))
  })
  return path.toString()
}

const ternaryPoint = (
  left: number,
  top: number,
  right: number,
  offsetX = 0
) => ternaryToCartesian({ left, top, right }, offsetX)

const triangleGridPaths = (offsetX = 0): string[] => {
  const values = d3.range(0.1, 1, 0.1)
  const paths: string[] = []

  values.forEach((value) => {
    paths.push(
      buildLinePath([
        ternaryPoint(value, 0, 1 - value, offsetX),
        ternaryPoint(value, 1 - value, 0, offsetX),
      ])
    )
    paths.push(
      buildLinePath([
        ternaryPoint(0, value, 1 - value, offsetX),
        ternaryPoint(1 - value, value, 0, offsetX),
      ])
    )
    paths.push(
      buildLinePath([
        ternaryPoint(1 - value, 0, value, offsetX),
        ternaryPoint(0, 1 - value, value, offsetX),
      ])
    )
  })

  return paths
}

const diamondGridPaths = (): string[] => {
  const values = d3.range(0.1, 1, 0.1)
  const paths: string[] = []

  values.forEach((value) => {
    paths.push(
      buildLinePath([
        diamondFromFractions({ alkalisFraction: value, strongAcidsFraction: 0 }),
        diamondFromFractions({ alkalisFraction: value, strongAcidsFraction: 1 }),
      ])
    )
    paths.push(
      buildLinePath([
        diamondFromFractions({ alkalisFraction: 0, strongAcidsFraction: value }),
        diamondFromFractions({ alkalisFraction: 1, strongAcidsFraction: value }),
      ])
    )
  })

  return paths
}

const leftTrianglePath = pathFromPoints([
  { x: 0, y: TRIANGLE_BASE_Y },
  { x: 1, y: TRIANGLE_BASE_Y },
  { x: 0.5, y: TRIANGLE_BASE_Y + TRIANGLE_HEIGHT },
])

const leftTriangleVertices = [
  { x: 0, y: TRIANGLE_BASE_Y },
  { x: 1, y: TRIANGLE_BASE_Y },
  { x: 0.5, y: TRIANGLE_BASE_Y + TRIANGLE_HEIGHT },
]

const rightTrianglePath = pathFromPoints([
  { x: RIGHT_TRIANGLE_OFFSET, y: TRIANGLE_BASE_Y },
  { x: RIGHT_TRIANGLE_OFFSET + 1, y: TRIANGLE_BASE_Y },
  { x: RIGHT_TRIANGLE_OFFSET + 0.5, y: TRIANGLE_BASE_Y + TRIANGLE_HEIGHT },
])

const rightTriangleVertices = [
  { x: RIGHT_TRIANGLE_OFFSET, y: TRIANGLE_BASE_Y },
  { x: RIGHT_TRIANGLE_OFFSET + 1, y: TRIANGLE_BASE_Y },
  { x: RIGHT_TRIANGLE_OFFSET + 0.5, y: TRIANGLE_BASE_Y + TRIANGLE_HEIGHT },
]

const diamondPath = pathFromPoints([
  { x: DIAMOND_CENTER_X, y: DIAMOND_BASE_Y },
  {
    x: DIAMOND_CENTER_X + 0.5,
    y: DIAMOND_BASE_Y + DIAMOND_HEIGHT,
  },
  {
    x: DIAMOND_CENTER_X,
    y: DIAMOND_BASE_Y + 2 * DIAMOND_HEIGHT,
  },
  {
    x: DIAMOND_CENTER_X - 0.5,
    y: DIAMOND_BASE_Y + DIAMOND_HEIGHT,
  },
])

const diamondVertices = [
  { x: DIAMOND_CENTER_X, y: DIAMOND_BASE_Y },
  {
    x: DIAMOND_CENTER_X + 0.5,
    y: DIAMOND_BASE_Y + DIAMOND_HEIGHT,
  },
  {
    x: DIAMOND_CENTER_X,
    y: DIAMOND_BASE_Y + 2 * DIAMOND_HEIGHT,
  },
  {
    x: DIAMOND_CENTER_X - 0.5,
    y: DIAMOND_BASE_Y + DIAMOND_HEIGHT,
  },
]

const leftTriangleGridPaths = triangleGridPaths(0)
const rightTriangleGridPaths = triangleGridPaths(RIGHT_TRIANGLE_OFFSET)
const diamondMeshPaths = diamondGridPaths()

const labelStyle = {
  fontSize: 11,
  fill: 'currentColor',
  fontWeight: 700,
} as const

type AxisLabel = {
  text: string
  x: number
  y: number
  angle?: number
}

const centroid = (vertices: Point[]) => ({
  x: d3.mean(vertices, (d) => d.x) ?? 0,
  y: d3.mean(vertices, (d) => d.y) ?? 0,
})

const edgeLabel = ({
  from,
  to,
  polygon,
  offset = 0.12,
}: {
  from: Point
  to: Point
  polygon: Point[]
  offset?: number
}) => {
  const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 }
  const dx = to.x - from.x
  const dy = to.y - from.y
  const length = Math.hypot(dx, dy) || 1
  const normals = [
    { x: -dy / length, y: dx / length },
    { x: dy / length, y: -dx / length },
  ]
  const c = centroid(polygon)
  const chosenNormal =
    Math.hypot(mid.x + normals[0].x * offset - c.x, mid.y + normals[0].y * offset - c.y) >
    Math.hypot(mid.x + normals[1].x * offset - c.x, mid.y + normals[1].y * offset - c.y)
      ? normals[0]
      : normals[1]

  return {
    x: mid.x + chosenNormal.x * offset,
    y: mid.y + chosenNormal.y * offset,
    angle: (Math.atan2(dy, dx) * 180) / Math.PI,
  }
}

const renderedEdgeAngle = (
  from: Point,
  to: Point
): number => {
  let angle =
    (Math.atan2(yScale(to.y) - yScale(from.y), xScale(to.x) - xScale(from.x)) *
      180) /
    Math.PI

  while (angle > 90) angle -= 180
  while (angle <= -90) angle += 180
  return angle
}

const leftBaseLabel = edgeLabel({
  from: leftTriangleVertices[0],
  to: leftTriangleVertices[1],
  polygon: leftTriangleVertices,
  offset: 0.18,
})
leftBaseLabel.angle = 0
const leftRightEdgeLabel = edgeLabel({
  from: leftTriangleVertices[1],
  to: leftTriangleVertices[2],
  polygon: leftTriangleVertices,
  offset: 0.1,
})
leftRightEdgeLabel.angle = renderedEdgeAngle(
  leftTriangleVertices[1],
  leftTriangleVertices[2]
)
const leftLeftEdgeLabel = edgeLabel({
  from: leftTriangleVertices[2],
  to: leftTriangleVertices[0],
  polygon: leftTriangleVertices,
  offset: 0.16,
})
leftLeftEdgeLabel.angle = renderedEdgeAngle(
  leftTriangleVertices[2],
  leftTriangleVertices[0]
)

const rightBaseLabel = edgeLabel({
  from: rightTriangleVertices[0],
  to: rightTriangleVertices[1],
  polygon: rightTriangleVertices,
  offset: 0.18,
})
rightBaseLabel.angle = 0
const rightLeftEdgeLabel = edgeLabel({
  from: rightTriangleVertices[2],
  to: rightTriangleVertices[0],
  polygon: rightTriangleVertices,
  offset: 0.1,
})
rightLeftEdgeLabel.angle = renderedEdgeAngle(
  rightTriangleVertices[2],
  rightTriangleVertices[0]
)
const rightRightEdgeLabel = edgeLabel({
  from: rightTriangleVertices[1],
  to: rightTriangleVertices[2],
  polygon: rightTriangleVertices,
  offset: 0.16,
})
rightRightEdgeLabel.angle = renderedEdgeAngle(
  rightTriangleVertices[1],
  rightTriangleVertices[2]
)

const diamondLowerLeftLabel = edgeLabel({
  from: diamondVertices[3],
  to: diamondVertices[2],
  polygon: diamondVertices,
  offset: 0.14,
})
diamondLowerLeftLabel.angle = renderedEdgeAngle(
  diamondVertices[3],
  diamondVertices[2]
)
const diamondLowerRightLabel = edgeLabel({
  from: diamondVertices[2],
  to: diamondVertices[1],
  polygon: diamondVertices,
  offset: 0.14,
})
diamondLowerRightLabel.angle = renderedEdgeAngle(
  diamondVertices[2],
  diamondVertices[1]
)

const axisLabels: AxisLabel[] = [
  {
    text: 'Ca',
    x: leftBaseLabel.x,
    y: leftBaseLabel.y,
  },
  {
    text: 'Na + K',
    x: leftRightEdgeLabel.x,
    y: leftRightEdgeLabel.y,
    angle: leftRightEdgeLabel.angle,
  },
  {
    text: 'Mg',
    x: leftLeftEdgeLabel.x,
    y: leftLeftEdgeLabel.y,
    angle: leftLeftEdgeLabel.angle,
  },
  {
    text: 'Cl',
    x: rightBaseLabel.x,
    y: rightBaseLabel.y,
  },
  {
    text: 'HCO3 + CO3',
    x: rightLeftEdgeLabel.x,
    y: rightLeftEdgeLabel.y,
    angle: rightLeftEdgeLabel.angle,
  },
  {
    text: 'SO4',
    x: rightRightEdgeLabel.x,
    y: rightRightEdgeLabel.y,
    angle: rightRightEdgeLabel.angle,
  },
  {
    text: 'SO4 + Cl',
    x: diamondLowerLeftLabel.x,
    y: diamondLowerLeftLabel.y,
    angle: diamondLowerLeftLabel.angle,
  },
  {
    text: 'Ca + Mg',
    x: diamondLowerRightLabel.x,
    y: diamondLowerRightLabel.y,
    angle: diamondLowerRightLabel.angle,
  },
]

const pdfStyles = StyleSheet.create({
  page: {
    padding: 24,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  title: {
    fontSize: 16,
    marginBottom: 4,
    fontWeight: 700,
  },
  subtitle: {
    fontSize: 10,
    color: '#666666',
    marginBottom: 12,
  },
  chartWrap: {
    marginBottom: 12,
  },
  table: {
    display: 'flex',
    flexDirection: 'column',
    borderWidth: 1,
    borderColor: '#d9d9d9',
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  cell: {
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRightWidth: 1,
    borderRightColor: '#e5e5e5',
  },
  headerCell: {
    fontWeight: 700,
    backgroundColor: '#f3f3f3',
  },
})

const buildPdfFilename = (): string => {
  const date = new Date()
  const stamp = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
  return `piper-diagram-${stamp}.pdf`
}

const isPiperPoint = (point: PiperPoint | null): point is PiperPoint => point !== null

const PDF_AXIS_COLOR = '#374151'
const PDF_GRID_COLOR = '#d1d5db'
const PDF_POINT_FILL = '#111827'
const PDF_LABEL_COLOR = '#111827'

const PdfPiperChart = ({ points }: { points: PiperPoint[] }) => (
  <Svg
    width="100%"
    height={SVG_HEIGHT}
    viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
  >
    {leftTriangleGridPaths.map((path, index) => (
      <PdfPath
        key={`pdf-left-grid-${index}`}
        d={path}
        fill="none"
        stroke={PDF_GRID_COLOR}
        strokeWidth={0.7}
      />
    ))}
    {rightTriangleGridPaths.map((path, index) => (
      <PdfPath
        key={`pdf-right-grid-${index}`}
        d={path}
        fill="none"
        stroke={PDF_GRID_COLOR}
        strokeWidth={0.7}
      />
    ))}
    {diamondMeshPaths.map((path, index) => (
      <PdfPath
        key={`pdf-diamond-grid-${index}`}
        d={path}
        fill="none"
        stroke={PDF_GRID_COLOR}
        strokeWidth={0.7}
      />
    ))}
    <PdfPath d={leftTrianglePath} fill="none" stroke={PDF_AXIS_COLOR} strokeWidth={1.5} />
    <PdfPath d={rightTrianglePath} fill="none" stroke={PDF_AXIS_COLOR} strokeWidth={1.5} />
    <PdfPath d={diamondPath} fill="none" stroke={PDF_AXIS_COLOR} strokeWidth={1.5} />
    {axisLabels.map((label) => (
      <PdfText
        key={`pdf-axis-${label.text}`}
        x={xScale(label.x)}
        y={yScale(label.y)}
        textAnchor="middle"
        transform={
          label.angle === undefined
            ? undefined
            : `rotate(${label.angle} ${xScale(label.x)} ${yScale(label.y)})`
        }
        style={{
          fontSize: 11,
          fontWeight: 700,
          fill: PDF_LABEL_COLOR,
        }}
      >
        {label.text}
      </PdfText>
    ))}
    {points.flatMap((point, index) => [
      <PdfCircle
        key={`pdf-cation-${point.featureId}-${index}`}
        cx={xScale(point.cationPoint.x)}
        cy={yScale(point.cationPoint.y)}
        r={4.4}
        fill={PDF_POINT_FILL}
      />,
      <PdfCircle
        key={`pdf-anion-${point.featureId}-${index}`}
        cx={xScale(point.anionPoint.x)}
        cy={yScale(point.anionPoint.y)}
        r={4.4}
        fill={PDF_POINT_FILL}
      />,
      <PdfCircle
        key={`pdf-diamond-${point.featureId}-${index}`}
        cx={xScale(point.diamondPoint.x)}
        cy={yScale(point.diamondPoint.y)}
        r={4.8}
        fill={PDF_POINT_FILL}
      />,
    ])}
  </Svg>
)

const PiperPdfDocument = ({
  points,
}: {
  points: PiperPoint[]
}) => (
  <Document>
    <Page size="LETTER" style={pdfStyles.page}>
      <PdfText style={pdfStyles.title}>Piper Diagram</PdfText>
      <PdfText style={pdfStyles.subtitle}>
        Generated from the current Piper well set.
      </PdfText>
      <View style={pdfStyles.chartWrap}>
        <PdfPiperChart points={points} />
      </View>
      <View style={pdfStyles.table}>
        <View style={pdfStyles.row}>
          {[
            ['Well', 2.2],
            ['Date', 1.35],
            ['Ca', 0.9],
            ['Mg', 0.9],
            ['NaK', 0.9],
            ['HCO3', 1.05],
            ['SO4', 0.9],
            ['Cl', 0.9],
          ].map(([label, flex], index) => (
            <PdfText
              key={label}
              style={[
                pdfStyles.cell,
                pdfStyles.headerCell,
                { flex, borderRightWidth: index === 7 ? 0 : 1 },
              ]}
            >
              {label}
            </PdfText>
          ))}
        </View>
        {points.map((point, rowIndex) => (
          <View key={`${point.featureId}-${rowIndex}`} style={pdfStyles.row}>
            {[
              point.name,
              point.chemistryDate,
              formatPercent(point.cation.calcium),
              formatPercent(point.cation.magnesium),
              formatPercent(point.cation.sodiumPotassium),
              formatPercent(point.anion.bicarbonateCarbonate),
              formatPercent(point.anion.sulfate),
              formatPercent(point.anion.chloride),
            ].map((value, index) => {
              const flexValues = [2.2, 1.35, 0.9, 0.9, 0.9, 1.05, 0.9, 0.9]
              return (
                <PdfText
                  key={`${point.featureId}-${index}`}
                  style={[
                    pdfStyles.cell,
                    {
                      flex: flexValues[index],
                      borderBottomWidth: 0,
                      borderRightWidth: index === 7 ? 0 : 1,
                    },
                  ]}
                >
                  {value}
                </PdfText>
              )
            })}
          </View>
        ))}
      </View>
    </Page>
  </Document>
)

export const PiperDiagram = forwardRef<
  PiperDiagramHandle,
  {
    features: GeoJsonFeature[]
    activeFeatureId?: string | null
    onActiveFeatureChange?: (featureId: string | null) => void
  }
>(({ features, activeFeatureId = null, onActiveFeatureChange }, ref) => {
  const theme = useTheme()
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({})
  const points = useMemo(
    () =>
      features
        .map(createPiperPoint)
        .filter(isPiperPoint)
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })),
    [features]
  )
  const invalidCount = features.length - points.length
  const axisColor = alpha(theme.palette.text.primary, 0.72)
  const gridColor = alpha(theme.palette.text.primary, 0.18)
  const activePointColor = theme.palette.primary.main
  const orderedPoints = useMemo(() => {
    if (!activeFeatureId) return points

    const inactivePoints = points.filter(
      (point) => point.featureId !== activeFeatureId
    )
    const activePoints = points.filter(
      (point) => point.featureId === activeFeatureId
    )

    return [...inactivePoints, ...activePoints]
  }, [activeFeatureId, points])

  useImperativeHandle(
    ref,
    () => ({
      exportPdf: async () => {
        if (points.length === 0) return

        const blob = await pdf(<PiperPdfDocument points={points} />).toBlob()

        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = buildPdfFilename()
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      },
    }),
    [points]
  )

  useEffect(() => {
    if (!activeFeatureId) return

    rowRefs.current[activeFeatureId]?.scrollIntoView({
      block: 'center',
      inline: 'nearest',
    })
  }, [activeFeatureId])

  return (
    <Stack spacing={1.25} sx={{ height: '100%', minHeight: 0 }}>
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
        <Chip
          size="small"
          label={`${points.length} plotted`}
          color={points.length > 0 ? 'primary' : 'default'}
        />
        {invalidCount > 0 ? (
          <Chip
            size="small"
            variant="outlined"
            label={`${invalidCount} skipped for missing chemistry`}
          />
        ) : null}
      </Stack>

      <Box
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1.25,
          p: 0.2,
          backgroundColor: alpha(theme.palette.background.default, 0.55),
          overflowX: 'auto',
          flexShrink: 0,
          flexBasis: 'auto',
        }}
      >
        <Box
          component="svg"
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          role="img"
          aria-label="Piper diagram for selected wells"
          sx={{
            width: '100%',
            minWidth: 252,
            height: 'auto',
            color: theme.palette.text.primary,
          }}
        >
          {leftTriangleGridPaths.map((path, index) => (
            <path
              key={`left-grid-${index}`}
              d={path}
              fill="none"
              stroke={gridColor}
              strokeWidth="0.7"
            />
          ))}
          {rightTriangleGridPaths.map((path, index) => (
            <path
              key={`right-grid-${index}`}
              d={path}
              fill="none"
              stroke={gridColor}
              strokeWidth="0.7"
            />
          ))}
          {diamondMeshPaths.map((path, index) => (
            <path
              key={`diamond-grid-${index}`}
              d={path}
              fill="none"
              stroke={gridColor}
              strokeWidth="0.7"
            />
          ))}
          <path d={leftTrianglePath} fill="none" stroke={axisColor} strokeWidth="1.5" />
          <path d={rightTrianglePath} fill="none" stroke={axisColor} strokeWidth="1.5" />
          <path d={diamondPath} fill="none" stroke={axisColor} strokeWidth="1.5" />

          {axisLabels.map((label) => (
            <text
              key={label.text}
              x={xScale(label.x)}
              y={yScale(label.y)}
              textAnchor="middle"
              transform={
                label.angle === undefined
                  ? undefined
                  : `rotate(${label.angle} ${xScale(label.x)} ${yScale(label.y)})`
              }
              style={labelStyle}
            >
              {label.text}
            </text>
          ))}
          {orderedPoints.map((point, index) => {
            const isActive = point.featureId === activeFeatureId

            return (
            <g key={point.featureId || `${point.name}-${index}`}>
              <circle
                cx={xScale(point.cationPoint.x)}
                cy={yScale(point.cationPoint.y)}
                r={isActive ? '7.2' : '4.4'}
                fill={theme.palette.text.primary}
                stroke={isActive ? activePointColor : theme.palette.background.paper}
                strokeWidth={isActive ? '3' : '1.2'}
                onClick={() =>
                  onActiveFeatureChange?.(isActive ? null : point.featureId)
                }
                style={{ cursor: onActiveFeatureChange ? 'pointer' : 'default' }}
              />
              <circle
                cx={xScale(point.anionPoint.x)}
                cy={yScale(point.anionPoint.y)}
                r={isActive ? '7.2' : '4.4'}
                fill={theme.palette.text.primary}
                stroke={isActive ? activePointColor : theme.palette.background.paper}
                strokeWidth={isActive ? '3' : '1.2'}
                onClick={() =>
                  onActiveFeatureChange?.(isActive ? null : point.featureId)
                }
                style={{ cursor: onActiveFeatureChange ? 'pointer' : 'default' }}
              />
              <circle
                cx={xScale(point.diamondPoint.x)}
                cy={yScale(point.diamondPoint.y)}
                r={isActive ? '7.6' : '4.8'}
                fill={theme.palette.text.primary}
                stroke={isActive ? activePointColor : theme.palette.background.paper}
                strokeWidth={isActive ? '3.2' : '1.3'}
                onClick={() =>
                  onActiveFeatureChange?.(isActive ? null : point.featureId)
                }
                style={{ cursor: onActiveFeatureChange ? 'pointer' : 'default' }}
              />
              <title>{point.name}</title>
            </g>
            )
          })}
        </Box>
      </Box>

      {points.length > 0 ? (
        <Stack spacing={0.75} sx={{ flex: '1 1 0', minHeight: 0 }}>
          <TableContainer
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1.25,
              flex: 1,
              minHeight: 0,
            }}
          >
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ whiteSpace: 'nowrap', py: 0.35, px: 0.6, fontSize: '0.68rem' }}>
                    Well
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap', py: 0.35, px: 0.45, fontSize: '0.68rem' }}>
                    Date
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap', py: 0.35, px: 0.45, fontSize: '0.68rem' }}>
                    Ca
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap', py: 0.35, px: 0.45, fontSize: '0.68rem' }}>
                    Mg
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap', py: 0.35, px: 0.45, fontSize: '0.68rem' }}>
                    NaK
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap', py: 0.35, px: 0.45, fontSize: '0.68rem' }}>
                    HCO3
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap', py: 0.35, px: 0.45, fontSize: '0.68rem' }}>
                    SO4
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap', py: 0.35, px: 0.45, fontSize: '0.68rem' }}>
                    Cl
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {points.map((point) => {
                  const isActive = point.featureId === activeFeatureId

                  return (
                    <TableRow
                      key={point.featureId || point.name}
                      ref={(element) => {
                        rowRefs.current[point.featureId] = element
                      }}
                      hover
                      onClick={() =>
                        onActiveFeatureChange?.(
                          isActive ? null : point.featureId
                        )
                      }
                      sx={{
                        cursor: onActiveFeatureChange ? 'pointer' : 'default',
                        '& .MuiTableCell-root': {
                          backgroundColor: isActive
                            ? alpha(theme.palette.primary.main, 0.08)
                            : undefined,
                          fontWeight: isActive ? 600 : undefined,
                          borderTop: isActive
                            ? `1px solid ${alpha(theme.palette.primary.main, 0.32)}`
                            : undefined,
                          borderBottom: isActive
                            ? `1px solid ${alpha(theme.palette.primary.main, 0.32)}`
                            : undefined,
                        },
                        '& .MuiTableCell-root:first-of-type': {
                          boxShadow: isActive
                            ? `inset 3px 0 0 ${theme.palette.primary.main}`
                            : undefined,
                        },
                      }}
                    >
                      <TableCell sx={{ whiteSpace: 'nowrap', py: 0.3, px: 0.6, fontSize: '0.68rem', lineHeight: 1.1 }}>
                        {point.name}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap', py: 0.3, px: 0.45, fontSize: '0.68rem', lineHeight: 1.1 }}>
                        {point.chemistryDate}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap', py: 0.3, px: 0.45, fontSize: '0.68rem', lineHeight: 1.1 }}>
                        {formatPercent(point.cation.calcium)}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap', py: 0.3, px: 0.45, fontSize: '0.68rem', lineHeight: 1.1 }}>
                        {formatPercent(point.cation.magnesium)}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap', py: 0.3, px: 0.45, fontSize: '0.68rem', lineHeight: 1.1 }}>
                        {formatPercent(point.cation.sodiumPotassium)}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap', py: 0.3, px: 0.45, fontSize: '0.68rem', lineHeight: 1.1 }}>
                        {formatPercent(point.anion.bicarbonateCarbonate)}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap', py: 0.3, px: 0.45, fontSize: '0.68rem', lineHeight: 1.1 }}>
                        {formatPercent(point.anion.sulfate)}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap', py: 0.3, px: 0.45, fontSize: '0.68rem', lineHeight: 1.1 }}>
                        {formatPercent(point.anion.chloride)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <Box
            sx={{
              px: 0.1,
              pb: 0.1,
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', lineHeight: 1.35 }}
            >
              Click a row or Piper point to highlight that well on the map and across all three Piper panels.
            </Typography>
          </Box>
        </Stack>
      ) : (
        <Box
          sx={{
            border: '1px dashed',
            borderColor: 'divider',
            borderRadius: 1.25,
            px: 1.25,
            py: 2,
            flex: 1,
            minHeight: 0,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            No plottable chemistry wells are selected yet. Draw or edit a map
            selection while the major chemistry layer is visible.
          </Typography>
        </Box>
      )}
    </Stack>
  )
})
