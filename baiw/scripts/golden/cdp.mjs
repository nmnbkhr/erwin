/**
 * A minimal Chrome DevTools Protocol client, with no npm dependency.
 *
 * WHY NOT PUPPETEER
 * -----------------
 * CLAUDE.md hard rule 4: zero test frameworks, and none may be installed
 * unasked. That rule has cost this project three honest "I could not drive a
 * browser" caveats across the D2 migration — the report component call site is
 * the one path the golden harness never touches, because the harness imports the
 * generator module directly and the hook that builds its ReportMeta lives in
 * React.
 *
 * It turns out no dependency is needed. Chrome is already on the machine and
 * Node 22 ships a global `WebSocket`, which is the entire surface CDP requires:
 * `fetch` the target list over HTTP, open one socket, send `{id, method,
 * params}`, match replies by id. That is ~80 lines, which is this file.
 *
 * Deliberately small. It does what the click-through needs — navigate, evaluate,
 * click, wait, capture downloads — and nothing else. If it starts growing a
 * selector engine or an auto-wait heuristic, that is the signal to stop and ask
 * for a real driver rather than to keep going here.
 */
import { spawn } from 'node:child_process'
import { mkdtempSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

const CHROME_CANDIDATES = [
  '/opt/google/chrome/chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/snap/bin/chromium',
]

export function findChrome() {
  const found = CHROME_CANDIDATES.find((p) => existsSync(p))
  if (!found) throw new Error(`no Chrome binary found; looked in:\n  ${CHROME_CANDIDATES.join('\n  ')}`)
  return found
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** Poll an HTTP endpoint until it answers, so we never race Chrome's startup. */
async function waitForJson(url, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs
  let lastErr
  while (Date.now() < deadline) {
    try { return await (await fetch(url)).json() } catch (e) { lastErr = e; await sleep(100) }
  }
  throw new Error(`${url} never answered within ${timeoutMs}ms: ${lastErr}`)
}

/** One CDP session over one WebSocket. */
class Session {
  constructor(ws) {
    this.ws = ws
    this.nextId = 1
    this.pending = new Map()
    this.listeners = new Map()
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data)
      if (msg.id !== undefined) {
        const p = this.pending.get(msg.id)
        if (!p) return
        this.pending.delete(msg.id)
        msg.error ? p.reject(new Error(`${msg.error.message} (${JSON.stringify(msg.error.data ?? '')})`)) : p.resolve(msg.result)
      } else {
        for (const fn of this.listeners.get(msg.method) ?? []) fn(msg.params)
      }
    })
  }

  send(method, params = {}) {
    const id = this.nextId++
    this.ws.send(JSON.stringify({ id, method, params }))
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      setTimeout(() => {
        if (this.pending.delete(id)) reject(new Error(`CDP ${method} timed out after 30s`))
      }, 30000)
    })
  }

  on(method, fn) {
    if (!this.listeners.has(method)) this.listeners.set(method, [])
    this.listeners.get(method).push(fn)
  }

  /**
   * Evaluate in the page and return the value.
   *
   * `awaitPromise` and `returnByValue` are both on: every caller here wants a
   * plain JS value back, and a rejected promise must surface as a thrown error
   * rather than as a silently undefined result.
   */
  async eval(expression) {
    const r = await this.send('Runtime.evaluate', {
      expression, awaitPromise: true, returnByValue: true, userGesture: true,
    })
    if (r.exceptionDetails) {
      throw new Error(`page threw: ${r.exceptionDetails.exception?.description ?? r.exceptionDetails.text}`)
    }
    return r.result.value
  }

  /** Poll an in-page predicate. Returns the value; throws with context on timeout. */
  async waitFor(expression, { timeoutMs = 15000, label = expression } = {}) {
    const deadline = Date.now() + timeoutMs
    let last
    while (Date.now() < deadline) {
      last = await this.eval(`(() => { try { return ${expression} } catch (e) { return null } })()`)
      if (last) return last
      await sleep(120)
    }
    throw new Error(`timed out after ${timeoutMs}ms waiting for: ${label} (last value ${JSON.stringify(last)})`)
  }

  close() { try { this.ws.close() } catch { /* already gone */ } }
}

