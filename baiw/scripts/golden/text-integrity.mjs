#!/usr/bin/env node
/**
 * TEXT-INTEGRITY — the text a cell was GIVEN must appear in the content stream.
 *
 *   node scripts/golden/text-integrity.mjs                 all four modules
 *   node scripts/golden/text-integrity.mjs --module dgiw
 *   node scripts/golden/text-integrity.mjs --verbose       every lost cell in full
 *   node scripts/golden/text-integrity.mjs --report        measure, always exit 0
 *
 * ─── WHY THIS IS WRITTEN AGAINST THE SYMPTOM ──────────────────────────────
 *
 * Three separate mechanisms have now silently dropped text from a shipped PDF,
 * and every guard in this repo was written against a MECHANISM:
 *
 *   D-004  doc.text(s, x, y, { maxWidth: n })   jsPDF splits, then draws line 1
 *   D-005  splitTextToSize before setFontSize   wrapped against the wrong size
 *   D-018  autotable cell clipping              cell wider than its column
 *
 *   TEXT-MAXWIDTH  greps for a key D-018 never sets
 *   geometry.mjs   looks for paths PAST the margin; a clipped cell stops SHORT
 *   the baselines   hash whatever came out, so truncated text hashes clean forever
 *
 * All three guards were blind to D-018 and would be blind to a fourth mechanism.
 * This one compares the INPUT to the OUTPUT and names neither: the input side is
 * the generator's own row data, recorded by `autotable-recorder.mjs` in front of
 * the one module that imports jspdf-autotable; the output side is the glyphs
 * `analysePdf()` already reads out of the content stream. It would have caught
 * all three, and it does not have to be told what the fourth will be.
 *
 * ─── WHAT IT CAN AND CANNOT SEE ───────────────────────────────────────────
 *
 * It covers TABLE CELLS ONLY. `text()`, `bullets()`, `keyValueBlock()` and
 * `sectionHeading()` are not recorded, because the recorder sits on the
 * autoTable import rather than on jsPDF. Extending it to those is a strictly
 * additive change to the same comparison; it is not done here because D-018 is
 * a table defect and a guard shipped wider than it was demonstrated is the
 * `FRAMEWORK-COVERAGE` shape.
 *
 * PRESENCE, NOT PLACEMENT. A cell whose text appears somewhere in the document
 * passes even if it was drawn in the wrong column. That is a deliberate floor:
 * losing text is the defect with three instances, and a check that also asserted
 * position would fail on every legitimate reflow.
 *
 * Comparison is whitespace-normalised on both sides, because autotable's
 * `linebreak` splits a cell across several `Tj` runs and the line boundary is
 * not a property of the input.
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  pinEnvironment, parseArgs, createDriver, analysePdf, MODULES, REGISTRY, environmentStamp,
} from './harness.mjs'

pinEnvironment()

const HERE = path.dirname(fileURLToPath(import.meta.url))
const RECORDER = path.join(HERE, 'autotable-recorder.mjs')

const USAGE = `
text-integrity.mjs — assert every table cell's text reaches the content stream

  node scripts/golden/text-integrity.mjs               all four modules
  node scripts/golden/text-integrity.mjs --module dgiw
  node scripts/golden/text-integrity.mjs --verbose     print every lost cell
  node scripts/golden/text-integrity.mjs --report      measure only, exit 0

Exit 1 when any cell's text is missing from the document it was drawn into.
`

// This tool's own flags are stripped before delegating, because harness.mjs's
// parseArgs throws on anything it does not know — which is the right behaviour
// for --module and the wrong place to teach about --verbose.
const argv = process.argv.slice(2)
const VERBOSE = argv.includes('--verbose')
const REPORT_ONLY = argv.includes('--report')
if (argv.includes('--help') || argv.includes('-h')) {
  console.log(USAGE)
  process.exit(0)
}
const { modules: selected } = parseArgs(argv.filter(a => a !== '--verbose' && a !== '--report'))

/**
 * The assertion is on GLYPHS IN ORDER, with all whitespace removed on both
 * sides — not on a whitespace-collapsed substring.
 *
 * Measured reason, not a preference. jsPDF's `splitTextToSize` breaks mid-WORD
 * when a word is wider than its column, so `dataLandscape.ts`'s "Cards &
 * Payments" header comes out as `Cards &` / `Paymen` / `ts` in a 13mm column.
 * Every glyph is on the page and in order; only the line boundaries are not
 * where the input's spaces were. A whitespace-collapsed test called all sixteen
 * of those cells LOST, which is a guard reporting a defect that is not there —
 * the failure mode this repo has hit three times from the other direction.
 *
 * The cost is that a lost SPACE is invisible to this check. That is the right
 * trade: the symptom with three instances is dropped glyphs, and a check that
 * cries wolf on legitimate wrapping is a check people turn off.
 */
