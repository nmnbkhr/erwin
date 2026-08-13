#!/usr/bin/env node
/**
 * Real-browser drive for DGIW's compliance assurance workflow.
 *
 *   npm run clickthrough:compliance   (needs the dev server on port 5174)
 *
 * This follows the repository's zero-dependency CDP pattern. It is deliberately
 * not part of deterministic `npm run verify`: that command must run without a
 * browser or live dev server. The script exits non-zero and is suitable for a
 * browser-enabled CI job.
 */
import path from 'node:path'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { launch, screenshot, sleep } from './golden/cdp.mjs'

const BASE = process.env.CLICKTHROUGH_BASE ?? 'http://127.0.0.1:5174'
let failures = 0
const check = (ok, label, detail = '') => {
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  ${detail}` : ''}`)
  if (!ok) failures++
}
const hasText = (value) => `document.body.textContent.includes(${JSON.stringify(value)})`
const clickByText = (text, tag = 'button') => `(() => {
  const el = [...document.querySelectorAll(${JSON.stringify(tag)})]
    .find((candidate) => candidate.textContent.trim() === ${JSON.stringify(text)}
      || candidate.textContent.trim().startsWith(${JSON.stringify(text)}));
  if (!el) return false;
  el.scrollIntoView({ block: 'center' }); el.click(); return true;
})()`
const buttonState = (text) => `(() => {
  const el = [...document.querySelectorAll('button')]
    .find((candidate) => candidate.textContent.trim().startsWith(${JSON.stringify(text)}));
  return el ? { found: true, disabled: el.disabled } : { found: false, disabled: null };
})()`
const controlHasStatus = (controlId, status) => `(() => {
  const el = [...document.querySelectorAll('button')]
    .find((candidate) => candidate.textContent.includes(${JSON.stringify(controlId)}));
  return Boolean(el && el.textContent.toLowerCase().includes(${JSON.stringify(status.toLowerCase())}));
})()`

async function createEngagement(browser, currentLabel, name) {
  if (!(await browser.page.eval(clickByText(currentLabel)))) throw new Error('could not open engagement switcher')
  await sleep(200)
  if (!(await browser.page.eval(clickByText('New')))) throw new Error('engagement switcher has no New button')
  await sleep(200)
  const typed = await browser.page.eval(`(() => {
    const el = [...document.querySelectorAll('input')]
      .find((candidate) => candidate.type === 'text' && candidate.placeholder.includes('United Bank'));
    if (!el) return false;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, ${JSON.stringify(name)});
    el.dispatchEvent(new Event('input', { bubbles: true })); return true;
  })()`)
  if (!typed || !(await browser.page.eval(clickByText('Create')))) throw new Error('could not create engagement')
  await browser.page.waitFor(hasText(name), { label: `${name} to become active` })
}

async function switchEngagement(browser, currentLabel, targetLabel) {
  if (!(await browser.page.eval(clickByText(currentLabel)))) return false
  await sleep(200)
  const switched = await browser.page.eval(clickByText(targetLabel))
  await sleep(400)
  return switched
}

const completeControl = (controlId) => `(() => {
  const header = [...document.querySelectorAll('button')].find((el) => el.textContent.includes(${JSON.stringify(controlId)}));
  if (!header) return { ok: false, reason: 'header missing' };
  const card = header.parentElement;
  const setInput = (el, value) => {
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype
      : el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
    el.dispatchEvent(new Event(el instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true }));
  };
  const field = (prefix, selector) => [...card.querySelectorAll('label')]
    .find((el) => el.textContent.trim().startsWith(prefix))?.querySelector(selector);
  const fields = {
    implementation: field('Implementation', 'select'), owner: field('Control owner', 'input'),
    evidenceReference: field('Evidence reference', 'input'), evidenceSummary: field('Evidence summary', 'textarea'),
    reviewer: field('Independent reviewer', 'input'), reviewedOn: field('Reviewed on', 'input'),
    decision: field('Review decision', 'select'),
  };
  if (Object.values(fields).some((el) => !el)) return { ok: false, reason: 'one or more fields missing' };
  setInput(fields.implementation, 'implemented');
  setInput(fields.owner, 'Data Governance Lead');
  setInput(fields.evidenceReference, 'EV-CT-001');
  setInput(fields.evidenceSummary, 'Signed mandate and current decision record independently reviewed.');
  setInput(fields.reviewer, 'Independent Assurance Reviewer');
  setInput(fields.reviewedOn, '2026-08-13');
  setInput(fields.decision, 'accepted');
  return { ok: true };
})()`

console.log(`\nDGIW compliance clickthrough — real Chrome over CDP\n  dev server ${BASE}\n`)
const browser = await launch({
  downloadPath: mkdtempSync(path.join(tmpdir(), 'dgiw-compliance-')),
  port: 9229,
})

