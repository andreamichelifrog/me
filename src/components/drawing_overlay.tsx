import React, { useMemo } from 'react'
import useReadDrawings from '@/lib/useReadDrawings'

type Placement = { side: 'left' | 'right' | 'bottom'; offset: number }

function pickRandom<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function useThemeChartColors() {
  // read --chart-1..5 from root
  const colors = [] as string[]
  for (let i = 1; i <= 5; i++) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(`--chart-${i}`)
    if (v) colors.push(v.trim())
  }
  if (colors.length === 0) colors.push('#1B2FDB')
  return colors
}

export default function DrawingOverlay() {
  const { drawings } = useReadDrawings({ quant: 100, limit: 20 })
  const colors = useThemeChartColors()

  // map drawings to randomized placement/color — stable per id using memo
  const items = useMemo(() => {
    return drawings.map((d) => {
      const side = pickRandom(['left', 'right', 'bottom'] as const)
      const offset = side === 'bottom' ? Math.random() * 60 + 10 : Math.random() * 70 + 5
      const color = pickRandom(colors)
      return { ...d, placement: { side, offset } as Placement, color }
    })
  }, [drawings.join?.toString?.() ?? JSON.stringify(drawings), colors])

  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      {items.map((it) => {
        const size = 120
        let style: React.CSSProperties = { position: 'absolute', width: size, height: size }
        if (it.placement.side === 'left') {
          style.left = 8
          style.top = `${it.placement.offset}%`
        } else if (it.placement.side === 'right') {
          style.right = 8
          style.top = `${it.placement.offset}%`
        } else {
          style.left = `${it.placement.offset}%`
          style.bottom = 8
        }

        return (
          <div key={it.id} style={style} className="opacity-95">
            <svg viewBox={`0 0 100 100`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
              <rect x="0" y="0" width="100" height="100" rx="12" fill="rgba(0,0,0,0.04)" />
              <g transform="translate(6,6) scale(0.88)">
                <path d={pathFromPoints(it.path)} fill="none" stroke={it.color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
              </g>
            </svg>
          </div>
        )
      })}
    </div>
  )
}

function pathFromPoints(points: Array<{ x: number; y: number }>) {
  if (!points || points.length === 0) return ''
  // normalize to 0..100 box based on max extents
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity
  for (const p of points) {
    if (p.x < minX) minX = p.x
    if (p.y < minY) minY = p.y
    if (p.x > maxX) maxX = p.x
    if (p.y > maxY) maxY = p.y
  }
  const w = maxX - minX || 1
  const h = maxY - minY || 1
  const scale = 88 // leave padding inside 100 viewBox
  const ox = 6
  const oy = 6
  const cmds: string[] = []
  points.forEach((p, i) => {
    const nx = ((p.x - minX) / w) * scale + ox
    const ny = ((p.y - minY) / h) * scale + oy
    cmds.push(`${i === 0 ? 'M' : 'L'} ${nx.toFixed(2)} ${ny.toFixed(2)}`)
  })
  return cmds.join(' ')
}
