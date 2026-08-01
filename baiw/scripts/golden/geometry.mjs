#!/usr/bin/env node
/**
 * Vector geometry audit — what the text harness cannot see.
 *
 * `analysePdf` in harness.mjs measures TEXT RUNS. A filled box drawn past the
 * content column is invisible to it unless a glyph inside that box happens to
 * overflow too. That is exactly how D-006 hid: BAIW's third roadmap phase box
 * ended at 200 mm against a 195 mm column, and only the long title
 * "Phase 3: Advanced Analytics" leaked far enough right to register as a text
 * overflow. TAIW and HAIW had the IDENTICAL grid with shorter titles, so their
 * boxes broke the margin by the same 5 mm and no check in this repo ever
 * noticed. This script found all three on its first run; all three are now fixed
 * and it reports zero paths past the content column across the 23 artefacts.
 *
 * This script reads the same page streams and reports the extent of every drawn
 * PATH. It reports rather than fails: a full-bleed band is legitimate geometry,
 * and only a human can say whether a given shape is meant to respect the text
 * margin. Run it after any change to hand-placed boxes, grids or charts.
 *
 *   node scripts/golden/geometry.mjs                # all PDF artefacts
 *   node scripts/golden/geometry.mjs --module baiw  # one module
 *   node scripts/golden/geometry.mjs --page 15      # one page across modules
 *
 * jsPDF emits no `cm`, `q`/`Q`, `v` or `y` operators, so coordinates are
 * absolute points and no transform stack is needed. Asserted below rather than
 * assumed — if a future jsPDF starts emitting them, this bails loudly instead of
 * reporting confidently wrong numbers.
 */
import fs from 'node:fs'
import path from 'node:path'

import {
  RAW_DIR, MODULES, MARGIN_PT, parseArgs,
  streamRanges, indirectObjects, streamBodyOf,
} from './harness.mjs'

const PT_PER_MM = 72 / 25.4
const round2 = n => Math.round(n * 100) / 100
const mm = pt => round2(pt / PT_PER_MM)

/** Operators that would invalidate the "coordinates are absolute points" assumption. */
const TRANSFORM_OPS = ['cm', 'q', 'Q', 'v', 'y']

/**
 * Every path in one content stream, with its x-extent.
 *
 * A bezier's true extent lies inside the convex hull of its control points, and
 * for the axis-aligned rounded rectangles jsPDF draws, the rightmost control
 * point IS the box edge — so taking the max over all control points is exact
 * here, not an over-estimate.
 */
function readPaths(body) {
  for (const op of TRANSFORM_OPS) {
    if (new RegExp(`(^|[\\s\\n])${op}([\\s\\n]|$)`).test(body)) {
      throw new Error(`content stream uses '${op}' — coordinates are no longer absolute; geometry.mjs needs a transform stack`)
    }
  }

  const paths = []
  let pts = []
  const flush = painter => {
    if (pts.length) paths.push({ painter, xs: pts.map(p => p[0]), ys: pts.map(p => p[1]) })
    pts = []
  }

  // Tokenise: numbers accumulate into an operand stack, letters are operators.
  const tokens = body.split(/[\s\n\r]+/)
  let stack = []
  for (const t of tokens) {
    if (t === '') continue
    if (/^-?[\d.]+$/.test(t)) { stack.push(Number(t)); continue }
    switch (t) {
      case 'm': case 'l':
        if (stack.length >= 2) pts.push([stack[stack.length - 2], stack[stack.length - 1]])
        break
      case 'c':
        // x1 y1 x2 y2 x3 y3 — all three points bound the curve.
        if (stack.length >= 6) {
          const a = stack.slice(-6)
          pts.push([a[0], a[1]], [a[2], a[3]], [a[4], a[5]])
        }
        break
      case 're':
        if (stack.length >= 4) {
          const [x, y, w, h] = stack.slice(-4)
          pts.push([x, y], [x + w, y], [x + w, y + h], [x, y + h])
        }
        break
      case 'f': case 'F': case 'f*': case 'S': case 's':
      case 'B': case 'B*': case 'b': case 'b*': case 'n':
        flush(t)
        break
      case 'h': break            // closepath adds no new point
      default: break             // text and graphics-state operators
    }
    if (!/^-?[\d.]+$/.test(t)) stack = []
  }
  flush('?')
  return paths
}

