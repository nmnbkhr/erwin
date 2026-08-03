/**
 * Golden-output harness — shared core for capture.mjs and compare.mjs.
 *
 * WHY THIS FILE EXISTS AT ALL
 * ---------------------------
 * The dominant structural fact of this repo is copy-paste (CLAUDE.md says so at
 * length: six layout shells, three report generators). Capture and compare need
 * the same Vite driver, the same fixture loading, the same PDF/CSV/Markdown
 * analysis and the same normalisation. Duplicating ~400 lines across two scripts
 * would guarantee they drift, and a compare that analyses differently from the
 * capture it is diffing against is worse than no harness. One core, two thin
 * entry points.
 *
 * WHAT IT DRIVES
 * --------------
 * Vite's programmatic SSR (`createServer` + `ssrLoadModule`), not a browser and
 * not CDP. It loads the real generator `.ts` modules with their real imports,
 * which is what D2 changes. `file-saver` is aliased to a sink and
 * `jsPDF.API.save` is patched so artefacts come back as bytes instead of
 * triggering a download.
 *
 * `resolve.conditions` is forced to browser. The app ships jspdf.es.min.js; the
 * `node` condition would resolve jspdf.node.min.js, a different bundle no user
 * ever renders (and CJS, which Vite's SSR inliner cannot evaluate at all).
 *
 * NOTHING HERE MAY READ THE CLOCK OR Math.random. The harness has to be more
 * deterministic than the thing it is measuring.
 */

import { createServer } from 'vite'
import { createHash } from 'node:crypto'
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { installDomSink, DOM_SINK } from './dom-sink.mjs'
/*
 * The fingerprint declaration is a SHARED module, not a local const, as of D5
 * stage E1. `check/suite/fingerprint-coverage.mjs` asserts that what a module's
 * generators import is a subset of what its fingerprint declares, and it cannot
 * import this file to find out — that would pull Vite into a gate that runs in
 * two seconds. Two copies of the rule is the shape D-010 came from, so there is
 * one copy and both sides import it.
 */
import {
  fixtureDataSources,
  SHARED_DATASETS,
  assertModulesMatch,
} from './fingerprint-decl.mjs'

/** Re-exported: this was defined here until D5 stage E1 and has outside callers. */
export { fixtureDataSources }

const HERE = path.dirname(fileURLToPath(import.meta.url))

/** `baiw/` — the Vite root and the base for every repo-relative path here. */
export const APP_ROOT = path.resolve(HERE, '../..')
export const FIXTURE_DIR = path.join(HERE, 'fixtures')
export const BASELINE_DIR = path.join(HERE, 'baseline')
/** Raw artefacts for eyeballing. Gitignored — see scripts/golden/.gitignore. */
export const RAW_DIR = path.join(HERE, 'raw')

export const MODULES = ['baiw', 'taiw', 'haiw', 'dgiw']

/*
 * A module present here but not in FINGERPRINTED_MODULES would record a
 * fingerprint whose coverage nothing verifies. Asserted at import rather than
 * documented — see fingerprint-decl.mjs::assertModulesMatch.
 */
assertModulesMatch(MODULES)

/**
 * DGIW's accent, copied from useDeliverable.ts's DGIW_ACCENT (rose-600).
 * Duplicated rather than imported because that module is a React hook.
 */
const DGIW_ACCENT = [225, 29, 72]

/** Every DGIW deliverable the UI can produce, mirrored from its call sites. */
const DGIW_REPORT = (file) => `/src/dgiw/report/${file}.ts`

// ── Environment pinning ──────────────────────────────────────────────────
// Step 1 measured this: TZ=Pacific/Kiritimati changes both the PDF's extracted
// text (the cover date rolls to the next day) and the markdown date line. A
// capture taken on a differently-configured machine would therefore differ from
// the baseline for no reason a reviewer could act on. Pin, don't document.

export const PINNED = {
  TZ: 'UTC',
  LANG: 'en_US.UTF-8',
  LC_ALL: 'en_US.UTF-8',
  /** What Intl must resolve to once LC_ALL has taken hold. */
  locale: 'en-US',
}

/**
 * Pin TZ and the ICU default locale, re-executing if the locale cannot be fixed
 * in place.
 *
 * `process.env.TZ = ...` takes effect immediately (V8 clears its timezone
 * cache). `process.env.LC_ALL = ...` does NOT — ICU resolves the default locale
 * once, at process start, and ignores later assignment. Verified on Node
 * v22.22.2: starting under LC_ALL=de_DE and assigning en_US.UTF-8 still leaves
 * `Intl.DateTimeFormat().resolvedOptions().locale === 'de-DE'`, which is enough
 * to change `toLocaleDateString()` from `7/31/2026` to `31.7.2026`.
 *
 * So: fix TZ in place, and if the locale is wrong, re-run ourselves with the
 * right environment. Loud, deterministic, one extra process at most.
 */
export function pinEnvironment() {
  process.env.TZ = PINNED.TZ
  const locale = new Intl.DateTimeFormat().resolvedOptions().locale
  if (locale === PINNED.locale) return

  if (process.env.GOLDEN_REEXEC === '1') {
    throw new Error(
      `Cannot pin the ICU locale: wanted ${PINNED.locale}, got ${locale}, even after re-exec ` +
      `with LC_ALL=${PINNED.LC_ALL}. This Node build may lack full ICU. Refusing to capture ` +
      `against an unpinned locale — the markdown date line would silently differ.`,
    )
  }

  const r = spawnSync(process.execPath, [process.argv[1], ...process.argv.slice(2)], {
    stdio: 'inherit',
    env: { ...process.env, ...PINNED, GOLDEN_REEXEC: '1' },
  })
  process.exit(r.status ?? 1)
}

/**
 * The EFFECTIVE environment — what actually decides what the generators render.
 * Recorded in every baseline so a mismatch is visible rather than mysterious.
 *
 * Deliberately not the raw env vars: pinEnvironment() may or may not have needed
 * to re-exec, so LC_ALL is set on one machine and unset on another while both
 * resolve `en-US`. Comparing the raw vars would flag a difference that changes
 * no byte of output. The raw vars are recorded separately, as context.
 */
export function environmentStamp() {
  const resolved = new Intl.DateTimeFormat().resolvedOptions()
  return { tz: process.env.TZ ?? null, icuLocale: resolved.locale, icuTimeZone: resolved.timeZone }
}

/** The raw variables behind the stamp. Context for a human, never compared. */
export function environmentVars() {
  return { LANG: process.env.LANG ?? null, LC_ALL: process.env.LC_ALL ?? null, reexeced: process.env.GOLDEN_REEXEC === '1' }
}

// ── CLI ──────────────────────────────────────────────────────────────────

export function parseArgs(argv) {
  const out = { modules: [...MODULES] }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--module' || a === '-m') {
      const v = argv[++i]
      if (!MODULES.includes(v)) throw new Error(`--module must be one of ${MODULES.join('|')}, got ${JSON.stringify(v)}`)
      out.modules = [v]
    } else if (a.startsWith('--module=')) {
      const v = a.slice('--module='.length)
      if (!MODULES.includes(v)) throw new Error(`--module must be one of ${MODULES.join('|')}, got ${JSON.stringify(v)}`)
      out.modules = [v]
    } else if (a === '--help' || a === '-h') {
      out.help = true
    } else {
      throw new Error(`unknown argument ${JSON.stringify(a)}`)
    }
  }
  return out
}

// ── The nine artefacts ───────────────────────────────────────────────────
// `id` is the baseline filename and is deliberately NOT the output filename:
// D2 renames every output via reportFilename(), and the artefact's identity has
// to survive that.

