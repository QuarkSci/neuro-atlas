import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react'

/**
 * The Liquid Glass selection indicator: one capsule that rests behind the
 * active item, glides to the next one instead of blinking between them, and
 * — while a finger is down — swells into a clear lens that follows the
 * pointer and enlarges the item it is over. Releasing over another item
 * selects it, so a tab strip can be scrubbed as well as tapped.
 *
 * The container must be positioned and hold a `<span class="lens-blob">`
 * (pass its ref); items are matched by `itemSelector`, the resting one by
 * `.active`. Everything is written straight to style — no React state, the
 * blob moves every pointer event.
 */
export function useLens(containerRef: RefObject<HTMLElement | null>, blobRef: RefObject<HTMLElement | null>, itemSelector: string, axis: 'x' | 'y' = 'x') {
  const held = useRef(false)

  const place = (blob: HTMLElement, item: HTMLElement) => {
    blob.style.setProperty('--bx', `${item.offsetLeft}px`)
    blob.style.setProperty('--by', `${item.offsetTop}px`)
    blob.style.setProperty('--bw', `${item.offsetWidth}px`)
    blob.style.setProperty('--bh', `${item.offsetHeight}px`)
  }

  const rest = () => {
    const box = containerRef.current
    const blob = blobRef.current
    if (!box || !blob || held.current) return
    const active = box.querySelector<HTMLElement>(`${itemSelector}.active`)
    if (!active || active.offsetWidth === 0) {
      blob.classList.remove('shown')
      return
    }
    // First appearance: land in place instead of flying in from the corner.
    const first = !blob.classList.contains('shown')
    if (first) blob.style.transition = 'none'
    place(blob, active)
    blob.classList.add('shown')
    if (first) {
      void blob.offsetWidth
      blob.style.transition = ''
    }
  }

  // After every render: the active item, or its size (language switch), may have changed.
  useLayoutEffect(rest)

  useEffect(() => {
    const box = containerRef.current
    const blob = blobRef.current
    if (!box || !blob) return
    const items = () => Array.from(box.querySelectorAll<HTMLElement>(itemSelector)).filter((n) => !(n as HTMLButtonElement).disabled && n.offsetWidth > 0)
    const nearest = (e: PointerEvent): HTMLElement | undefined => {
      const rect = box.getBoundingClientRect()
      const p = axis === 'x' ? e.clientX - rect.left : e.clientY - rect.top
      let best: HTMLElement | undefined
      let bestD = Infinity
      for (const n of items()) {
        const c = axis === 'x' ? n.offsetLeft + n.offsetWidth / 2 : n.offsetTop + n.offsetHeight / 2
        const d = Math.abs(c - p)
        if (d < bestD) [best, bestD] = [n, d]
      }
      return best
    }
    let downItem: HTMLElement | undefined
    let hover: HTMLElement | undefined
    let moved = false
    let start = 0

    const setHover = (n?: HTMLElement) => {
      if (hover === n) return
      hover?.classList.remove('lens-over')
      hover = n
      hover?.classList.add('lens-over')
    }
    const onMove = (e: PointerEvent) => {
      const pos = axis === 'x' ? e.clientX : e.clientY
      if (!moved && Math.abs(pos - start) < 4) return
      moved = true
      const rect = box.getBoundingClientRect()
      const n = nearest(e)
      if (!n) return
      setHover(n)
      // Follow the finger along the strip, sized to the item underneath.
      blob.style.setProperty('--bw', `${n.offsetWidth}px`)
      blob.style.setProperty('--bh', `${n.offsetHeight}px`)
      if (axis === 'x') {
        const x = Math.max(0, Math.min(e.clientX - rect.left - n.offsetWidth / 2, box.clientWidth - n.offsetWidth))
        blob.style.setProperty('--bx', `${x}px`)
        blob.style.setProperty('--by', `${n.offsetTop}px`)
      } else {
        const y = Math.max(0, Math.min(e.clientY - rect.top - n.offsetHeight / 2, box.clientHeight - n.offsetHeight))
        blob.style.setProperty('--by', `${y}px`)
        blob.style.setProperty('--bx', `${n.offsetLeft}px`)
      }
    }
    const onUp = (e: PointerEvent) => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      const target = moved && e.type === 'pointerup' ? nearest(e) : undefined
      held.current = false
      blob.classList.remove('held', 'drag')
      setHover(undefined)
      // A release on the item that was pressed is an ordinary click; only a
      // scrub that ended elsewhere has to be turned into one here.
      if (target && target !== downItem) target.click()
      requestAnimationFrame(rest)
    }
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return
      const item = (e.target as HTMLElement).closest<HTMLElement>(itemSelector)
      if (!item || !box.contains(item) || (item as HTMLButtonElement).disabled) return
      downItem = item
      moved = false
      start = axis === 'x' ? e.clientX : e.clientY
      held.current = true
      place(blob, item)
      blob.classList.add('shown', 'held')
      setHover(item)
      // Let the glide to the pressed item finish before pointer-tracking takes over.
      window.setTimeout(() => held.current && blob.classList.add('drag'), 220)
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
      window.addEventListener('pointercancel', onUp)
    }
    box.addEventListener('pointerdown', onDown)
    const sizes = new ResizeObserver(rest)
    sizes.observe(box)
    return () => {
      box.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      sizes.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemSelector, axis])
}
