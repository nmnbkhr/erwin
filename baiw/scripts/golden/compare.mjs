#!/usr/bin/env node
/**
 * Recapture the nine artefacts and diff them against the committed baselines.
 *
 *   node scripts/golden/compare.mjs [--module baiw|taiw|haiw]
 *
 * THIS IS A REVIEW TOOL, NOT A GATE. It is deliberately not wired into
 * `npm run build`. D2 migrates these generators onto src/report/ and will
 * legitimately change their output — pagination, maxWidth wrapping, real page
 * counts replacing the hardcoded 18, and new filenames from reportFilename().
 * A clean diff after D2 would mean the migration did nothing.
 *
 * So the output is optimised for one judgement: is this change the bug fix, or
 * is it a regression? Findings are classified rather than merely listed:
 *
 *   FAIL      the harness's own control broke — trust the harness less, not the
 *             generator (see the haiw/gap-csv note in README.md)
 *   NEW       an artefact this run produced and no baseline covers. Nothing was
 *             verified about it — see below.
 *   ORPHANED  a baseline on disk this run produced no artefact for. Nothing was
 *             verified about it either, from the other side.
 *   CHANGED   a real difference. Read it and decide.
 *   EXPECTED  a difference D2 is known to cause (filenames). Not red.
 *   SKIPPED   a field this harness declared unassertable. Never silently ignored.
 *   INFO      clock-derived values that move on their own (rendered dates).
 *
 * Exit code is 1 when anything is FAIL, NEW, ORPHANED or CHANGED, 0 otherwise.
 * After D2 that exit 1 is the expected outcome and means "go read the report",
 * not "revert".
 *
 * ─── NEW IS A FINDING, NOT A CRASH ─────────────────────────────────────────
 *
 * A missing baseline used to `throw`, which aborted the run at the first unseen
 * artefact and made every LATER artefact's diff invisible until you captured.
 * Adding a fixture is a normal act — D4 added four — and the tool failing hardest
 * on the normal act pushed the operator toward `capture --accept` to see the rest
 * of the report, which is precisely the unwalked freeze capture.mjs was hardened
 * against. It also made the two halves of the harness disagree: capture.mjs
 * classifies NEW and ORPHANED and refuses; compare.mjs crashed on one and could
 * not see the other at all.
 *
 * So both are findings now. The run completes, every other artefact is still
 * diffed, and the exit code is still non-zero — because an artefact nobody has a
 * baseline for has been verified exactly as much as one nobody ran.
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs'
import path from 'node:path'
import {
  pinEnvironment, environmentStamp, parseArgs, createDriver, analyse, assertNonEmpty,
  baselinePath, splitCsvRow, SKIP_TOKEN, MARGIN_MM, REGISTRY, BASELINE_DIR,
  stableJson, environmentVars,
} from './harness.mjs'

pinEnvironment()

const USAGE = `
compare.mjs — diff a fresh capture against the committed golden baselines

  node scripts/golden/compare.mjs                    all three modules
  node scripts/golden/compare.mjs --module taiw      one module

Exit 1 when anything is CHANGED, FAIL, NEW or ORPHANED. A NEW artefact (no
baseline) and an ORPHANED baseline (no artefact) are findings, not crashes: the
run completes so the rest of the diff stays visible. Run capture.mjs to accept
new output, but read this report first.
`.trim()

const args = parseArgs(process.argv.slice(2))
if (args.help) { console.log(USAGE); process.exit(0) }

// ── Presentation ─────────────────────────────────────────────────────────

const TTY = process.stdout.isTTY && !process.env.NO_COLOR
const c = (code, s) => (TTY ? `\u001b[${code}m${s}\u001b[0m` : s)
const RED = s => c('31', s)
const YELLOW = s => c('33', s)
const GREEN = s => c('32', s)
const BLUE = s => c('36', s)
const DIM = s => c('2', s)
const BOLD = s => c('1', s)

const SEVERITY = {
  FAIL: { rank: 6, paint: RED },
  // Above CHANGED on purpose. A CHANGED artefact was measured and disagreed; a
  // NEW or ORPHANED one was not measured at all, and unmeasured outranks wrong.
  NEW: { rank: 5, paint: RED },
  ORPHANED: { rank: 4, paint: RED },
  CHANGED: { rank: 3, paint: YELLOW },
  SKIPPED: { rank: 2, paint: BLUE },
  EXPECTED: { rank: 1, paint: BLUE },
  INFO: { rank: 0, paint: DIM },
}

const RULE = '─'.repeat(78)
const num = n => (typeof n === 'number' ? n.toLocaleString('en-US') : String(n))
const delta = (a, b) => (typeof a === 'number' && typeof b === 'number' ? ` (${b - a >= 0 ? '+' : ''}${b - a})` : '')

// ── Array diff (LCS) for per-page text ───────────────────────────────────
// Pages carry a few dozen runs, so a plain DP is fine and has no dependency.

function diffArrays(a, b) {
  const CAP = 1200
  if (a.length > CAP || b.length > CAP) {
    // Degrade to positional comparison rather than burning quadratic time.
    const ops = []
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      if (a[i] === b[i]) ops.push({ op: '=', v: a[i] })
      else {
        if (i < a.length) ops.push({ op: '-', v: a[i] })
        if (i < b.length) ops.push({ op: '+', v: b[i] })
      }
    }
    return ops
  }
  const n = a.length, m = b.length
  const dp = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }
  const ops = []
  let i = 0, j = 0
  while (i < n && j < m) {
    if (a[i] === b[j]) { ops.push({ op: '=', v: a[i] }); i++; j++ }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { ops.push({ op: '-', v: a[i] }); i++ }
    else { ops.push({ op: '+', v: b[j] }); j++ }
  }
  while (i < n) ops.push({ op: '-', v: a[i++] })
  while (j < m) ops.push({ op: '+', v: b[j++] })
  return ops
}

function renderTextDiff(oldText, newText, indent, maxShown = 14) {
  const lines = []
  const ops = diffArrays(oldText, newText).filter(o => o.op !== '=')
  for (const o of ops.slice(0, maxShown)) {
    const clipped = o.v.length > 96 ? `${o.v.slice(0, 96)}…` : o.v
    lines.push(`${indent}${o.op === '-' ? RED('-') : GREEN('+')} ${JSON.stringify(clipped)}`)
  }
  if (ops.length > maxShown) lines.push(`${indent}${DIM(`… ${ops.length - maxShown} more changed run(s)`)}`)
  return lines
}

/** Where a right edge sits relative to the margin and the paper. */
function edgeNote(rightEdgePt, marginEdgePt, pageWidthPt) {
  if (rightEdgePt > pageWidthPt + 0.05) return RED(`${(rightEdgePt - pageWidthPt).toFixed(2)}pt PAST THE PAPER EDGE`)
  if (rightEdgePt > marginEdgePt + 0.05) return YELLOW(`${(rightEdgePt - marginEdgePt).toFixed(2)}pt past the ${MARGIN_MM}mm margin`)
  return GREEN(`${(marginEdgePt - rightEdgePt).toFixed(2)}pt inside the margin`)
}

