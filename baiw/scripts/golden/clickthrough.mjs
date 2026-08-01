#!/usr/bin/env node
/**
 * Drive a real browser through the three report components and check what
 * actually lands on disk.
 *
 *   node scripts/golden/clickthrough.mjs            (needs the dev server on 5174)
 *
 * WHY THIS EXISTS
 * ---------------
 * `compare.mjs` and `walk.mjs` import the generator MODULE and call it with a
 * ReportMeta the harness builds. That covers the generator and it does not cover
 * the one thing D2 actually changed at the call site: `useReportMeta()`, which is
 * a React hook, reading `useEngagementOptional()` and `useOrgName()`, feeding a
 * `metaFor(artefactId)` into a click handler. Three migrations shipped with an
 * honest "I could not drive a browser" caveat against exactly that path.
 *
 * The blocker was CLAUDE.md hard rule 4 — no test framework may be installed
 * unasked — read as "no browser automation". It is not: Chrome is on the machine
 * and Node 22 has a global WebSocket, so CDP needs no dependency at all. See
 * cdp.mjs. Nothing is installed, nothing is added to package.json.
 *
 * WHAT IT ASSERTS, per module × {PDF, markdown} × {engagement, none}
 * -----------------------------------------------------------------
 *  - a file actually downloads, non-zero, and Chrome reports it completed
 *  - the filename matches reportFilename()'s pattern exactly, including the
 *    MR- artefact id, the org slug, the layer and today's UTC date
 *  - the PDF parses and its COVER carries the engagement's org name — the whole
 *    point of the engagement work, and the thing a wrong `meta` would break
 *    while still producing a perfectly valid PDF
 *  - the markdown's title line carries the same org name and a long-form date
 *  - the browser console stays clean throughout
 *
 * The no-engagement pass matters on its own: `engagementId` falls back to `''`
 * and `orgName` to the profile's `orgFallback`, so the filename slug and the
 * /ID seed both change. That branch has a comment in useReportMeta.ts explaining
 * why it is acceptable; this is what checks that it is also what happens.
 *
 * NOT a gate, for the same reason compare.mjs is not: it needs a dev server and
 * a browser, and a check that cannot run in every environment must not be able
 * to block a build. Exit 1 on any failed assertion so it is usable by hand.
 */
