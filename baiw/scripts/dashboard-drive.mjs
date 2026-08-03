#!/usr/bin/env node
/**
 * dashboard-drive.mjs — exercise the dashboard scoring paths no fixture reaches.
 *
 * ─── WHY THIS EXISTS ───────────────────────────────────────────────────────
 *
 * `scripts/golden/` renders PDFs. `scripts/check/` reads datasets and source
 * text. Neither runs a React component, so the two maturity radars on the
 * dashboards — BAIW's `MaturityRadarCard` and HAIW's `HaiwDashboard` — were
 * verified by nothing at all, and both carried a fabrication for two phases:
 *
 *   D-012  BAIW sliced the answer list POSITIONALLY into eight equal blocks and
 *          labelled them with the eight category names. Eight answers to one
 *          category put a score on all eight axes.
 *   D-013  HAIW drew `Math.floor(Math.random() * 2) + 2` over eight labels, not
 *          one of which was an HACR category.
 *
 * Both were fixed onto `src/scoring/maturity.ts`. "The baselines did not move"
 * is not evidence for either — the harness cannot see these files. This is the
 * evidence: seed answers, call the real exported function, print what each axis
 * would draw. It asserts nothing; a human reads the table, which is the same
 * contract `scripts/golden/geometry.mjs` ships under.
 *
 * The seeded case is deliberately the one that only the fixed code gets right:
 * ONE category answered out of eight. At 8-of-8 the broken and the fixed code
 * agree exactly, which is why every golden fixture missed this class twice.
 *
 *   node scripts/dashboard-drive.mjs
 */
import { createServer } from 'vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/** Minimal localStorage. `engagement/storage.ts` guards every access already. */
function installStorage() {
  const map = new Map()
  const storage = {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    key: (i) => [...map.keys()][i] ?? null,
    clear: () => map.clear(),
    get length() { return map.size },
  }
  globalThis.localStorage = storage
  globalThis.window = { localStorage: storage }
  return storage
}

const line = (s) => console.log(s)
const rule = () => line('─'.repeat(78))

const label = (agg) =>
  agg.state === 'scored' ? agg.current.toFixed(1)
  : agg.state === 'not-assessed' ? 'NOT ASSESSED'
  : 'NOT APPLICABLE'

async function main() {
  const storage = installStorage()
  /*
   * `optimizeDeps: { noDiscovery: true }` — the same option, for the same reason,
   * as `scripts/golden/harness.mjs`, whose comment states it plainly: SSR never
   * touches the pre-bundle, so discovery would crawl the whole app for nothing and
   * then complain when the server is closed.
   *
   * That complaint was 3,736 lines — 49% of everything `npm run verify` printed.
   * The dep scanner starts in the background, `finally { vite.close() }` closes the
   * server before it finishes, and every module it was mid-resolve on throws
   * "The server is being restarted or closed. Request is outdated" as a full
   * esbuild-formatted error block naming a file this script never asked for. It was
   * identical at HEAD, so it predates the pages that appear in it; it named
   * `src/alm/...` and `src/components/QuickAssessment.tsx` while driving two radars.
   *
   * NOTHING IS FILTERED. The crawl is not started, so the output is not suppressed —
   * it is not produced. A stderr filter would have been the wrong fix twice over:
   * it would hide a real vite error the day one appears, and it would leave the
   * race in place for the next tool that closes this server.
   */
  const vite = await createServer({
    root: ROOT,
    appType: 'custom',
    server: { middlewareMode: true },
    logLevel: 'error',
    optimizeDeps: { noDiscovery: true, include: [] },
  })

  try {
    // ── HAIW ────────────────────────────────────────────────────────────────
    // Answers are filed under the active engagement, so the drive goes through
    // the same namespacing the assessment screen writes with. A driver that
    // wrote a bare key would prove the card reads a key nobody writes, which is
    // the defect (D4 site 3), not the verification.
    const { HACR_ANSWERS_KEY, HACR_CATEGORIES, hacrRadarState } = await vite.ssrLoadModule('/src/haiw/hacr.ts')
    const { nsKey } = await vite.ssrLoadModule('/src/engagement/storage.ts')

    const ENGAGEMENT = 'drive-engagement'
    // Ten answers, all in one category, all at current 2 / desired 4.
    const seeded = {}
    for (let i = 1; i <= 10; i++) {
      const id = `HACR-WS-${String(i).padStart(3, '0')}`
      seeded[id] = { questionId: id, currentState: 2, desiredState: 4 }
    }
    storage.setItem(nsKey(HACR_ANSWERS_KEY, ENGAGEMENT), JSON.stringify(seeded))

    rule()
    line('HAIW — HaiwDashboard radar   (D-013)')
    line(`  seeded: 10 answers, all "Workforce & Skills", current 2 / desired 4`)
    line(`  before the fix every axis carried Math.floor(Math.random()*2)+2, and`)
    line(`  not one of the eight labels was an HACR category.`)
    rule()

    const empty = hacrRadarState(null)
    line(`  no engagement selected → answered ${empty.answered}, ` +
      `${empty.outcomes.filter((o) => o.agg.state === 'scored').length} scored (the card shows its empty state)`)

    const state = hacrRadarState(ENGAGEMENT)
    line(`  engagement "${ENGAGEMENT}" → answered ${state.answered}`)
    line('')
    for (const o of state.outcomes) line(`    ${o.name.padEnd(34)} ${label(o.agg)}`)
    line('')
    const { coverageStatement } = await vite.ssrLoadModule('/src/scoring/maturity.ts')
    line(`  coverage line under the chart: ${coverageStatement(state.outcomes)}`)
    line(`  axes plotted: ${state.outcomes.filter((o) => o.agg.state === 'scored').length} of ${HACR_CATEGORIES.length}` +
      ` — the other ${state.outcomes.length - state.outcomes.filter((o) => o.agg.state === 'scored').length} plot null, not 0`)

    // ── BAIW ────────────────────────────────────────────────────────────────
    // Unnamespaced on purpose: `MaturityRadarCard` reads `baiw-assessment`
    // directly, which is what it does in the app today. Namespacing BAIW's
    // assessment is a separate change with its own migration.
    const { getAssessmentProgress } = await vite.ssrLoadModule('/src/components/dashboard/MaturityRadarCard.tsx')
    const baiwAnswers = {}
    for (let i = 1; i <= 8; i++) {
      const id = `agility_summary_${String(i).padStart(3, '0')}`
      baiwAnswers[id] = { questionId: id, currentState: 2, desiredState: 4 }
    }
    storage.setItem('baiw-assessment', JSON.stringify({ answers: baiwAnswers, currentCategory: 0, completed: false }))

    rule()
    line('BAIW — MaturityRadarCard     (D-012)')
    line('  seeded: 8 answers, all "Agility"')
    line('  before the fix `floor(answered / 8)` called this 1 category assessed')
    line('  by arithmetic on the COUNT, whichever category the answers came from.')
    rule()
    const prog = getAssessmentProgress()
    line(`  categoriesAssessed ${prog.categoriesAssessed} of ${prog.total}` +
      `  — categories with at least one answer, attributed by question id`)
    rule()
  } finally {
    await vite.close()
  }
}

main().catch((err) => { console.error(err); process.exit(1) })
