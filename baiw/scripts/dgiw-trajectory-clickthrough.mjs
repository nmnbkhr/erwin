#!/usr/bin/env node
/**
 * Drive a real browser through G6's snapshot capture and Trajectory surfaces,
 * and take the screenshots no harness in this repo has ever produced.
 *
 *   node scripts/dgiw-trajectory-clickthrough.mjs   (needs the dev server on 5174)
 *
 * WHY THIS EXISTS
 * ---------------
 * G6 CP3: capture two snapshots at Standard tier with answers changed between,
 * see the delta with its digests on /dg/trajectory; capture one at Quick and
 * select it against a Standard one, see the not-comparable rule rendered;
 * switch engagement, see isolation hold; console clean throughout. No other
 * harness renders these components — the golden harness imports generator
 * modules and the gate compiles pure ones, so the capture button, the pair
 * selector and the chart exist only here.
 *
 * THE SCREENSHOT RIDER
 * --------------------
 * Page.captureScreenshot at named waypoints — each new G6 surface plus one
 * per existing G-series surface — written to scripts/screenshots/ (gitignored)
 * and LISTED at the end, so a human can finally review layout. Nothing
 * asserts on pixels; the PNGs are for eyes.
 *
 * NOT a gate, for clickthrough.mjs's reason: needs a dev server and a
 * browser. Exit 1 on any failed assertion so it is usable by hand.
 */
import path from 'node:path'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { launch, screenshot, sleep } from './golden/cdp.mjs'

const BASE = process.env.CLICKTHROUGH_BASE ?? 'http://127.0.0.1:5174'
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SHOTS = path.join(ROOT, 'scripts', 'screenshots')

let failures = 0
const check = (ok, label, detail = '') => {
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  ${detail}` : ''}`)
  if (!ok) failures++
}

const taken = []
const shot = async (b, name) => {
  taken.push(await screenshot(b.page, path.join(SHOTS, `${name}.png`)))
}

/* ---- in-page helpers (dgiw-design-clickthrough.mjs's idiom) ---- */

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

/** Drive the i-th maturity slider to a value, through React's own setter. */
const setSlider = (index, value) => `(() => {
  const el = [...document.querySelectorAll('input[type=range]')][${index}];
  if (!el) return false;
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(el, ${JSON.stringify(String(value))});
  el.dispatchEvent(new Event('input', { bubbles: true }));
  return true;
})()`

/** Pick the option of the n-th select whose text starts with the given label. */
const pickOption = (selectIndex, optionPrefix) => `(() => {
  const sel = [...document.querySelectorAll('select')][${selectIndex}];
  if (!sel) return false;
  const opt = [...sel.options].find(o => o.textContent.trim().startsWith(${JSON.stringify(optionPrefix)}));
  if (!opt) return false;
  const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
  setter.call(sel, opt.value);
  sel.dispatchEvent(new Event('change', { bubbles: true }));
  sel.dispatchEvent(new Event('input', { bubbles: true }));
  return true;
})()`

/** Count 32-hex digest runs currently rendered on the page. */
const digestCount = `(document.body.textContent.match(/[0-9A-F]{32}/g) ?? []).length`

/* ---- engagement helpers ---- */

async function createEngagement(b, name) {
  const opened =
    (await b.page.eval(clickByText('No engagement'))) || (await b.page.eval(clickByText('Trajectory')))
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
  const opened = await b.page.eval(clickByText('Trajectory'))
  if (!opened) throw new Error('could not open the engagement switcher')
  await sleep(300)
  const clicked = await b.page.eval(clickByText(name))
  await sleep(600)
  return clicked
}

/* ---- the run ---- */

console.log(`\nG6 Trajectory click-through — real Chrome over CDP, no npm dependency\n  dev server ${BASE}\n  screenshots -> ${SHOTS}\n`)