import { readFileSync, readdirSync, rmSync, mkdirSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { launch, sleep } from './cdp.mjs'
import { analysePdf, APP_ROOT } from './harness.mjs'
import jsPDFPkg from 'jspdf'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const DL = path.join(HERE, 'raw', 'clickthrough')
const BASE = process.env.DEV_URL ?? 'http://localhost:5174'

const TTY = process.stdout.isTTY && !process.env.NO_COLOR
const c = (n, s) => (TTY ? `[${n}m${s}[0m` : s)
const PASS = c('32', 'PASS'), FAIL = c('31', 'FAIL'), BOLD = s => c('1', s)

let failures = 0
const check = (ok, label, detail = '') => {
  if (!ok) failures++
  console.log(`    ${ok ? PASS : FAIL}  ${label}${detail ? `  ${c('2', detail)}` : ''}`)
}

/**
 * The three report panels, described the way a person clicking would describe
 * them. Selectors are text, not classes: class strings are Tailwind and change
 * for cosmetic reasons, whereas the button label changing IS a finding.
 */
const MODULES = [
  {
    key: 'baiw', label: 'BAIW — Banking', url: '/maturity',
    enter: ['Start Assessment'], showResults: 'Results',
    panel: 'Generate Your Assessment Report',
    pdfButton: 'Download PDF', mdButton: 'Download Markdown',
    orgPlaceholder: 'e.g., United Bank Limited',
    ids: { pdf: 'MR-BAIW-MATURITY', md: 'MR-BAIW-ROADMAP' },
    fallbackOrg: 'Your Bank',
  },
  {
    key: 'taiw', label: 'TAIW — Trade', url: '/taiw/maturity',
    enter: ['Start Assessment'], showResults: 'View Results',
    panel: 'Generate Trade Assessment Report',
    pdfButton: 'Download PDF', mdButton: 'Download Markdown',
    orgPlaceholder: 'e.g., Pakistan Customs, FBR',
    ids: { pdf: 'MR-TAIW-MATURITY', md: 'MR-TAIW-ROADMAP' },
    fallbackOrg: 'Pakistan Customs',
  },
  {
    key: 'haiw', label: 'HAIW — Healthcare', url: '/haiw/maturity',
    enter: [], showResults: null,
    panel: 'Generate Your Healthcare Assessment Report',
    pdfButton: 'PDF Report', mdButton: 'Roadmap Slides',
    orgPlaceholder: null,
    ids: { pdf: 'MR-HAIW-MATURITY', md: 'MR-HAIW-ROADMAP' },
    fallbackOrg: 'Your Healthcare Organization',
  },
]

/** `reportFilename()`'s shape, restated here so a change to it has to be noticed. */
const filenameRe = (id, orgSlug, ext) =>
  new RegExp(`^${id}_${orgSlug}_all_\\d{4}-\\d{2}-\\d{2}\\.${ext}$`)

const slugify = n => n.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'unnamed'
const todayUtc = () => new Date().toISOString().slice(0, 10)

/* ---- in-page helpers, injected as expressions ---- */

const clickByText = (text, tag = 'button') => `(() => {
  const el = [...document.querySelectorAll(${JSON.stringify(tag)})]
    .find(e => e.textContent.trim() === ${JSON.stringify(text)} || e.textContent.trim().startsWith(${JSON.stringify(text)}));
  if (!el) return false;
  el.scrollIntoView({ block: 'center' }); el.click(); return true;
})()`

const hasText = text => `document.body.textContent.includes(${JSON.stringify(text)})`

/**
 * Answer the visible questions by driving the real controls.
 *
 * Range inputs need React's own value setter — assigning `.value` directly is
 * invisible to React's synthetic onChange, so the answer would never reach state
 * and the report panel would never appear. Radio labels are just clicked.
 */
const answerVisible = (value) => `(() => {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  let ranges = 0, radios = 0;
  for (const el of document.querySelectorAll('input[type=range]')) {
    setter.call(el, String(${value}));
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    ranges++;
  }
  for (const el of document.querySelectorAll('input[type=radio]')) {
    if (el.value === String(${value})) { el.click(); radios++; }
  }
  return { ranges, radios };
})()`

/* ---- the run ---- */

async function createEngagement(b, name) {
  await b.page.eval(clickByText('No engagement'))
  await sleep(300)
  const clicked = await b.page.eval(clickByText('New'))
  if (!clicked) throw new Error('engagement switcher has no "New" button')
  await sleep(400)
  // `input[type=text]` would miss it: React renders these without an explicit
  // type attribute, and the attribute selector does not see the DEFAULTED value.
  // `el.type` does.
  const typed = await b.page.eval(`(() => {
    const el = [...document.querySelectorAll('input')].find(e => e.type === 'text');
    if (!el) return false;
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(el, ${JSON.stringify(name)});
    el.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  })()`)
  if (!typed) throw new Error('no text input in the new-engagement form')
  await sleep(200)
  await b.page.eval(clickByText('Create'))
  await sleep(600)
  return b.page.eval(`localStorage.getItem('wb.engagement.active')`)
}

async function download(b, mod, buttonText, kind, expectOrg) {
  const before = b.downloads.length
  const clicked = await b.page.eval(clickByText(buttonText))
  check(clicked, `clicked "${buttonText}"`)
  if (!clicked) return

  // The handler awaits a 100ms spinner delay before generating.
  for (let i = 0; i < 120 && b.downloads.length === before; i++) await sleep(100)
  const d = b.downloads[before]
  if (!d) { check(false, 'a file downloaded', 'no download event within 12s'); return }
  for (let i = 0; i < 100 && d.state !== 'completed'; i++) await sleep(100)

  const ext = kind === 'pdf' ? 'pdf' : 'md'
  const id = mod.ids[kind]
  const expected = filenameRe(id, slugify(expectOrg), ext)
  check(expected.test(d.filename), `filename matches reportFilename()`, d.filename)
  check(d.filename.includes(todayUtc()), `filename carries today's UTC date`, todayUtc())

  const file = path.join(DL, d.filename)
  check(existsSync(file), 'file is on disk')
  if (!existsSync(file)) return
  const bytes = readFileSync(file)
  check(bytes.length > 0, 'file is non-empty', `${bytes.length} bytes`)

  if (kind === 'pdf') {
    const ruler = new jsPDFPkg.jsPDF('p', 'pt', 'a4')
    let a
    try { a = analysePdf(bytes, ruler, {}) } catch (e) { check(false, 'PDF parses', String(e)); return }
    check(a.pageCount > 1, 'PDF opens and has pages', `${a.pageCount} pages`)
    const cover = a.pages[0].text
    check(cover.includes(expectOrg), 'cover carries the org name', JSON.stringify(cover[0]))
    // coverTag is '' for every module report: the MR- id must NOT be printed.
    check(!cover.some(t => t.includes(id)), 'cover does NOT print the artefact id')
    const header = a.pages[1].text.join(' ')
    check(header.includes(expectOrg), 'page chrome carries the org name')
  } else {
    const text = bytes.toString('utf8')
    check(text.startsWith(`# ${expectOrg} —`), 'markdown title carries the org name', text.split('\n')[0])
    check(/^## Prepared by Godaitec \| [A-Z][a-z]+ \d{1,2}, \d{4}$/.test(text.split('\n')[1]),
      'markdown date is the long UTC form', text.split('\n')[1])
  }
}

async function runModule(b, mod, { engagementOrg }) {
  const expectOrg = engagementOrg ?? mod.fallbackOrg
  console.log(`\n  ${BOLD(mod.label)}  ${engagementOrg ? `engagement "${engagementOrg}"` : 'NO engagement (fallback org)'}`)

  await b.goto(BASE + mod.url)
  await sleep(1200)

  for (const step of mod.enter) {
    const ok = await b.page.eval(clickByText(step))
    check(ok, `entered the assessment via "${step}"`)
    await sleep(900)
  }

  // Answer everything on screen, then page forward until the panel can render.
  let answered = { ranges: 0, radios: 0 }
  for (let round = 0; round < 3; round++) {
    const r = await b.page.eval(answerVisible(3))
    answered = { ranges: answered.ranges + r.ranges, radios: answered.radios + r.radios }
    await sleep(500)
    if (r.ranges + r.radios === 0) break
  }
  check(answered.ranges + answered.radios > 0, 'answered questions through the real controls',
    `${answered.ranges} sliders, ${answered.radios} radios`)

  if (mod.showResults) {
    const ok = await b.page.eval(clickByText(mod.showResults))
    check(ok, `switched to results via "${mod.showResults}"`)
    await sleep(1000)
  }

  await b.page.waitFor(hasText(mod.panel), { label: `the "${mod.panel}" panel to render` })
  await b.page.eval(clickByText(mod.panel))
  await sleep(500)

  await download(b, mod, mod.pdfButton, 'pdf', expectOrg)
  await download(b, mod, mod.mdButton, 'md', expectOrg)
}

// ── main ─────────────────────────────────────────────────────────────────

if (!existsSync(path.join(APP_ROOT, 'package.json'))) throw new Error('APP_ROOT looks wrong')

/*
 * ORDER IS LOAD-BEARING: every way this run can fail to start is checked BEFORE
 * anything is deleted.
 *
 * This used to rmSync(DL) as its first act, above the dev-server check. Running
 * it without a server on 5174 therefore wiped the previous run's twelve
 * artefacts and *then* exited 2 — a tool that destroys its own output when
 * invoked wrongly, which is the invocation most likely to happen by accident.
 *
 * The loss is not recoverable from git: scripts/golden/.gitignore excludes
 * `raw/`, so these twelve files are local-only. The only way back is a
 * successful run, and that re-dates every filename to today (`generatedAt` is
 * truncated to the day at the call site), so a stale-by-one-day set cannot be
 * restored — it can only be replaced.
 *
 * Reachability first, then Chrome, then delete. Note the clear is files-only
 * and happens AFTER launch: findChrome() throws when no binary is present, and
 * that is just as much a run that never started. Browser.setDownloadBehavior
 * has already been handed this path by then, so the directory itself must
 * survive — removing its contents is safe, removing the inode is not.
 */
try {
  await fetch(BASE)
} catch {
  console.error(`\nNo dev server at ${BASE}. Start it with \`npm run dev\` and retry.\n`)
  console.error(`Nothing was deleted; ${path.relative(APP_ROOT, DL)} is untouched.\n`)
  process.exit(2)
}

mkdirSync(DL, { recursive: true })

console.log(`\nclick-through — real Chrome over CDP, no npm dependency\n  dev server ${BASE}\n  downloads  ${path.relative(APP_ROOT, DL)}`)

const b = await launch({ downloadPath: DL })

// Past this point the run is committed, so the previous set can go. Files only:
// see the note above on why DL itself has to outlive the clear.
const stale = readdirSync(DL)
for (const f of stale) rmSync(path.join(DL, f), { recursive: true, force: true })
if (stale.length) console.log(`  cleared    ${stale.length} file(s) from the previous run`)

try {
  console.log(`\n${BOLD('PASS 1 — with an active engagement')}`)
  // The switcher lives in the module shell header, not on the suite landing page.
  await b.goto(BASE + '/maturity')
  await sleep(1500)
  const org = 'Clickthrough Test Bank'
  const id = await createEngagement(b, org)
  check(Boolean(id), 'created an engagement through the switcher', String(id))
  for (const mod of MODULES) await runModule(b, mod, { engagementOrg: org })

  console.log(`\n${BOLD('PASS 2 — no engagement (engagementId falls back to "")')}`)
  await b.page.eval(`localStorage.clear()`)
  for (const mod of MODULES) await runModule(b, mod, { engagementOrg: null })

  console.log(`\n${BOLD('browser console')}`)
  check(b.consoleErrors.length === 0, 'no console errors or warnings',
    b.consoleErrors.slice(0, 5).join(' | '))

  const produced = readdirSync(DL).filter(f => !f.endsWith('.crdownload'))
  console.log(`\n  ${produced.length} file(s) downloaded:`)
  for (const f of produced.sort()) console.log(`    ${f}`)
} finally {
  await b.close()
}

console.log(failures === 0 ? `\n${PASS} — every assertion held.\n` : `\n${FAIL} — ${failures} assertion(s) failed.\n`)
process.exit(failures === 0 ? 0 : 1)