export const REGISTRY = {
  /*
   * BAIW — migrated onto the spine in D2 step 3, PDF and markdown only. Same
   * shape as HAIW's and TAIW's: `artefactIdExport` so the harness reads the id
   * from the generator rather than restating it, and `profile` naming the
   * REPORT_PROFILES entry the real call site passes to useReportMeta().
   *
   * `assertRawBytes` is on for the PDF and the markdown, as it is for TAIW's and
   * HAIW's. It could not be before D2: a pre-spine generator re-rolled the
   * trailer /ID from Math.random on every call, so a byte hash was a different
   * number every run and storing it would have rewritten the baseline on every
   * capture. ReportDoc now pins /CreationDate and /ID from meta.generatedAt, and
   * a two-run byte comparison confirms all six are reproducible — so extracted
   * text is no longer the strongest thing that can be asserted about them, and
   * asserting less than you can measure is how a regression gets through.
   *
   * gap-csv asserts raw bytes too as of D-001's removal. It emitted three
   * `Math.random` columns until then, so a byte hash was a different number
   * every run; the columns are gone, the file is the 112-row BVF capability
   * register, and nothing in it varies between two exports.
   */
  baiw: {
    entry: '/src/utils/reportGenerator.ts',
    artefacts: [
      {
        id: 'maturity-pdf',
        kind: 'pdf',
        exportName: 'generateMaturityPDF',
        assertRawBytes: true,
        artefactIdExport: 'MATURITY_ARTEFACT_ID',
        profile: 'baiw',
        call: (m, f, c) => m.generateMaturityPDF(f.assessment, c.meta),
      },
      {
        id: 'gap-csv',
        kind: 'csv',
        exportName: 'generateCapabilityRegisterCSV',
        artefactIdExport: 'REGISTER_ARTEFACT_ID',
        profile: 'baiw',
        // D-001 CLOSED BY REMOVAL. `unassertable` is gone, not relaxed: the
        // three columns it named — Current Level, Gap, Priority — no longer
        // exist. Nothing here is derived from the assessment any more, so the
        // call takes only meta.
        //
        // The baseline id stays `gap-csv` while the artefact id became
        // MR-BAIW-REGISTER: renaming the id would orphan the committed baseline
        // and read as a deletion plus an addition in the diff, which is the
        // opposite of what this change wants to show.
        assertRawBytes: true,
        call: (m, _f, c) => m.generateCapabilityRegisterCSV(c.meta),
      },
      {
        id: 'roadmap-md',
        kind: 'md',
        exportName: 'generateRoadmapMarkdown',
        assertRawBytes: true,
        artefactIdExport: 'ROADMAP_ARTEFACT_ID',
        profile: 'baiw',
        call: (m, f, c) => m.generateRoadmapMarkdown(f.assessment, c.meta),
      },
    ],
  },
  /*
   * TAIW — migrated onto the spine in D2 step 2, PDF and markdown only. Same
   * shape as HAIW: `artefactIdExport` so the harness reads the id from the
   * generator rather than restating it, and `profile` naming the REPORT_PROFILES
   * entry the real call site passes to useReportMeta().
   *
   * gap-csv asserts raw bytes too as of D-001's removal — the 100-row TCF
   * capability register, with no derived column left in it.
   */
  taiw: {
    entry: '/src/taiw/utils/tradeReportGenerator.ts',
    artefacts: [
      {
        id: 'maturity-pdf',
        kind: 'pdf',
        exportName: 'generateTradeMaturityPDF',
        assertRawBytes: true,
        artefactIdExport: 'TRADE_MATURITY_ARTEFACT_ID',
        profile: 'taiw',
        call: (m, f, c) => m.generateTradeMaturityPDF(f.assessment, c.meta),
      },
      {
        id: 'gap-csv',
        kind: 'csv',
        exportName: 'generateTradeCapabilityRegisterCSV',
        artefactIdExport: 'TRADE_REGISTER_ARTEFACT_ID',
        profile: 'taiw',
        // D-001 closed by removal, as BAIW's above. Baseline id kept as
        // `gap-csv` for the same reason; artefact id is now MR-TAIW-REGISTER.
        assertRawBytes: true,
        call: (m, _f, c) => m.generateTradeCapabilityRegisterCSV(c.meta),
      },
      {
        id: 'roadmap-md',
        kind: 'md',
        exportName: 'generateTradeRoadmapMarkdown',
        assertRawBytes: true,
        artefactIdExport: 'TRADE_ROADMAP_ARTEFACT_ID',
        profile: 'taiw',
        call: (m, f, c) => m.generateTradeRoadmapMarkdown(f.assessment, c.meta),
      },
      /*
       * PARTIAL — D4. The first artefacts in this repo that exercise an
       * unanswered category.
       *
       * Every fixture before these answers every question, which is precisely why
       * the defect D4 fixed was invisible for the whole of Phase D: at 8-of-8 the
       * ÷scored and ÷all rules coincide at the same number, so the two
       * implementations agreed on every baseline while disagreeing by a factor of
       * two on any half-finished assessment.
       *
       * `orgName` differs so the artefact gets its own filename — see metaFor —
       * and so a reader comparing the two captures can tell which is which from
       * the cover.
       */
      {
        id: 'maturity-pdf-partial',
        kind: 'pdf',
        exportName: 'generateTradeMaturityPDF',
        assertRawBytes: true,
        artefactIdExport: 'TRADE_MATURITY_ARTEFACT_ID',
        profile: 'taiw',
        orgName: 'Fixture Customs Authority Partial',
        call: (m, f, c) => m.generateTradeMaturityPDF(f.assessmentPartial, c.meta),
      },
      {
        id: 'roadmap-md-partial',
        kind: 'md',
        exportName: 'generateTradeRoadmapMarkdown',
        assertRawBytes: true,
        artefactIdExport: 'TRADE_ROADMAP_ARTEFACT_ID',
        profile: 'taiw',
        orgName: 'Fixture Customs Authority Partial',
        call: (m, f, c) => m.generateTradeRoadmapMarkdown(f.assessmentPartial, c.meta),
      },
      /*
       * ── THE FRAMEWORK ARTEFACTS, D5 STAGE E3 ───────────────────────────
       *
       * Three things differ from the five above and each is deliberate:
       *
       *  - Their own `entry`, per artefact. These generators are in
       *    `src/taiw/report/`, not in `tradeReportGenerator.ts`, which is the
       *    module-level entry. DGIW's block established the per-artefact form.
       *  - `needsSpine`, so `c.saveReport` and `c.reportFilename` are loaded.
       *    They RETURN a jsPDF doc rather than saving one, matching every DGIW
       *    generator and the component call sites.
       *  - `f.tacrSpine` and `f.tacrAnswers`, not `f.assessment`. A projection
       *    buckets by TACR SECTION, which the category means in `assessment`
       *    have already aggregated away.
       *
       * ALIGNMENT IS ONE ARTEFACT ID PRODUCING THREE DOCUMENTS, one per offered
       * framework — DGIW's AR-47 is the precedent and all four of its are
       * captured for the same reason: the crosswalk work is recent, and a
       * projection that changed silently under a spine edit is what this exists
       * to catch. DGI is absent because TAIW does not offer it (59% reach), and
       * a fourth baseline appearing here would be the first sign that changed.
       */
      ...['FW-01', 'FW-02', 'FW-04'].map((frameworkId) => ({
        id: `framework-alignment-${frameworkId.toLowerCase()}-pdf`,
        entry: '/src/taiw/report/frameworkAlignment.ts',
        kind: 'pdf',
        exportName: 'buildTaiwFrameworkAlignmentPdf',
        artefactIdExport: 'TAIW_ALIGNMENT_ARTEFACT_ID',
        assertRawBytes: true,
        profile: 'taiw',
        needsSpine: true,
        call: (m, f, c) =>
          c.saveReport(
            m.buildTaiwFrameworkAlignmentPdf({
              meta: c.meta,
              answers: f.tacrAnswers,
              categories: f.tacrSpine,
              frameworkId,
            }),
            c.reportFilename(c.meta, 'pdf').replace(/\.pdf$/, `_${frameworkId.toLowerCase()}.pdf`),
            c.meta,
          ),
      })),
      {
        id: 'multi-framework-pdf',
        entry: '/src/taiw/report/multiFrameworkScorecard.ts',
        kind: 'pdf',
        exportName: 'buildTaiwScorecardPdf',
        artefactIdExport: 'TAIW_SCORECARD_ARTEFACT_ID',
        assertRawBytes: true,
        profile: 'taiw',
        needsSpine: true,
        call: (m, f, c) =>
          c.saveReport(
            m.buildTaiwScorecardPdf({ meta: c.meta, answers: f.tacrAnswers, categories: f.tacrSpine }),
            c.reportFilename(c.meta, 'pdf'),
            c.meta,
          ),
      },
      /*
       * PARTIAL, and these two are the ONLY inputs that reach three sections of
       * the alignment pack: not-assessed leaf dimensions, dimensions scored from
       * part of their evidence, and a scoredShare below retainedShare. On the
       * full 640-of-640 set every mapped dimension is 100% scored and all three
       * render their empty case — which is the 8-of-8 shape CLAUDE.md warns
       * about, one level up from category scoring.
       *
       * DMBOK2 only for the alignment: three partial packs would triple the
       * baselines to exercise one code path each. The scorecard covers all three
       * frameworks' partial states in one document.
       */
      {
        id: 'framework-alignment-fw-01-pdf-partial',
        entry: '/src/taiw/report/frameworkAlignment.ts',
        kind: 'pdf',
        exportName: 'buildTaiwFrameworkAlignmentPdf',
        artefactIdExport: 'TAIW_ALIGNMENT_ARTEFACT_ID',
        assertRawBytes: true,
        profile: 'taiw',
        needsSpine: true,
        orgName: 'Fixture Customs Authority Partial',
        call: (m, f, c) =>
          c.saveReport(
            m.buildTaiwFrameworkAlignmentPdf({
              meta: c.meta,
              answers: f.tacrAnswersPartial,
              categories: f.tacrSpine,
              frameworkId: 'FW-01',
            }),
            c.reportFilename(c.meta, 'pdf').replace(/\.pdf$/, '_fw-01.pdf'),
            c.meta,
          ),
      },
      {
        id: 'multi-framework-pdf-partial',
        entry: '/src/taiw/report/multiFrameworkScorecard.ts',
        kind: 'pdf',
        exportName: 'buildTaiwScorecardPdf',
        artefactIdExport: 'TAIW_SCORECARD_ARTEFACT_ID',
        assertRawBytes: true,
        profile: 'taiw',
        needsSpine: true,
        orgName: 'Fixture Customs Authority Partial',
        call: (m, f, c) =>
          c.saveReport(
            m.buildTaiwScorecardPdf({ meta: c.meta, answers: f.tacrAnswersPartial, categories: f.tacrSpine }),
            c.reportFilename(c.meta, 'pdf'),
            c.meta,
          ),
      },
    ],
  },
  /*
   * HAIW — migrated onto the spine in D2 step 1, PDF and markdown only.
   *
   * Those two now take `meta: ReportMeta` where they took `orgName: string`, so
   * they carry `artefactIdExport` (the harness reads the id from the generator
   * rather than repeating it) and `profile`, which names the entry in
   * REPORT_PROFILES that the real call site passes to useReportMeta(). Reading
   * the profile out of the app instead of restating it here is the difference
   * between mirroring the call site and paraphrasing it.
   *
   * gap-csv is untouched: no meta, no profile, still the pre-spine generator.
   */
  haiw: {
    entry: '/src/haiw/utils/healthReportGenerator.ts',
    artefacts: [
      {
        id: 'maturity-pdf',
        kind: 'pdf',
        exportName: 'generateHealthMaturityPDF',
        assertRawBytes: true,
        artefactIdExport: 'HEALTH_MATURITY_ARTEFACT_ID',
        profile: 'haiw',
        // benchmarks is null in the fixture -> undefined here, which is exactly
        // what HealthReportGenerator.tsx passes, so DEFAULT_BENCHMARKS applies.
        // f.questions is the HacrQuestionLink projection — see the fixture's notes.
        call: (m, f, c) => m.generateHealthMaturityPDF(f.answers, f.capabilities, f.questions, f.benchmarks ?? undefined, c.meta),
      },
      {
        /*
         * SPEC ID STAYS `gap-csv` THOUGH THE ARTEFACT IS NOW A REGISTER.
         *
         * D5 stage E2 withdrew HAIW's per-capability score (D-016) and renamed the
         * export and the artefact id. The spec id is the BASELINE FILENAME, and BAIW
         * kept `gap-csv` through exactly this change under D-001 —
         * `baseline/baiw/gap-csv.json` records `generateCapabilityRegisterCSV` today.
         * Renaming it here would orphan one baseline and create another, turning a
         * reviewable content diff into a file move that hides it. Both modules are
         * consistent, and both are consistently misnamed; the id is a harness handle,
         * not a claim about the deliverable.
         */
        id: 'gap-csv',
        kind: 'csv',
        exportName: 'generateHealthCapabilityRegisterCSV',
        artefactIdExport: 'HEALTH_REGISTER_ARTEFACT_ID',
        profile: 'haiw',
        // No answers and no questions: a register of authored attributes cannot vary
        // with the assessment, and the signature no longer accepts them.
        call: (m, f, c) => m.generateHealthCapabilityRegisterCSV(f.capabilities, c.meta),
        // THE CONTROL. Step 1 found no clock read and no RNG in this generator,
        // and its bytes were identical across four TZ/locale environments. It is
        // therefore baselined on raw bytes as well as normalised text: if this
        // one ever reports a diff on an unchanged generator, the harness is
        // broken, not the generator.
        //
        // On src/report/csv.ts since 2026-08-01, the last of the three to move.
        // That migration changed its encoding — BOM, CRLF, every field quoted —
        // and its filename, but no cell value; the walk asserted the parsed cell
        // matrix was identical before and after.
        assertRawBytes: true,
      },
      {
        id: 'roadmap-md',
        kind: 'md',
        exportName: 'generateHealthRoadmapMarkdown',
        assertRawBytes: true,
        artefactIdExport: 'HEALTH_ROADMAP_ARTEFACT_ID',
        profile: 'haiw',
        // f.questions added in D4: the markdown scores categories from the
        // question universe, as the PDF does, so an unanswered category reads
        // NOT ASSESSED instead of 0.0.
        call: (m, f, c) => m.generateHealthRoadmapMarkdown(f.answers, f.capabilities, f.questions, c.meta),
      },
      /*
       * PARTIAL — D4. See the note on TAIW's pair above. HAIW's is the more
       * informative of the two: its generator computes the category scores rather
       * than being handed them, so this pair is what proves the ÷scored rule and
       * the not-assessed / not-applicable split are live in the report itself and
       * not just on the screen.
       */
      {
        id: 'maturity-pdf-partial',
        kind: 'pdf',
        exportName: 'generateHealthMaturityPDF',
        assertRawBytes: true,
        artefactIdExport: 'HEALTH_MATURITY_ARTEFACT_ID',
        profile: 'haiw',
        orgName: 'Fixture Health Authority Partial',
        call: (m, f, c) => m.generateHealthMaturityPDF(f.answersPartial, f.capabilities, f.questions, f.benchmarks ?? undefined, c.meta),
      },
      {
        id: 'roadmap-md-partial',
        kind: 'md',
        exportName: 'generateHealthRoadmapMarkdown',
        assertRawBytes: true,
        artefactIdExport: 'HEALTH_ROADMAP_ARTEFACT_ID',
        profile: 'haiw',
        orgName: 'Fixture Health Authority Partial',
        call: (m, f, c) => m.generateHealthRoadmapMarkdown(f.answersPartial, f.capabilities, f.questions, c.meta),
      },
      /*
       * ── THE FRAMEWORK ARTEFACTS, D5 STAGE E3 ───────────────────────────
       *
       * TAIW's block carries the full note on `entry`, `needsSpine` and why the
       * partial pair exists. Two things are HAIW-specific:
       *
       *  - FOUR alignment documents, not three. DGI reaches 100% of itself on
       *    HACR and 59% on TACR, so HAIW offers it and TAIW does not. The
       *    baseline count is where that difference is visible from outside.
       *  - The answers are mapped from the fixture's ARRAY to the id-keyed
       *    record the projection takes, which is exactly what
       *    `HealthReportGenerator.tsx` does at the call site. `f.questions` now
       *    carries `category` and `subcategory`, added in E3, so the spine is
       *    derived here from the same 720 records the maturity PDF reads.
       */
      ...(() => {
        const byId = (answers) =>
          Object.fromEntries(
            answers.map((a) => [a.questionId, { currentState: a.currentState, desiredState: a.desiredState }]),
          )
        const alignment = ['FW-01', 'FW-02', 'FW-03', 'FW-04'].map((frameworkId) => ({
          id: `framework-alignment-${frameworkId.toLowerCase()}-pdf`,
          entry: '/src/haiw/report/frameworkAlignment.ts',
          kind: 'pdf',
          exportName: 'buildHaiwFrameworkAlignmentPdf',
          artefactIdExport: 'HAIW_ALIGNMENT_ARTEFACT_ID',
          assertRawBytes: true,
          profile: 'haiw',
          needsSpine: true,
          call: (m, f, c) =>
            c.saveReport(
              m.buildHaiwFrameworkAlignmentPdf({
                meta: c.meta,
                answers: byId(f.answers),
                questions: f.questions,
                frameworkId,
              }),
              c.reportFilename(c.meta, 'pdf').replace(/\.pdf$/, `_${frameworkId.toLowerCase()}.pdf`),
              c.meta,
            ),
        }))
        return [
          ...alignment,
          {
            id: 'multi-framework-pdf',
            entry: '/src/haiw/report/multiFrameworkScorecard.ts',
            kind: 'pdf',
            exportName: 'buildHaiwScorecardPdf',
            artefactIdExport: 'HAIW_SCORECARD_ARTEFACT_ID',
            assertRawBytes: true,
            profile: 'haiw',
            needsSpine: true,
            call: (m, f, c) =>
              c.saveReport(
                m.buildHaiwScorecardPdf({ meta: c.meta, answers: byId(f.answers), questions: f.questions }),
                c.reportFilename(c.meta, 'pdf'),
                c.meta,
              ),
          },
          {
            id: 'framework-alignment-fw-01-pdf-partial',
            entry: '/src/haiw/report/frameworkAlignment.ts',
            kind: 'pdf',
            exportName: 'buildHaiwFrameworkAlignmentPdf',
            artefactIdExport: 'HAIW_ALIGNMENT_ARTEFACT_ID',
            assertRawBytes: true,
            profile: 'haiw',
            needsSpine: true,
            orgName: 'Fixture Health Authority Partial',
            call: (m, f, c) =>
              c.saveReport(
                m.buildHaiwFrameworkAlignmentPdf({
                  meta: c.meta,
                  answers: byId(f.answersPartial),
                  questions: f.questions,
                  frameworkId: 'FW-01',
                }),
                c.reportFilename(c.meta, 'pdf').replace(/\.pdf$/, '_fw-01.pdf'),
                c.meta,
              ),
          },
          {
            id: 'multi-framework-pdf-partial',
            entry: '/src/haiw/report/multiFrameworkScorecard.ts',
            kind: 'pdf',
            exportName: 'buildHaiwScorecardPdf',
            artefactIdExport: 'HAIW_SCORECARD_ARTEFACT_ID',
            assertRawBytes: true,
            profile: 'haiw',
            needsSpine: true,
            orgName: 'Fixture Health Authority Partial',
            call: (m, f, c) =>
              c.saveReport(
                m.buildHaiwScorecardPdf({ meta: c.meta, answers: byId(f.answersPartial), questions: f.questions }),
                c.reportFilename(c.meta, 'pdf'),
                c.meta,
              ),
          },
        ]
      })(),
    ],
  },

  /*
   * DGIW — the seven generators already on the spine.
   *
   * Added in D2 step 0a, before the spine gains `poweredBy`/`scopeLabel`. These
   * are the artefacts actually in production, and until now the only module with
   * NO golden coverage was the only one whose reports ship through src/report/.
   * Changing shared report infrastructure for three new callers while nothing
   * verified the seven existing ones is how C1-C3 gets silently broken.
   *
   * Three things differ from the pre-spine modules:
   *
   *  - Each artefact has its own `entry`. DGIW's UI imports one generator module
   *    per deliverable; there is no single module exporting all of them.
   *  - `call` receives a third argument carrying `meta` and the spine's own
   *    `saveReport` / `downloadCsv` / `reportFilename`, so each line here mirrors
   *    the component call site verbatim rather than paraphrasing it.
   *  - `assertRawBytes` is on for ALL of them. `meta.generatedAt` is caller-
   *    supplied and the spine pins both /CreationDate and /ID from it, so a DGIW
   *    artefact is byte-reproducible in a way no pre-spine one is. That is what
   *    makes "the spine change altered nothing" provable instead of asserted.
   */
  dgiw: {
    artefacts: [
      {
        id: 'diagnostic-pdf', entry: DGIW_REPORT('diagnosticReport'), kind: 'pdf',
        exportName: 'buildDiagnosticReport', artefactIdExport: 'DIAGNOSTIC_ARTEFACT_ID',
        assertRawBytes: true,
        call: (m, f, c) => c.saveReport(m.buildDiagnosticReport({ meta: c.meta, answers: f.answers }), c.reportFilename(c.meta, 'pdf'), c.meta),
      },
      // The same report under the other two layers. Not label coverage: layer
      // filters applicableQuestions(), so these are materially different
      // documents — and they are the only place LAYER_LABEL's other two strings
      // are rendered, which is exactly what scopeLabel is about to touch.
      {
        id: 'diagnostic-pdf-core', entry: DGIW_REPORT('diagnosticReport'), kind: 'pdf',
        exportName: 'buildDiagnosticReport', artefactIdExport: 'DIAGNOSTIC_ARTEFACT_ID',
        assertRawBytes: true, layer: 'core',
        call: (m, f, c) => c.saveReport(m.buildDiagnosticReport({ meta: c.meta, answers: f.answers }), c.reportFilename(c.meta, 'pdf'), c.meta),
      },
      {
        id: 'diagnostic-pdf-banking', entry: DGIW_REPORT('diagnosticReport'), kind: 'pdf',
        exportName: 'buildDiagnosticReport', artefactIdExport: 'DIAGNOSTIC_ARTEFACT_ID',
        assertRawBytes: true, layer: 'banking',
        call: (m, f, c) => c.saveReport(m.buildDiagnosticReport({ meta: c.meta, answers: f.answers }), c.reportFilename(c.meta, 'pdf'), c.meta),
      },
      {
        id: 'cde-register-pdf', entry: DGIW_REPORT('cdeRegister'), kind: 'pdf',
        exportName: 'buildCdeRegisterPdf', artefactIdExport: 'CDE_REGISTER_ARTEFACT_ID',
        assertRawBytes: true,
        call: (m, f, c) => c.saveReport(m.buildCdeRegisterPdf({ meta: c.meta }), c.reportFilename(c.meta, 'pdf'), c.meta),
      },
      {
        id: 'cde-register-csv', entry: DGIW_REPORT('cdeRegister'), kind: 'csv',
        exportName: 'buildCdeRegisterRows', artefactIdExport: 'CDE_REGISTER_ARTEFACT_ID',
        assertRawBytes: true,
        call: (m, f, c) => {
          const { rows, columns } = m.buildCdeRegisterRows({ meta: c.meta })
          return c.downloadCsv(rows, columns, c.reportFilename(c.meta, 'csv'), c.meta)
        },
      },
      {
        id: 'dq-rule-spec-pdf', entry: DGIW_REPORT('dqRuleSpec'), kind: 'pdf',
        exportName: 'buildDqRuleSpecPdf', artefactIdExport: 'DQ_RULE_SPEC_ARTEFACT_ID',
        assertRawBytes: true,
        call: (m, f, c) => c.saveReport(m.buildDqRuleSpecPdf({ meta: c.meta }), c.reportFilename(c.meta, 'pdf'), c.meta),
      },
      {
        id: 'dq-rule-spec-csv', entry: DGIW_REPORT('dqRuleSpec'), kind: 'csv',
        exportName: 'buildDqRuleSpecRows', artefactIdExport: 'DQ_RULE_SPEC_ARTEFACT_ID',
        assertRawBytes: true,
        call: (m, f, c) => {
          const { rows, columns } = m.buildDqRuleSpecRows({ meta: c.meta })
          return c.downloadCsv(rows, columns, c.reportFilename(c.meta, 'csv'), c.meta)
        },
      },
      {
        id: 'roadmap-pdf', entry: DGIW_REPORT('roadmap'), kind: 'pdf',
        exportName: 'buildRoadmapPdf', artefactIdExport: 'ROADMAP_ARTEFACT_ID',
        assertRawBytes: true,
        call: (m, f, c) => c.saveReport(m.buildRoadmapPdf({ meta: c.meta }), c.reportFilename(c.meta, 'pdf'), c.meta),
      },
      {
        id: 'operating-model-pdf', entry: DGIW_REPORT('operatingModel'), kind: 'pdf',
        exportName: 'buildOperatingModelPdf', artefactIdExport: 'OPERATING_MODEL_ARTEFACT_ID',
        assertRawBytes: true,
        call: (m, f, c) => c.saveReport(m.buildOperatingModelPdf({ meta: c.meta }), c.reportFilename(c.meta, 'pdf'), c.meta),
      },
      {
        id: 'multi-framework-pdf', entry: DGIW_REPORT('multiFrameworkScorecard'), kind: 'pdf',
        exportName: 'buildMultiFrameworkScorecardPdf', artefactIdExport: 'MULTI_FRAMEWORK_ARTEFACT_ID',
        assertRawBytes: true,
        call: (m, f, c) => c.saveReport(m.buildMultiFrameworkScorecardPdf({ meta: c.meta, answers: f.answers }), c.reportFilename(c.meta, 'pdf'), c.meta),
      },
      /*
       * WAVE A — four register pivots over the CDE spine, CSV and PDF each.
       *
       * All four read `report/cdeJoins.ts` and therefore the same three joins,
       * which is why they are captured together: a change to the shared filter,
       * the rule index or the owner resolution moves eight baselines at once and
       * a change that moves only one is a change to that document alone.
       *
       * `assertRawBytes` on all eight, like every other DGIW artefact — the
       * spine pins /CreationDate and /ID from caller-supplied meta, so these are
       * byte-reproducible and "nothing changed" is provable rather than asserted.
       */
      {
        id: 'business-glossary-csv', entry: DGIW_REPORT('businessGlossary'), kind: 'csv',
        exportName: 'buildBusinessGlossaryRows', artefactIdExport: 'BUSINESS_GLOSSARY_ARTEFACT_ID',
        assertRawBytes: true,
        call: (m, f, c) => {
          const { rows, columns } = m.buildBusinessGlossaryRows({ meta: c.meta })
          return c.downloadCsv(rows, columns, c.reportFilename(c.meta, 'csv'), c.meta)
        },
      },
      {
        id: 'business-glossary-pdf', entry: DGIW_REPORT('businessGlossary'), kind: 'pdf',
        exportName: 'buildBusinessGlossaryPdf', artefactIdExport: 'BUSINESS_GLOSSARY_ARTEFACT_ID',
        assertRawBytes: true,
        call: (m, f, c) => c.saveReport(m.buildBusinessGlossaryPdf({ meta: c.meta }), c.reportFilename(c.meta, 'pdf'), c.meta),
      },
      {
        id: 'reference-model-csv', entry: DGIW_REPORT('referenceModelMapping'), kind: 'csv',
        exportName: 'buildReferenceModelRows', artefactIdExport: 'REFERENCE_MODEL_ARTEFACT_ID',
        assertRawBytes: true,
        call: (m, f, c) => {
          const { rows, columns } = m.buildReferenceModelRows({ meta: c.meta })
          return c.downloadCsv(rows, columns, c.reportFilename(c.meta, 'csv'), c.meta)
        },
      },
      {
        id: 'reference-model-pdf', entry: DGIW_REPORT('referenceModelMapping'), kind: 'pdf',
        exportName: 'buildReferenceModelPdf', artefactIdExport: 'REFERENCE_MODEL_ARTEFACT_ID',
        assertRawBytes: true,
        call: (m, f, c) => c.saveReport(m.buildReferenceModelPdf({ meta: c.meta }), c.reportFilename(c.meta, 'pdf'), c.meta),
      },
      {
        id: 'data-landscape-csv', entry: DGIW_REPORT('dataLandscape'), kind: 'csv',
        exportName: 'buildDataLandscapeRows', artefactIdExport: 'DATA_LANDSCAPE_ARTEFACT_ID',
        assertRawBytes: true,
        call: (m, f, c) => {
          const { rows, columns } = m.buildDataLandscapeRows({ meta: c.meta })
          return c.downloadCsv(rows, columns, c.reportFilename(c.meta, 'csv'), c.meta)
        },
      },
      {
        id: 'data-landscape-pdf', entry: DGIW_REPORT('dataLandscape'), kind: 'pdf',
        exportName: 'buildDataLandscapePdf', artefactIdExport: 'DATA_LANDSCAPE_ARTEFACT_ID',
        assertRawBytes: true,
        call: (m, f, c) => c.saveReport(m.buildDataLandscapePdf({ meta: c.meta }), c.reportFilename(c.meta, 'pdf'), c.meta),
      },
      {
        id: 'lineage-trace-csv', entry: DGIW_REPORT('lineageTrace'), kind: 'csv',
        exportName: 'buildLineageTraceRows', artefactIdExport: 'LINEAGE_TRACE_ARTEFACT_ID',
        assertRawBytes: true,
        call: (m, f, c) => {
          const { rows, columns } = m.buildLineageTraceRows({ meta: c.meta })
          return c.downloadCsv(rows, columns, c.reportFilename(c.meta, 'csv'), c.meta)
        },
      },
      {
        id: 'lineage-trace-pdf', entry: DGIW_REPORT('lineageTrace'), kind: 'pdf',
        exportName: 'buildLineageTracePdf', artefactIdExport: 'LINEAGE_TRACE_ARTEFACT_ID',
        assertRawBytes: true,
        call: (m, f, c) => c.saveReport(m.buildLineageTracePdf({ meta: c.meta }), c.reportFilename(c.meta, 'pdf'), c.meta),
      },
      // The trace under the core layer. Not label coverage: the ranking is
      // computed per layer, so a core-only engagement selects DIFFERENT
      // consumption points, and that claim is only checkable if it is captured.
      {
        id: 'lineage-trace-pdf-core', entry: DGIW_REPORT('lineageTrace'), kind: 'pdf',
        exportName: 'buildLineageTracePdf', artefactIdExport: 'LINEAGE_TRACE_ARTEFACT_ID',
        assertRawBytes: true, layer: 'core',
        call: (m, f, c) => c.saveReport(m.buildLineageTracePdf({ meta: c.meta }), c.reportFilename(c.meta, 'pdf'), c.meta),
      },

      // AR-47 is one artefact id producing four documents, one per framework.
      // All four are captured: the crosswalk work is recent, and a projection
      // that silently changed under a spine edit is exactly what 0a is for.
      ...['FW-01', 'FW-02', 'FW-03', 'FW-04'].map((frameworkId) => ({
        id: `framework-alignment-${frameworkId.toLowerCase()}-pdf`,
        entry: DGIW_REPORT('frameworkAlignment'), kind: 'pdf',
        exportName: 'buildFrameworkAlignmentPdf', artefactIdExport: 'FRAMEWORK_ALIGNMENT_ARTEFACT_ID',
        assertRawBytes: true,
        call: (m, f, c) => c.saveReport(
          m.buildFrameworkAlignmentPdf({ meta: c.meta, answers: f.answers, frameworkId }),
          c.reportFilename(c.meta, 'pdf').replace(/\.pdf$/, `_${frameworkId.toLowerCase()}.pdf`),
          c.meta,
        ),
      })),
    ],
  },
}

