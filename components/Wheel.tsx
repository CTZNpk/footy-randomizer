'use client'

import { sliceBounds } from '@/lib/weights'
import { PlayerView } from '@/lib/types'

const COLORS = [
  '#22c55e', '#38bdf8', '#fb923c', '#a78bfa', '#f472b6',
  '#facc15', '#2dd4bf', '#f87171', '#818cf8', '#84cc16',
]

const LABEL_OUTER_RADIUS = 94
const LABEL_MIN_SIZE = 3
const LABEL_MAX_SIZE = 7
const GLYPH_ASPECT = 0.55

function labelFontSize(name: string, degrees: number): number {
  const radians = (degrees * Math.PI) / 180
  const fitted =
    (LABEL_OUTER_RADIUS * radians) / (1 + GLYPH_ASPECT * name.length * radians)
  return Math.min(LABEL_MAX_SIZE, Math.max(LABEL_MIN_SIZE, fitted))
}

function arcPath(radius: number, startDeg: number, endDeg: number): string {
  const point = (deg: number) => {
    const rad = ((deg - 90) * Math.PI) / 180
    return `${(radius * Math.cos(rad)).toFixed(3)} ${(radius * Math.sin(rad)).toFixed(3)}`
  }
  const largeArc = endDeg - startDeg > 180 ? 1 : 0
  return `M 0 0 L ${point(startDeg)} A ${radius} ${radius} 0 ${largeArc} 1 ${point(endDeg)} Z`
}

export default function Wheel({
  pool,
  rotation,
  durationMs,
}: {
  pool: PlayerView[]
  rotation: number
  durationMs: number
}) {
  const bounds = sliceBounds(pool.map((player) => player.weight))

  return (
    <div className="relative mx-auto aspect-square w-full max-w-md">
      <div className="absolute left-1/2 top-0 z-10 h-0 w-0 -translate-x-1/2 border-x-[10px] border-t-[18px] border-x-transparent border-t-chalk" />
      <svg
        viewBox="-105 -105 210 210"
        className="h-full w-full drop-shadow-[0_0_30px_rgba(34,197,94,0.15)]"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: durationMs
            ? `transform ${durationMs}ms cubic-bezier(0.15, 0.6, 0.1, 1)`
            : undefined,
        }}
      >
        <circle r="102" fill="none" stroke="var(--color-line)" strokeWidth="4" />
        {pool.map((player, i) => {
          const { start, end } = bounds[i]

          return (
            <g key={player.id}>
              <path
                d={arcPath(100, start, end)}
                fill={COLORS[i % COLORS.length]}
                fillOpacity="0.85"
                stroke="#0b1f16"
                strokeWidth="0.8"
              />
              <text
                transform={`rotate(${(start + end) / 2}) translate(0 -${LABEL_OUTER_RADIUS}) rotate(90)`}
                textAnchor="start"
                dominantBaseline="middle"
                fontSize={labelFontSize(player.name, end - start)}
                className="fill-pitch font-bold"
              >
                {player.name}
              </text>
            </g>
          )
        })}
        <circle r="14" fill="var(--color-pitch)" stroke="var(--color-line)" strokeWidth="3" />
      </svg>
    </div>
  )
}