const glyphs = s => s.replace(/\s+/g, '')
/** Whitespace-collapsed form, for reporting where a cut fell. */
const norm = s => s.replace(/\s+/g, ' ').trim()

/**
 * Does every glyph of `cell` reach the page, in order?
 *
 * The common case is a contiguous substring of the whole document's glyphs.
 * There is exactly ONE legitimate discontinuity, and it is declared here rather
 * than absorbed by loosening the test: autotable's `rowPageBreak: 'auto'` splits
 * a tall row across a page boundary, so a cell's first lines end page N and its
 * remainder resumes on page N+1 AFTER that page's footer, header chrome and
 * repeated table header. Measured on `haiw/framework-alignment-fw-02-pdf`,
 * CW-H-063 "Infrastructure & Systems / Cybersecurity" — `Infrastructure &
 * Systems /` closes page 6 and `Cybersecurity` opens page 7's table body.
 *
 * The first part is NOT required to end page N: the rest of the row — Share,
 * Rationale — and the footer are drawn after it, so page 6 ends
 * `…Infrastructure & Systems /|15%|The technical control layer…|Page 6 of 8`.
 * An `endsWith` anchor was tried first and rejected that legitimate split.
 *
 * Requiring only "prefix on page N, remainder on page N+1" costs nothing in
 * detection power, which is the point: a cell that was actually CLIPPED has a
 * tail that appears on no page at all, so no split can satisfy this. What the
 * allowance can hide is a cell whose halves both happen to appear on adjacent
 * pages for unrelated reasons — accepted, and stated, because the alternative is
 * a guard that fails on correct output.
 */
function reachesPage(cell, allGlyphs, pageGlyphs) {
  if (allGlyphs.includes(cell)) return true
  for (let i = 0; i < pageGlyphs.length - 1; i++) {
    for (let k = cell.length - 1; k > 0; k--) {
      if (pageGlyphs[i].includes(cell.slice(0, k)) && pageGlyphs[i + 1].includes(cell.slice(k))) return true
    }
  }
  return false
}

/**
 * Longest prefix of `cell` that survives in `haystack`.
 *
 * This is what turns "text is missing" into "text was CUT HERE", which is the
 * difference between a finding a reader can act on and one they have to
 * reproduce by hand. Binary search over the prefix length: a clipped cell shares
 * a long prefix with what was drawn, a genuinely absent one shares almost none.
 */
function survivingPrefix(cell, haystack) {
  if (!cell) return cell
  let lo = 0, hi = cell.length
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2)
    if (haystack.includes(cell.slice(0, mid))) lo = mid
    else hi = mid - 1
  }
  return cell.slice(0, lo)
}

const modules = selected

console.log(environmentStamp())
console.log('TEXT-INTEGRITY — every table cell\'s text must appear in the content stream\n')

/**
 * `generate()` returns a whole module's artefacts at once, so the ledger has to
 * be sectioned DURING generation or every table in the module lands on its first
 * document. `beforeArtefact` is that boundary; `pending` is what the last one
 * drew.
 */
const byArtefact = new Map()
let current = null
let takeTableLedger = () => []

