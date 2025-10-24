import { useRef, useCallback } from 'react'
import { supabase } from './supabaseClient'

type Point = { x: number; y: number }

/**
 * useDrawing
 * - Collects points (quantized) and sends lightweight payload to Supabase
 * - Auto-deletes the inserted row after `ttl` seconds to avoid DB bloat
 */
export function useDrawing(opts?: { ttlSeconds?: number; quant?: number; minDistance?: number }) {
  // Default options with reasonable fallbacks. The hook consumer can override these.
  const ttlSeconds = opts?.ttlSeconds ?? 5 // keep drawing in DB for 5 seconds by default
  const quant = opts?.quant ?? 100 // quantization factor (100 -> two decimal places when dividing back)
  const minDistance = opts?.minDistance ?? 0.5 // minimum distance in CSS pixels between recorded points

  // Refs are used instead of state for the point buffer because:
  // - We want to mutate the buffer frequently during pointer moves without causing React re-renders.
  // - React state updates are asynchronous and would be inefficient for high-rate input like pointermove.
  const pointsRef = useRef<Point[]>([])
  const lastRef = useRef<Point | null>(null)
  // NOTE: we no longer auto-delete drawings client-side. This hook only collects
  // points and writes the compact payload to the server.

  // start() resets the local buffer before a new stroke. It's memoized with useCallback
  // to keep the identity stable if it is passed around as a prop.
  const start = useCallback(() => {
    pointsRef.current = []
    lastRef.current = null
  }, [])

  // push() adds a sampled (and quantized) point to the buffer.
  // We sample by distance so we avoid recording many near-duplicate points.
  const push = useCallback(
    (p: Point) => {
      const last = lastRef.current
      if (last) {
        const dx = p.x - last.x
        const dy = p.y - last.y
        // If the pointer hasn't moved enough, skip recording this point.
        if (Math.hypot(dx, dy) < minDistance) return
      }
      lastRef.current = p

      // Quantize the point to reduce payload size and noise.
      // For example, with quant=100: a coordinate 12.345 -> Math.round(12.345*100)/100 = 12.35
      const qx = Math.round(p.x * quant) / quant
      const qy = Math.round(p.y * quant) / quant
      pointsRef.current.push({ x: qx, y: qy })
    },
    [minDistance, quant]
  )

  // finishAndSend() compacts the recorded points into a tiny JSON payload and inserts it into Supabase.
  // It also schedules a client-side timeout to delete the row after `ttlSeconds` to keep the DB small.
  const finishAndSend = useCallback(
    async (userId?: string) => {
      const pts = pointsRef.current
      if (!pts || pts.length === 0) return null

      // Compact representation: array of integer pairs [qx, qy].
      // To keep the stored numbers small we multiply by `quant` and store integers.
      const partsArray = pts.map((p) => [Math.round(p.x * quant), Math.round(p.y * quant)])
      const payload = { p: partsArray }

      try {
        // Insert the drawing row and return the inserted id.
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

        // Previously we scheduled a client-side auto-delete here. That behavior
        // has been removed; the server is now responsible for any lifecycle.
        return id
      } catch (err) {
        console.error('Unexpected error sending drawing:', err)
        return null
      } finally {
        // Clear the local buffer immediately to free memory and prepare for the next stroke.
        pointsRef.current = []
        lastRef.current = null
      }
    },
    [quant, ttlSeconds]
  )

  // Return stable references to the API so components can call start/push/finishAndSend.
  return { start, push, finishAndSend }
}

export type { Point }
