/**
 * Print the extracted text of a captured artefact, page by page.
 *
 * `compare.mjs` tells you WHICH fields moved; `walk.mjs` reconciles a diff against a
 * baseline. Neither prints what a new artefact actually says, and a NEW artefact has no
 * baseline to reconcile against — so reviewing one before freezing it meant opening a
 * PDF by hand, which is not something a reviewer can paste into a report.
 *
 * This reads `raw/` through the harness's OWN `analysePdf`, so the text here is the same
 * text the baseline records. A separate extractor would be a second implementation that
 * agrees today, which is the thing this directory exists to avoid.
 *
 * ─── WHAT IT DOES NOT SHOW, AND THIS WILL MISLEAD YOU ONCE ─────────────────
 *
 * `analysePdf`'s reassembly DROPS the continuation lines of a WRAPPED TABLE CELL. A
 * rationale that autoTable broke over two lines appears here cut at the break, ending
 * mid-sentence, and it reads exactly like the D-004 invisible truncation this repo went
 * looking for. It is not: the text is in the PDF, on its own `Tj`, and it renders.
 * Verified by decoding the content stream directly — "…HACR asks it" is followed by
 * "about analytics rather than about governance…" as the next draw.
 *
 * The baseline is not blind to it either: every artefact here sets `assertRawBytes`, so
 * a change to a wrapped continuation moves the byte hash even though the normalised
 * text is unchanged. Reported rather than fixed — narrowing the gap is a change to
 * `analysePdf`, which every baseline's `normalisedTextSha256` depends on, and that is
 * its own change with its own walk.
 *
 * If a cell looks cut here, decode the stream before filing a defect.
 *
 *   node scripts/golden/dump-text.mjs taiw/framework-alignment-fw-01-pdf
 *   node scripts/golden/dump-text.mjs haiw/multi-framework-pdf --grep 'NOT APPLICABLE'
 *
 * Reads only. Writes nothing, ever — it is a reader for the record, not a writer of it.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { jsPDF } from 'jspdf'
import { REGISTRY, artefactSpec, analysePdf, analyseMd, analyseCsv } from './harness.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const RAW = path.join(HERE, 'raw')

const [target, ...rest] = process.argv.slice(2)
if (!target || !target.includes('/')) {
  console.error('usage: node scripts/golden/dump-text.mjs <module>/<artefact-id> [--grep <regex>]')
  console.error('\navailable:')
  for (const [m, reg] of Object.entries(REGISTRY))
    for (const a of reg.artefacts) console.error(`  ${m}/${a.id}`)
  process.exit(2)
}
const gi = rest.indexOf('--grep')
const grep = gi >= 0 ? new RegExp(rest[gi + 1], 'i') : null

const [module, id] = [target.slice(0, target.indexOf('/')), target.slice(target.indexOf('/') + 1)]
const spec = artefactSpec(module, id)

/*
 * The raw filename is `reportFilename()`'s, not the spec id — D2 renamed every output
 * and the artefact's identity had to survive that.
 *
 * The ARTEFACT ID is read from the generator's own exported constant, through the same
 * vite runner the harness uses, rather than guessed from the spec id. `metaFor` does
 * exactly this and for the same reason: if an id changes, the tool follows it instead of
 * matching a stale one. Guessing was tried first and was ambiguous immediately —
 * `haiw/multi-framework-pdf` matched the MATURITY pdf too.
 */
const dir = path.join(RAW, module)
if (!existsSync(dir)) {
  console.error(`no ${dir} — run: node scripts/golden/capture.mjs   (it refreshes raw/ even when it refuses to freeze)`)
  process.exit(2)
}
const { createServer } = await import('vite')
const server = await createServer({
  root: path.resolve(HERE, '..', '..'),
  appType: 'custom',
  server: { middlewareMode: true },
  logLevel: 'error',
})
let artefactId
try {
  const entry = spec.entry ?? REGISTRY[module].entry
  artefactId = (await server.ssrLoadModule(entry))[spec.artefactIdExport]
} finally {
  await server.close()
}
if (typeof artefactId !== 'string' || !artefactId) {
  console.error(`${target}: the generator does not export ${spec.artefactIdExport} as a string — the registry is stale`)
  process.exit(2)
}

const slug = (s) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
const orgSlug = spec.orgName ? slug(spec.orgName) : null
// AR-47's shape: one artefact id, one document per framework, separated in the filename.
const suffix = /framework-alignment-(fw-\d+)/.exec(id)?.[1]
const candidates = readdirSync(dir).filter((f) => {
  if (!f.startsWith(`${artefactId}_`)) return false
  if (spec.kind && !f.endsWith(`.${spec.kind}`)) return false
  if (orgSlug && !f.includes(`_${orgSlug}_`)) return false
  if (!orgSlug && /-partial_/.test(f)) return false
  if (suffix) return f.includes(`_${suffix}.`)
  return !/_fw-\d+\./.test(f)
})
if (candidates.length !== 1) {
  console.error(`expected one file for ${target} (${artefactId}), found ${candidates.length}: ${candidates.join(', ')}`)
  process.exit(2)
}

const file = path.join(dir, candidates[0])
const bytes = readFileSync(file)
const body =
  spec.kind === 'pdf'
    ? analysePdf(bytes, new jsPDF('p', 'pt', 'a4'), spec)
    : spec.kind === 'csv'
      ? analyseCsv(bytes, spec)
      : analyseMd(bytes, spec)

console.log(`${target}  ${candidates[0]}  ${bytes.length} bytes`)
if (spec.kind !== 'pdf') {
  const text = bytes.toString('utf8')
  for (const line of text.split(/\r?\n/)) if (!grep || grep.test(line)) console.log(line)
  process.exit(0)
}

console.log(`${body.pageCount} pages, ${body.glyphCount} glyphs, ${body.tableRowsTotal} table rows\n`)
for (const page of body.pages) {
  // `page.text` is the reassembled line list analysePdf already builds for the
  // baseline's normalised-text hash. Reading it here rather than re-splitting the
  // runs is what keeps this a reader of the record rather than a second opinion.
  const lines = Array.isArray(page.text) ? page.text : String(page.text ?? '').split('\n')
  const hits = grep ? lines.filter((l) => grep.test(l)) : lines
  if (grep && hits.length === 0) continue
  console.log(
    `──── page ${page.page} ──── right edge ${page.rightEdgePt?.toFixed?.(2) ?? '?'}pt` +
      `${page.runsPastMargin ? `  ${page.runsPastMargin} RUNS PAST MARGIN` : ''}`,
  )
  for (const l of hits) console.log(`  ${l}`)
  console.log('')
}