/** Per-artefact entry, falling back to the module-level one. */
export const artefactEntry = (module, spec) => spec.entry ?? REGISTRY[module].entry

export function artefactSpec(module, id) {
  const spec = REGISTRY[module]?.artefacts.find(a => a.id === id)
  if (!spec) throw new Error(`no artefact ${module}/${id} in the registry`)
  return spec
}

// ── Fixtures ─────────────────────────────────────────────────────────────

export function loadFixture(module) {
  const p = path.join(FIXTURE_DIR, `${module}.json`)
  if (!existsSync(p)) throw new Error(`missing fixture ${p}`)
  const f = JSON.parse(readFileSync(p, 'utf8'))
  if (f.module !== module) throw new Error(`fixture ${p} declares module ${f.module}`)
  return f
}

// ── Vite driver ──────────────────────────────────────────────────────────

/**
 * Serve the fixture's frozen copy of any dataset the generator imports.
 *
 * `reportGenerator.ts` does `import benchmarks from '../data/benchmarks.json'`.
 * That is a module-level import, not a parameter, so the only way to freeze it
 * without editing the generator (which D1 may not do) is to intercept the
 * resolution. Redirecting to a virtual id rather than rewriting the .json keeps
 * Vite's own JSON plugin out of the way.
 *
 * `served` is exported so the caller can assert the interception actually
 * happened. If D2 moves an import and the plugin silently stops matching, the
 * baseline would quietly go back to reading live data — which is exactly the
 * vacuous pass this repo has already been bitten by four times.
 */
