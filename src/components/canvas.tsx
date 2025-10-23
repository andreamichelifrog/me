import { useEffect, useRef } from 'react'

export default function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const drawing = useRef(false)
  const lastPoint = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // capture non-null locals for handlers
    const canvasEl = canvas
    const ctx2 = ctx

    // scale for devicePixelRatio
    function resize() {
      const dpr = window.devicePixelRatio || 1
      const rect = canvasEl.getBoundingClientRect()
      canvasEl.width = Math.round(rect.width * dpr)
      canvasEl.height = Math.round(rect.height * dpr)
      // reset transform then scale to avoid cumulative scaling on resize
      ctx2.setTransform(1, 0, 0, 1, 0, 0)
      ctx2.scale(dpr, dpr)
      ctx2.lineCap = 'round'
      ctx2.lineJoin = 'round'
      ctx2.lineWidth = 16
      // use theme primary color for stroke (fallback to indigo)
      const primary = getComputedStyle(document.documentElement).getPropertyValue('--primary') || '#1B2FDB'
      ctx2.strokeStyle = primary.trim() || '#1B2FDB'
    }

    resize()

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    function toCanvasPoint(clientX: number, clientY: number) {
      const rect = canvasEl.getBoundingClientRect()
      return { x: clientX - rect.left, y: clientY - rect.top }
    }

    function pointerDown(e: PointerEvent) {
      drawing.current = true
      // cancel any ongoing fade and clear previous drawing
      const dpr = window.devicePixelRatio || 1
      canvasEl.style.transition = 'none'
      canvasEl.style.opacity = '1'
      ctx2.clearRect(0, 0, canvasEl.width / dpr, canvasEl.height / dpr)
      const p = toCanvasPoint(e.clientX, e.clientY)
      lastPoint.current = p
      // start a tiny stroke so tap shows
      ctx2.beginPath()
      ctx2.moveTo(p.x, p.y)
      ctx2.lineTo(p.x + 0.01, p.y + 0.01)
      ctx2.stroke()
    }

    function pointerMove(e: PointerEvent) {
      if (!drawing.current) return
      const p = toCanvasPoint(e.clientX, e.clientY)
      if (!lastPoint.current) lastPoint.current = p
      ctx2.beginPath()
      ctx2.moveTo(lastPoint.current.x, lastPoint.current.y)
      ctx2.lineTo(p.x, p.y)
      ctx2.stroke()
      lastPoint.current = p
    }

    function pointerUp() {
      drawing.current = false
      lastPoint.current = null
      // fade the canvas out, then clear and reset opacity
      const dpr = window.devicePixelRatio || 1
      // ensure transition applies
      canvasEl.style.transition = 'opacity 600ms ease-out'
      // trigger fade
      requestAnimationFrame(() => {
        canvasEl.style.opacity = '0'
      })

      function onTransitionEnd() {
        ctx2.clearRect(0, 0, canvasEl.width / dpr, canvasEl.height / dpr)
        canvasEl.style.transition = 'none'
        canvasEl.style.opacity = '1'
        canvasEl.removeEventListener('transitionend', onTransitionEnd)
      }

      canvasEl.addEventListener('transitionend', onTransitionEnd)
    }

  // pointer events (covers touch & mouse on supporting browsers)
  canvasEl.addEventListener('pointerdown', pointerDown)
  window.addEventListener('pointermove', pointerMove)
  window.addEventListener('pointerup', pointerUp)
  window.addEventListener('pointercancel', pointerUp)

    // fallback for older touch-only environments
    function touchStart(ev: TouchEvent) {
      ev.preventDefault()
      const t = ev.touches[0]
      pointerDown({ clientX: t.clientX, clientY: t.clientY } as PointerEvent)
    }
    function touchMove(ev: TouchEvent) {
      ev.preventDefault()
      const t = ev.touches[0]
      pointerMove({ clientX: t.clientX, clientY: t.clientY } as PointerEvent)
    }
    function touchEnd() {
      pointerUp()
    }
  canvasEl.addEventListener('touchstart', touchStart, { passive: false })
    window.addEventListener('touchmove', touchMove, { passive: false })
    window.addEventListener('touchend', touchEnd)

    return () => {
  ro.disconnect()
  canvasEl.removeEventListener('pointerdown', pointerDown)
      window.removeEventListener('pointermove', pointerMove)
      window.removeEventListener('pointerup', pointerUp)
      window.removeEventListener('pointercancel', pointerUp)
  canvasEl.removeEventListener('touchstart', touchStart)
      window.removeEventListener('touchmove', touchMove)
      window.removeEventListener('touchend', touchEnd)
    }
  }, [])

  return (
    <div className='w-72 h-80 canvas-3d rounded-2xl overflow-hidden touch-none'>
      <canvas ref={canvasRef} className='w-full h-full block' />
    </div>
  )
}