// ── Diff drivers, per artefact kind ──────────────────────────────────────

function scalar(findings, severity, label, before, after, extra = '') {
  if (before === after) return
  findings.push({ severity, label, lines: [`${num(before)} -> ${num(after)}${delta(before, after)}${extra}`] })
}

function diffCommon(findings, base, now) {
  if (base.filenameNormalised !== now.filenameNormalised) {
    findings.push({
      severity: 'EXPECTED',
      label: 'filename',
      lines: [RED(`- ${base.filename}`), GREEN(`+ ${now.filename}`), DIM('  D2 renames output through reportFilename(); this is expected, not a regression')],
    })
  } else if (base.filename !== now.filename) {
    findings.push({ severity: 'INFO', label: 'filename (date only)', lines: [`${base.filename} -> ${now.filename}`] })
  }
  if (base.generator !== now.generator) {
    findings.push({ severity: 'CHANGED', label: 'generator export', lines: [`${base.generator} -> ${now.generator}`] })
  }
  if (base.datasets && stableJson(base.datasets) !== stableJson(now.datasets ?? null)) {
    findings.push({
      severity: 'CHANGED',
      label: 'source datasets',
      lines: [`${stableJson(base.datasets)} -> ${stableJson(now.datasets ?? null)}`,
        YELLOW('  a live dataset behind this baseline has changed since it was taken'),
        DIM('  reported separately so a spine or generator change is not blamed for it — but'),
        DIM('  read it differently per module. DGIW reads live data, so this EXPLAINS the'),
        DIM('  content changes below. BAIW/TAIW/HAIW freeze a copy in the fixture, so it does'),
        DIM('  NOT: it means the frozen copy is now stale and this baseline describes output'),
        DIM('  production no longer makes. Refresh the fixture, then walk. That is D-010.')],
    })
  }
  const bd = stableJson(base.clockDerived ?? null)
  const nd = stableJson(now.clockDerived ?? null)
  if (bd !== nd) {
    findings.push({
      severity: 'INFO',
      label: 'clock-derived values',
      lines: [`${bd} -> ${nd}`, DIM('  these are the wall clock, normalised out of every hash; recorded so you can see them')],
    })
  }
}

