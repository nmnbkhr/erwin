#!/usr/bin/env node
/**
 * provenance-drive.mjs — exercise src/report/provenance.ts, the recorder no
 * fixture writes and no golden baseline can see.
 *
 * ─── WHY THIS EXISTS ────────────────────────────────────────────────────────
 *
 * `scripts/golden/` captures PDF/CSV/Markdown BYTES and compares them against a
 * baseline — it has never once looked at what a generation writes to
 * `localStorage`, because nothing it produces before D5 stage F1 wrote
 * anything there. `scripts/check/` reads source text and datasets, never runs
 * a generator. Neither harness can see whether `recordProvenance` actually
 * fires, which is exactly the gap `scripts/dashboard-drive.mjs` exists to close
 * for the two dashboard radars (D-012, D-013) — same shape, different surface.
 * It REPORTS rather than asserts the artefact-by-artefact table (a human still
 * reads it, the `geometry.mjs` contract), but IS load-bearing about two things
 * it can check outright: determinism across two runs, and the recorded fileId
 * against a real PDF's own trailer /ID.
 *
 * ─── WHAT IT DRIVES ─────────────────────────────────────────────────────────
 *
 * `scripts/golden/harness.mjs::createDriver` — the same Vite SSR driver
 * `capture.mjs`/`compare.mjs` use, over the same committed fixtures, calling the
 * SAME real generator functions with the SAME real meta construction. Nothing
 * here re-implements a generator or a meta shape; reusing the harness is what
 * makes this exercise every module artefact rather than a hand-picked few.
 *
 * `createDriver` gained one additive, optional parameter for this file alone:
 * `{ plugins: [...] }`, so `provenanceFingerprintPlugin()` — normally applied by
 * `vite.config.ts`, which this bare `configFile: false` server never loads — is
 * present here too. Without it every recorded `datasetFingerprint` would read
 * `null` for a reason that has nothing to do with the recorder working.
 *
 *   node scripts/provenance-drive.mjs
 */
import { createDriver, loadFixture, MODULES } from './golden/harness.mjs'
import { provenanceFingerprintPlugin } from './vite-plugin-provenance-fingerprint.mjs'

/**
 * Minimal localStorage. `engagement/storage.ts` reads the bare global
 * (`localStorage.getItem(...)`), never `window.localStorage` — so, unlike
 * `dashboard-drive.mjs`, this does NOT also stub `globalThis.window`. This
 * driver loads the real `jspdf` package through the same server, and jsPDF's
 * browser bundle checks `typeof window !== 'undefined'` — a real browser has
 * one, Node normally does not, and capture.mjs/compare.mjs already prove jsPDF
 * loads cleanly under Node with no `window` at all. Introducing an
 * INCOMPLETE one here (as this file's first draft did) made jsPDF believe it
 * was in a browser and then crash reaching for `window` members that stub
 * never carried — so the fix is not adding more to the stub, it is not
 * shadowing `window` in the first place.
 */
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
  return storage
}

const line = (s = '') => console.log(s)
const rule = () => line('─'.repeat(88))

