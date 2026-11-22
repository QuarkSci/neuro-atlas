/**
 * One Euro filter (Casiez, Roussel & Vogel, CHI 2012): a low-pass whose cut-off
 * rises with speed, so a still hand stops shaking while a fast one does not lag.
 */
export class OneEuro {
  private x: number | null = null
  private dx = 0
  private t = 0

  private minCutoff: number
  private beta: number
  private dCutoff: number

  constructor(minCutoff = 1.2, beta = 0.02, dCutoff = 1) {
    this.minCutoff = minCutoff
    this.beta = beta
    this.dCutoff = dCutoff
  }

  private static alpha(cutoff: number, dt: number) {
    const tau = 1 / (2 * Math.PI * cutoff)
    return 1 / (1 + tau / dt)
  }

  reset() {
    this.x = null
  }

  filter(value: number, timeMs: number) {
    if (this.x === null) {
      this.x = value
      this.t = timeMs
      this.dx = 0
      return value
    }
    const dt = Math.max(1e-3, (timeMs - this.t) / 1000)
    this.t = timeMs
    const dx = (value - this.x) / dt
    this.dx += OneEuro.alpha(this.dCutoff, dt) * (dx - this.dx)
    const cutoff = this.minCutoff + this.beta * Math.abs(this.dx)
    this.x += OneEuro.alpha(cutoff, dt) * (value - this.x)
    return this.x
  }
}

/** A filter per coordinate of a 21-point hand. */
export class HandFilter {
  private f: OneEuro[]
  constructor(minCutoff: number, beta: number) {
    this.f = Array.from({ length: 21 * 3 }, () => new OneEuro(minCutoff, beta))
  }
  reset() {
    for (const f of this.f) f.reset()
  }
  apply(pts: { x: number; y: number; z: number }[], t: number) {
    return pts.map((p, i) => ({
      x: this.f[i * 3].filter(p.x, t),
      y: this.f[i * 3 + 1].filter(p.y, t),
      z: this.f[i * 3 + 2].filter(p.z, t),
    }))
  }
}