/**
 * Raw-bytes equality, for the artefacts whose identity is pinned.
 *
 * ALL 23 artefacts reach this as of D-001's removal. The spine pins
 * /CreationDate and /ID from meta.generatedAt, or there is nothing to pin, so a
 * byte difference on an untouched generator means the harness moved.
 *
 * Nothing opts out any more. `Math.random` left the report code entirely when
 * BAIW's and TAIW's fabricated capability scores were removed — until then those
 * two CSVs were the only artefacts whose bytes were a different number every run.
 */
function diffRawBytes(findings, base, now) {
  if (!base.rawBytesAsserted) return
  if (!base.rawBytesSha256 || !now.rawBytesSha256) {
    throw new Error('artefact asserts raw bytes but no raw hash was recorded — the harness is misconfigured, not the generator')
  }
  if (base.rawBytesSha256 !== now.rawBytesSha256) {
    findings.push({
      severity: 'FAIL',
      label: 'raw bytes',
      lines: [`${base.rawBytesSha256.slice(0, 12)} -> ${now.rawBytesSha256.slice(0, 12)}`,
        RED('  Byte-reproducible by construction — no clock, no RNG, identity pinned by the'),
        RED('  spine — so this is a real output change, not drift. If you edited src/report/,'),
        RED('  that edit is NOT behaviour-preserving. If nothing was edited, suspect the harness.')],
    })
  } else {
    findings.push({ severity: 'INFO', label: 'raw bytes', lines: [`stable (${base.rawBytesSha256.slice(0, 12)})`] })
  }
}

