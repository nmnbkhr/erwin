#!/usr/bin/env node
/**
 * Walk a module's diff page by page, so a migration can be reviewed rather than
 * merely detected.
 *
 *   node scripts/golden/walk.mjs --module baiw
 *
 * WHY THIS EXISTS SEPARATELY FROM compare.mjs
 * -------------------------------------------
 * compare.mjs answers "did anything change?" and prints the changed fields. That
 * is the right shape for a review tool and the wrong shape for the question D2
 * actually has to answer, which is "does every glyph that moved have a named
 * reason?". Reconciling a whole-document `glyphCount 13133 -> 13042` against
 * eighteen pages of text arrays by eye is how a real regression hides inside an
 * expected one.
 *
 * This was written by hand three times — once per module migrated in D2 — and
 * thrown away twice. It is committed on the third writing because the numbers it
 * produces are the deliverable of every remaining D2 step, including the
 * re-baseline.
 *
 * WHAT IT REPORTS, and why each one is here
 * -----------------------------------------
 *  - Per-page glyph and run deltas that must SUM to the document totals. An
 *    unreconciled remainder is the finding.
 *  - Every right-edge extent that moved, with the widest run either side. This
 *    is how D-002 was found: text drawn past the paper edge is invisible in a
 *    text dump and obvious in a coordinate.
 *  - Runs past the margin and past the paper, before and after. Extent alone
 *    understates a page where one long run was replaced by two short ones.
 *  - A reassembly check on every page whose runs changed: concatenating the
 *    page's runs, whitespace-normalised, must be IDENTICAL before and after
 *    unless text was genuinely added or removed. That is the check that
 *    separates "the line rewrapped" from "the line lost its tail" — D-004 was
 *    invisible to every geometry metric and showed up only here.
 *  - The ellipsis sweep: fitOneLine() marks a cut with U+2026, so any new one is
 *    text the spine decided would not fit.
 *
 * It reads the committed baseline for the BEFORE side and recaptures for the
 * AFTER side. It writes nothing and asserts nothing — exit code is 0 unless the
 * capture itself fails. Deciding whether a named change is acceptable is the
 * reviewer's job, which is the same reason compare.mjs is not a gate.
 */

import { readFileSync, existsSync } from 'node:fs'
import {
  pinEnvironment, parseArgs, createDriver, analyse, assertNonEmpty, baselinePath, REGISTRY,
} from './harness.mjs'

pinEnvironment()

const USAGE = `
walk.mjs — page-by-page reconciliation of a module's diff against its baseline

  node scripts/golden/walk.mjs --module baiw

Prints per-page glyph/run deltas, right-edge movement, overflow counts and a
text-reassembly check. Reads baselines; never writes them.
`.trim()

const args = parseArgs(process.argv.slice(2))
if (args.help) { console.log(USAGE); process.exit(0) }

const TTY = process.stdout.isTTY && !process.env.NO_COLOR
const c = (code, s) => (TTY ? `[${code}m${s}[0m` : s)
const BOLD = s => c('1', s)
const DIM = s => c('2', s)
const RED = s => c('31', s)
const GREEN = s => c('32', s)
const YELLOW = s => c('33', s)

const RULE = '─'.repeat(78)
const sign = n => (n > 0 ? `+${n}` : String(n))
const pad = (s, n) => String(s).padStart(n)

/**
 * Page chrome, which legitimately CHANGES POSITION in the run order under the
 * spine and must not be mistaken for content moving.
 *
 * Pre-spine, `addHeaderFooter()` painted header and footer before the page's
 * content, so all four chrome runs led every page. The spine paints the header
 * at `page()` and stamps the footers last, in `build()`, precisely so `of N` is
 * the real page count — which puts the two footer runs at the END of every page.
 * The reassembly check below is order-sensitive on purpose (that is what makes
 * it able to tell a rewrap from a truncation), so the chrome is removed from
 * both sides first. It is compared separately, by page, above.
 */
const CHROME = [
  /^Page \d+ of \d+$/,
  /^Prepared by Godaitec \| godai\.tech$/,
  /^Powered by /,
]

