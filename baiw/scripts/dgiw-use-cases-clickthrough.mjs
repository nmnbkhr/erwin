#!/usr/bin/env node
/**
 * Drive a real browser through DGIW's industry use-case portfolio and cover
 * the engagement-scoped interaction that the deterministic verification gate
 * cannot render.
 *
 *   npm run clickthrough:use-cases   (needs the dev server on port 5174)
 *
 * The script follows the existing zero-dependency CDP clickthrough pattern. It
 * asserts that the reference inventory remains visible without an engagement,
 * scope controls are gated, the Trade filter derives seven rows from the live
 * registry, selection survives reload for one engagement, and a second
 * engagement remains isolated. It also requires a clean browser console.
 *
 * NOT a build gate: it needs a dev server and Chrome, so ordinary verification
 * must not depend on it. Exit 1 on any failed assertion so it is reusable by
 * hand and in browser-capable CI.
 */
import path from 'node:path'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { launch } from './golden/cdp.mjs'

const BASE = process.env.CLICKTHROUGH_BASE ?? 'http://127.0.0.1:5174'
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

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
  el.scrollIntoView({ block: 'center' });
  el.click();
  return true;
})()`

const buttonState = (text) => `(() => {
  const el = [...document.querySelectorAll('button')]
    .find((candidate) => candidate.textContent.trim() === ${JSON.stringify(text)});
  return el ? { found: true, disabled: el.disabled } : { found: false, disabled: null };
})()`

const pressedCount = () => `document.querySelectorAll('button[aria-pressed="true"]').length`

async function createEngagement(browser, currentLabel, name) {
  if (!(await browser.page.eval(clickByText(currentLabel)))) {
    throw new Error(`could not open the engagement switcher from ${JSON.stringify(currentLabel)}`)
  }
  await sleep(250)
  if (!(await browser.page.eval(clickByText('New')))) throw new Error('engagement switcher has no "New" button')
  await sleep(250)
  const typed = await browser.page.eval(`(() => {
    const el = [...document.querySelectorAll('input')]
      .find((candidate) => candidate.type === 'text' && candidate.placeholder.includes('United Bank'));
    if (!el) return false;
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(el, ${JSON.stringify(name)});
    el.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  })()`)
  if (!typed) throw new Error('new-engagement form has no organisation-name input')
  await sleep(150)
  if (!(await browser.page.eval(clickByText('Create')))) throw new Error('new-engagement form has no "Create" button')
  await browser.page.waitFor(hasText(`${name}'s scope`), { label: `${name} to become active` })
}

async function switchToEngagement(browser, currentLabel, targetLabel) {
  if (!(await browser.page.eval(clickByText(currentLabel)))) {
    throw new Error(`could not open the engagement switcher from ${JSON.stringify(currentLabel)}`)
  }
  await sleep(250)
  const switched = await browser.page.eval(clickByText(targetLabel))
  await sleep(500)
  return switched
}

console.log(`\nDGIW industry use-case clickthrough — real Chrome over CDP, no npm dependency\n  dev server ${BASE}\n`)

const browser = await launch({
  downloadPath: mkdtempSync(path.join(tmpdir(), 'dgiw-use-cases-')),
  port: 9228,
})

try {
  await browser.goto(`${BASE}/dg/use-cases`)
  await browser.page.waitFor(hasText('Industry Use-Case Portfolio'), { label: 'the use-case portfolio to render' })

  console.log('— reference view: inventory visible, engagement writes gated')
  check(await browser.page.eval(hasText('40')), 'the computed 40-case inventory is visible')
  check(await browser.page.eval(hasText('Choose an engagement to define its use-case scope')), 'the no-engagement guidance is visible')
  const selectVisibleWithoutEngagement = await browser.page.eval(buttonState('Select visible'))
  check(selectVisibleWithoutEngagement.found && selectVisibleWithoutEngagement.disabled, '"Select visible" is disabled without an engagement')
  const selectWithoutEngagement = await browser.page.eval(buttonState('Select'))
  check(selectWithoutEngagement.found && selectWithoutEngagement.disabled, 'per-case selection is disabled without an engagement')

  console.log('— engagement A: filter Trade and select the seven visible cases')
  await createEngagement(browser, 'No engagement', 'Use Cases CT Alpha')
  check(await browser.page.eval(clickByText('Trade')), 'selected the Trade sector filter')
  await browser.page.waitFor(hasText('Showing 7 of 40 registered use cases.'), { label: 'the derived Trade result count' })
  check(true, 'Trade filter shows 7 of 40 cases')
  check(await browser.page.eval(clickByText('Select visible')), 'selected the visible Trade cases')
  await browser.page.waitFor(hasText("7 use cases in Use Cases CT Alpha's scope"), { label: 'seven cases to enter engagement A scope' })
  check((await browser.page.eval(pressedCount())) === 7, 'seven case controls report selected')

  console.log('— reload: engagement A scope survives under its namespace')
  await sleep(350)
  await browser.goto(`${BASE}/dg/use-cases`)
  await browser.page.waitFor(hasText("7 use cases in Use Cases CT Alpha's scope"), { label: 'engagement A scope after reload' })
  check((await browser.page.eval(pressedCount())) === 7, 'seven selected cases survived reload')

  console.log('— engagement B: scope starts empty; switching back restores A')
  await createEngagement(browser, 'Use Cases CT Alpha', 'Use Cases CT Beta')
  await browser.page.waitFor(hasText("0 use cases in Use Cases CT Beta's scope"), { label: 'engagement B empty scope' })
  check((await browser.page.eval(pressedCount())) === 0, 'engagement B has no selected cases')
  check(await switchToEngagement(browser, 'Use Cases CT Beta', 'Use Cases CT Alpha'), 'switched back to engagement A')
  await browser.page.waitFor(hasText("7 use cases in Use Cases CT Alpha's scope"), { label: 'engagement A scope to return' })
  check((await browser.page.eval(pressedCount())) === 7, "engagement A's seven selections returned")

  const noise = browser.consoleErrors.filter((entry) => !/Download the React DevTools/.test(entry))
  check(noise.length === 0, 'browser console clean', noise.length ? `\n    ${noise.join('\n    ')}` : '')
} finally {
  await browser.close()
}

console.log(failures === 0
  ? '\n  OK — use-case selection persists and remains isolated per engagement through the real page'
  : `\n  ${failures} assertion(s) FAILED`)
process.exit(failures === 0 ? 0 : 1)