function diffPdf(findings, base, now) {
  diffRawBytes(findings, base, now)
  scalar(findings, 'CHANGED', 'page count', base.pageCount, now.pageCount,
    base.pageCount !== now.pageCount ? DIM('   — every generator hardcodes "Page N of 18"; check the footers agree') : '')
  scalar(findings, 'CHANGED', 'glyph count', base.glyphCount, now.glyphCount)
  scalar(findings, 'CHANGED', 'text run count', base.textRunCount, now.textRunCount)
  scalar(findings, 'CHANGED', 'table rows (total)', base.tableRowsTotal, now.tableRowsTotal)

  if (stableJson(base.unknownFonts) !== stableJson(now.unknownFonts)) {
    findings.push({
      severity: 'CHANGED',
      label: 'unrecognised fonts',
      lines: [`${JSON.stringify(base.unknownFonts)} -> ${JSON.stringify(now.unknownFonts)}`,
        DIM('  width measurement falls back to Helvetica for these, so right-edge numbers are approximate')],
    })
  }
  if (stableJson(base.nonWinAnsiFonts ?? []) !== stableJson(now.nonWinAnsiFonts ?? [])) {
    findings.push({
      severity: 'CHANGED',
      label: 'fonts not using /WinAnsiEncoding',
      lines: [`${JSON.stringify(base.nonWinAnsiFonts ?? [])} -> ${JSON.stringify(now.nonWinAnsiFonts ?? [])}`,
        DIM('  the text extractor decodes WinAnsi; anything else is decoded and hashed wrongly')],
    })
  }

  // Per-page geometry. Reported page by page on purpose: a regression on page 3
  // must not be masked by an improvement on page 16.
  const geo = []
  const pageCount = Math.max(base.pages.length, now.pages.length)
  for (let i = 0; i < pageCount; i++) {
    const b = base.pages[i], n = now.pages[i]
    if (!b) { geo.push(`page ${String(i + 1).padStart(2)}  ${GREEN('new page')}  right edge ${n.rightEdgePt.toFixed(2)}pt  ${edgeNote(n.rightEdgePt, n.rightMarginPt, n.widthPt)}`); continue }
    if (!n) { geo.push(`page ${String(i + 1).padStart(2)}  ${RED('page removed')}  was ${b.rightEdgePt.toFixed(2)}pt`); continue }
    if (Math.abs(b.rightEdgePt - n.rightEdgePt) < 0.05) continue
    const dir = n.rightEdgePt < b.rightEdgePt ? 'narrower' : 'wider'
    geo.push(
      `page ${String(i + 1).padStart(2)}  right edge ${b.rightEdgePt.toFixed(2)}pt -> ${n.rightEdgePt.toFixed(2)}pt  (${dir})\n` +
      `            was ${edgeNote(b.rightEdgePt, b.rightMarginPt, b.widthPt)}, now ${edgeNote(n.rightEdgePt, n.rightMarginPt, n.widthPt)}\n` +
      `            widest: ${JSON.stringify((n.widestText ?? '').slice(0, 78))}`,
    )
  }
  if (geo.length) findings.push({ severity: 'CHANGED', label: 'right-edge extent', lines: geo })

  // Per-page table rows.
  const tbl = []
  for (let i = 0; i < Math.min(base.pages.length, now.pages.length); i++) {
    if (base.pages[i].tableRows !== now.pages[i].tableRows) {
      tbl.push(`page ${String(i + 1).padStart(2)}  ${base.pages[i].tableRows} -> ${now.pages[i].tableRows} row(s)`)
    }
  }
  if (tbl.length) findings.push({ severity: 'CHANGED', label: 'table rows per page', lines: tbl })

  // The text itself, last and in most detail — it is what a reader sees.
  if (base.normalisedTextSha256 !== now.normalisedTextSha256) {
    const lines = [`${base.normalisedTextSha256.slice(0, 12)} -> ${now.normalisedTextSha256.slice(0, 12)}`]
    for (let i = 0; i < Math.min(base.pages.length, now.pages.length); i++) {
      const bt = base.pages[i].text, nt = now.pages[i].text
      if (JSON.stringify(bt) === JSON.stringify(nt)) continue
      lines.push(`page ${String(i + 1).padStart(2)}`)
      lines.push(...renderTextDiff(bt, nt, '  '))
    }
    for (let i = base.pages.length; i < now.pages.length; i++) {
      lines.push(`page ${String(i + 1).padStart(2)}  ${GREEN('added')}`)
      lines.push(...renderTextDiff([], now.pages[i].text, '  '))
    }
    for (let i = now.pages.length; i < base.pages.length; i++) {
      lines.push(`page ${String(i + 1).padStart(2)}  ${RED('removed')}`)
      lines.push(...renderTextDiff(base.pages[i].text, [], '  '))
    }
    findings.push({ severity: 'CHANGED', label: 'normalised text sha256', lines })
  }
}