function fixtureDataPlugin(dataByAbsPath, served) {
  // The path is base64url'd into the virtual id rather than appended raw. Vite's
  // own `vite:json` plugin filters on the id ending in `.json` and would try to
  // JSON.parse the `export default {...}` this plugin returns.
  const VIRTUAL = '\0golden-fixture:'
  const enc = p => Buffer.from(p, 'utf8').toString('base64url')
  const dec = t => Buffer.from(t, 'base64url').toString('utf8')

  return {
    name: 'golden-fixture-data',
    enforce: 'pre',
    resolveId(source, importer) {
      if (!importer || source.startsWith('\0')) return null
      const base = importer.startsWith('/') && !existsSync(path.dirname(importer))
        ? path.join(APP_ROOT, path.dirname(importer))
        : path.dirname(importer)
      const abs = path.resolve(base, source)
      if (Object.hasOwn(dataByAbsPath, abs)) return VIRTUAL + enc(abs)
      return null
    },
    load(id) {
      if (!id.startsWith(VIRTUAL)) return null
      const key = dec(id.slice(VIRTUAL.length))
      served.add(key)
      return `export default ${JSON.stringify(dataByAbsPath[key])}`
    },
  }
}

/**
 * Boot one Vite SSR server that can generate every requested module's artefacts.
 * Returns `{ generate, close }`.
 *
 * @param {{ plugins?: object[], define?: Record<string, string> }} [opts] Additive
 *   and optional — every existing caller (capture.mjs, compare.mjs, walk.mjs)
 *   passes none of it and sees no change. Added for
 *   `scripts/provenance-drive.mjs`, which needs `vite.config.ts`'s
 *   `provenanceFingerprintPlugin` (this bare server sets `configFile: false`
 *   and loads none of that file's plugins on its own) so `__PROVENANCE_
 *   FINGERPRINT__` is defined when it drives a real generator — without it,
 *   every recorded provenance record would show a fingerprint of `null` for a
 *   reason that has nothing to do with the recorder actually working.
 */
