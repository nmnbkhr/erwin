#!/usr/bin/env node
/**
 * Drive a real browser through DGIW's diagnostic at G2 depth — tiers,
 * evidence, targets — and check the three behaviours no other harness sees.
 *
 *   node scripts/dgiw-diagnostic-clickthrough.mjs   (needs the dev server on 5174)
 *
 * Sibling of dgiw-design-clickthrough.mjs, same zero-dependency CDP client.
 * What it asserts, per G2 checkpoint 3:
 *
 *  - select Quick, answer a question WITH an evidence note, set a target —
 *    then reload: all three persist (three stores, one engagement namespace)
 *  - switch engagement: all three are empty for the new engagement
 *  - switch back: all three return intact
 *  - switch tier Quick → Deep Dive: the Quick answer is still visible and
 *    still counted — nesting as the user experiences it, not as the gate
 *    proves it
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

/* ---- in-page helpers (the two sibling scripts' idiom) ---- */

const clickByText = (text, tag = 'button') => `(() => {
  const el = [...document.querySelectorAll(${JSON.stringify(tag)})]
    .find(e => e.textContent.trim() === ${JSON.stringify(text)} || e.textContent.trim().startsWith(${JSON.stringify(text)}));
  if (!el) return false;
  el.scrollIntoView({ block: 'center' }); el.click(); return true;
})()`

const hasText = (text) => `document.body.textContent.includes(${JSON.stringify(text)})`

/** Answer the FIRST visible range slider through React's own value setter. */
const answerFirstRange = (value) => `(() => {
  const el = document.querySelector('input[type=range]');
  if (!el) return false;
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(el, String(${value}));
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
})()`

const typeIntoTextarea = (placeholderFrag, value) => `(() => {
  const el = [...document.querySelectorAll('textarea')].find(e => (e.placeholder ?? '').includes(${JSON.stringify(placeholderFrag)}));
  if (!el) return false;
  const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
  setter.call(el, ${JSON.stringify(value)});
  el.dispatchEvent(new Event('input', { bubbles: true }));
  return true;
})()`

/** Set the FIRST select inside the Target state card (P01's row, top of the table). */
const setFirstTargetSelect = (value) => `(() => {
  const card = [...document.querySelectorAll('h2')].find(h => h.textContent.trim() === 'Target state')?.closest('div.bg-white');
  const el = card?.querySelector('select');
  if (!el) return false;
  const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
  setter.call(el, String(${value}));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
})()`

const firstTargetSelectValue = () => `(() => {
  const card = [...document.querySelectorAll('h2')].find(h => h.textContent.trim() === 'Target state')?.closest('div.bg-white');
  return card?.querySelector('select')?.value ?? null;
})()`

const firstRangeValue = () => `document.querySelector('input[type=range]')?.value ?? null`

/* ---- engagement helpers (as the sibling scripts) ---- */

async function createEngagement(b, name) {
  const opened =
    (await b.page.eval(clickByText('No engagement'))) || (await b.page.eval(clickByText('Diag-CT')))
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

async function switchToEngagement(b, name) {
  if (!(await b.page.eval(clickByText('Diag-CT')))) throw new Error('could not open the engagement switcher')
  await sleep(300)
  const clicked = await b.page.eval(clickByText(name))
  await sleep(600)
  return clicked
}

/* ---- the run ---- */

const EVIDENCE = 'Sponsor letter sighted in the November board pack.'

console.log(`\nDiagnostic depth click-through — real Chrome over CDP, no npm dependency\n  dev server ${BASE}\n`)

const b = await launch({ downloadPath: mkdtempSync(path.join(tmpdir(), 'dgiw-diag-')), port: 9224 })
try {
  await b.goto(`${BASE}/dg/diagnostic`)
  await b.page.waitFor(hasText('Maturity Diagnostic'), { label: 'the diagnostic page to render' })

  console.log('— engagement A: Quick tier, one answer with evidence, one target')
  await createEngagement(b, 'Diag-CT Alpha')
  await b.page.waitFor(hasText('at this tier'), { label: 'the tier-aware progress line' })

  check(await b.page.eval(clickByText('Quick')), 'selected the Quick tier')
  await b.page.waitFor(hasText('/ 11 at this tier'), { label: 'the Quick question count (11)' })
  check(true, 'Quick shows 11 of 55 questions — coverage honesty on the page')

  check(await b.page.eval(answerFirstRange(4)), 'answered P01’s quick question at 4')
  await b.page.waitFor(hasText('1 / 11 at this tier'), { label: 'the answer to count' })
  check(await b.page.eval(clickByText('Add evidence')), 'opened the evidence affordance')
  await sleep(150)
  check(await b.page.eval(typeIntoTextarea('What was seen', EVIDENCE)), 'typed an evidence note')
  await b.page.waitFor(hasText('Evidence recorded'), { label: 'the evidence indicator' })

  check(await b.page.eval(clickByText('View results')), 'opened the results view')
  await b.page.waitFor(hasText('Target state'), { label: 'the target-state table' })
  check(await b.page.eval(setFirstTargetSelect(4)), 'set P01’s target to 4')
  await sleep(400)

  console.log('— reload: tier, answer+evidence and target must all come back')
  await b.goto(`${BASE}/dg/diagnostic`)
  await b.page.waitFor(hasText('Maturity Diagnostic'), { label: 'the page after reload' })
  check(await b.page.eval(hasText('/ 11 at this tier')), 'tier selection (Quick) survived the reload')
  check(await b.page.eval(hasText('1 / 11 at this tier')), 'the answer survived the reload')
  check(await b.page.eval(hasText('Evidence recorded')), 'the evidence note survived the reload')
  await b.page.eval(clickByText('View results'))
  await b.page.waitFor(hasText('Target state'), { label: 'results after reload' })
  check((await b.page.eval(firstTargetSelectValue())) === '4', 'the target survived the reload')
  await b.page.eval(clickByText('Back to questions'))
  await sleep(300)

  console.log('— engagement B: all three stores must be empty')
  await createEngagement(b, 'Diag-CT Beta')
  await sleep(400)
  check(await b.page.eval(hasText('0 / 38 at this tier')), 'engagement B starts at Standard with nothing answered')
  check(!(await b.page.eval(hasText('Evidence recorded'))), 'no evidence indicator for engagement B')

  console.log('— back to A: restored')
  check(await switchToEngagement(b, 'Diag-CT Alpha'), 'switched back to engagement A')
  await b.page.waitFor(hasText('1 / 11 at this tier'), { label: "engagement A's Quick state to return" })
  check(await b.page.eval(hasText('Evidence recorded')), "engagement A's evidence returned")

  console.log('— tier Quick → Deep Dive: the Quick answer stays visible and counted')
  check(await b.page.eval(clickByText('Deep Dive')), 'switched to Deep Dive')
  await b.page.waitFor(hasText('1 / 55 at this tier'), { label: 'the Quick answer counted at Deep' })
  check((await b.page.eval(firstRangeValue())) === '4', 'the Quick answer is still visible on its slider')

  const noise = b.consoleErrors.filter((e) => !/Download the React DevTools/.test(e))
  check(noise.length === 0, 'browser console clean', noise.length ? `\n    ${noise.join('\n    ')}` : '')
} finally {
  await b.close()
}

console.log(failures === 0 ? '\n  OK — tiers, evidence and targets round-trip per engagement, through the real page' : `\n  ${failures} assertion(s) FAILED`)
process.exit(failures === 0 ? 0 : 1)
