'use client'

import { useId } from 'react'

interface AreaChartProps {
  labels: string[]
  series: { name: string; color: string; values: number[] }[]
  /** Max of the normalized scale. @default 100 */
  max?: number
  height?: number
}

function buildPath(values: number[], width: number, height: number, max: number, pad: number) {
  const innerW = width - pad * 2
  const innerH = height - pad * 2
  const step = values.length > 1 ? innerW / (values.length - 1) : 0
  return values.map((v, i) => {
    const x = pad + i * step
    const y = pad + innerH - (Math.min(v, max) / max) * innerH
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
  })
}

/**
 * Lightweight dependency-free SVG area chart for the Helm overview.
 * Uses brand chart colors; no recharts/d3 needed.
 */
export function AreaChart({ labels, series, max = 100, height = 200 }: AreaChartProps) {
  const uid = useId().replace(/:/g, '')
  const width = 720
  const pad = 16

  return (
    <svg
      role="img"
      aria-label="Active users and activation rate over the last 12 weeks"
      viewBox={`0 0 ${width} ${height}`}
      className="h-[200px] w-full"
      preserveAspectRatio="none"
    >
      <title>Active users and activation rate over the last 12 weeks</title>
      {/* horizontal gridlines */}
      {[0.25, 0.5, 0.75].map((t) => (
        <line
          key={t}
          x1={pad}
          x2={width - pad}
          y1={pad + (height - pad * 2) * t}
          y2={pad + (height - pad * 2) * t}
          stroke="var(--border)"
          strokeWidth={1}
          strokeDasharray="3 4"
          opacity={0.6}
        />
      ))}
      {series.map((s) => {
        const line = buildPath(s.values, width, height, max, pad)
        const area = `${line.join(' ')} L${(width - pad).toFixed(1)},${(height - pad).toFixed(1)} L${pad.toFixed(1)},${(height - pad).toFixed(1)} Z`
        const gradId = `area-${uid}-${s.name.replace(/\s+/g, '')}`
        return (
          <g key={s.name}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.32} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <path d={area} fill={`url(#${gradId})`} />
            <path
              d={line.join(' ')}
              fill="none"
              stroke={s.color}
              strokeWidth={2.5}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </g>
        )
      })}
      {/* x labels (first / mid / last) */}
      {[0, Math.floor(labels.length / 2), labels.length - 1].map((i) => {
        const innerW = width - pad * 2
        const step = labels.length > 1 ? innerW / (labels.length - 1) : 0
        return (
          <text
            key={labels[i]}
            x={pad + i * step}
            y={height - 2}
            fill="var(--muted-foreground)"
            fontSize={11}
            textAnchor={i === 0 ? 'start' : i === labels.length - 1 ? 'end' : 'middle'}
          >
            {labels[i]}
          </text>
        )
      })}
    </svg>
  )
}