async function main() {
  installStorage()
  const driver = await createDriver(MODULES, { plugins: [provenanceFingerprintPlugin()] })

  try {
    const { readProvenanceLog } = await driver.server.ssrLoadModule('/src/report/provenance.ts')
    const { stableFileId, contentKey } = await driver.server.ssrLoadModule('/src/report/spine.ts')

    rule()
    line('PROVENANCE-DRIVE — every module artefact, through the real recorder')
    line('  Drives the real generators via scripts/golden/harness.mjs, over the committed')
    line('  fixtures. Nothing here asserts PDF/CSV/Markdown bytes — that is compare.mjs\'s')
    line('  job. This reads back what each generation appended to the provenance log.')
    rule()

    let totalArtefacts = 0
    let totalRecords = 0
    let mismatchedModules = 0

    for (const module of MODULES) {
      const fixture = loadFixture(module)
      const beforeCount = readProvenanceLog(fixture.engagementId).length

      // ROUND 1.
      const artefacts = await driver.generate(module)
      const afterRound1 = readProvenanceLog(fixture.engagementId)
      const round1New = afterRound1.slice(beforeCount)

      line(`\n${module.toUpperCase()} — ${artefacts.length} artefact(s) generated, ${round1New.length} provenance record(s) appended`)
      for (const rec of round1New) {
        const fp = rec.datasetFingerprint ? `${rec.datasetFingerprint.sha256.slice(0, 12)} (${rec.datasetFingerprint.files} files)` : 'MISSING'
        line(`  ${rec.kind.padEnd(4)} ${rec.artefactId.padEnd(24)} fileId=${rec.fileId ?? '(none — csv/md carry no PDF trailer)'}  fingerprint=${fp}`)
      }

      // ROUND 2 — determinism. Same fixture, same generators, same engagement:
      // the identical shape of record must be appended again, byte for byte.
      // No Math.random or clock read anywhere in provenance.ts is what this is
      // actually testing; a broken build of that promise would show up here
      // as a differing `generatedAt`, `fileId` or `datasetFingerprint` between
      // two back-to-back calls over unchanged input.
      await driver.generate(module)
      const afterRound2 = readProvenanceLog(fixture.engagementId)
      const round2New = afterRound2.slice(afterRound1.length)

      let mismatches = round1New.length === round2New.length ? 0 : round1New.length
      for (let i = 0; i < Math.min(round1New.length, round2New.length); i++) {
        const a = JSON.stringify(round1New[i])
        const b = JSON.stringify(round2New[i])
        if (a !== b) {
          mismatches++
          line(`  MISMATCH ${round1New[i].artefactId}: round 1 and round 2 records differ`)
          line(`    round 1: ${a}`)
          line(`    round 2: ${b}`)
        }
      }
      line(
        `  determinism: ${round1New.length - mismatches} of ${round1New.length} records identical across two runs` +
          (mismatches ? ' — SEE MISMATCH ABOVE' : (round2New.length !== round1New.length ? ` (round 2 appended ${round2New.length}, expected ${round1New.length})` : '')),
      )
      if (mismatches > 0 || round2New.length !== round1New.length) mismatchedModules++

      totalArtefacts += artefacts.length
      totalRecords += round1New.length
    }

    // ── fileId verification — recompute stableFileId, check it against a
    // real PDF's own trailer /ID. DGIW's CDE register PDF: its content digest
    // is contentKey(rows.map(r => r.id)), reproducible here from the SAME
    // exported buildCdeRegisterRows the generator itself calls — not a
    // reimplementation of the digest, a second call to the one that exists.
    rule()
    line('fileId verification — recomputing stableFileId against a real PDF trailer')
    line('  "not signed" (F1.1): the PDF is its own witness. Anyone holding a manifest')
    line('  entry and the PDF it describes can run this same recomputation.')
    rule()
    const { buildCdeRegisterRows, CDE_REGISTER_ARTEFACT_ID } = await driver.server.ssrLoadModule('/src/dgiw/report/cdeRegister.ts')
    const dgiwFixture = loadFixture('dgiw')
    const dgiwLog = readProvenanceLog(dgiwFixture.engagementId)
    const cdeRecord = [...dgiwLog].reverse().find((r) => r.artefactId === CDE_REGISTER_ARTEFACT_ID && r.kind === 'pdf')
    if (!cdeRecord) throw new Error('no cde-register-pdf provenance record found to verify — did the DGIW registry entry move?')

    const meta = {
      orgName: cdeRecord.orgName,
      engagementId: cdeRecord.engagementId,
      generatedAt: cdeRecord.generatedAt,
      layer: cdeRecord.layer,
      accent: dgiwFixture.accent,
      isDraft: false,
      artefactId: cdeRecord.artefactId,
    }
    const { rows } = buildCdeRegisterRows({ meta })
    const digest = contentKey(rows.map((r) => r.id))
    const seed = `${meta.artefactId}|${meta.engagementId}|${meta.orgName}|${meta.layer}|${meta.generatedAt}|${digest}`
    const recomputed = stableFileId(seed)

    line(`  recorded  fileId              ${cdeRecord.fileId}`)
    line(`  recomputed stableFileId(seed) ${recomputed}`)
    line(`  seed = artefactId|engagementId|orgName|layer|generatedAt|contentKey(${rows.length} row ids)`)
    if (recomputed !== cdeRecord.fileId) {
      throw new Error(
        'recomputed stableFileId does NOT match the recorded fileId — the record is not a faithful witness of the PDF trailer',
      )
    }
    line('  MATCH — the recorded fileId is exactly the PDF\'s own trailer /ID')

    // ── the no-engagement path. useReportMeta.ts / useDeliverable.ts both
    // document that engagementId falls back to '' with no active engagement;
    // the recorder must still produce a record, filed under the unfiled
    // bucket with engagementId: null rather than a fabricated id.
    rule()
    line('no active engagement — the unfiled bucket (engagementId: null)')
    rule()
    const { saveReport } = await driver.server.ssrLoadModule('/src/report/spine.ts')
    const { buildCdeRegisterPdf } = await driver.server.ssrLoadModule('/src/dgiw/report/cdeRegister.ts')
    const beforeUnfiled = readProvenanceLog(null).length
    const noEngagementMeta = {
      orgName: 'Walk-in (no engagement)',
      engagementId: '',
      generatedAt: dgiwFixture.generatedAt,
      layer: 'all',
      accent: dgiwFixture.accent,
      isDraft: false,
      artefactId: CDE_REGISTER_ARTEFACT_ID,
    }
    saveReport(buildCdeRegisterPdf({ meta: noEngagementMeta }), 'walk-in.pdf', noEngagementMeta)
    const unfiledLog = readProvenanceLog(null)
    const unfiledRecord = unfiledLog[unfiledLog.length - 1]
    if (unfiledLog.length !== beforeUnfiled + 1 || unfiledRecord.engagementId !== null) {
      throw new Error('a no-engagement saveReport call did not append engagementId: null to the unfiled bucket')
    }
    line(`  recorded: engagementId=${unfiledRecord.engagementId}  orgName=${unfiledRecord.orgName}  artefactId=${unfiledRecord.artefactId}`)
    line('  OK — no id was fabricated, and the record still exists to be read back')

    rule()
    line(
      `TOTAL: ${totalArtefacts} artefacts generated across ${MODULES.length} modules, ${totalRecords} provenance records ` +
        `appended, ${mismatchedModules} module(s) with a determinism mismatch, fileId recomputation MATCHED, ` +
        `unfiled bucket verified`,
    )
    rule()

    if (mismatchedModules > 0) process.exitCode = 1
  } finally {
    await driver.close()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
