/**
 * A picture of the plate the viewer shows (AI-4): the figure's SVG with its
 * stylesheet-applied look copied onto every element (a serialized SVG loses
 * the page's CSS), external images (the real BigBrain slice) inlined as data
 * URLs, drawn on the viewer's own background and exported as JPEG.
 */
const PROPS = [
  'fill',
  'fill-opacity',
  'fill-rule',
  'stroke',
  'stroke-width',
  'stroke-opacity',
  'stroke-dasharray',
  'stroke-linejoin',
  'stroke-linecap',
  'opacity',
  'display',
  'visibility',
  'font-size',
  'font-weight',
  'font-family',
  'text-anchor',
  'dominant-baseline',
  'paint-order',
  'filter',
] as const

function inlineStyles(src: Element, dst: Element) {
  const cs = getComputedStyle(src)
  const style = PROPS.map((p) => `${p}:${cs.getPropertyValue(p)}`).join(';')
  dst.setAttribute('style', style)
  // non-scaling strokes keep their screen width only on screen; bake it as is.
  for (let i = 0; i < src.children.length; i++) if (dst.children[i]) inlineStyles(src.children[i], dst.children[i])
}

async function toDataUrl(url: string): Promise<string | null> {
  try {
    const blob = await (await fetch(url)).blob()
    return await new Promise((ok) => {
      const r = new FileReader()
      r.onload = () => ok(String(r.result))
      r.onerror = () => ok(null)
      r.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

/** The visible plate figure, or null when no plate viewer is open. */
export function plateFigure(): SVGSVGElement | null {
  const all = [...document.querySelectorAll<SVGSVGElement>('.section-viewer svg.sv-svg')]
  return all.find((s) => s.getBoundingClientRect().width > 40) ?? null
}

export async function capturePlate(maxSide = 1280): Promise<string | null> {
  const svg = plateFigure()
  if (!svg) return null
  const box = svg.getBoundingClientRect()
  const clone = svg.cloneNode(true) as SVGSVGElement
  inlineStyles(svg, clone)
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('width', String(box.width))
  clone.setAttribute('height', String(box.height))
  for (const img of [...clone.querySelectorAll('image')]) {
    const href = img.getAttribute('href') ?? img.getAttribute('xlink:href')
    if (!href || href.startsWith('data:')) continue
    const data = await toDataUrl(new URL(href, location.href).toString())
    if (data) img.setAttribute('href', data)
  }
  const xml = new XMLSerializer().serializeToString(clone)
  const url = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml' }))
  try {
    const im = new Image()
    await new Promise<void>((ok, no) => {
      im.onload = () => ok()
      im.onerror = () => no(new Error('svg render failed'))
      im.src = url
    })
    const k = Math.min(2, maxSide / Math.max(box.width, box.height))
    const c = document.createElement('canvas')
    c.width = Math.round(box.width * k)
    c.height = Math.round(box.height * k)
    const g = c.getContext('2d')!
    // The viewer's own ground, so the figure reads as on screen (and JPEG has no transparency).
    const host = svg.closest('.sv-figure, .sv-stage, .section-viewer') ?? document.body
    g.fillStyle = getComputedStyle(host).backgroundColor && getComputedStyle(host).backgroundColor !== 'rgba(0, 0, 0, 0)' ? getComputedStyle(host).backgroundColor : '#0e121a'
    g.fillRect(0, 0, c.width, c.height)
    g.drawImage(im, 0, 0, c.width, c.height)
    return c.toDataURL('image/jpeg', 0.9)
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** A user's own picture (an MRI, a textbook figure), downscaled to JPEG. */
export async function captureFile(file: File, maxSide = 1568): Promise<string | null> {
  if (!file.type.startsWith('image/')) return null
  const url = URL.createObjectURL(file)
  try {
    const im = new Image()
    await new Promise<void>((ok, no) => {
      im.onload = () => ok()
      im.onerror = () => no(new Error('image failed'))
      im.src = url
    })
    const k = Math.min(1, maxSide / Math.max(im.naturalWidth, im.naturalHeight))
    const c = document.createElement('canvas')
    c.width = Math.round(im.naturalWidth * k)
    c.height = Math.round(im.naturalHeight * k)
    const g = c.getContext('2d')!
    g.fillStyle = '#fff'
    g.fillRect(0, 0, c.width, c.height)
    g.drawImage(im, 0, 0, c.width, c.height)
    return c.toDataURL('image/jpeg', 0.9)
  } finally {
    URL.revokeObjectURL(url)
  }
}