const b = await launch({ downloadPath: mkdtempSync(path.join(tmpdir(), 'dgiw-trajectory-')) })
try {
  await b.page.send('Emulation.setDeviceMetricsOverride', {
    width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false,
  })

  await b.goto(`${BASE}/dg/diagnostic`)
  await b.page.waitFor(hasText('Data Governance Maturity Diagnostic'), { label: 'the Diagnostic page' })
  await createEngagement(b, 'Trajectory Bank A')

  console.log('— engagement A: answer at Standard, capture "Baseline"')
  check(await b.page.eval(clickByText('Standard')), 'selected the Standard tier')
  await sleep(300)
  await shot(b, 'g2-diagnostic-tiers')
  check(await b.page.eval(setSlider(0, 2)), 'answered the first P01 question at 2')
  check(await b.page.eval(setSlider(1, 2)), 'answered the second P01 question at 2')
  await sleep(300)
  check(await b.page.eval(clickByText('View results')), 'opened the results view')
  await b.page.waitFor(hasText('Assessment snapshots'), { label: 'the snapshot capture card' })
  await shot(b, 'g6-diagnostic-capture-card')
  // The first capture's label defaults to "Baseline" — just press the button.
  check(await b.page.eval(clickByText('Capture snapshot')), 'clicked Capture snapshot')
  await b.page.waitFor(hasText('Captured "Baseline"'), { label: 'the capture confirmation' })
  const digest1 = await b.page.eval(`(document.body.textContent.match(/digest ([0-9A-F]{32})/) ?? [])[1] ?? null`)
  check(Boolean(digest1), 'the confirmation carries the full content digest', digest1)

  console.log('— change answers, capture "Re-assessment" at the same tier')
  check(await b.page.eval(clickByText('Back to questions')), 'returned to the question flow')
  await sleep(300)
  check(await b.page.eval(setSlider(0, 4)), 'moved the first answer 2 -> 4')
  check(await b.page.eval(setSlider(2, 4)), 'answered a third question at 4')
  await sleep(300)
  check(await b.page.eval(clickByText('View results')), 'reopened the results view')
  await b.page.waitFor(hasText('Assessment snapshots'), { label: 'the snapshot card again' })
  check(await b.page.eval(typeByPlaceholder('Baseline', 'Re-assessment')), 'typed the second label')
  await sleep(150)
  check(await b.page.eval(clickByText('Capture snapshot')), 'captured the second snapshot')
  await b.page.waitFor(hasText('Captured "Re-assessment"'), { label: 'the second confirmation' })

  console.log('— /dg/trajectory: deltas with digests')
  await b.goto(`${BASE}/dg/trajectory`)
  await b.page.waitFor(hasText('Pillar deltas'), { label: 'the delta table' })
  check(await b.page.eval(hasText('from: Baseline')), 'the citation names the earlier snapshot')
  check(await b.page.eval(hasText('to: Re-assessment')), 'the citation names the later snapshot')
  const digests = await b.page.eval(digestCount)
  check(digests >= 4, 'both content digests are rendered (citations + snapshot table)', `${digests} digest runs on the page`)
  check(await b.page.eval(hasText('P01')), 'P01 appears in the delta table')
  check(await b.page.eval(`/\\+\\d\\.\\d/.test(document.body.textContent)`), 'a signed delta is rendered')
  check(await b.page.eval(hasText('Excluded from the comparison')), 'exclusions are listed with reasons')
  check(await b.page.eval(hasText('Trajectory by pillar')), 'the chart card rendered')
  // The chart tiles are the svg[role=img] elements; lucide nav icons are not.
  // Straight segments are <line>, points are <circle> — a <path> in a tile
  // would be the smoothing/curve machinery non-negotiable 4 bans.
  const curves = await b.page.eval(`document.querySelectorAll('svg[role="img"] path').length`)
  const segs = await b.page.eval(`document.querySelectorAll('svg[role="img"] line').length`)
  check(curves === 0 && segs > 0, 'chart tiles draw straight <line> segments and no <path> curves', `${segs} lines, ${curves} paths`)
  await shot(b, 'g6-trajectory-deltas')

  console.log('— a Quick capture against a Standard one is not comparable')
  await b.goto(`${BASE}/dg/diagnostic`)
  await b.page.waitFor(hasText('Data Governance Maturity Diagnostic'), { label: 'the Diagnostic page again' })
  check(await b.page.eval(clickByText('Quick')), 'selected the Quick tier')
  await sleep(300)
  check(await b.page.eval(setSlider(0, 5)), 'answered the quick question at 5')
  await sleep(300)
  check(await b.page.eval(clickByText('View results')), 'opened results at Quick')
  await b.page.waitFor(hasText('Assessment snapshots'), { label: 'the snapshot card at Quick' })
  check(await b.page.eval(typeByPlaceholder('Baseline', 'Quick pulse')), 'typed the Quick label')
  await sleep(150)
  check(await b.page.eval(clickByText('Capture snapshot')), 'captured the Quick snapshot')
  await b.page.waitFor(hasText('Captured "Quick pulse"'), { label: 'the Quick confirmation' })

  await b.goto(`${BASE}/dg/trajectory`)
  await b.page.waitFor(hasText('Pillar deltas'), { label: 'the trajectory page with three snapshots' })
  check(await b.page.eval(pickOption(1, 'Quick pulse')), 'selected "Quick pulse" as the To snapshot')
  await b.page.waitFor(hasText('These two snapshots cannot be compared'), { label: 'the not-comparable card' })
  check(await b.page.eval(hasText('Standard tier')) && await b.page.eval(hasText('Quick tier')), 'both tiers are named in the rule')
  check(await b.page.eval(hasText('DELTAS ONLY BETWEEN COMPARABLE CAPTURES')), 'the rule statement itself is rendered')
  await shot(b, 'g6-trajectory-not-comparable')

  console.log('— engagement isolation')
  await createEngagement(b, 'Trajectory Bank B')
  await b.page.waitFor(hasText('No snapshot has been captured'), { label: 'engagement B to see an empty store' })
  check(true, 'engagement B sees no snapshots')
  check(await switchToEngagement(b, 'Trajectory Bank A'), 'switched back to engagement A')
  // The pair selection ("Quick pulse" as To) is component state and survives
  // the switch, so the not-comparable card is the correct render here — what
  // must return is the snapshot RECORD, all three captures intact.
  await b.page.waitFor(hasText('Re-assessment'), { label: "engagement A's snapshots to return" })
  check(await b.page.eval(hasText('Baseline')) && await b.page.eval(hasText('Quick pulse')), "engagement A's three snapshots returned intact")

  console.log('— screenshots of the earlier G-series surfaces')
  for (const [route, wait, name] of [
    ['/dg/design', 'Program Design', 'g1-program-design'],
    ['/dg/gaps', 'Gap Register', 'g3-gap-register'],
    ['/dg/plan', 'Implementation', 'g4-implementation-plan'],
    ['/dg/deliverables', 'Deliverables', 'g5-deliverables-tracking'],
  ]) {
    await b.goto(`${BASE}${route}`)
    await b.page.waitFor(hasText(wait), { label: `${route} to render` })
    await sleep(400)
    await shot(b, name)
  }

  const noise = b.consoleErrors.filter((e) => !/Download the React DevTools/.test(e))
  check(noise.length === 0, 'browser console clean', noise.length ? `\n    ${noise.join('\n    ')}` : '')
} finally {
  await b.close()
}

console.log('\n  screenshots written:')
for (const f of taken) console.log(`    ${f}`)
console.log(failures === 0 ? '\n  OK — G6 surfaces verified through the real page' : `\n  ${failures} assertion(s) FAILED`)
process.exit(failures === 0 ? 0 : 1)