try {
  await browser.page.send('Emulation.setDeviceMetricsOverride', {
    width: 1440, height: 900, deviceScaleFactor: 1, mobile: false,
  })
  await browser.goto(`${BASE}/dg/compliance`)
  await browser.page.waitFor(hasText('Compliance Assurance'), { label: 'compliance page to render' })

  console.log('— no engagement: sources visible, writes gated')
  check(await browser.page.eval(hasText('does not provide legal advice')), 'legal and certification boundary is visible')
  check(await browser.page.eval(hasText('Build an assurance scope from business use cases')), 'the empty state provides a clear start path')
  check(await browser.page.eval(hasText('12source instruments')), 'the reference catalogue summary is populated before scoping')
  check(await browser.page.eval(hasText('Reference control library')), 'the reusable control library is visible before scoping')
  check(await browser.page.eval(hasText('Standards and regulatory source catalogue (12)')), 'all source instruments are visible before scoping')
  const exportWithoutEngagement = await browser.page.eval(buttonState('Export assurance CSV'))
  check(exportWithoutEngagement.found && exportWithoutEngagement.disabled, 'export is disabled without an engagement')
  const referenceShot = await screenshot(browser.page, path.resolve('scripts/screenshots/dgiw-compliance-reference.png'))
  check(Boolean(referenceShot), 'captured populated reference-state screenshot', path.relative(process.cwd(), referenceShot))

  console.log('— engagement A: selected trade scope derives obligations and controls')
  await createEngagement(browser, 'No engagement', 'Assurance CT Alpha')
  await browser.goto(`${BASE}/dg/use-cases`)
  await browser.page.waitFor(hasText('Industry Use-Case Portfolio'), { label: 'use-case page to render' })
  check(await browser.page.eval(clickByText('Trade')), 'selected Trade sector')
  await browser.page.waitFor(hasText('Showing 7 of 40 registered use cases.'), { label: 'seven Trade cases' })
  check(await browser.page.eval(clickByText('Select visible')), 'selected seven Trade cases')
  await browser.page.waitFor(hasText("7 use cases in Assurance CT Alpha's scope"), { label: 'scope selection to persist' })

  await browser.goto(`${BASE}/dg/compliance`)
  await browser.page.waitFor(hasText('OBL-TRADE-01'), { label: 'trade obligations to derive' })
  check(await browser.page.eval(hasText('Applicable standards and regulatory bodies')), 'applicable standards and bodies are scoped')
  check(await browser.page.eval(hasText('World Customs Organization')), 'authoritative Trade source is in applicable scope')
  check(await browser.page.eval(hasText('CTL-001')), 'shared controls are derived from obligations')

  console.log('— evidence and independent review: one control reaches VERIFIED')
  check(await browser.page.eval(clickByText('CTL-001')), 'opened the first shared control')
  await browser.page.waitFor(`document.querySelector('textarea') !== null`, { label: 'control evidence fields to render' })
  const completed = await browser.page.eval(completeControl('CTL-001'))
  check(completed?.ok, 'filled implementation, evidence and review fields', completed?.reason ?? '')
  await browser.page.waitFor(hasText('Evidence accepted by Independent Assurance Reviewer'), { label: 'verified control state' })
  check(await browser.page.eval(hasText('This verifies the control record; it is not an organisation-wide certification.')), 'verified state keeps its narrow claim boundary')

  console.log('— output: AR-59 CSV downloads with the engagement evidence')
  check(await browser.page.eval(clickByText('Export assurance CSV')), 'started assurance CSV export')
  const downloaded = await browser.page.waitFor(
    `(${JSON.stringify(true)} && true)`,
    { timeoutMs: 500, label: 'brief export settle' },
  ).then(async () => {
    const deadline = Date.now() + 10000
    while (Date.now() < deadline) {
      const done = browser.downloads.find((row) => row.state === 'completed')
      if (done) return done
      await sleep(100)
    }
    return null
  })
  check(Boolean(downloaded && /AR-59.*\.csv$/i.test(downloaded.filename)), 'AR-59 CSV completed', downloaded?.filename ?? 'no completed download')

  console.log('— persistence and engagement isolation')
  await browser.goto(`${BASE}/dg/compliance`)
  await browser.page.waitFor(controlHasStatus('CTL-001', 'verified'), { label: 'verified status after reload' })
  check(true, 'verified assurance status survived reload')
  await createEngagement(browser, 'Assurance CT Alpha', 'Assurance CT Beta')
  await browser.page.waitFor(hasText('Select use cases on Industry Use Cases first.'), { label: 'engagement B empty scope' })
  check(await browser.page.eval(hasText('Reference control library')), 'engagement B returns to the populated reference state')
  check(!(await browser.page.eval(controlHasStatus('CTL-001', 'verified'))), 'engagement B has no leaked assurance record')
  check(await switchEngagement(browser, 'Assurance CT Beta', 'Assurance CT Alpha'), 'switched back to engagement A')
  await browser.page.waitFor(controlHasStatus('CTL-001', 'verified'), { label: 'engagement A evidence to return' })
  check(true, 'engagement A scope and review record returned')
  await browser.page.eval(clickByText('Assurance CT Alpha'))
  await browser.page.eval('window.scrollTo(0, 0)')
  await sleep(200)
  const shot = await screenshot(browser.page, path.resolve('scripts/screenshots/dgiw-compliance-assurance.png'))
  check(Boolean(shot), 'captured full-page visual review screenshot', path.relative(process.cwd(), shot))

  const noise = browser.consoleErrors.filter((entry) => !/Download the React DevTools/.test(entry))
  check(noise.length === 0, 'browser console clean', noise.length ? `\n    ${noise.join('\n    ')}` : '')
} finally {
  await browser.close()
}

console.log(failures === 0
  ? '\n  OK — applicability, evidence review, output and engagement isolation work through the real page'
  : `\n  ${failures} assertion(s) FAILED`)
process.exit(failures === 0 ? 0 : 1)
