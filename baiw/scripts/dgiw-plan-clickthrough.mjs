#!/usr/bin/env node
/**
 * Drive a real browser through the G4 engagement plan view and the replaced
 * Diagnostic roadmap — the behaviours no other harness sees.
 *
 *   node scripts/dgiw-plan-clickthrough.mjs   (needs the dev server on 5174)
 *
 * Sibling of dgiw-gap-clickthrough.mjs, same zero-dependency CDP client.
 * What it asserts, per G4 checkpoint 2:
 *
 *  - intake (org + driver + scope P01) + Quick answers on P01 and P02 +
 *    targets on both → the ImplementationPlan page shows an engagement view
 *    with a slice card for P01 ONLY; P02, measured but out of scope, is in
 *    the exclusion list with the reason
 *  - the assumptions block and the sequence strip render
 *  - the Diagnostic's derived roadmap rows carry the tier column (the G3
 *    flag, closed) and the band from the register
 *  - a fresh engagement returns the page to the reference view
 *  - the browser console stays clean throughout
 *
 * NOT a gate: needs a dev server and a browser. Exit 1 on any failed assertion.
 */
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

const typeByPlaceholder = (placeholder, value) => `(() => {
  const el = [...document.querySelectorAll('input')].find(e => (e.placeholder ?? '').includes(${JSON.stringify(placeholder)}));
  if (!el) return false;
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(el, ${JSON.stringify(value)});
  el.dispatchEvent(new Event('input', { bubbles: true }));
  return true;
})()`

const tickPillar = (id) => `(() => {
  const label = [...document.querySelectorAll('label')].find(l => l.textContent.includes(${JSON.stringify(id)}));
  const box = label?.querySelector('input[type=checkbox]');
  if (!box) return false;
  if (!box.checked) box.click();
  return true;
})()`

const answerFirstRange = (value) => `(() => {
  const el = document.querySelector('input[type=range]');
  if (!el) return false;
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(el, String(${value}));
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
})()`

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

