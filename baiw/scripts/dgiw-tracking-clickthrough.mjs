#!/usr/bin/env node
/**
 * Drive a real browser through the G5 delivery-tracking surfaces — the
 * behaviours no other harness sees.
 *
 *   node scripts/dgiw-tracking-clickthrough.mjs   (needs the dev server on 5174)
 *
 * Sibling of dgiw-plan-clickthrough.mjs, same zero-dependency CDP client.
 *
 * The D-020 section is the one this script exists for first: a DESIGNED
 * refusal driven through the Deliverables button must surface as an info
 * notice with a CLEAN console. Before G5 that was impossible to assert —
 * `useDeliverable.run()` printed every refusal through console.error, so the
 * console-clean assertion below would fail on working behaviour. The
 * assertion was demonstrated failing under a temporary revert of the refusal
 * branch (G5 checkpoint 1), because a guard that has never failed is
 * decoration.
 *
 * The tracking sections (checkpoint 3) then drive the delivery lifecycle and
 * KPI capture through the real controls: statuses recorded including a
 * REGRESSION with its note (append-only — both entries survive), two KPI
 * captures with sources, reload persistence, per-engagement isolation, and
 * the switch back.
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

const answerFirstRange = (value) => `(() => {
  const el = document.querySelector('input[type=range]');
  if (!el) return false;
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(el, String(${value}));
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
})()`

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

/** Click the PDF button on one Deliverables card, found by its artefact id. */
const clickPdfOnCard = (artefactId) => `(() => {
  const idEl = [...document.querySelectorAll('span')].find(s => s.textContent.trim() === ${JSON.stringify(artefactId)});
  const card = idEl?.closest('.p-5');
  const btn = [...(card?.querySelectorAll('button') ?? [])].find(b => /PDF/.test(b.textContent));
  if (!btn || btn.disabled) return false;
  btn.scrollIntoView({ block: 'center' }); btn.click(); return true;
})()`

/** Status control on one Deliverables card: pick a state, type the note, Record. */
const recordStatusOnCard = (artefactId, state, note) => `(() => {
  const idEl = [...document.querySelectorAll('span')].find(s => s.textContent.trim() === ${JSON.stringify(artefactId)});
  const card = idEl?.closest('.p-5');
  const sel = card?.querySelector('select');
  const noteEl = [...(card?.querySelectorAll('input') ?? [])].find(e => (e.placeholder ?? '').includes('note'));
  const btn = [...(card?.querySelectorAll('button') ?? [])].find(b => b.textContent.trim() === 'Record');
  if (!sel || !noteEl || !btn) return false;
  const selSet = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
  selSet.call(sel, ${JSON.stringify(state)});
  sel.dispatchEvent(new Event('change', { bubbles: true }));
  const inSet = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  inSet.call(noteEl, ${JSON.stringify(note)});
  noteEl.dispatchEvent(new Event('input', { bubbles: true }));
  btn.scrollIntoView({ block: 'center' }); btn.click(); return true;
})()`

/** The current-status chip text on one Deliverables card, or null. */
const statusChipOnCard = (artefactId) => `(() => {
  const idEl = [...document.querySelectorAll('span')].find(s => s.textContent.trim() === ${JSON.stringify(artefactId)});
  const card = idEl?.closest('.p-5');
  const strip = [...(card?.querySelectorAll('div') ?? [])].find(d => d.textContent.includes('Engagement status'));
  const chip = [...(strip?.querySelectorAll('span') ?? [])].find(s => /^(planned|in-progress|delivered|accepted)$/.test(s.textContent.trim()));
  return chip ? chip.textContent.trim() : null;
})()`

