import { useMemo } from 'react'
import { extent, line, scaleLinear } from 'd3'
import type { ITempDepthPoint } from '@/interfaces/geothermal'

const W = 360
const H = 460
const M = { top: 16, right: 16, bottom: 40, left: 52 }

/**
 * Depth profile: a chosen measurement on X, depth on Y (increasing downward).
 * Renders the log's points as a connected line + dots. Pure SVG + d3 scales.
 */
export function TempDepthChart({
  points,
  xField,
  xLabel,
}: {
  points: ITempDepthPoint[]
  xField: keyof ITempDepthPoint
  xLabel: string
}) {
  const data = useMemo(
    () =>
      points
        .filter((p) => p.depth_ft != null && p[xField] != null)
        .map((p) => ({
          depth: p.depth_ft as number,
          value: p[xField] as number,
        }))
        .sort((a, b) => a.depth - b.depth),
    [points, xField]
  )

  if (data.length < 2) {
    return (
      <div className="flex h-full items-center justify-center px-4 text-center text-sm text-muted-foreground">
        Add depth (ft) and {xLabel} to plot the profile.
      </div>
    )
  }

  const vExtent = extent(data, (d) => d.value) as [number, number]
  const dExtent = extent(data, (d) => d.depth) as [number, number]
  const x = scaleLinear().domain(vExtent).nice().range([M.left, W - M.right])
  // Depth increases downward: min depth at top, max at bottom.
  const y = scaleLinear().domain(dExtent).nice().range([M.top, H - M.bottom])
  const path =
    line<{ depth: number; value: number }>()
      .x((d) => x(d.value))
      .y((d) => y(d.depth))(data) ?? ''

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full text-primary"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Y axis (depth) */}
      {y.ticks(6).map((t) => (
        <g key={`y${t}`} className="text-border">
          <line
            x1={M.left}
            x2={W - M.right}
            y1={y(t)}
            y2={y(t)}
            stroke="currentColor"
            strokeWidth={0.5}
          />
          <text
            x={M.left - 6}
            y={y(t)}
            dy="0.32em"
            textAnchor="end"
            className="fill-muted-foreground text-[9px]"
          >
            {t}
          </text>
        </g>
      ))}
      {/* X axis (temp) */}
      {x.ticks(5).map((t) => (
        <g key={`x${t}`}>
          <text
            x={x(t)}
            y={H - M.bottom + 14}
            textAnchor="middle"
            className="fill-muted-foreground text-[9px]"
          >
            {t}
          </text>
        </g>
      ))}

      <text
        x={(M.left + W - M.right) / 2}
        y={H - 6}
        textAnchor="middle"
        className="fill-muted-foreground text-[10px]"
      >
        {xLabel}
      </text>
      <text
        x={-(M.top + H - M.bottom) / 2}
        y={12}
        transform="rotate(-90)"
        textAnchor="middle"
        className="fill-muted-foreground text-[10px]"
      >
        Depth (ft)
      </text>

      <path d={path} fill="none" stroke="currentColor" strokeWidth={1.5} />
      {data.map((d, i) => (
        <circle
          key={i}
          cx={x(d.value)}
          cy={y(d.depth)}
          r={1.6}
          fill="currentColor"
        />
      ))}
    </svg>
  )
}