const driver = await createDriver(modules, {
  alias: [{ find: /^jspdf-autotable$/, replacement: RECORDER }],
  beforeArtefact: (mod, spec) => {
    if (current) byArtefact.set(current, takeTableLedger())
    current = `${mod}/${spec.id}`
  },
})
;({ takeTableLedger } = await driver.server.ssrLoadModule(RECORDER))

let totalCells = 0, totalLost = 0, totalTables = 0, totalDocs = 0
const findings = []

try {
  for (const mod of modules) {
    const produced = await driver.generate(mod)
    // Close the last artefact of the module: nothing calls beforeArtefact again.
    if (current) { byArtefact.set(current, takeTableLedger()); current = null }
    for (const { spec, filename, bytes } of produced) {
      const ledger = byArtefact.get(`${mod}/${spec.id}`) ?? []
      if (spec.kind && spec.kind !== 'pdf') {
        // A CSV or markdown artefact draws no tables. Recorded so the summary
        // cannot read as "every artefact was covered" when some carry no PDF.
        if (ledger.length) throw new Error(`${mod}/${spec.id} is ${spec.kind} but drew ${ledger.length} table(s)`)
        continue
      }
      totalDocs++
      const analysis = analysePdf(bytes, driver.ruler)
      // Runs joined with NO separator: a cell wrapped over several lines emits
      // contiguous runs, so its glyphs are contiguous here too.
      const pageGlyphs = analysis.pages.map(p => glyphs(p.text.join('')))
      const stream = pageGlyphs.join('')

      const lost = []
      let cells = 0
      for (const t of ledger) {
        totalTables++
        for (const row of [...t.head, ...t.body]) {
          for (const raw of row) {
            const cell = glyphs(raw)
            if (!cell) continue
            cells++
            if (reachesPage(cell, stream, pageGlyphs)) continue
            const kept = survivingPrefix(cell, stream)
            lost.push({ cell: norm(raw), kept, dropped: cell.slice(kept.length) })
          }
        }
      }
      totalCells += cells
      totalLost += lost.length

      const tag = `${mod}/${spec.id}`
      if (!lost.length) {
        console.log(`  ok    ${tag.padEnd(44)} ${String(cells).padStart(5)} cells in ${String(ledger.length).padStart(2)} table(s)`)
        continue
      }
      const worst = lost.reduce((a, b) => (b.dropped.length > a.dropped.length ? b : a))
      console.log(
        `  LOST  ${tag.padEnd(44)} ${String(lost.length).padStart(5)} of ${cells} cells truncated` +
        ` (worst: ${worst.dropped.length} chars)`,
      )
      findings.push({ module: mod, id: spec.id, filename, cells, tables: ledger.length, lost })
      const show = VERBOSE ? lost : lost.slice(0, 3)
      for (const l of show) {
        console.log(`          kept    "${l.kept}"`)
        console.log(`          DROPPED "${l.dropped}"`)
      }
      if (!VERBOSE && lost.length > show.length) {
        console.log(`          … and ${lost.length - show.length} more (--verbose for all)`)
      }
    }
  }
  driver.assertFixtureDataWasServed()
} finally {
  await driver.close()
}

console.log('')
console.log(`  documents ${totalDocs}   tables ${totalTables}   cells ${totalCells}   cells losing text ${totalLost}`)

// A check that examined nothing is a VACUOUS failure — hard rule 4, applied to a
// harness rather than to a gate class. A run over zero cells prints identically
// to a clean run over 12,000 and must not be allowed to.
if (totalCells === 0) {
  console.log('\n  FAIL — no table cells were examined. The recorder alias is not in front of spine.ts.')
  process.exit(1)
}
if (!totalLost) {
  console.log('\n  PASS — every recorded cell\'s text appears in the document it was drawn into.')
  process.exit(0)
}
console.log(`\n  ${REPORT_ONLY ? 'REPORTED' : 'FAIL'} — ${totalLost} cell(s) across ${findings.length} document(s) lost text between the generator and the page.`)
console.log('  This is D-018 unless a newer mechanism has appeared; see docs/known-defects.md.')
process.exit(REPORT_ONLY ? 0 : 1)