function pagesOf(buf) {
  const s = buf.toString('latin1')
  const objs = indirectObjects(s, streamRanges(s))

  let kids = null
  for (const [, body] of [...objs].sort((a, b) => a[0] - b[0])) {
    if (!/\/Type\s*\/Pages\b/.test(body)) continue
    const m = /\/Kids\s*\[([^\]]*)\]/.exec(body)
    if (m) { kids = [...m[1].matchAll(/(\d+)\s+0\s+R/g)].map(k => Number(k[1])); break }
  }
  if (!kids?.length) throw new Error('PDF has no /Pages /Kids — cannot establish page order')

  return kids.map(pageObj => {
    const body = objs.get(pageObj) ?? ''
    const contents = Number(/\/Contents\s+(\d+)\s+0\s+R/.exec(body)?.[1])
    const box = /\/MediaBox\s*\[\s*([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s*\]/.exec(body)
    const stream = Number.isFinite(contents) ? streamBodyOf(objs.get(contents) ?? '') : null
    return {
      widthPt: box ? Number(box[3]) : 0,
      paths: stream === null ? [] : readPaths(stream),
    }
  })
}

// `--page` is local to this script; strip it before the shared parser, which
// throws on arguments it does not know rather than ignoring them.
const argv = process.argv.slice(2)
let onlyPage = null
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--page') { onlyPage = Number(argv[i + 1]); argv.splice(i, 2); i-- }
  else if (argv[i].startsWith('--page=')) { onlyPage = Number(argv[i].slice(7)); argv.splice(i, 1); i-- }
}
const only = parseArgs(argv).modules

let overflowing = 0
let fullBleed = 0

for (const module of only) {
  const dir = path.join(RAW_DIR, module)
  if (!fs.existsSync(dir)) continue
  const pdfs = fs.readdirSync(dir).filter(f => f.endsWith('.pdf')).sort()

  for (const file of pdfs) {
    const pages = pagesOf(fs.readFileSync(path.join(dir, file)))
    console.log(`\n${module}/${file}`)
    console.log(`  ${pages.length} pages · content column ends at ${round2(pages[0].widthPt - MARGIN_PT)}pt (${mm(pages[0].widthPt - MARGIN_PT)}mm)`)

    for (const [i, p] of pages.entries()) {
      const pageNo = i + 1
      if (onlyPage && pageNo !== onlyPage) continue
      const contentRight = p.widthPt - MARGIN_PT
      const over = p.paths
        .map(q => ({ ...q, right: Math.max(...q.xs), left: Math.min(...q.xs) }))
        .filter(q => q.right > contentRight + 0.005)
        .sort((a, b) => b.right - a.right)
      if (!over.length) continue

      // A band starting at x=0 and running the full sheet is deliberate cover
      // chrome, not a margin break. Counted separately so it never masks a real one.
      const bleed = over.filter(q => q.left <= 0.005 && q.right >= p.widthPt - 0.005)
      const real = over.filter(q => !bleed.includes(q))
      fullBleed += bleed.length
      overflowing += real.length
      if (!real.length) continue

      console.log(`  page ${String(pageNo).padStart(2)}  ${real.length} path(s) past the content column${bleed.length ? ` (+${bleed.length} full-bleed, ignored)` : ''}`)
      for (const q of real.slice(0, 6)) {
        console.log(
          `      ${q.painter}  x ${mm(q.left).toFixed(2)}..${mm(q.right).toFixed(2)}mm` +
          `   right ${round2(q.right).toFixed(2)}pt   ${round2(q.right - contentRight).toFixed(2)}pt PAST the margin`
        )
      }
    }
  }
}

console.log(`\n${overflowing} path(s) past the content column, ${fullBleed} full-bleed band(s) ignored`)
process.exit(0)