/**
 * Everything a page's CONTENT says, with whitespace collapsed.
 *
 * Line breaks introduced by wrapping are exactly what this must NOT see: a run
 * split into two is the same sentence, and joining with a single space makes
 * "…Royal Customs" + "(JKDM))…" compare equal to the unwrapped original. A run
 * that lost its tail does not — which is how D-004 was caught.
 *
 * The header's left run is "<org> — <title>" and matches no fixed pattern, so it
 * is identified POSITIONALLY: first run of a content page. An `/ — /` rule was
 * tried first and was wrong — it silently ate BAIW's page-18 methodology bullets
 * and its cover subtitle, both of which carry an em dash, and a reassembly check
 * that drops the text it is meant to be counting is worse than no check. Page 1
 * is the cover and carries no chrome at all.
 */
function reassemble(runs, pageNo) {
  const body = pageNo === 1
    ? runs
    : runs.filter((t, i) => !(i === 0 && / — /.test(t)) && !CHROME.some(re => re.test(t)))
  return body.join(' ').replace(/\s+/g, ' ').trim()
}

const ELLIPSIS = /…/

function walkPdf(id, before, after) {
  console.log(BOLD(`${id}`))

  // ── document scalars ──
  const scalars = [
    ['pages', before.pageCount, after.pageCount],
    ['glyphs', before.glyphCount, after.glyphCount],
    ['runs', before.textRunCount, after.textRunCount],
    ['table rows', before.tableRowsTotal, after.tableRowsTotal],
    ['bytes', before.bytes, after.bytes],
  ]
  for (const [label, b, a] of scalars) {
    const moved = b !== a
    const delta = typeof b === 'number' && typeof a === 'number' ? ` (${sign(a - b)})` : ''
    console.log(`  ${label.padEnd(11)} ${pad(b, 7)} -> ${pad(a, 7)}${moved ? YELLOW(delta) : DIM('  held')}`)
  }

  if (before.pageCount !== after.pageCount) {
    console.log(RED('  page count moved — the per-page table below aligns by index and may mislead'))
  }

  // ── per-page reconciliation ──
  console.log(`\n  ${DIM('page  glyphΔ   runΔ   rightEdge (pt)        pastMargin  runs>margin  runs>paper')}`)
  let glyphSum = 0, runSum = 0
  const n = Math.max(before.pageCount, after.pageCount)
  const notes = []
  for (let i = 0; i < n; i++) {
    const b = before.pages[i], a = after.pages[i]
    if (!b || !a) { console.log(RED(`  ${pad(i + 1, 4)}  page present on only one side`)); continue }
    const dg = a.glyphs - b.glyphs, dr = a.textRuns - b.textRuns
    glyphSum += dg; runSum += dr
    const edgeMoved = b.rightEdgePt !== a.rightEdgePt
    const edge = `${pad(b.rightEdgePt, 7)} -> ${pad(a.rightEdgePt, 7)}`
    const line =
      `  ${pad(i + 1, 4)}  ${pad(sign(dg), 6)} ${pad(sign(dr), 6)}   ${edgeMoved ? YELLOW(edge) : DIM(edge)}` +
      `   ${pad(b.pastMarginPt, 5)}->${pad(a.pastMarginPt, 5)}` +
      `   ${pad(b.runsPastMargin, 5)}->${pad(a.runsPastMargin, 5)}` +
      `   ${pad(b.runsPastPaper, 4)}->${pad(a.runsPastPaper, 4)}`
    console.log(line)

    if (a.pastMarginPt > 0 || b.pastMarginPt > 0) {
      notes.push(
        `page ${i + 1} widest run  before ${JSON.stringify(b.widestText)} @ ${b.rightEdgePt}pt` +
        `\n              after  ${JSON.stringify(a.widestText)} @ ${a.rightEdgePt}pt`,
      )
    }

    // Reassembly: the one check that catches silently discarded text.
    const rb = reassemble(b.text, i + 1), ra = reassemble(a.text, i + 1)
    if (rb !== ra) {
      const lost = rb.length - ra.length
      notes.push(
        `page ${i + 1} TEXT NOT IDENTICAL after reassembly — ${sign(-lost)} characters` +
        `\n              ${lost > 0 ? RED('content is missing or reordered') : YELLOW('content was added or reordered')}` +
        `\n              before: ${JSON.stringify(rb.slice(0, 110))}` +
        `\n              after : ${JSON.stringify(ra.slice(0, 110))}`,
      )
    }

    const eb = b.text.filter(t => ELLIPSIS.test(t))
    const ea = a.text.filter(t => ELLIPSIS.test(t))
    if (ea.length !== eb.length) {
      notes.push(`page ${i + 1} ellipsis runs ${eb.length} -> ${ea.length} — ${JSON.stringify(ea)}`)
    }
  }

  const dgTotal = after.glyphCount - before.glyphCount
  const drTotal = after.textRunCount - before.textRunCount
  const ok = glyphSum === dgTotal && runSum === drTotal
  console.log(
    `  ${' '.repeat(4)}  ${pad(sign(glyphSum), 6)} ${pad(sign(runSum), 6)}   ` +
    (ok ? GREEN(`reconciles with the document totals (${sign(dgTotal)} / ${sign(drTotal)})`)
        : RED(`DOES NOT reconcile — document says ${sign(dgTotal)} / ${sign(drTotal)}`)),
  )

  if (notes.length) {
    console.log(`\n  ${BOLD('per-page notes')}`)
    for (const nn of notes) console.log(`    ${nn}`)
  }

  // ── whole-document overflow inventory ──
  const sum = (pages, k) => pages.reduce((t, p) => t + p[k], 0)
  console.log(
    `\n  overflow   runs past margin ${sum(before.pages, 'runsPastMargin')} -> ${sum(after.pages, 'runsPastMargin')}` +
    `   runs past paper ${sum(before.pages, 'runsPastPaper')} -> ${sum(after.pages, 'runsPastPaper')}`,
  )
  console.log(`  filename   ${before.filename}\n             -> ${after.filename}`)
  console.log()
}

