#!/usr/bin/env node
/**
 * Drive a real browser through DGIW's Program Design intake (G1) and check the
 * three behaviours no other harness can see.
 *
 *   node scripts/dgiw-design-clickthrough.mjs      (needs the dev server on 5174)
 *
 * WHY THIS EXISTS
 * ---------------
 * G1's checkpoint 2 requires: fill a minimal intake, reload, values persist;
 * switch engagement, values are empty; switch back, values return. Every other
 * harness in this repo imports modules — none renders `ProgramDesign.tsx`, so
 * none can see `useProgramIntake()` actually round-trip through the engagement
 * namespace, or the mode banner actually flip when `intakeIsActionable` does.
 * The G1 stage shipped with an honest "no browser was driven" caveat against
 * exactly this; this file is what closes it. Same zero-dependency CDP client
 * as clickthrough.mjs — Chrome is on the machine, nothing is installed.
 *
 * WHAT IT ASSERTS
 * ---------------
 *  - /dg/design renders, in ILLUSTRATIVE reference mode ("Intake incomplete")
 *  - typing the org name, one regulatory driver and ticking one pillar flips
 *    the banner to "Intake actionable" — the predicate, driven through the UI
 *  - a reload preserves every entered value (usePersistedState round-trip)
 *  - a SECOND engagement sees an empty intake (namespacing, not one shared key)
 *  - switching back returns the first engagement's values intact
 *  - the browser console stays clean throughout
 *
 * NOT a gate, for clickthrough.mjs's reason: it needs a dev server and a
 * browser, and a check that cannot run in every environment must not be able
 * to block a build. Exit 1 on any failed assertion so it is usable by hand.
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

/* ---- in-page helpers, injected as expressions (clickthrough.mjs's idiom) ---- */

const clickByText = (text, tag = 'button') => `(() => {
  const el = [...document.querySelectorAll(${JSON.stringify(tag)})]
    .find(e => e.textContent.trim() === ${JSON.stringify(text)} || e.textContent.trim().startsWith(${JSON.stringify(text)}));
  if (!el) return false;
  el.scrollIntoView({ block: 'center' }); el.click(); return true;
})()`

const hasText = (text) => `document.body.textContent.includes(${JSON.stringify(text)})`

/** Type into the input found by placeholder, through React's own value setter. */
const typeByPlaceholder = (placeholder, value) => `(() => {
  const el = [...document.querySelectorAll('input')].find(e => (e.placeholder ?? '').includes(${JSON.stringify(placeholder)}));
  if (!el) return false;
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(el, ${JSON.stringify(value)});
  el.dispatchEvent(new Event('input', { bubbles: true }));
  return true;
})()`

const valueByPlaceholder = (placeholder) => `(() => {
  const el = [...document.querySelectorAll('input')].find(e => (e.placeholder ?? '').includes(${JSON.stringify(placeholder)}));
  return el ? el.value : null;
})()`

/** Tick the pillar-scope checkbox rendered beside a given pillar id. */
const tickPillar = (id) => `(() => {
  const label = [...document.querySelectorAll('label')].find(l => l.textContent.includes(${JSON.stringify(id)}));
  const box = label?.querySelector('input[type=checkbox]');
  if (!box) return false;
  if (!box.checked) box.click();
  return true;
})()`

const pillarChecked = (id) => `(() => {
  const label = [...document.querySelectorAll('label')].find(l => l.textContent.includes(${JSON.stringify(id)}));
  return label?.querySelector('input[type=checkbox]')?.checked ?? null;
})()`

/* ---- engagement helpers, from clickthrough.mjs ---- */

async function createEngagement(b, name) {
  const opened =
    (await b.page.eval(clickByText('No engagement'))) || (await b.page.eval(clickByText('Clickthrough')))
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
  const opened = await b.page.eval(clickByText('Clickthrough'))
  if (!opened) throw new Error('could not open the engagement switcher')
  await sleep(300)
  const clicked = await b.page.eval(clickByText(name))
  await sleep(600)
  return clicked
}