function diffCsv(findings, base, now) {
  scalar(findings, 'CHANGED', 'row count', base.rowCount, now.rowCount)
  scalar(findings, 'CHANGED', 'column count', base.columnCount, now.columnCount)

  if (JSON.stringify(base.header) !== JSON.stringify(now.header)) {
    findings.push({ severity: 'CHANGED', label: 'header row', lines: renderTextDiff(base.header, now.header, '  ') })
  }

  const idx = base.unassertableColumnIndexes ?? []
  const maskRow = line => {
    if (!idx.length) return line
    const cells = splitCsvRow(line)
    for (const i of idx) cells[i] = SKIP_TOKEN
    return cells.join(',')
  }

  for (const key of ['firstThreeRows', 'lastThreeRows']) {
    const b = (base[key] ?? []).map(maskRow)
    const n = (now[key] ?? []).map(maskRow)
    if (JSON.stringify(b) === JSON.stringify(n)) continue
    findings.push({
      severity: 'CHANGED',
      label: key === 'firstThreeRows' ? 'first three data rows' : 'last three data rows',
      lines: renderTextDiff(b, n, '  '),
    })
  }

  if (base.assertableSha256 !== now.assertableSha256) {
    findings.push({
      severity: 'CHANGED',
      label: 'assertable-columns sha256',
      lines: [`${base.assertableSha256.slice(0, 12)} -> ${now.assertableSha256.slice(0, 12)}`,
        DIM('  covers every column except the unassertable ones listed below')],
    })
  }

  if (base.sampleRowsMasked) {
    findings.push({
      severity: 'SKIPPED',
      label: 'sample rows',
      lines: [`unassertable cells shown as ${SKIP_TOKEN}; every other cell is verbatim`,
        DIM('  the genuinely verbatim file is written to scripts/golden/raw/ (gitignored)')],
    })
  }

  if (base.unassertable?.length) {
    findings.push({
      severity: 'SKIPPED',
      label: `columns ${base.unassertable.map(x => JSON.stringify(x)).join(', ')}`,
      lines: [`SKIPPED (${base.unassertableReason})`,
        DIM('  not compared, and not silently ignored: D2 could change every number in these'),
        DIM('  columns and this harness would not notice. See docs/known-defects.md.')],
    })
  }

  diffRawBytes(findings, base, now)
}

function diffMd(findings, base, now) {
  // Markdown reached D3 with a recorded rawBytesSha256 that nothing compared:
  // analyseMd() always hashed the bytes, but this function never called
  // diffRawBytes and analyseMd never set rawBytesAsserted, so the value sat in
  // three baselines being read by no one. A markdown file has no /ID and no
  // CreationDate — it was byte-assertable from the very first capture.
  diffRawBytes(findings, base, now)
  scalar(findings, 'CHANGED', 'line count', base.lineCount, now.lineCount)
  scalar(findings, 'CHANGED', 'heading count', base.headingCount, now.headingCount)
  if (JSON.stringify(base.headings) !== JSON.stringify(now.headings)) {
    findings.push({ severity: 'CHANGED', label: 'headings', lines: renderTextDiff(base.headings, now.headings, '  ') })
  }
  if (base.normalisedTextSha256 !== now.normalisedTextSha256) {
    findings.push({
      severity: 'CHANGED',
      label: 'normalised text sha256',
      lines: [`${base.normalisedTextSha256.slice(0, 12)} -> ${now.normalisedTextSha256.slice(0, 12)}`,
        DIM('  dates are normalised to a token before hashing, so this is a content change')],
    })
  }
}

/**
 * One line describing what a fresh analysis holds, for a NEW artefact.
 *
 * Mirrors capture.mjs's per-artefact `detail` line: with no baseline there is
 * nothing to diff, so the only useful thing to print is the shape of what was
 * produced — which is also what the reader is about to be asked to accept.
 */
function shapeSummary(a) {
  if (a.kind === 'pdf') return `${a.pageCount} pages · ${a.glyphCount} glyphs · ${a.textRunCount} runs · ${a.tableRowsTotal} table rows`
  if (a.kind === 'csv') return `${a.rowCount} rows × ${a.columnCount} cols`
  return `${a.lineCount} lines · ${a.headingCount} headings`
}

// ── Run ──────────────────────────────────────────────────────────────────

const env = environmentStamp()
console.log(BOLD('golden compare'))
console.log(`  node ${process.version}  TZ=${env.tz}  locale=${env.icuLocale}  icuTimeZone=${env.icuTimeZone}`)
console.log(DIM(`  env vars: ${stableJson(environmentVars())}`))
console.log(`  modules: ${args.modules.join(', ')}`)
console.log()

