import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

export type ReadDrawing = {
  id: string
  user_id: string | null
  created_at?: string
  path: Array<{ x: number; y: number }>
}

/**
 * useReadDrawings
 * - subscribes to real-time INSERT/DELETE on the `drawings` table
 * - returns an array of ReadDrawing objects (dequantized)
 *
 * options:
 * - quant: number the value was multiplied by when sent (default 100)
 * - roomId: optional filter column (if you add a room column to drawings)
 * - limit: initial query limit
 */
export function useReadDrawings(opts?: { quant?: number; roomId?: string; limit?: number }) {
  const quant = opts?.quant ?? 100
  const roomId = opts?.roomId
  const limit = opts?.limit ?? 50

  const [drawings, setDrawings] = useState<ReadDrawing[]>([])

  useEffect(() => {
    let channel: any
    let mounted = true

    async function fetchInitial() {
      try {
        let query = supabase.from('drawings').select('id,user_id,created_at,data').order('created_at', { ascending: false }).limit(limit)
        if (roomId) {
          query = query.eq('room_id', roomId) as any
        }
        const { data, error } = await query
        if (error) {
          console.error('Error fetching initial drawings:', error.message)
          return
        }

        if (!mounted) return

        const parsed = (data || []).map((r: any) => {
          const pts: Array<{ x: number; y: number }> = []
          try {
            const payload = r.data
            const pairs = payload?.p || []
            for (const pair of pairs) {
              pts.push({ x: pair[0] / quant, y: pair[1] / quant })
            }
          } catch (e) {
            // skip on parse error
          }
          return { id: r.id, user_id: r.user_id ?? null, created_at: r.created_at, path: pts }
        })

        setDrawings(parsed.reverse()) // oldest first
      } catch (err) {
        console.error('Unexpected error fetching drawings:', err)
      }
    }

    fetchInitial()

    channel = supabase
      .channel('realtime-drawings')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'drawings' },
        (payload: any) => {
          try {
            const r = payload.new
            const pairs = r.data?.p || []
            const path = pairs.map((pair: any) => ({ x: pair[0] / quant, y: pair[1] / quant }))
            setDrawings((prev) => [...prev, { id: r.id, user_id: r.user_id ?? null, created_at: r.created_at, path }])
          } catch (e) {
            console.error('Error parsing incoming drawing', e)
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'drawings' },
        (payload: any) => {
          const id = payload.old?.id
          if (!id) return
          setDrawings((prev) => prev.filter((d) => d.id !== id))
        }
      )
      .subscribe()

    return () => {
      mounted = false
      if (channel) supabase.removeChannel(channel)
    }
  }, [quant, roomId, limit])

  return { drawings }
}

export default useReadDrawings