export async function createDriver(modules, opts = {}) {
  const fixtures = Object.fromEntries(modules.map(m => [m, loadFixture(m)]))

  // Sorted so the plugin's match order never depends on object insertion order.
  const dataByAbsPath = {}
  for (const m of [...modules].sort()) {
    for (const rel of Object.keys(fixtures[m].data ?? {}).sort()) {
      dataByAbsPath[path.join(APP_ROOT, rel)] = fixtures[m].data[rel]
    }
  }
  const served = new Set()

  const server = await createServer({
    configFile: false,
    root: APP_ROOT,
    appType: 'custom',
    logLevel: 'silent',
    server: { middlewareMode: true, hmr: false, watch: null, fs: { allow: [APP_ROOT], strict: false } },
    plugins: [fixtureDataPlugin(dataByAbsPath, served), ...(opts.plugins ?? [])],
    define: opts.define,
    resolve: {
      alias: [{ find: /^file-saver$/, replacement: path.join(HERE, 'file-saver-sink.mjs') }],
      conditions: ['browser', 'import', 'module', 'default'],
    },
    ssr: {
      resolve: { conditions: ['browser', 'import', 'module', 'default'] },
      // Inline them so the browser build is what gets evaluated.
      noExternal: ['jspdf', 'jspdf-autotable'],
    },
    // SSR never touches the pre-bundle; discovery would crawl the whole app for
    // nothing and then complain when we close the server.
    optimizeDeps: { noDiscovery: true, include: [] },
  })

  // downloadCSV builds the real bytes — BOM, CRLF, quote-every-field — and only
  // needs a browser to hand them over. Installed before any module loads.
  installDomSink()

  const sink = await server.ssrLoadModule(path.join(HERE, 'file-saver-sink.mjs'))
  const jsPDF = (await server.ssrLoadModule('jspdf')).default
  const pdfs = []
  jsPDF.API.save = function (filename) {
    pdfs.push({ filename, bytes: Buffer.from(this.output('arraybuffer')) })
    return this
  }
  // src/report/spine.ts's saveReport() ends at doc.save() too, so this same hook
  // captures post-D2 output. That is the one thing that lets the baseline
  // outlive the migration it exists to review.

  const ruler = new jsPDF('p', 'pt', 'a4')

  // The spine's own save/CSV/filename helpers, so a DGIW registry entry can
  // mirror its component call site line for line instead of paraphrasing it.
  /*
   * D5 stage E3: no longer DGIW-only. TAIW's and HAIW's framework artefacts RETURN a
   * jsPDF doc rather than saving it, exactly as DGIW's do, so their specs call
   * `c.saveReport` too. Derived from the specs rather than from a module name — a
   * hardcoded `includes('dgiw')` is how the next module's specs would have got an
   * empty `c` and thrown on `c.saveReport is not a function` with nothing saying why.
   */
  const needsSpine = modules.some((m) => m === 'dgiw' || REGISTRY[m].artefacts.some((a) => a.needsSpine))
  const spine = needsSpine
    ? {
        saveReport: (await server.ssrLoadModule('/src/report/spine.ts')).saveReport,
        downloadCsv: (await server.ssrLoadModule('/src/report/csv.ts')).downloadCsv,
        reportFilename: (await server.ssrLoadModule('/src/report/naming.ts')).reportFilename,
      }
    : {}

  /*
   * REPORT_PROFILES, read from the app rather than restated here.
   *
   * DGIW_ACCENT above is a copied constant with a comment explaining why — that
   * was acceptable for one number. `poweredBy`, `scopeLabel`, the accent and the
   * org-name fallback are four per-module facts across three modules, and a
   * harness carrying its own copy would be asserting its copy. useReportMeta.ts
   * is a hook module, but importing it only evaluates it; nothing here renders.
   */
  const needsProfiles = modules.some(m => REGISTRY[m].artefacts.some(a => a.profile))
  const reportProfiles = needsProfiles
    ? (await server.ssrLoadModule('/src/engagement/useReportMeta.ts')).REPORT_PROFILES
    : {}

  /**
   * ReportMeta for a spine artefact, mirroring the hook its call site uses —
   * useDeliverable().metaFor for DGIW, useReportMeta() for a module with a
   * `profile`.
   *
   * `artefactId` is read from the generator's own exported constant rather than
   * repeated here: if an id changes, the harness follows it instead of asserting
   * a stale one. `generatedAt` comes from the fixture, which is what makes a
   * spine artefact byte-reproducible.
   */
  function metaFor(fixture, spec, mod) {
    const artefactId = mod[spec.artefactIdExport]
    if (typeof artefactId !== 'string' || !artefactId) {
      throw new Error(`${spec.id} does not export ${spec.artefactIdExport} as a string — the registry is stale`)
    }
    let profile = null
    if (spec.profile) {
      profile = reportProfiles[spec.profile]
      if (!profile) {
        throw new Error(`REPORT_PROFILES has no "${spec.profile}" — the registry names a profile the app does not define`)
      }
    }
    const base = {
      /*
       * `spec.orgName` exists for the partial-assessment artefacts added in D4.
       * Two artefacts sharing one artefactId, orgName, layer and date produce the
       * same `reportFilename()`, so the second would overwrite the first in raw/.
       * A distinct org name gives each its own file AND puts the scenario on the
       * cover, where a reader comparing two captures can see which is which.
       */
      orgName: spec.orgName ?? fixture.orgName,
      engagementId: fixture.engagementId,
      generatedAt: fixture.generatedAt,
      layer: spec.layer ?? fixture.layer,
      accent: profile?.accent ?? fixture.accent ?? DGIW_ACCENT,
      isDraft: fixture.isDraft ?? false,
      artefactId,
    }
    // The three fields useReportMeta() sets and useDeliverable() does not. Absent
    // for DGIW, so its metas — and its bytes — are exactly what they were.
    return profile
      ? { ...base, poweredBy: profile.poweredBy, scopeLabel: profile.scopeLabel, coverTag: '' }
      : base
  }

  async function generate(module) {
    const fixture = fixtures[module]
    const { artefacts } = REGISTRY[module]
    const out = []
    for (const spec of artefacts) {
      const entry = artefactEntry(module, spec)
      const mod = await server.ssrLoadModule(entry)
      if (typeof mod[spec.exportName] !== 'function') {
        throw new Error(`${entry} no longer exports ${spec.exportName}() — the registry is stale`)
      }
      pdfs.length = 0
      sink.SINK.length = 0
      DOM_SINK.length = 0

      const ctx = spec.artefactIdExport ? { ...spine, meta: metaFor(fixture, spec, mod) } : {}
      spec.call(mod, fixture, ctx)

      const produced = pdfs.length + sink.SINK.length + DOM_SINK.length
      if (produced !== 1) {
        throw new Error(`${module}/${spec.id}: expected exactly one artefact, got ${produced}`)
      }
      if (pdfs.length) {
        out.push({ spec, filename: pdfs[0].filename, bytes: pdfs[0].bytes })
      } else {
        const { filename, blob } = sink.SINK[0] ?? DOM_SINK[0]
        out.push({ spec, filename, bytes: Buffer.from(await blob.arrayBuffer()) })
      }
    }
    return out
  }

  function assertFixtureDataWasServed() {
    const expected = Object.keys(dataByAbsPath).sort()
    const missing = expected.filter(k => !served.has(k))
    if (missing.length) {
      throw new Error(
        `fixture data was never requested: ${missing.map(m => path.relative(APP_ROOT, m)).join(', ')}. ` +
        `The generator's import path probably moved, so it read LIVE src/data/ instead of the frozen ` +
        `fixture copy. Fix the fixture's data keys before trusting this capture.`,
      )
    }
  }

  /**
   * The `datasets` field every baseline records, per module.
   *
   * One place, so capture and compare cannot drift — they each carried their own
   * copy of `module === 'dgiw' ? datasetFingerprint(...) : null` until D-010, and
   * the `null` half was the bug: `diffCommon`'s dataset check is guarded on
   * `base.datasets`, so it could never fire for the three modules that freeze.
   *
   * DGIW fingerprints its live directory PLUS the shared framework definitions.
   * `frameworks.json` left `src/dgiw/data/` in D5 stage B and the projection still
   * reads it; covering only the directory would have shrunk this from eleven files
   * to ten and made a DMBOK edit invisible to all fourteen DGIW baselines.
   *
   * SHARED_DATASETS moved to `fingerprint-decl.mjs` in D5 stage E1 so the gate can
   * read the same list without importing Vite. It is imported at the top of this
   * file; the reasoning above is why it is not merely a path constant.
   */
  function fingerprintFor(module) {
    if (module === 'dgiw') return datasetFingerprint('src/dgiw/data', SHARED_DATASETS)
    const sources = fixtureDataSources(fixtures[module])
    if (sources.length === 0) {
      throw new Error(
        `fixture ${module}.json declares neither a \`data\` block nor \`dataSources\`, so its baselines would record ` +
          `\`datasets: null\` and a live dataset edit would be invisible to compare.mjs — which is D-010. Declare the ` +
          `files this fixture's frozen content comes from.`,
      )
    }
    return datasetFingerprintOf(sources)
  }

  // `server` itself is exposed alongside the higher-level helpers — additive,
  // for scripts/provenance-drive.mjs, which needs to ssrLoadModule
  // src/report/provenance.ts directly to read back what a generate() call just
  // wrote to localStorage. capture.mjs/compare.mjs/walk.mjs use none of it.
  return { generate, ruler, assertFixtureDataWasServed, fingerprintFor, server, close: () => server.close() }
}