const driver = await createDriver(args.modules)
const tally = { SAME: 0, INFO: 0, EXPECTED: 0, SKIPPED: 0, CHANGED: 0, ORPHANED: 0, NEW: 0, FAIL: 0 }
let compared = 0
/** Artefacts this run produced that no baseline covers. Reported, not thrown. */
const unbaselined = []
/** Baseline filenames this run produced an artefact for, per module. */
const producedByModule = new Map(args.modules.map((m) => [m, new Set()]))

try {
  for (const module of args.modules) {
    const artefacts = await driver.generate(module)
    if (!artefacts.length) throw new Error(`${module}: generated zero artefacts`)

    for (const artefact of artefacts) {
      const now = analyse(artefact, driver.ruler)
      // Mirrors what capture.mjs records, so diffCommon compares like with like.
      // Both call the SAME harness function now — this line and capture's carried
      // separate copies of a `module === 'dgiw' ? … : null` ternary, and the null
      // half is what made D-010 invisible: diffCommon's dataset check is guarded
      // on `base.datasets`, so it could not fire for a module recording null.
      now.datasets = driver.fingerprintFor(module)
      const bp = baselinePath(module, now.artefact)
      producedByModule.get(module).add(path.basename(bp))
      if (!existsSync(bp)) {
        // Not a throw. See the header: aborting here hid every later artefact's
        // diff and made `capture --accept` the cheapest way to see the report.
        unbaselined.push(`${module}/${now.artefact}`)
        tally.NEW++
        console.log(RULE)
        console.log(`${BOLD(`${module}/${now.artefact}`.padEnd(22))} ${DIM(now.generator.padEnd(28))} ${SEVERITY.NEW.paint('NEW')}`)
        console.log(`  ${SEVERITY.NEW.paint('NEW'.padEnd(9))} no baseline at ${path.relative(process.cwd(), bp)}`)
        console.log(`    produced ${shapeSummary(now)}`)
        console.log(`    -> ${now.filename}`)
        console.log(`    ${RED('nothing about this artefact was verified — there is nothing to verify it against')}`)
        // walk.mjs needs a BEFORE side and says so; for a NEW artefact the only
        // review material is the artefact itself, which capture drops in raw/
        // whether or not it is allowed to write a baseline.
        console.log(`    ${DIM(`read it in scripts/golden/raw/${module}/, then: node scripts/golden/capture.mjs --accept`)}`)
        continue
      }
      const base = JSON.parse(readFileSync(bp, 'utf8'))
      // A baseline that was written empty would let every comparison pass
      // vacuously. Re-assert on read, not just on write.
      assertNonEmpty(`baseline ${module}/${now.artefact}`, base)
      compared++

      const findings = []
      if (base.capturedWith && stableJson(base.capturedWith) !== stableJson(env)) {
        findings.push({
          severity: 'CHANGED',
          label: 'capture environment',
          lines: [`${stableJson(base.capturedWith)} -> ${stableJson(env)}`,
            RED('  the baseline was taken under a different environment; pin it or recapture')],
        })
      }
      diffCommon(findings, base, now)
      if (base.kind !== now.kind) {
        findings.push({ severity: 'FAIL', label: 'artefact kind', lines: [`${base.kind} -> ${now.kind}`] })
      } else if (now.kind === 'pdf') diffPdf(findings, base, now)
      else if (now.kind === 'csv') diffCsv(findings, base, now)
      else diffMd(findings, base, now)

      findings.sort((a, b) => SEVERITY[b.severity].rank - SEVERITY[a.severity].rank)
      const worst = findings.reduce((w, f) => (SEVERITY[f.severity].rank > SEVERITY[w].rank ? f.severity : w), 'INFO')
      const actionable = findings.some(f => f.severity === 'CHANGED' || f.severity === 'FAIL')
      const headline = findings.length === 0 || !actionable
        ? (findings.length === 0 ? GREEN('unchanged') : SEVERITY[worst].paint(`unchanged (${worst.toLowerCase()} only)`))
        : SEVERITY[worst].paint(worst)

      console.log(RULE)
      console.log(`${BOLD(`${module}/${now.artefact}`.padEnd(22))} ${DIM(now.generator.padEnd(28))} ${headline}`)
      for (const f of findings) {
        tally[f.severity]++
        console.log(`  ${SEVERITY[f.severity].paint(f.severity.padEnd(9))} ${f.label}`)
        for (const l of f.lines) for (const sub of String(l).split('\n')) console.log(`    ${sub}`)
      }
      if (!findings.length) tally.SAME++
    }
  }

  driver.assertFixtureDataWasServed()
  // Every registry artefact must have been REACHED, whether or not it had a
  // baseline. A shortfall here is the harness or the registry, not the baselines.
  const expected = args.modules.reduce((n, m) => n + REGISTRY[m].artefacts.length, 0)
  const reached = compared + unbaselined.length
  if (reached !== expected) throw new Error(`reached ${reached} artefacts, expected ${expected}`)
  // Vacuity: a run that verified nothing must not print like a run that verified
  // everything. When some artefacts were reached but none had a baseline, the NEW
  // findings above already say so and the exit code is 1 — throwing on top of
  // that would only discard the report explaining why.
  if (reached === 0) throw new Error('reached zero artefacts — nothing was generated, let alone verified')
} finally {
  await driver.close()
}

