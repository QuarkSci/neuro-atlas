#!/usr/bin/env node
/**
 * Prints CSS `linear()` easings sampled from a real damped spring, plus the
 * settle time to use as the duration. A cubic-bezier can only fake one
 * overshoot; a spring settles the way the system's Liquid Glass motion does.
 *
 *   node scripts/gen-spring.mjs [response damping name]...
 *   node scripts/gen-spring.mjs 0.38 0.74 glide 0.5 0.55 pop
 *
 * Model (SwiftUI's `spring(response:dampingFraction:)`): ω = 2π / response, ζ = damping.
 * Unit step response of x'' + 2ζω x' + ω² x = ω² for ζ < 1.
 */
const args = process.argv.slice(2)
const defs = args.length
  ? Array.from({ length: args.length / 3 }, (_, i) => ({ response: +args[i * 3], zeta: +args[i * 3 + 1], name: args[i * 3 + 2] }))
  : [
      { response: 0.34, zeta: 0.78, name: 'glide' }, // selection capsule, menus
      { response: 0.42, zeta: 0.58, name: 'pop' }, // press release, knobs
    ]

const step = (t, w, z) => {
  const wd = w * Math.sqrt(1 - z * z)
  return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + ((z * w) / wd) * Math.sin(wd * t))
}

for (const d of defs) {
  const w = (2 * Math.PI) / d.response
  // Settle: last time the curve is further than 0.2 % from 1.
  let settle = 0
  for (let t = 0; t < 4; t += 0.002) if (Math.abs(step(t, w, d.zeta) - 1) > 0.002) settle = t
  settle = Math.ceil(settle * 100) / 100
  const n = 36
  const pts = []
  for (let i = 0; i <= n; i++) {
    // Denser at the start where the curve moves fastest.
    const u = (i / n) ** 1.35
    const y = step(u * settle, w, d.zeta)
    pts.push(`${y.toFixed(4).replace(/0+$/, '').replace(/\.$/, '')} ${(u * 100).toFixed(2).replace(/0+$/, '').replace(/\.$/, '')}%`)
  }
  let peak = 0
  for (let t = 0; t < settle; t += 0.002) peak = Math.max(peak, step(t, w, d.zeta))
  console.log(`/* ${d.name}: response ${d.response}s, damping ${d.zeta}, overshoot ${((peak - 1) * 100).toFixed(1)} %, settles in ${settle}s */`)
  console.log(`--lg-${d.name}: linear(${pts.join(', ')});`)
  console.log(`--lg-${d.name}-t: ${settle}s;`)
}