/** Fill the value+source inputs on one KPI row and press Capture. */
const captureKpiOnRow = (kpiId, value, source) => `(() => {
  const idEl = [...document.querySelectorAll('span')].find(s => s.textContent.trim() === ${JSON.stringify(kpiId)});
  const row = idEl?.closest('li');
  const valueEl = [...(row?.querySelectorAll('input') ?? [])].find(e => e.placeholder === 'value');
  const sourceEl = [...(row?.querySelectorAll('input') ?? [])].find(e => e.placeholder === 'source');
  const btn = [...(row?.querySelectorAll('button') ?? [])].find(b => b.textContent.trim() === 'Capture');
  if (!valueEl || !sourceEl || !btn) return false;
  const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  set.call(valueEl, ${JSON.stringify(value)});
  valueEl.dispatchEvent(new Event('input', { bubbles: true }));
  set.call(sourceEl, ${JSON.stringify(source)});
  sourceEl.dispatchEvent(new Event('input', { bubbles: true }));
  btn.scrollIntoView({ block: 'center' }); btn.click(); return true;
})()`

async function createEngagement(b, name) {
  const opened =
    (await b.page.eval(clickByText('No engagement'))) || (await b.page.eval(clickByText('Track-CT')))
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

console.log(`\nDelivery-tracking click-through — real Chrome over CDP, no npm dependency\n  dev server ${BASE}\n`)

const b = await launch({ downloadPath: mkdtempSync(path.join(tmpdir(), 'dgiw-track-')), port: 9227 })
try {
  console.log('— seed: measurements WITHOUT an intake, so AR-55 is enabled but must refuse')
  await b.goto(`${BASE}/dg/diagnostic`)
  await b.page.waitFor(hasText('Maturity Diagnostic'), { label: 'the diagnostic page' })
  await createEngagement(b, 'Track-CT Alpha')
  await sleep(400)
  check(await b.page.eval(clickByText('Quick')), 'selected the Quick tier')
  await b.page.waitFor(hasText('/ 11 at this tier'), { label: 'the Quick question count' })
  check(await b.page.eval(answerFirstRange(2)), "answered P01's quick question at 2")
  await b.page.waitFor(hasText('1 / 11 at this tier'), { label: 'the first answer' })
  check(await b.page.eval(clickByText('View results')), 'opened results')
  await b.page.waitFor(hasText('Target state'), { label: 'the target table' })
  check(await b.page.eval(setTargetForPillar('P01', 4)), 'target P01 = 4')
  await sleep(400)

  console.log('— D-020: the refusing button surfaces tone info, and the console stays CLEAN')
  await b.goto(`${BASE}/dg/deliverables`)
  await b.page.waitFor(hasText('Deliverables'), { label: 'the pack view' })
  check(await b.page.eval(clickPdfOnCard('AR-55')), "clicked AR-55's PDF button (enabled — one pillar has both measurements)")
  await b.page.waitFor(hasText('engagement-mode only'), { label: 'the refusal notice' })
  const banner = await b.page.eval(`(() => {
    const el = [...document.querySelectorAll('div')].find(d =>
      d.className.includes('rounded-lg border') && d.textContent.includes('engagement-mode only'));
    return el ? el.className : null;
  })()`)
  check(Boolean(banner) && banner.includes('border-slate-200') && !banner.includes('rose'),
    'the refusal notice renders in the INFO tone, not the error tone', banner ?? 'banner missing')
  check(!(await b.page.eval(`document.body.textContent.includes('Generation failed')`)),
    'no failure wording anywhere on the page')

  const noise = b.consoleErrors.filter((e) => !/Download the React DevTools/.test(e))
  check(noise.length === 0, 'browser console clean — a DESIGNED refusal prints nothing (D-020)',
    noise.length ? `\n    ${noise.join('\n    ')}` : '')

  console.log('— statuses: record, then REGRESS with a note — append-only through the UI')
  check(await b.page.eval(recordStatusOnCard('AR-13', 'delivered', '')), 'recorded AR-13 delivered')
  await sleep(300)
  check((await b.page.eval(statusChipOnCard('AR-13'))) === 'delivered', "AR-13's chip reads delivered")
  check(await b.page.eval(recordStatusOnCard('AR-13', 'in-progress', 'client returned the draft register')),
    'regressed AR-13 to in-progress WITH a note')
  await sleep(300)
  check((await b.page.eval(statusChipOnCard('AR-13'))) === 'in-progress', 'the chip reads the LAST entry')
  check(await b.page.eval(hasText('2 transitions logged')), 'both transitions survive — the regression appended, nothing was rewritten')
  check(await b.page.eval(recordStatusOnCard('AR-01', 'accepted', '')), 'recorded AR-01 accepted')
  await sleep(300)

  console.log('— KPI capture needs the engagement plan: make the intake actionable')
  await b.goto(`${BASE}/dg/design`)
  await b.page.waitFor(hasText('Program Design'), { label: 'the design page' })
  check(await b.page.eval(typeByPlaceholder('Meezan', 'Track Bank Limited')), 'typed the organisation name')
  check(await b.page.eval(clickByText('Add regulatory driver')), 'added a regulatory driver row')
  await sleep(200)
  check(await b.page.eval(typeByPlaceholder('SBP data submission', 'BCBS 239 delivery accountability')), 'typed the driver')
  await sleep(200)
  check(await b.page.eval(tickPillar('P01')), 'scoped P01')
  await sleep(400)

  console.log('— KPI capture: two entries through the real controls, values typed never computed')
  await b.goto(`${BASE}/dg/plan`)
  await b.page.waitFor(hasText('Engagement plan available'), { label: 'the engagement view' })
  check(await b.page.eval(hasText('no measurement recorded')), 'unmeasured KPIs say so — never a placeholder')
  check(await b.page.eval(captureKpiOnRow('K-W0-01', '58 of 76', 'CDE register v3')), 'captured K-W0-01')
  await sleep(300)
  check(await b.page.eval(captureKpiOnRow('K-W0-02', '71%', 'steward letters')), 'captured K-W0-02')
  await sleep(400)
  check(await b.page.eval(hasText('58 of 76')) && (await b.page.eval(hasText('CDE register v3'))),
    'the first capture renders with its source')
  check(await b.page.eval(hasText('71%')), 'the second capture renders')
  // AR-01 is the P01 deliverable on this slice (AR-13 is P03's and is not
  // here) — its recorded 'accepted' must reach the slice deliverable row.
  check(await b.page.eval(hasText('accepted')), "AR-01's recorded status reaches the slice deliverable row")

  console.log('— reload: everything comes back from the engagement namespace')
  await sleep(400)
  await b.goto(`${BASE}/dg/plan`)
  await b.page.waitFor(hasText('Engagement plan available'), { label: 'the engagement view after reload' })
  check(await b.page.eval(hasText('58 of 76')) && (await b.page.eval(hasText('71%'))), 'both captures survived the reload')
  await b.goto(`${BASE}/dg/deliverables`)
  await b.page.waitFor(hasText('Deliverables'), { label: 'the pack view after reload' })
  check((await b.page.eval(statusChipOnCard('AR-13'))) === 'in-progress', "AR-13's status survived the reload")
  check(await b.page.eval(hasText('2 transitions logged')), 'the full history survived the reload')

  console.log('— engagement B: empty; back to A: restored')
  await createEngagement(b, 'Track-CT Beta')
  await sleep(500)
  check((await b.page.eval(statusChipOnCard('AR-13'))) === null, 'engagement B tracks nothing')
  const opened = await b.page.eval(clickByText('Track-CT Beta'))
  check(opened, 'opened the switcher from engagement B')
  await sleep(300)
  check(await b.page.eval(clickByText('Track-CT Alpha')), 'switched back to engagement A')
  await sleep(600)
  check((await b.page.eval(statusChipOnCard('AR-13'))) === 'in-progress', "engagement A's statuses returned")

  const noise2 = b.consoleErrors.filter((e) => !/Download the React DevTools/.test(e))
  check(noise2.length === 0, 'browser console clean through the whole run',
    noise2.length ? `\n    ${noise2.join('\n    ')}` : '')
} finally {
  await b.close()
}

console.log(failures === 0 ? '\n  OK — refusal channel, append-only statuses and KPI capture hold through the real pages' : `\n  ${failures} assertion(s) FAILED`)
process.exit(failures === 0 ? 0 : 1)