async function connect(wsUrl) {
  const ws = new WebSocket(wsUrl)
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true })
    ws.addEventListener('error', () => reject(new Error(`could not open ${wsUrl}`)), { once: true })
  })
  return new Session(ws)
}

/**
 * Launch headless Chrome and return `{ page, downloads, close }`.
 *
 * `downloads` is filled by Browser.downloadWillBegin / downloadProgress, which is
 * the only way to see a `doc.save()` land: file-saver and jsPDF both go through
 * an anchor click, so nothing in the page's own JS reports the filename.
 */
export async function launch({ downloadPath, port = 9223 }) {
  const binary = findChrome()
  const userDataDir = mkdtempSync(path.join(tmpdir(), 'erwin-cdp-'))
  const proc = spawn(binary, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    '--no-first-run', '--no-default-browser-check', '--disable-gpu',
    '--no-sandbox', '--disable-dev-shm-usage',
    // Nothing here may reach the network: this suite has no backend, and a
    // component update check would be noise in the console assertions below.
    '--disable-background-networking', '--disable-component-update', '--disable-sync',
    'about:blank',
  ], { stdio: 'ignore' })

  const version = await waitForJson(`http://127.0.0.1:${port}/json/version`)
  const browser = await connect(version.webSocketDebuggerUrl)

  const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank' })
  const targets = await waitForJson(`http://127.0.0.1:${port}/json/list`)
  const target = targets.find((t) => t.id === targetId)
  if (!target?.webSocketDebuggerUrl) throw new Error('created a target with no debugger URL')
  const page = await connect(target.webSocketDebuggerUrl)

  await page.send('Page.enable')
  await page.send('Runtime.enable')
  await page.send('Log.enable')

  const downloads = []
  browser.on('Browser.downloadWillBegin', (p) => downloads.push({ guid: p.guid, filename: p.suggestedFilename, state: 'begin' }))
  browser.on('Browser.downloadProgress', (p) => {
    const d = downloads.find((x) => x.guid === p.guid)
    if (d) { d.state = p.state; d.bytes = p.totalBytes }
  })
  await browser.send('Browser.setDownloadBehavior', {
    behavior: 'allow', downloadPath, eventsEnabled: true,
  })

  /** Console errors and page exceptions, so "console clean" is measured. */
  const consoleErrors = []
  page.on('Runtime.exceptionThrown', (p) =>
    consoleErrors.push(`exception: ${p.exceptionDetails.exception?.description ?? p.exceptionDetails.text}`))
  page.on('Runtime.consoleAPICalled', (p) => {
    if (p.type === 'error' || p.type === 'warning') {
      consoleErrors.push(`${p.type}: ${p.args.map((a) => a.value ?? a.description ?? a.type).join(' ')}`)
    }
  })
  page.on('Log.entryAdded', (p) => {
    if (p.entry.level === 'error') consoleErrors.push(`log: ${p.entry.text}`)
  })

  return {
    page,
    browser,
    downloads,
    consoleErrors,
    async goto(url) {
      await page.send('Page.navigate', { url })
      await page.waitFor(`document.readyState === 'complete'`, { label: `${url} to finish loading` })
    },
    async close() {
      page.close(); browser.close()
      proc.kill('SIGTERM')
      await sleep(200)
    },
  }
}

/**
 * G6 screenshot rider: capture the page as a PNG for human layout review.
 * The click-throughs call this at named waypoints and list the files they
 * wrote — nothing asserts on the pixels; a screenshot is for eyes, which is
 * the one instrument this repo's harnesses have never had.
 */
export async function screenshot(page, filePath) {
  const { writeFileSync, mkdirSync } = await import('node:fs')
  mkdirSync(path.dirname(filePath), { recursive: true })
  // Full page, not the viewport: the layout defects worth catching (an
  // overflowing tile, a collapsed grid) are usually below the fold.
  const { data } = await page.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true })
  writeFileSync(filePath, Buffer.from(data, 'base64'))
  return filePath
}

export { sleep }