async function createEngagement(b, name) {
  const opened =
    (await b.page.eval(clickByText('No engagement'))) || (await b.page.eval(clickByText('Plan-CT')))
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

console.log(`\nEngagement plan click-through — real Chrome over CDP, no npm dependency\n  dev server ${BASE}\n`)

const b = await launch({ downloadPath: mkdtempSync(path.join(tmpdir(), 'dgiw-plan-')), port: 9226 })
try {
  console.log('— reference state first: no intake, no measurements')
  await b.goto(`${BASE}/dg/plan`)
  await b.page.waitFor(hasText('Implementation Plan'), { label: 'the plan page to render' })
  await createEngagement(b, 'Plan-CT Alpha')
  await sleep(400)
  check(await b.page.eval(hasText('Reference plan only')), 'the reference banner shows before any intake')
  check(!(await b.page.eval(hasText('Engagement plan'))), 'no engagement tab in the reference state')

  console.log('— seed: intake scoping P01, Quick answers on P01+P02, targets on both')
  await b.goto(`${BASE}/dg/design`)
  await b.page.waitFor(hasText('Program Design'), { label: 'the design page' })
  check(await b.page.eval(typeByPlaceholder('Meezan', 'Plan Bank Limited')), 'typed the organisation name')
  check(await b.page.eval(clickByText('Add regulatory driver')), 'added a regulatory driver row')
  await sleep(200)
  check(await b.page.eval(typeByPlaceholder('SBP data submission', 'BCBS 239 lineage accountability')), 'typed the driver')
  await sleep(200)
  check(await b.page.eval(tickPillar('P01')), 'scoped P01 — and only P01')
  await sleep(400)

  await b.goto(`${BASE}/dg/diagnostic`)
  await b.page.waitFor(hasText('Maturity Diagnostic'), { label: 'the diagnostic page' })
  check(await b.page.eval(clickByText('Quick')), 'selected the Quick tier')
  await b.page.waitFor(hasText('/ 11 at this tier'), { label: 'the Quick question count' })
  check(await b.page.eval(answerFirstRange(2)), "answered P01's quick question at 2")
  await b.page.waitFor(hasText('1 / 11 at this tier'), { label: 'the first answer' })
  check(await b.page.eval(clickByText('Data Strategy & Business Alignment', 'h2')), "opened P02's accordion")
  await sleep(300)
  check(await b.page.eval(answerFirstRange(2)), "answered P02's quick question at 2")
  await b.page.waitFor(hasText('2 / 11 at this tier'), { label: 'the second answer' })
  check(await b.page.eval(clickByText('View results')), 'opened results')
  await b.page.waitFor(hasText('Target state'), { label: 'the target table' })
  check(await b.page.eval(setTargetForPillar('P01', 4)), 'target P01 = 4')
  check(await b.page.eval(setTargetForPillar('P02', 4)), 'target P02 = 4')
  await sleep(400)

  console.log('— the engagement view: one slice, one visible exclusion')
  await b.goto(`${BASE}/dg/plan`)
  await b.page.waitFor(hasText('Engagement plan available'), { label: 'the engagement banner' })
  check(await b.page.eval(hasText('1 pillar slice')), 'the banner counts exactly one slice')
  check(await b.page.eval(hasText('Assumptions')), 'the assumptions block renders')
  check(await b.page.eval(hasText('relative sequence windows, not calendar commitments')), 'the no-invented-effort assumption is on the page')
  check(await b.page.eval(hasText('P01 · Governance & Operating Model')), "P01's slice card renders")
  check(await b.page.eval(hasText('Sequence:')), 'the sequence strip renders')
  // The exclusion LIST legitimately names P02, so the assertion is scoped to
  // slice-card headings (h2), not the whole page text.
  check(await b.page.eval(`(() => {
    return ![...document.querySelectorAll('h2')].some(h => h.textContent.trim().startsWith('P02'));
  })()`), 'P02 has NO slice card (h2 scan — the exclusion list may name it)')
  check(await b.page.eval(hasText("not in the engagement's pillar scope")), "P02's exclusion names the intake scope")

  console.log('— Diagnostic roadmap: register-sourced, tier column present')
  await b.goto(`${BASE}/dg/diagnostic`)
  await b.page.waitFor(hasText('Maturity Diagnostic'), { label: 'the diagnostic page' })
  check(await b.page.eval(clickByText('View results')), 'opened results')
  await b.page.waitFor(hasText('Derived roadmap'), { label: 'the roadmap card' })
  check(await b.page.eval(hasText('Coverage at tier')), 'the roadmap table has the tier-coverage column')
  const roadmapRow = await b.page.eval(`(() => {
    const card = [...document.querySelectorAll('h2')].find(h => h.textContent.trim() === 'Derived roadmap')?.closest('div.bg-white');
    const row = [...(card?.querySelectorAll('tbody tr') ?? [])].find(r => r.textContent.includes('Governance & Operating Model'));
    return row ? row.textContent : null;
  })()`)
  check(Boolean(roadmapRow) && roadmapRow.includes('Quick'), "P01's roadmap row states the Quick tier", roadmapRow?.slice(0, 80))
  // Deterministic for this seed: gap 2 with no MAPPED driver (the driver was
  // typed, never mapped to pillars) multiplies to ~2.8 < CRITICAL_MIN → high.
  check(Boolean(roadmapRow) && roadmapRow.includes('high'), "P01's roadmap row carries the register's band (high for this seed)")

  console.log('— a fresh engagement returns the reference view')
  await b.goto(`${BASE}/dg/plan`)
  await b.page.waitFor(hasText('Implementation Plan'), { label: 'the plan page' })
  await createEngagement(b, 'Plan-CT Beta')
  await sleep(500)
  check(await b.page.eval(hasText('Reference plan only')), 'engagement B sees the reference banner')

  const noise = b.consoleErrors.filter((e) => !/Download the React DevTools/.test(e))
  check(noise.length === 0, 'browser console clean', noise.length ? `\n    ${noise.join('\n    ')}` : '')
} finally {
  await b.close()
}

console.log(failures === 0 ? '\n  OK — slices, exclusions and the tier-aware roadmap hold through the real pages' : `\n  ${failures} assertion(s) FAILED`)
process.exit(failures === 0 ? 0 : 1)
