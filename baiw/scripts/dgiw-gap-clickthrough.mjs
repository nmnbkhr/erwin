#!/usr/bin/env node
/**
 * Drive a real browser through the G3 Gap Register page and check the three
 * behaviours no other harness sees.
 *
 *   node scripts/dgiw-gap-clickthrough.mjs   (needs the dev server on 5174)
 *
 * Sibling of dgiw-diagnostic-clickthrough.mjs, same zero-dependency CDP
 * client. What it asserts, per G3 checkpoint 2:
 *
 *  - answer two pillars at Quick, set their targets plus one target on an
 *    unanswered pillar — /gaps shows exactly TWO rows, and the third pillar
 *    appears in the exclusion list naming the tier, never in the table
 *  - the expanded row states the priority formula with the entry's own
 *    inputs — "why is this critical?" is answerable from the screen
 *  - the CSV export downloads with a tier column carrying the active tier
 *  - the browser console stays clean throughout
 *
 * NOT a gate: needs a dev server and a browser. Exit 1 on any failed assertion.
 */
import fs from 'node:fs'
import path from 'node:path'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { launch } from './golden/cdp.mjs'

const BASE = process.env.CLICKTHROUGH_BASE ?? 'http://127.0.0.1:5174'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

let failures = 0
const check = (ok, label, detail = '') => {
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  ${detail}` : ''}`)
  if (!ok) failures++
}

/* ---- in-page helpers (the sibling scripts' idiom) ---- */

const clickByText = (text, tag = 'button') => `(() => {
  const el = [...document.querySelectorAll(${JSON.stringify(tag)})]
    .find(e => e.textContent.trim() === ${JSON.stringify(text)} || e.textContent.trim().startsWith(${JSON.stringify(text)}));
  if (!el) return false;
  el.scrollIntoView({ block: 'center' }); el.click(); return true;
})()`

const hasText = (text) => `document.body.textContent.includes(${JSON.stringify(text)})`

const answerFirstRange = (value) => `(() => {
  const el = document.querySelector('input[type=range]');
  if (!el) return false;
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(el, String(${value}));
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
})()`

/** Set the target select on the Target-state row whose first cell names the pillar. */
const setTargetForPillar = (pillarId, value) => `(() => {
  const card = [...document.querySelectorAll('h2')].find(h => h.textContent.trim() === 'Target state')?.closest('div.bg-white');
  const row = [...(card?.querySelectorAll('tbody tr') ?? [])].find(r => r.textContent.includes(${JSON.stringify(pillarId)}));
  const el = row?.querySelector('select');
  if (!el) return false;
  const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
  setter.call(el, String(${value}));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
})()`

const registerRowCount = () => `document.querySelectorAll('tbody tr').length`

async function createEngagement(b, name) {
  const opened =
    (await b.page.eval(clickByText('No engagement'))) || (await b.page.eval(clickByText('Gap-CT')))
  if (!opened) throw new Error('could not open the engagement switcher')
  await sleep(300)
  if (!(await b.page.eval(clickByText('New')))) throw new Error('engagement switcher has no "New" button')
  await sleep(400)
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
}

/* ---- the run ---- */

const downloadPath = mkdtempSync(path.join(tmpdir(), 'dgiw-gap-'))

console.log(`\nGap Register click-through — real Chrome over CDP, no npm dependency\n  dev server ${BASE}\n`)