/* ---- the run ---- */

const ORG = 'Clickthrough Bank Alpha'
const DRIVER = 'SBP data submission accountability'
const INCOMPLETE = 'Intake incomplete'
const ACTIONABLE = 'Intake actionable'

console.log(`\nProgram Design click-through — real Chrome over CDP, no npm dependency\n  dev server ${BASE}\n`)

const b = await launch({ downloadPath: mkdtempSync(path.join(tmpdir(), 'dgiw-design-')) })
try {
  await b.goto(`${BASE}/dg/design`)
  await b.page.waitFor(hasText('Program Design'), { label: 'the Program Design page to render' })

  console.log('— engagement A: fill the minimal intake through the real controls')
  await createEngagement(b, 'Clickthrough A')
  await b.page.waitFor(hasText(INCOMPLETE), { label: 'the reference-mode banner' })
  check(true, 'fresh engagement renders the "Intake incomplete" banner')

  check(await b.page.eval(typeByPlaceholder('Meezan', ORG)), 'typed the organisation name')
  check(await b.page.eval(clickByText('Add regulatory driver')), 'clicked "Add regulatory driver"')
  await sleep(150)
  check(await b.page.eval(typeByPlaceholder('SBP data submission', DRIVER)), 'typed a regulatory driver')
  check(await b.page.eval(tickPillar('P01')), 'ticked pillar P01')

  await b.page.waitFor(hasText(ACTIONABLE), { label: 'the banner to flip to actionable' })
  check(true, 'banner flipped to "Intake actionable" — the imported predicate, driven through the UI')

  console.log('— reload: the intake must come back from the engagement namespace')
  await sleep(400) // let the persist effect flush
  await b.goto(`${BASE}/dg/design`)
  await b.page.waitFor(hasText('Program Design'), { label: 'the page to render after reload' })
  check((await b.page.eval(valueByPlaceholder('Meezan'))) === ORG, 'org name survived the reload')
  check((await b.page.eval(valueByPlaceholder('SBP data submission'))) === DRIVER, 'driver survived the reload')
  check((await b.page.eval(pillarChecked('P01'))) === true, 'pillar scope survived the reload')
  check(await b.page.eval(hasText(ACTIONABLE)), 'banner still actionable after reload')

  console.log('— engagement B: a second engagement must see an EMPTY intake')
  await createEngagement(b, 'Clickthrough B')
  await b.page.waitFor(hasText(INCOMPLETE), { label: 'engagement B to render the reference banner' })
  check((await b.page.eval(valueByPlaceholder('Meezan'))) === '', 'org name is empty for engagement B')
  check((await b.page.eval(pillarChecked('P01'))) === false, 'pillar scope is empty for engagement B')

  console.log('— back to A: the values must return intact')
  check(await switchToEngagement(b, 'Clickthrough A'), 'switched back to engagement A')
  await b.page.waitFor(hasText(ACTIONABLE), { label: "engagement A's actionable banner to return" })
  check((await b.page.eval(valueByPlaceholder('Meezan'))) === ORG, "engagement A's org name returned")
  check((await b.page.eval(valueByPlaceholder('SBP data submission'))) === DRIVER, "engagement A's driver returned")
  check((await b.page.eval(pillarChecked('P01'))) === true, "engagement A's pillar scope returned")

  const noise = b.consoleErrors.filter((e) => !/Download the React DevTools/.test(e))
  check(noise.length === 0, 'browser console clean', noise.length ? `\n    ${noise.join('\n    ')}` : '')
} finally {
  await b.close()
}

console.log(failures === 0 ? '\n  OK — the intake round-trips per engagement, through the real page' : `\n  ${failures} assertion(s) FAILED`)
process.exit(failures === 0 ? 0 : 1)