function walkText(id, before, after) {
  console.log(BOLD(`${id}`))
  for (const k of ['lineCount', 'headingCount', 'rowCount', 'columnCount', 'bytes']) {
    if (before[k] === undefined && after[k] === undefined) continue
    const moved = before[k] !== after[k]
    console.log(`  ${k.padEnd(12)} ${pad(before[k], 7)} -> ${pad(after[k], 7)}${moved ? YELLOW('  moved') : DIM('  held')}`)
  }
  const bh = before.headings ?? [], ah = after.headings ?? []
  for (let i = 0; i < Math.max(bh.length, ah.length); i++) {
    if (bh[i] !== ah[i]) console.log(`  heading ${i}\n    - ${JSON.stringify(bh[i])}\n    + ${JSON.stringify(ah[i])}`)
  }
  console.log(`  filename   ${before.filename}\n             -> ${after.filename}\n`)
}

// ── run ──────────────────────────────────────────────────────────────────

const module = args.modules.length === 1 ? args.modules[0] : null
if (!module) {
  console.error('walk.mjs takes exactly one --module; a reconciliation is per document.')
  process.exit(2)
}

const driver = await createDriver([module])
try {
  const produced = await driver.generate(module)
  driver.assertFixtureDataWasServed()

  console.log(`\n${RULE}\nwalk ${module} — baseline vs fresh capture\n${RULE}\n`)

  for (const artefact of produced) {
    const id = artefact.spec.id
    const p = baselinePath(module, id)
    if (!existsSync(p)) { console.log(`${id}: no baseline at ${p} — nothing to walk against\n`); continue }
    const before = JSON.parse(readFileSync(p, 'utf8'))
    const after = analyse(artefact, driver.ruler)
    assertNonEmpty(`${module}/${id}`, after)

    if (before.kind !== after.kind) { console.log(RED(`${id}: kind changed ${before.kind} -> ${after.kind}\n`)); continue }
    if (after.kind === 'pdf') walkPdf(`${module}/${id}`, before, after)
    else walkText(`${module}/${id}`, before, after)
  }

  const declared = REGISTRY[module].artefacts.length
  console.log(`${RULE}\n${produced.length} of ${declared} declared artefact(s) walked. Nothing was written.\n`)
} finally {
  await driver.close()
}