const b = await launch({ downloadPath, port: 9225 })
try {
  await b.goto(`${BASE}/dg/diagnostic`)
  await b.page.waitFor(hasText('Maturity Diagnostic'), { label: 'the diagnostic page to render' })

  console.log('— seed: two pillars answered at Quick, three targets set')
  await createEngagement(b, 'Gap-CT Alpha')
  await b.page.waitFor(hasText('at this tier'), { label: 'the tier-aware progress line' })
  check(await b.page.eval(clickByText('Quick')), 'selected the Quick tier')
  await b.page.waitFor(hasText('/ 11 at this tier'), { label: 'the Quick question count' })

  check(await b.page.eval(answerFirstRange(2)), "answered P01's quick question at 2")
  await b.page.waitFor(hasText('1 / 11 at this tier'), { label: 'the first answer to count' })
  check(await b.page.eval(clickByText('Data Strategy & Business Alignment', 'h2')), "opened P02's accordion")
  await sleep(300)
  check(await b.page.eval(answerFirstRange(4)), "answered P02's quick question at 4")
  await b.page.waitFor(hasText('2 / 11 at this tier'), { label: 'the second answer to count' })

  check(await b.page.eval(clickByText('View results')), 'opened the results view')
  await b.page.waitFor(hasText('Target state'), { label: 'the target-state table' })
  check(await b.page.eval(setTargetForPillar('P01', 4)), 'target P01 = 4 (answered — a gap)')
  check(await b.page.eval(setTargetForPillar('P02', 3)), 'target P02 = 3 (answered above target — met)')
  check(await b.page.eval(setTargetForPillar('P03', 3)), 'target P03 = 3 (NOT answered — must be excluded)')
  await sleep(400)

  console.log('— /gaps: two rows, the third pillar excluded with its reason')
  await b.goto(`${BASE}/dg/gaps`)
  await b.page.waitFor(hasText('Gap Register'), { label: 'the gap register page' })
  check(await b.page.eval(hasText('2 pillars with both measurements')), 'header counts two pillars in the register')
  check((await b.page.eval(registerRowCount())) === 2, 'the table has exactly two rows', `got ${await b.page.eval(registerRowCount())}`)
  check(await b.page.eval(hasText('not assessed at the Quick tier')), "P03's exclusion names the tier")
  check(await b.page.eval(hasText('no target set')), 'pillars without targets are listed too')
  check(await b.page.eval(hasText('met')), "P02's met target is a row, not a filtered-out success")

  console.log('— the expanded row answers "why is this critical?"')
  check(await b.page.eval(`(() => {
    const row = [...document.querySelectorAll('tbody tr')].find(r => r.textContent.includes('P01'));
    if (!row) return false; row.click(); return true;
  })()`), "expanded P01's row")
  await b.page.waitFor(hasText('Priority = gapSize'), { label: 'the stated formula' })
  check(await b.page.eval(hasText('Driver alignment')), 'driver alignment input is stated')
  check(await b.page.eval(hasText('Decisiveness')), 'decisiveness input is stated')

  console.log('— CSV export carries the tier column')
  check(await b.page.eval(clickByText('Export register (CSV)')), 'clicked the CSV export')
  let csvFile = null
  for (let i = 0; i < 40 && !csvFile; i++) {
    await sleep(250)
    csvFile = fs.readdirSync(downloadPath).find((f) => f.endsWith('.csv'))
  }
  check(Boolean(csvFile), 'a CSV file downloaded', csvFile ?? 'nothing in the download dir')
  if (csvFile) {
    const text = fs.readFileSync(path.join(downloadPath, csvFile), 'utf8')
    const [header, ...rows] = text.trim().split(/\r?\n/)
    check(header.includes('"tier"') || header.includes('tier'), 'the header has a tier column', header.slice(0, 120))
    check(rows.length === 2, 'two data rows', `got ${rows.length}`)
    check(rows.every((r) => r.includes('quick')), 'every row carries the active tier')
  }

  const noise = b.consoleErrors.filter((e) => !/Download the React DevTools/.test(e))
  check(noise.length === 0, 'browser console clean', noise.length ? `\n    ${noise.join('\n    ')}` : '')
} finally {
  await b.close()
}

console.log(failures === 0 ? '\n  OK — the register page shows both measurements, states its formula, and exports honestly' : `\n  ${failures} assertion(s) FAILED`)
process.exit(failures === 0 ? 0 : 1)