// ── Hashing and stable serialisation ─────────────────────────────────────

export const sha256 = s => createHash('sha256').update(typeof s === 'string' ? Buffer.from(s, 'utf8') : s).digest('hex')

/** JSON with object keys sorted at every depth. Arrays keep their order. */
export function stableStringify(value, indent = 2) {
  const walk = v => {
    if (Array.isArray(v)) return v.map(walk)
    if (v && typeof v === 'object') {
      const out = {}
      for (const k of Object.keys(v).sort()) out[k] = walk(v[k])
      return out
    }
    return v
  }
  return JSON.stringify(walk(value), null, indent) + '\n'
}

/**
 * Compact, key-sorted JSON for EQUALITY CHECKS.
 *
 * Plain JSON.stringify preserves insertion order, so a freshly built object and
 * the same object round-tripped through a key-sorted baseline file compare
 * unequal while being identical. That bug had the first compare run reporting
 * nine environment changes against a baseline captured seconds earlier.
 */
export function stableJson(value) {
  return stableStringify(value, 0).trimEnd()
}

// ── Date normalisation ───────────────────────────────────────────────────
// Two clock-derived strings survive into content, and both must be neutralised
// before hashing or the baseline expires at the next local midnight. The raw
// value is recorded next to the hash so a reviewer can still see it.

export const DATE_TOKEN = '⟨DATE⟩'
/** Stands in for a column whose value the harness has declared unassertable. */
export const SKIP_TOKEN = '⟨SKIPPED⟩'

const MONTHS = 'January|February|March|April|May|June|July|August|September|October|November|December'

/**
 * `July 31, 2026` — the PDF cover date.
 * Pre-D2 this comes from `new Date().toLocaleDateString('en-US', {...})`;
 * post-D2 from `formatCoverDate()` in src/report/naming.ts, which builds the
 * same long form from UTC parts. One pattern covers both.
 */
export const LONG_DATE_RE = new RegExp(`\\b(?:${MONTHS}) \\d{1,2}, \\d{4}\\b`, 'g')

/**
 * `7/31/2026` — the markdown date, from bare `toLocaleDateString()` with no
 * locale argument. Locale-shaped as well as clock-shaped; the harness pins the
 * locale so only the clock can move it.
 */
export const SHORT_DATE_RE = /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g

/** `2026-07-31` — appears in post-D2 filenames from reportFilename(). */
export const ISO_DATE_RE = /\b\d{4}-\d{2}-\d{2}\b/g

export function normaliseDates(text) {
  return text
    .replace(LONG_DATE_RE, DATE_TOKEN)
    .replace(SHORT_DATE_RE, DATE_TOKEN)
}

export function normaliseFilename(name) {
  return name.replace(ISO_DATE_RE, DATE_TOKEN)
}

export function findDates(text) {
  const hits = [...(text.match(LONG_DATE_RE) ?? []), ...(text.match(SHORT_DATE_RE) ?? [])]
  return [...new Set(hits)].sort()
}

// ── PDF reader ───────────────────────────────────────────────────────────
// jsPDF writes uncompressed content streams (no /FlateDecode anywhere in the
// output), so every text run's string, position, font and size is directly
// recoverable. That is why this harness needs no PDF library.

const PT_PER_MM = 72 / 25.4
/** The margin all three generators hand-place against, and src/report/spine.ts's MARGIN. */
export const MARGIN_MM = 15
export const MARGIN_PT = MARGIN_MM * PT_PER_MM

/**
 * Byte ranges of every `stream ... endstream` body, so object scanning can skip them.
 *
 * Exported alongside `indirectObjects` and `streamBodyOf` so `geometry.mjs` can
 * walk the same content streams for VECTOR operators. `analysePdf` below reads
 * only text runs, which is why D-006 — a filled box 5 mm past the content column
 * — was invisible to the harness in TAIW, where the titles inside the box are
 * short enough that no glyph overflowed. Geometry needs its own reader; it does
 * not need a second copy of the object parser.
 */
export function streamRanges(s) {
  const ranges = []
  const re = /stream\r?\n/g
  let m
  while ((m = re.exec(s)) !== null) {
    if (s.slice(m.index - 3, m.index) === 'end') continue   // this is "endstream"
    const end = s.indexOf('endstream', re.lastIndex)
    if (end < 0) break
    ranges.push([re.lastIndex, end])
    re.lastIndex = end + 'endstream'.length
  }
  return ranges
}

const inRanges = (ranges, off) => ranges.some(([a, b]) => off >= a && off < b)

export function indirectObjects(s, ranges) {
  const objs = new Map()
  const re = /(\d+)\s+0\s+obj\b/g
  let m
  while ((m = re.exec(s)) !== null) {
    if (inRanges(ranges, m.index)) continue
    let end = s.indexOf('endobj', re.lastIndex)
    while (end >= 0 && inRanges(ranges, end)) end = s.indexOf('endobj', end + 'endobj'.length)
    if (end < 0) continue
    objs.set(Number(m[1]), s.slice(re.lastIndex, end))
  }
  return objs
}

export function streamBodyOf(objBody) {
  const m = /stream\r?\n([\s\S]*?)\r?\nendstream/.exec(objBody)
  return m ? m[1] : null
}

/**
 * WinAnsiEncoding 0x80-0x9F -> Unicode.
 *
 * Every font jsPDF emits declares /WinAnsiEncoding, where 0xA0-0xFF matches
 * Latin-1 but 0x80-0x9F does not — it holds the typographic punctuation these
 * reports are full of. Without this table `—`, `–` and `•` decode to invisible
 * C1 control characters, which silently corrupts the extracted text, the glyph
 * count and the hash. Caught when a captured page read
 * "Closing this gap requires 1824 months".
 */
const WIN_ANSI_HIGH = {
  0x80: '€', 0x82: '‚', 0x83: 'ƒ', 0x84: '„', 0x85: '…',
  0x86: '†', 0x87: '‡', 0x88: 'ˆ', 0x89: '‰', 0x8A: 'Š',
  0x8B: '‹', 0x8C: 'Œ', 0x8E: 'Ž', 0x91: '‘', 0x92: '’',
  0x93: '“', 0x94: '”', 0x95: '•', 0x96: '–', 0x97: '—',
  0x98: '˜', 0x99: '™', 0x9A: 'š', 0x9B: '›', 0x9C: 'œ',
  0x9E: 'ž', 0x9F: 'Ÿ',
}

function decodeWinAnsi(s) {
  let out = ''
  for (const ch of s) {
    const code = ch.codePointAt(0)
    out += code >= 0x80 && code <= 0x9f ? (WIN_ANSI_HIGH[code] ?? ch) : ch
  }
  return out
}

function unescapePdfString(literal) {
  const bytes = literal
    .slice(1, -1)
    .replace(/\\(\d{1,3})/g, (_, o) => String.fromCharCode(parseInt(o, 8)))
    .replace(/\\([\\()nrtbf])/g, (_, c) => ({ n: '\n', r: '\r', t: '\t', b: '\b', f: '\f' }[c] ?? c))
  return decodeWinAnsi(bytes)
}

const BASE_FONT_MAP = {
  Helvetica: ['helvetica', 'normal'],
  'Helvetica-Bold': ['helvetica', 'bold'],
  'Helvetica-Oblique': ['helvetica', 'italic'],
  'Helvetica-BoldOblique': ['helvetica', 'bolditalic'],
  Courier: ['courier', 'normal'],
  'Courier-Bold': ['courier', 'bold'],
  'Courier-Oblique': ['courier', 'italic'],
  'Courier-BoldOblique': ['courier', 'bolditalic'],
  'Times-Roman': ['times', 'normal'],
  'Times-Bold': ['times', 'bold'],
  'Times-Italic': ['times', 'italic'],
  'Times-BoldItalic': ['times', 'bolditalic'],
  Symbol: ['symbol', 'normal'],
  ZapfDingbats: ['zapfdingbats', 'normal'],
}

const round2 = n => Math.round(n * 100) / 100

/**
 * Walk one page's content stream and return its text runs in draw order.
 *
 * jsPDF emits one `BT ... ET` block per text() call with a single absolute `Td`
 * (BT resets the text matrix, so Td is absolute here rather than relative).
 * Rotated text uses `Tm` instead; those runs are collected but excluded from the
 * right-edge extent, because a 45-degree DRAFT watermark has no meaningful one.
 */
