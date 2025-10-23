import React, { useEffect, useRef, useState } from 'react'
import useReadDrawings from '@/lib/useReadDrawings'

type Placement = { side: 'left' | 'right' | 'bottom'; offset: number }

function hashToDeterministic(id: string, max: number) {
  let h = 2166136261 >>> 0
  for (let i = 0; i < id.length; i++) {
    h = Math.imul(h ^ id.charCodeAt(i), 16777619) >>> 0
  }
  return h % max
}

function useThemeChartColors() {
  const colors = [] as string[]
  for (let i = 1; i <= 5; i++) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(`--chart-${i}`)
    if (v) colors.push(v.trim())
  }
  if (colors.length === 0) colors.push('#1B2FDB')
  return colors
}

export default function DrawingOverlay() {
  const { drawings } = useReadDrawings({ quant: 100, limit: 50 })
  const colors = useThemeChartColors()

  // append-only items list (for rendering). We keep a ref map for quick lookup
  const itemsRef = useRef<Array<{ id: string; path: Array<{ x: number; y: number }>; placement: Placement; color: string }>>([])
  const itemsIndex = useRef<Record<string, boolean>>({})
  const timers = useRef<Record<string, number>>({})
  const [, setTick] = useState(0) // used to trigger re-renders only when items change
  const TTL = 4000

  useEffect(() => {
    drawings.forEach((d) => {
      if (itemsIndex.current[d.id]) return // already appended

      // deterministic placement & color
      const sideIdx = hashToDeterministic(d.id + 'side', 3)
      const side = (['left', 'right', 'bottom'] as const)[sideIdx]
      const offsetSeed = hashToDeterministic(d.id + 'off', 100) / 100
      const offset = side === 'bottom' ? offsetSeed * 60 + 10 : offsetSeed * 70 + 5
      const colorIdx = hashToDeterministic(d.id + 'col', colors.length)
      const color = colors[colorIdx]

      const item = { id: d.id, path: d.path, placement: { side, offset }, color }
      itemsRef.current.push(item)
      itemsIndex.current[d.id] = true

      // schedule removal
      const t = window.setTimeout(() => {
        // remove from itemsRef in-place to keep other indices stable
        const idx = itemsRef.current.findIndex((it) => it.id === d.id)
        if (idx !== -1) itemsRef.current.splice(idx, 1)
        delete itemsIndex.current[d.id]
        delete timers.current[d.id]
        setTick((v) => v + 1)
      }, TTL)
      timers.current[d.id] = t

      // trigger small re-render to show the new item
      setTick((v) => v + 1)
    })

    // handle server-side deletes: remove any items not present in drawings list
    const present = new Set(drawings.map((d) => d.id))
    for (let i = itemsRef.current.length - 1; i >= 0; i--) {
      const id = itemsRef.current[i].id
      if (!present.has(id)) {
        itemsRef.current.splice(i, 1)
        if (timers.current[id]) {
          clearTimeout(timers.current[id])
          delete timers.current[id]
        }
        delete itemsIndex.current[id]
        setTick((v) => v + 1)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawings, colors])

  useEffect(() => {
    return () => {
      // cleanup timers on unmount
      for (const k of Object.keys(timers.current)) {
        clearTimeout(timers.current[k])
      }
    }
  }, [])

  const items = itemsRef.current

  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      {items.map((it) => {
        const size = 160
        let style: React.CSSProperties = { position: 'absolute', width: size, height: size }
        if (it.placement.side === 'left') {
          style.left = 12
          style.top = `${it.placement.offset}%`
        } else if (it.placement.side === 'right') {
          style.right = 12
          style.top = `${it.placement.offset}%`
        } else {
          style.left = `${it.placement.offset}%`
          style.bottom = 12
        }

        return (
          <div key={it.id} style={style} className="opacity-95">
            <svg viewBox={`0 0 100 100`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
              <g transform="translate(6,6) scale(0.88)">
                <path d={pathFromPoints(it.path)} fill="none" stroke={it.color} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" opacity={0.95} />
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
  const scale = 88
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