/*
 * A baseline on disk this run produced no artefact for — the other half of the
 * pair capture.mjs reports, and the half compare.mjs could not see at all.
 *
 * It iterates the artefacts it GENERATES, so a baseline for a removed or renamed
 * artefact was simply never opened: it sat in git being compared by nothing, and
 * the summary said "27 artefacts compared" with no hint that a 28th file was
 * being carried. Renaming an artefact id produces one of these and one NEW.
 */
const orphaned = []
for (const module of args.modules) {
  const dir = path.join(BASELINE_DIR, module)
  if (!existsSync(dir)) continue
  const produced = producedByModule.get(module)
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.json')).sort()) {
    if (produced.has(f)) continue
    orphaned.push(`${module}/${f.replace(/\.json$/, '')}`)
  }
}
for (const o of orphaned) {
  tally.ORPHANED++
  console.log(RULE)
  console.log(`${BOLD(o.padEnd(22))} ${DIM(''.padEnd(28))} ${SEVERITY.ORPHANED.paint('ORPHANED')}`)
  console.log(`  ${SEVERITY.ORPHANED.paint('ORPHANED'.padEnd(9))} baseline on disk, this run produced no such artefact`)
  console.log(`    ${RED('compared by nothing — it is carried in git and read by no check')}`)
  console.log(`    ${DIM('delete it deliberately, or restore the artefact the registry stopped producing')}`)
}

console.log(RULE)
console.log(BOLD('summary'))
console.log(`  ${compared} artefact(s) compared against ${path.relative(process.cwd(), BASELINE_DIR)}`)
if (unbaselined.length) console.log(`  ${RED(`${unbaselined.length} artefact(s) had no baseline and were NOT compared`)}: ${unbaselined.join(', ')}`)
if (orphaned.length) console.log(`  ${RED(`${orphaned.length} baseline(s) had no artefact and were NOT compared`)}: ${orphaned.join(', ')}`)
for (const k of ['FAIL', 'NEW', 'ORPHANED', 'CHANGED', 'EXPECTED', 'SKIPPED', 'INFO']) {
  if (tally[k]) console.log(`  ${SEVERITY[k].paint(k.padEnd(9))} ${tally[k]} finding(s)`)
}
const failing = tally.FAIL + tally.NEW + tally.ORPHANED + tally.CHANGED
if (failing) {
  console.log()
  console.log(`  ${YELLOW('exit 1')} — ${failing} actionable finding(s). Read them before deciding.`)
  console.log(DIM('  After D2 this is the expected outcome: the migration is supposed to change output.'))
  console.log(DIM('  Accept the new behaviour with:  node scripts/golden/capture.mjs'))
  process.exit(1)
}
console.log()
console.log(`  ${GREEN('exit 0')} — no actionable differences.`)
console.log(DIM('  Whether that is good depends on what you changed. For shared infrastructure'))
console.log(DIM('  (a spine edit meant to be behaviour-preserving) it is the goal. After a'))
console.log(DIM('  generator migration it means the migration did nothing — check that it ran.'))
