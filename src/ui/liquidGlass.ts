/**
 * Liquid Glass refraction.
 *
 * CSS alone can frost and tint what is behind an element, but it cannot bend
 * it — and the bending at the rim is what makes Apple's material read as a
 * thick piece of glass rather than a blurred card. Chromium accepts an SVG
 * filter as a `backdrop-filter`, so for every `.lens` element we build a
 * displacement map that matches its exact size and corner radius and hand it
 * over through the `--lg-url` custom property. Other engines never get the
 * `lg-on` class and keep the plain frosted material from index.css.
 *
 * The map is flat in the middle and bends inwards across a bezel band. Only
 * top-level glass gets one: a filter on a child of filtered glass sees just
 * its parent's (mostly transparent) content and paints the bent copy over
 * the original, doubling it — so the selection lens enlarges its item with
 * a plain CSS scale instead (see `useLens.ts`).
 */

const SVG_NS = 'http://www.w3.org/2000/svg'
const SELECTOR = '.lens'

interface Entry {
  key: string
}

const supported = (): boolean => {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  // Blink only: WebKit and Gecko parse `backdrop-filter: url()` but render nothing.
  return /Chrome\//.test(ua) && !/Firefox\//.test(ua)
}

/** Signed distance to a rounded rectangle plus the outward normal at that point. */
function roundedRect(px: number, py: number, hw: number, hh: number, r: number): [number, number, number] {
  const qx = Math.abs(px) - (hw - r)
  const qy = Math.abs(py) - (hh - r)
  const sx = px < 0 ? -1 : 1
  const sy = py < 0 ? -1 : 1
  if (qx > 0 && qy > 0) {
    const len = Math.hypot(qx, qy) || 1
    return [len - r, (qx / len) * sx, (qy / len) * sy]
  }
  if (qx > qy) return [qx - r, sx, 0]
  return [qy - r, 0, sy]
}

/**
 * Paint the displacement map: R carries the x offset, G the y offset, 128 is
 * "no shift". The offset points inwards, so the rim shows content pulled
 * from deeper inside the shape — the squeeze a convex glass edge produces.
 */
function buildMap(w: number, h: number, r: number): string {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  const img = ctx.createImageData(w, h)
  const hw = w / 2
  const hh = h / 2
  const half = Math.min(hw, hh)
  const bezel = Math.max(5, Math.min(half * 0.82, 15))
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const [sd, nx, ny] = roundedRect(x + 0.5 - hw, y + 0.5 - hh, hw, hh, r)
      const depth = -sd // distance inside the edge
      let mag = 0
      if (depth < bezel) {
        const t = Math.max(0, depth) / bezel // 0 at the edge → 1 where the glass turns flat
        // Circular bezel profile: steep at the very edge, easing to flat.
        mag = 1 - Math.sqrt(1 - (1 - t) * (1 - t))
      }
      const i = (y * w + x) * 4
      img.data[i] = Math.round(128 - nx * mag * 127)
      img.data[i + 1] = Math.round(128 - ny * mag * 127)
      img.data[i + 2] = 128
      img.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  return canvas.toDataURL('image/png')
}

function el<K extends keyof SVGElementTagNameMap>(name: K, attrs: Record<string, string | number>): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVG_NS, name)
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v))
  return node
}

/**
 * One filter per size: displace the backdrop three times with slightly
 * different strengths, keep one colour channel of each, and add them back
 * together. The mismatch between channels is the chromatic fringe at the rim.
 */
function buildFilter(id: string, w: number, h: number, r: number): SVGFilterElement {
  const half = Math.min(w, h) / 2
  const scale = Math.max(10, Math.min(half * 1.5, 34))
  const spread = 0.1
  const filter = el('filter', { id, x: 0, y: 0, width: w, height: h, filterUnits: 'userSpaceOnUse', 'color-interpolation-filters': 'sRGB' })
  const image = el('feImage', { x: 0, y: 0, width: w, height: h, result: 'map', preserveAspectRatio: 'none' })
  image.setAttribute('href', buildMap(w, h, r))
  filter.appendChild(image)
  const channels: [string, number, string][] = [
    ['r', 1, '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0'],
    ['g', 1 - spread, '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0'],
    ['b', 1 - spread * 2, '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0'],
  ]
  for (const [name, k, matrix] of channels) {
    filter.appendChild(el('feDisplacementMap', { in: 'SourceGraphic', in2: 'map', scale: scale * k, xChannelSelector: 'R', yChannelSelector: 'G', result: `d${name}` }))
    filter.appendChild(el('feColorMatrix', { in: `d${name}`, type: 'matrix', values: matrix, result: name }))
  }
  filter.appendChild(el('feBlend', { in: 'r', in2: 'g', mode: 'screen', result: 'rg' }))
  filter.appendChild(el('feBlend', { in: 'rg', in2: 'b', mode: 'screen' }))
  return filter
}

let installed = false

/** Start refracting every `.lens` element, now and as they mount. */
export function installLiquidGlass(): void {
  if (installed || typeof document === 'undefined' || !supported()) return
  installed = true

  const defs = el('svg', { width: 0, height: 0, 'aria-hidden': 'true' })
  defs.style.cssText = 'position:absolute;width:0;height:0;pointer-events:none'
  document.body.appendChild(defs)
  document.documentElement.classList.add('lg-on')

  const entries = new Map<Element, Entry>()
  const uses = new Map<string, number>()

  const release = (key: string) => {
    const n = (uses.get(key) ?? 1) - 1
    if (n > 0) return void uses.set(key, n)
    uses.delete(key)
    defs.querySelector(`#${key}`)?.remove()
  }

  const update = (node: HTMLElement) => {
    const w = node.offsetWidth
    const h = node.offsetHeight
    const entry = entries.get(node)
    if (!entry) return
    if (w < 8 || h < 8) return // hidden; keep whatever it had
    const r = Math.round(Math.min(parseFloat(getComputedStyle(node).borderTopLeftRadius) || 0, w / 2, h / 2))
    const key = `lg-${w}x${h}r${r}`
    if (key === entry.key) return
    if (!uses.has(key)) defs.appendChild(buildFilter(key, w, h, r))
    uses.set(key, (uses.get(key) ?? 0) + 1)
    if (entry.key) release(entry.key)
    entry.key = key
    node.style.setProperty('--lg-url', `url(#${key})`)
  }

  const sizes = new ResizeObserver((records) => {
    for (const rec of records) update(rec.target as HTMLElement)
  })

  let queued = false
  const scan = () => {
    queued = false
    const live = new Set(document.querySelectorAll<HTMLElement>(SELECTOR))
    for (const node of live) {
      if (entries.has(node)) continue
      entries.set(node, { key: '' })
      sizes.observe(node)
      update(node)
    }
    for (const [node, entry] of entries) {
      if (live.has(node as HTMLElement)) continue
      sizes.unobserve(node)
      if (entry.key) release(entry.key)
      entries.delete(node)
    }
  }
  new MutationObserver(() => {
    if (queued) return
    queued = true
    requestAnimationFrame(scan)
  }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] })
  scan()
}
