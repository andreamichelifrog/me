import { useRef, useCallback } from 'react'
import { supabase } from './supabaseClient'

type Point = { x: number; y: number }

/**
 * useDrawing
 * - Collects points (quantized) and sends lightweight payload to Supabase
 * - Auto-deletes the inserted row after `ttl` seconds to avoid DB bloat
 */
export function useDrawing(opts?: { ttlSeconds?: number; quant?: number; minDistance?: number }) {
  const ttlSeconds = opts?.ttlSeconds ?? 5 // default keep for 5s
  const quant = opts?.quant ?? 100 // quantization factor (100 => two decimal places)
  const minDistance = opts?.minDistance ?? 0.5 // minimum distance (in CSS pixels) between recorded points

  const pointsRef = useRef<Point[]>([])
  const lastRef = useRef<Point | null>(null)
  const pendingTimeouts = useRef<Record<string, number>>({})

  const start = useCallback(() => {
    pointsRef.current = []
    lastRef.current = null
  }, [])

  const push = useCallback((p: Point) => {
    // sample by distance
    const last = lastRef.current
    if (last) {
      const dx = p.x - last.x
      const dy = p.y - last.y
      if (Math.hypot(dx, dy) < minDistance) return
    }
    lastRef.current = p
    // quantize
    const qx = Math.round(p.x * quant) / quant
    const qy = Math.round(p.y * quant) / quant
    pointsRef.current.push({ x: qx, y: qy })
  }, [minDistance, quant])

  const finishAndSend = useCallback(async (userId?: string) => {
    const pts = pointsRef.current
    if (!pts || pts.length === 0) return null

    // compact JSON representation: array of [qx,qy] pairs (integers)
    const partsArray = pts.map((p) => [Math.round(p.x * quant), Math.round(p.y * quant)])
    const payload = { p: partsArray }

    try {
      const { data, error } = await supabase
        .from('drawings')
        .insert([{ data: payload, user_id: userId ?? null }])
        .select('id')
        .maybeSingle()

      if (error) {
        console.error('Error inserting drawing:', error.message)
        return null
      }

      const id = (data as any)?.id
      if (!id) return null

      // schedule delete after ttlSeconds
      const timeoutId = window.setTimeout(async () => {
        try {
          await supabase.from('drawings').delete().eq('id', id)
        } catch (e) {
          console.error('Failed to auto-delete drawing', e)
        }
        delete pendingTimeouts.current[id]
      }, ttlSeconds * 1000)

      pendingTimeouts.current[id] = timeoutId
      return id
    } catch (err) {
      console.error('Unexpected error sending drawing:', err)
      return null
    } finally {
      // clear local buffer immediately
      pointsRef.current = []
      lastRef.current = null
    }
  }, [quant, ttlSeconds])

  const cancelPendingDelete = useCallback((id: string) => {
    const t = pendingTimeouts.current[id]
    if (t) {
      clearTimeout(t)
      delete pendingTimeouts.current[id]
    }
  }, [])

  return { start, push, finishAndSend, cancelPendingDelete }
}

export type { Point }