function readTextRuns(body, fontByResource, ruler, unknownFonts, usedBaseFonts) {
  const runs = []
  let font = null, size = 12, x = 0, y = 0, rotated = false

  const emit = str => {
    if (!str.length) return
    const base = font ? fontByResource[font] : undefined
    if (font && !base) unknownFonts.add(font)
    if (base) usedBaseFonts.add(base)
    const mapped = BASE_FONT_MAP[base] ?? ['helvetica', 'normal']
    if (base && !BASE_FONT_MAP[base]) unknownFonts.add(base)
    ruler.setFont(mapped[0], mapped[1])
    ruler.setFontSize(size)
    const width = ruler.getStringUnitWidth(str) * size
    runs.push({ text: str, x: round2(x), y: round2(y), size: round2(size), width: round2(width), right: round2(x + width), rotated })
  }

  for (const rawLine of body.split('\n')) {
    const line = rawLine.trim()
    let t
    if (line === 'BT') { rotated = false; continue }
    if ((t = /^\/(\w+)\s+([\d.]+)\s+Tf$/.exec(line))) { font = t[1]; size = Number(t[2]); continue }
    if ((t = /^([-\d.]+)\s+([-\d.]+)\s+(?:Td|TD)$/.exec(line))) { x = Number(t[1]); y = Number(t[2]); rotated = false; continue }
    if ((t = /^([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+Tm$/.exec(line))) {
      x = Number(t[5]); y = Number(t[6])
      rotated = Number(t[2]) !== 0 || Number(t[3]) !== 0
      continue
    }
    if ((t = /^(\((?:\\[\s\S]|[^\\()])*\))\s*Tj$/.exec(line))) { emit(unescapePdfString(t[1])); continue }
    if ((t = /^\[([\s\S]*)\]\s*TJ$/.exec(line))) {
      const lits = t[1].match(/\((?:\\[\s\S]|[^\\()])*\)/g) ?? []
      emit(lits.map(unescapePdfString).join(''))
      continue
    }
  }
  return runs
}

/**
 * Analyse one PDF into the reviewable shape the baseline stores.
 *
 * Deliberately NOT a hash of the bytes: Step 1 measured that /CreationDate (23
 * bytes, wall clock) and the trailer /ID (77 bytes, Math.random) move on every
 * single run. Hashing extracted text excludes both without having to special-case
 * byte offsets that D2 will shift anyway.
 */
export function analysePdf(buf, ruler, spec = {}) {
  const s = buf.toString('latin1')
  const ranges = streamRanges(s)
  const objs = indirectObjects(s, ranges)

  // Page order comes from the Pages tree's /Kids, not from stream order.
  let kids = null
  for (const [, body] of [...objs].sort((a, b) => a[0] - b[0])) {
    if (!/\/Type\s*\/Pages\b/.test(body)) continue
    const m = /\/Kids\s*\[([^\]]*)\]/.exec(body)
    if (m) { kids = [...m[1].matchAll(/(\d+)\s+0\s+R/g)].map(k => Number(k[1])); break }
  }
  if (!kids || !kids.length) throw new Error('PDF has no /Pages /Kids — cannot establish page order')

  // /Fn -> BaseFont, resolved through each page's /Resources.
  const baseFontOf = objNum => /\/BaseFont\s*\/([\w-]+)/.exec(objs.get(objNum) ?? '')?.[1] ?? null
  const fontsForResources = resObjNum => {
    const body = objs.get(resObjNum) ?? ''
    const map = {}
    const fd = /\/Font\s*<<([\s\S]*?)>>/.exec(body)
    for (const m of (fd?.[1] ?? '').matchAll(/\/(\w+)\s+(\d+)\s+0\s+R/g)) map[m[1]] = baseFontOf(Number(m[2]))
    return map
  }

  // decodeWinAnsi() assumes /WinAnsiEncoding. jsPDF registers all fourteen
  // standard fonts in every document whether or not they are drawn with, and two
  // of them (Symbol, ZapfDingbats) carry their own built-in encodings. Flagging
  // those unconditionally would put a permanent false positive in every baseline,
  // so only fonts a text run actually SELECTS are checked, below.
  const nonWinAnsiBase = new Set()
  for (const [n, body] of [...objs].sort((a, b) => a[0] - b[0])) {
    if (!/\/Type\s*\/Font\b/.test(body)) continue
    if (/\/WinAnsiEncoding\b/.test(body)) continue
    nonWinAnsiBase.add(/\/BaseFont\s*\/([\w-]+)/.exec(body)?.[1] ?? `obj ${n}`)
  }

  const usedBaseFonts = new Set()
  const unknownFonts = new Set()
  const pages = []
  for (const pageObj of kids) {
    const body = objs.get(pageObj)
    if (body === undefined) throw new Error(`page object ${pageObj} referenced by /Kids is missing`)
    const contents = Number(/\/Contents\s+(\d+)\s+0\s+R/.exec(body)?.[1])
    const resources = Number(/\/Resources\s+(\d+)\s+0\s+R/.exec(body)?.[1])
    const mediaBox = /\/MediaBox\s*\[\s*([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s*\]/.exec(body)
    const stream = Number.isFinite(contents) ? streamBodyOf(objs.get(contents) ?? '') : null
    const runs = stream === null ? [] : readTextRuns(stream, fontsForResources(resources), ruler, unknownFonts, usedBaseFonts)
    pages.push({
      widthPt: mediaBox ? round2(Number(mediaBox[3])) : null,
      heightPt: mediaBox ? round2(Number(mediaBox[4])) : null,
      runs,
    })
  }

  const pageReports = pages.map((p, i) => {
    const straight = p.runs.filter(r => !r.rotated)
    const rightEdgePt = straight.length ? round2(Math.max(...straight.map(r => r.right))) : 0
    const widest = straight.length ? straight.reduce((a, b) => (b.right > a.right ? b : a)) : null
    const pageW = p.widthPt ?? 0
    const marginEdge = round2(pageW - MARGIN_PT)

    // Table-row proxy, defined against the artefact rather than against
    // jspdf-autotable: a baseline (shared y) carrying >= 3 distinct x positions.
    // Page chrome puts exactly two runs on a shared baseline (header left/right,
    // footer left/right), so >= 3 excludes it while every real table row — the
    // narrowest here has four columns — is counted. Documented in README.md
    // because it is a proxy, not a parse of the table model.
    const byBaseline = new Map()
    for (const r of p.runs) {
      const key = r.y.toFixed(2)
      if (!byBaseline.has(key)) byBaseline.set(key, new Set())
      byBaseline.get(key).add(r.x.toFixed(2))
    }
    let tableRows = 0, multiColumnBaselines = 0
    for (const xs of byBaseline.values()) {
      if (xs.size >= 2) multiColumnBaselines++
      if (xs.size >= 3) tableRows++
    }

    return {
      page: i + 1,
      widthPt: p.widthPt,
      heightPt: p.heightPt,
      textRuns: p.runs.length,
      rotatedRuns: p.runs.filter(r => r.rotated).length,
      glyphs: p.runs.reduce((n, r) => n + r.text.length, 0),
      tableRows,
      multiColumnBaselines,
      rightEdgePt,
      rightMarginPt: marginEdge,
      pastMarginPt: round2(Math.max(0, rightEdgePt - marginEdge)),
      pastPaperPt: round2(Math.max(0, rightEdgePt - pageW)),
      runsPastMargin: straight.filter(r => r.right > marginEdge + 0.05).length,
      runsPastPaper: straight.filter(r => r.right > pageW + 0.05).length,
      widestText: widest ? widest.text : null,
      text: p.runs.map(r => r.text),
    }
  })

  const allText = pageReports.map(p => p.text.join('\n')).join('\n\f\n')
  const dates = findDates(allText)

  return {
    kind: 'pdf',
    pageCount: pageReports.length,
    glyphCount: pageReports.reduce((n, p) => n + p.glyphs, 0),
    textRunCount: pageReports.reduce((n, p) => n + p.textRuns, 0),
    tableRowsTotal: pageReports.reduce((n, p) => n + p.tableRows, 0),
    unknownFonts: [...unknownFonts].sort(),
    // Only fonts actually drawn with — see the comment where nonWinAnsiBase is built.
    nonWinAnsiFonts: [...usedBaseFonts].filter(f => nonWinAnsiBase.has(f)).sort(),
    usedFonts: [...usedBaseFonts].sort(),
    // Hash of the TEXT, not the bytes. See the comment on this function.
    normalisedTextSha256: sha256(normaliseDates(allText)),
    // Recorded only when the caller pins the document's identity.
    //
    // A PRE-SPINE PDF cannot: jsPDF re-rolls the trailer /ID from Math.random on
    // every call, so a byte hash is a different number every run. Storing it
    // would churn the baseline file on every capture for a value that can never
    // be asserted, and a golden file that rewrites itself is not reviewable.
    //
    // A SPINE PDF can. ReportDoc's constructor feeds meta.generatedAt to
    // setCreationDate and a FNV-1a of the document's identity plus content digest
    // to setFileId, so both sources of drift are pinned. That is what lets a DGIW
    // baseline assert raw bytes and makes "the spine change altered nothing"
    // provable rather than asserted.
    rawBytesSha256: spec.assertRawBytes ? sha256(buf) : null,
    rawBytesAsserted: Boolean(spec.assertRawBytes),
    notReproducible: spec.assertRawBytes
      ? {}
      : { rawBytesSha256: 'jsPDF fills the trailer /ID from Math.random and /CreationDate from the clock' },
    bytes: buf.length,
    // Recorded, never asserted: these are the clock's, and they are exactly the
    // values a reviewer wants to see when the text hash moves for no other reason.
    clockDerived: { renderedDates: dates },
    pages: pageReports,
  }
}

// ── CSV reader ───────────────────────────────────────────────────────────

/** Split one CSV line, honouring the double-quoting the generators emit. */
export function splitCsvRow(line) {
  const out = []
  let cur = '', inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (inQuotes) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++ }
      else if (c === '"') inQuotes = false
      else cur += c
    } else if (c === '"') inQuotes = true
    else if (c === ',') { out.push(cur); cur = '' }
    else cur += c
  }
  out.push(cur)
  return out
}

export function analyseCsv(buf, spec) {
  const text = buf.toString('utf8')
  const lines = text.split('\n')
  while (lines.length && lines[lines.length - 1] === '') lines.pop()
  if (!lines.length) throw new Error('CSV is empty')

  const header = splitCsvRow(lines[0])
  const dataLines = lines.slice(1)
  const unassertable = spec.unassertable ?? []
  const unassertableIdx = unassertable.map(name => {
    const i = header.indexOf(name)
    if (i < 0) throw new Error(`declared-unassertable column ${JSON.stringify(name)} is not in the header [${header.join(', ')}]`)
    return i
  }).sort((a, b) => a - b)

  // The assertable hash covers every column EXCEPT the declared ones. Masking
  // rather than dropping keeps column positions stable in the digest, so adding
  // a column is still visible.
  const mask = line => {
    if (!unassertableIdx.length) return line
    const cells = splitCsvRow(line)
    for (const i of unassertableIdx) cells[i] = SKIP_TOKEN
    return cells.join(',')
  }

  // A baseline may only record REPRODUCIBLE facts. Where a column is
  // unassertable, everything downstream of it is unassertable too: the row
  // bytes, the file length and both whole-file hashes all move with the RNG.
  // Recording them would churn two of the nine baseline files on every capture
  // and give a reviewer numbers they must not trust. The reason is recorded in
  // their place, and the genuinely verbatim output is written to the gitignored
  // raw/ directory for anyone who wants to look at it.
  const rng = unassertableIdx.length > 0
  const reason = spec.unassertableReason ?? 'derived from an unassertable column'

  return {
    kind: 'csv',
    rowCount: dataLines.length,
    columnCount: header.length,
    header,
    // Verbatim where verbatim is meaningful. For the two Math.random CSVs the
    // unassertable cells carry a token instead of a number that would differ on
    // the next capture — every other cell is untouched.
    firstThreeRows: dataLines.slice(0, 3).map(mask),
    lastThreeRows: dataLines.slice(-3).map(mask),
    sampleRowsMasked: rng,
    unassertable,
    unassertableReason: spec.unassertableReason ?? null,
    unassertableColumnIndexes: unassertableIdx,
    assertableSha256: sha256([header.join(','), ...dataLines.map(mask)].join('\n')),
    fullTextSha256: rng ? null : sha256(text),
    rawBytesSha256: rng ? null : sha256(buf),
    rawBytesAsserted: Boolean(spec.assertRawBytes),
    bytes: rng ? null : buf.length,
    notReproducible: rng ? { bytes: reason, fullTextSha256: reason, rawBytesSha256: reason } : {},
  }
}

// ── Markdown reader ──────────────────────────────────────────────────────

export function analyseMd(buf, spec = {}) {
  const text = buf.toString('utf8')
  const lines = text.split('\n')
  const headings = lines.filter(l => /^#{1,6}\s/.test(l))
  return {
    kind: 'md',
    lineCount: lines.length,
    headingCount: headings.length,
    headings,
    normalisedTextSha256: sha256(normaliseDates(text)),
    rawBytesSha256: sha256(buf),
    /*
     * This flag used to be absent here, and its absence was a silent hole.
     *
     * A markdown file has no /ID and no CreationDate, so `rawBytesSha256` above
     * was always a real, reproducible hash — and compare.mjs opens its raw-byte
     * check with `if (!base.rawBytesAsserted) return`. The hash was therefore
     * recorded in all three markdown baselines and compared in none of them: a
     * stored value nothing reads, which is exactly the vacuous check this harness
     * exists to prevent. Found in D3 while flipping the flag on the six migrated
     * artefacts and noticing only the three PDFs moved.
     */
    rawBytesAsserted: Boolean(spec.assertRawBytes),
    bytes: buf.length,
    clockDerived: { renderedDates: findDates(text), dateLineRaw: lines[1] ?? null },
  }
}

// ── Non-emptiness ────────────────────────────────────────────────────────
// Four times in this project a check has passed vacuously over an empty set.
// Every collection the baseline stores is asserted non-empty at capture, and
// again when a baseline is read back.

export function assertNonEmpty(label, analysis) {
  const bad = m => { throw new Error(`${label}: ${m} — refusing to write a vacuous baseline`) }
  if (!analysis || typeof analysis !== 'object') bad('analysis is not an object')
  if (analysis.bytes === 0) bad('artefact is zero bytes')
  if (analysis.rawBytesAsserted && !analysis.rawBytesSha256) bad('raw bytes are asserted but no raw hash was recorded')
  if (analysis.kind === 'pdf') {
    if (!analysis.pageCount) bad('zero pages')
    if (!analysis.textRunCount) bad('zero text runs')
    if (!analysis.glyphCount) bad('zero glyphs')
    if (!analysis.tableRowsTotal) bad('zero table rows across the whole document')
    if (!analysis.pages?.length) bad('empty pages array')
    if (analysis.pages.some(p => !p.widthPt)) bad('a page has no /MediaBox width')
  } else if (analysis.kind === 'csv') {
    if (!analysis.rowCount) bad('zero data rows')
    if (!analysis.columnCount) bad('zero columns')
    if (!analysis.header?.length) bad('empty header row')
    if (!analysis.firstThreeRows?.length) bad('no sample rows captured')
  } else if (analysis.kind === 'md') {
    if (!analysis.lineCount) bad('zero lines')
    if (!analysis.headingCount) bad('zero headings')
  } else {
    bad(`unknown artefact kind ${JSON.stringify(analysis.kind)}`)
  }
}

// ── Analysis entry point ─────────────────────────────────────────────────

export function analyse(artefact, ruler) {
  const { spec, filename, bytes } = artefact
  const body = spec.kind === 'pdf' ? analysePdf(bytes, ruler, spec)
    : spec.kind === 'csv' ? analyseCsv(bytes, spec)
      : analyseMd(bytes, spec)
  return {
    artefact: spec.id,
    kind: spec.kind,
    generator: spec.exportName,
    // Recorded raw, compared normalised. D2 renames every output through
    // reportFilename(); that is an expected change, not a regression.
    filename,
    filenameNormalised: normaliseFilename(filename),
    ...body,
  }
}

/**
 * sha256 over every JSON file a module's generators read live.
 *
 * The pre-spine fixtures freeze their datasets, because those baselines have to
 * survive weeks of migration and a dataset edit must not read as a generator
 * regression. DGIW cannot do that: its seven generators import a dozen datasets
 * between them, and freezing ~2 MB of them into a fixture would mean the baseline
 * stopped describing the module actually in production.
 *
 * So DGIW reads live data, and this fingerprint closes the ambiguity that
 * creates. If a dataset changed between capture and compare, the report says so
 * in its own finding instead of leaving a spine edit holding the blame.
 */
export function datasetFingerprint(dir, sharedRel = []) {
  const abs = path.join(APP_ROOT, dir)
  if (!existsSync(abs)) return null
  const files = readdirSync(abs).filter((f) => f.endsWith('.json')).sort()
  if (files.length === 0) return null
  const lines = files.map((f) => `${f}:${sha256(readFileSync(path.join(abs, f)))}`)

  /*
   * SHARED FILES READ FROM OUTSIDE THE DIRECTORY.
   *
   * D5 stage B moved `frameworks.json` to `src/frameworks/data/` because DMBOK2,
   * DCAM and COBIT belong to the suite rather than to DGIW. The projection still
   * reads it, so dropping it out of this hash would have quietly reduced what the
   * fingerprint covers from eleven files to ten — reopening D-010's blind spot on
   * the one module that never had it, as a side effect of a relocation.
   *
   * Named in the output, not just folded into the hash: a reader comparing two
   * baselines has to be able to see WHICH files a fingerprint claims to cover,
   * or the number is just a number that changed.
   */
  const shared = [...sharedRel].sort()
  for (const rel of shared) {
    const p = path.join(APP_ROOT, rel)
    if (!existsSync(p))
      throw new Error(
        `datasetFingerprint: declared shared source ${rel} does not exist. A fingerprint that silently skips a file ` +
          `the generator reads is worth less than no fingerprint, because it still prints.`,
      )
    lines.push(`${rel}:${sha256(readFileSync(p))}`)
  }

  return {
    dir,
    files: files.length + shared.length,
    ...(shared.length ? { shared } : {}),
    sha256: sha256(lines.join('\n')),
  }
}

/**
 * The LIVE files a frozen fixture's data came from.
 *
 * ─── THE FREEZE HAS TWO DIRECTIONS, AND ONLY ONE WAS COVERED ───────────────
 *
 * BAIW, TAIW and HAIW freeze their datasets into the fixture so a dataset edit
 * cannot read as a generator regression while a migration is in flight. That
 * reason is sound and the freeze stays. But it is a two-way valve and nothing
 * said so:
 *
 *   dataset edit misattributed to the generator   the freeze PREVENTS this
 *   dataset edit invisible, the baseline quietly
 *   describing output production no longer makes  the freeze CAUSES this
 *
 * D-010 is the second direction, measured: `benchmarks.json`'s
 * `regionalLeaders["Overall Assessment"]` was corrected from 3.18 to 3.3, page 16
 * of every BAIW report moved from "0.4 levels behind regional leaders" to 0.5 —
 * and `compare.mjs` printed `exit 0 — no actionable differences`, because it
 * regenerated the page from the fixture's frozen 3.18. A client-facing sentence
 * changed and the golden record could not see it.
 *
 * DGIW never had the problem: it reads live data and records a fingerprint per
 * baseline, so the same edit surfaces as its own `source datasets` finding,
 * correctly attributed. This gives the other three the same signal without giving
 * up the freeze — the fingerprint is over the LIVE files, so when they drift away
 * from the frozen copy the baseline says so under its own name.
 *
 * @returns repo-relative paths, sorted, from the `data` block's own keys plus any
 *          `dataSources` the fixture declares for content it freezes outside it
 *          (HAIW's `capabilities` and `questions` arrays).
 *
 * THE IMPLEMENTATION MOVED to `fingerprint-decl.mjs` in D5 stage E1 and is
 * re-exported from the top of this file. It is imported by the suite gate's
 * FINGERPRINT-COVERAGE class, which asserts that every JSON file a module's
 * generators reach is in this set — the half of the D-010 story the freeze itself
 * cannot tell. This comment stays here because this is where a reader looks.
 */

/** sha256 over an explicit list of repo-relative files. Companion to the above. */
export function datasetFingerprintOf(sources) {
  if (!sources.length) return null
  const parts = []
  for (const rel of sources) {
    const abs = path.join(APP_ROOT, rel)
    // A declared source that is not there is a finding, not a shrug: it means the
    // fixture is frozen against a file that moved, so the fingerprint would
    // silently stop covering it. Same rule as REPORT-SOURCES.
    parts.push(`${rel}:${existsSync(abs) ? sha256(readFileSync(abs)) : 'MISSING'}`)
  }
  return { sources, files: sources.length, sha256: sha256(parts.join('\n')) }
}

export const baselinePath = (module, id) => path.join(BASELINE_DIR, module, `${id}.json`)
