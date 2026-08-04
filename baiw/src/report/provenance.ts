/**
 * Artefact provenance — one append-only record per generated deliverable.
 *
 * ─── THE QUESTION THIS ANSWERS ──────────────────────────────────────────────
 *
 * Every report already produces a content digest: `stableFileId()` in spine.ts
 * folds `artefactId | engagementId | orgName | layer | generatedAt |
 * contentDigest` into the PDF's trailer /ID, so two documents with different
 * content cannot share one. Nothing recorded it. A client asking "is this the
 * report you sent us in March?" could not be answered — the PDF is its own
 * witness, but nobody was keeping a copy of what it witnessed.
 *
 * ─── NOT SIGNED, AND WHY THAT IS THE RIGHT CALL ─────────────────────────────
 *
 * A client-side signature is not evidence against the party who controls the
 * client — the consultant is the party an audit question is about, and a key
 * that lives in the same browser as the document proves nothing a browser
 * console couldn't fabricate too. What the PDF already carries instead: /ID is
 * a one-way function (FNV-1a, four times over salted variants — see spine.ts)
 * of all six seed fields, so a plaintext manifest entry can be checked against
 * a PDF's own trailer by ANYONE who has both, and an edited manifest entry
 * stops matching. That is a real property and it does not require inventing a
 * key-management story this suite has no server to anchor.
 *
 * ─── WHY BUILD-TIME, NOT RUNTIME WEB CRYPTO ─────────────────────────────────
 *
 * The dataset fingerprint every record carries (`datasetFingerprint` below) has
 * to be a hash of the SOURCE BYTES a module's generators read — exactly what
 * `scripts/golden/harness.mjs`'s `datasetFingerprint()` computes for a golden
 * baseline. The browser never holds those bytes: by the time a JSON dataset
 * reaches this code it has been parsed, tree-shaken and possibly reordered by
 * the bundler, so a runtime `crypto.subtle.digest()` over `JSON.stringify(data)`
 * could never equal the Node-side hash and the two halves could never be
 * compared. `__PROVENANCE_FINGERPRINT__` is computed once, in Node, over the
 * real files, by `scripts/vite-plugin-provenance-fingerprint.mjs`, and baked
 * into the bundle as a `define` constant — see that file, and the ambient
 * declaration in `provenance-fingerprint.d.ts`. Byte-identical to what a golden
 * capture would hash is the point, not an accident.
 *
 * This is the first build-time-computed value under `src/` in this repo —
 * everything else here is either authored data or derived at runtime from it.
 *
 * ─── ONE APPENDED LOG PER ENGAGEMENT, NOT ONE MANIFEST PER EXPORT ───────────
 *
 * Closer to the `artefact_run` table F2.1 promotes this to (one row per run,
 * queried per engagement) than a manifest-per-PDF would be, so that migration
 * is a lift-and-shift rather than a redesign. One file to hand to a client
 * rather than one per export. And read-modify-write under one storage key is
 * exactly what `usePersistedState` already does on every keystroke elsewhere in
 * this suite — no new persistence idiom, just this module's own use of the same
 * primitives (`engagement/storage.ts`).
 *
 * `engagementId: null` when there is none — never a fabricated id. Records with
 * no active engagement go to a separate, unnamespaced bucket (`UNFILED_KEY`)
 * rather than being silently dropped or filed under an invented identity: two
 * exports of the same assessment must not differ because an id was invented for
 * one of them and not the other.
 *
 * ─── DETERMINISM ────────────────────────────────────────────────────────────
 *
 * Same inputs, same record, byte for byte: no `Math.random`, no bare
 * `new Date()` anywhere in this file (the CLAUDE.md rule for `src/report/`
 * applies here too). `generatedAt` comes from `ReportMeta`, already truncated to
 * the day by every caller. There is deliberately no independent "recorded at"
 * timestamp — a report regenerated from identical inputs produces an identical
 * record, matching the byte-identical PDF/CSV/Markdown it describes, rather
 * than a log entry that looks different for no reason a reader could act on.
 *
 * ─── FAILURE MUST NOT BLOCK THE ARTEFACT, AND MUST NOT BE SILENT ────────────
 *
 * `recordProvenance()` never throws — every caller in `spine.ts`, `csv.ts` and
 * `markdown.ts` calls it AFTER the file has already been handed to the browser,
 * so a recording failure can never cost the user the document they clicked for.
 * An unexpected failure (corrupt existing log, storage quota) is logged with
 * `console.error` rather than swallowed: the one channel already established at
 * this call depth (`EngagementSwitcher.tsx`'s own `[engagement] export failed`
 * pattern). There is no in-app toast for this yet — that is a stated gap, not a
 * silent one. A merely EXPECTED non-recording (no build-time fingerprint
 * available — see below) is not a failure and logs nothing.
 *
 * ─── WHAT THIS DOES NOT COVER ───────────────────────────────────────────────
 *
 * Five exits produce a user-facing file and are NOT wired to this recorder:
 * `downloadPDF` and `generateQuickPDF` (screenshot-to-PDF and the quick-scan
 * PDF, neither of which carries an artefact id or a content digest to record),
 * and `downloadJSON` (generic state export, ~30 call sites, none of them a
 * catalogued or module-report artefact). Only `saveReport`, `downloadCsv` and
 * `saveMarkdown` — the three exits that carry a `ReportMeta` — route through
 * here, and `PROVENANCE-COVERAGE` (scripts/check/suite/) enforces that every
 * call to those three, within the declared report source set, supplies it.
 *
 * CSV and Markdown records carry `fileId: null`. Only a jsPDF document has a
 * trailer /ID to read back; there is no equivalent content-addressed handle for
 * a CSV or a Markdown file, and the record says so rather than implying one.
 *
 * The golden capture/compare harness (`scripts/golden/harness.mjs`) boots its
 * OWN bare Vite server with `configFile: false` and never loads this suite's
 * `vite.config.ts` plugins, and it runs with no `localStorage` at all. Both
 * globals this module reads are therefore genuinely absent there — not a bug,
 * a different process — and both reads below are written to degrade to `null`
 * rather than throw. See `scripts/provenance-drive.mjs` for how this is
 * actually exercised, since no fixture writes a provenance record and no golden
 * baseline can see one.
 */
import type { ReportMeta } from './types'
import { readNsRaw, writeNsRaw, removeNs, safeGet, safeSet } from '../engagement/storage'

export type ProvenanceKind = 'pdf' | 'csv' | 'md'

/**
 * Mirrors the shape `scripts/golden/harness.mjs::datasetFingerprint` /
 * `datasetFingerprintOf` print into a golden baseline's own `datasets` field —
 * see `scripts/golden/fingerprint-decl.mjs`'s `computeModuleFingerprint`, which
 * both this constant's build-time producer and that harness ultimately compute
 * from. `dir`/`shared` are DGIW's directory-hash shape; `sources` is the
 * declared-list shape BAIW/TAIW/HAIW use.
 */
export interface DatasetFingerprint {
  files: number
  sha256: string
  dir?: string
  shared?: string[]
  sources?: string[]
}

export interface ProvenanceRecord {
  kind: ProvenanceKind
  artefactId: string
  /** Derived from artefactId's shape (MR-<MODULE>-* or AR-nn) — see moduleOfArtefactId. */
  module: string | null
  engagementId: string | null
  orgName: string
  layer: ReportMeta['layer']
  /** ISO 8601, truncated to the day — copied verbatim from ReportMeta.generatedAt. */
  generatedAt: string
  filename: string
  /**
   * G1: 'engagement' when the document was built from the engagement's own
   * intake, 'reference' when it fell back to ILLUSTRATIVE reference content,
   * null when the artefact predates or does not carry the distinction. Copied
   * verbatim from ReportMeta.mode — the audit trail must be able to tell a
   * client-specific charter from a watermarked reference one without opening
   * the PDF.
   */
  mode: 'engagement' | 'reference' | null
  /**
   * G2: the tier a score-carrying artefact was measured at and its coverage at
   * that tier, copied verbatim from ReportMeta. Both null on artefacts with no
   * assessment score — the record says "no tier applies" rather than implying
   * a full assessment. The audit question they answer: was the March scorecard
   * a Deep Dive or a Quick pass, without opening the PDF.
   */
  assessmentTier: 'quick' | 'standard' | 'deep' | null
  assessmentCoverage: { answered: number; applicable: number } | null
  /** jsPDF's own /ID, from doc.getFileId(). Always null for 'csv' and 'md'. */
  fileId: string | null
  /** This module's dataset fingerprint as of THIS BUILD. null if unavailable — see moduleFingerprint(). */
  datasetFingerprint: DatasetFingerprint | null
}

/** The one storage base every engagement's log is namespaced under. */
const PROVENANCE_BASE = 'godaitec-provenance-log'
/**
 * Flat, unnamespaced key for artefacts generated with no active engagement.
 * `useReportMeta.ts` and `useDeliverable.ts` both document that this path is
 * reachable — `engagementId` falls back to `''` rather than throwing — so a
 * record still needs somewhere to go. A shared bucket, not an invented
 * engagement id: the record's own `engagementId: null` still says truthfully
 * that none was active.
 */
const UNFILED_KEY = 'wb.provenance.unfiled'

/**
 * `MR-BAIW-MATURITY` -> `'baiw'`, `MR-TAIW-REGISTER` -> `'taiw'`, `AR-13` ->
 * `'dgiw'`. Derived from the id shape ARTEFACT-IMPL already asserts (`MR-` ids
 * carry their owning module's prefix; catalogued `AR-nn` ids are DGIW-only
 * today) rather than threaded as a new parameter through 32 call sites — one
 * more thing that would need to independently agree with the id shape and
 * could independently drift from it.
 */
export function moduleOfArtefactId(id: string): string | null {
  const mr = /^MR-([A-Z]+)-/.exec(id)
  if (mr) return mr[1].toLowerCase()
  return /^AR-\d+$/.test(id) ? 'dgiw' : null
}

/**
 * The build-time fingerprint table, read defensively.
 *
 * `typeof ... !== 'undefined'` rather than a bare reference: the identifier is
 * replaced by `scripts/vite-plugin-provenance-fingerprint.mjs` via Vite's
 * `define`, which the golden harness's own bare `createServer` never applies
 * (see this file's header). A bare reference would throw a ReferenceError
 * there on every single captured artefact; this reads as `null` instead, which
 * `recordProvenance` treats as "no fingerprint available", not an error.
 */
function moduleFingerprint(module: string | null): DatasetFingerprint | null {
  if (module === null) return null
  const table: Record<string, DatasetFingerprint | null> =
    typeof __PROVENANCE_FINGERPRINT__ !== 'undefined' ? __PROVENANCE_FINGERPRINT__ : {}
  return table[module] ?? null
}

function readLog(engagementId: string | null): ProvenanceRecord[] {
  const raw = engagementId === null ? safeGet(UNFILED_KEY) : readNsRaw(PROVENANCE_BASE, engagementId)
  if (raw === null) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as ProvenanceRecord[]) : []
  } catch {
    // Corrupt value — same degrade as usePersistedState's readEntry: fall back
    // to empty rather than throwing into a click handler. The bad string is
    // left on disk; the next append below replaces it wholesale.
    return []
  }
}

function writeLog(engagementId: string | null, log: ProvenanceRecord[]): void {
  const raw = JSON.stringify(log)
  if (engagementId === null) safeSet(UNFILED_KEY, raw)
  else writeNsRaw(PROVENANCE_BASE, engagementId, raw)
}

/**
 * Append one record for a generated artefact.
 *
 * Called from `saveReport`, `downloadCsv` and `saveMarkdown` — never call this
 * directly from a component; that would be a second recorder, which is exactly
 * the drift `PROVENANCE-COVERAGE` and this single function exist to prevent.
 *
 * NEVER THROWS. A failure here must not cost the user the file they clicked
 * for — see this file's header. Every caller invokes this AFTER handing the
 * artefact to the browser, so even a defect in this function cannot delay or
 * block the download; this internal try/catch is defence in depth on top of
 * that ordering, not a substitute for it.
 */
export function recordProvenance(kind: ProvenanceKind, meta: ReportMeta, filename: string, fileId: string | null): void {
  try {
    const module = moduleOfArtefactId(meta.artefactId)
    const engagementId = meta.engagementId || null
    const record: ProvenanceRecord = {
      kind,
      artefactId: meta.artefactId,
      module,
      engagementId,
      orgName: meta.orgName,
      layer: meta.layer,
      generatedAt: meta.generatedAt,
      filename,
      mode: meta.mode ?? null,
      assessmentTier: meta.assessmentTier ?? null,
      assessmentCoverage: meta.assessmentCoverage ?? null,
      fileId,
      datasetFingerprint: moduleFingerprint(module),
    }
    writeLog(engagementId, [...readLog(engagementId), record])
  } catch (err) {
    console.error('[provenance] failed to record', meta.artefactId, err)
  }
}

/** Every record for one engagement (or the unfiled bucket, given null), oldest first. */
export function readProvenanceLog(engagementId: string | null): ProvenanceRecord[] {
  return readLog(engagementId)
}

/**
 * Delete one engagement's provenance log. Called from `EngagementContext.tsx`'s
 * `remove()` — deliberately NOT wired onto `duplicate()` (which copies every
 * `PERSISTED_BASES` key): a copied log would carry records whose `engagementId`
 * field still names the SOURCE engagement, sitting under the COPY's id, which
 * is a confusing state to leave lying around for the sake of reusing one
 * existing code path. This base is intentionally not in `PERSISTED_BASES` for
 * the same reason.
 */
export function clearProvenanceLog(engagementId: string): void {
  removeNs(PROVENANCE_BASE, engagementId)
}

/** The shape `EngagementContext.tsx::exportProvenanceLog` downloads as a file. */
export interface ProvenanceLogExport {
  kind: 'godaitec.provenance-log'
  version: 1
  exportedAt: string
  engagementId: string | null
  orgName: string | null
  records: ProvenanceRecord[]
}

/**
 * Build the exportable log. `exportedAt` is supplied by the caller rather than
 * read from the clock here — this file is under `src/report/`, where CLAUDE.md
 * forbids `new Date()`/`Date.now()` outright, and the one real caller
 * (`EngagementContext.tsx::exportProvenanceLog`) already has `nowIso()` in
 * scope for exactly this, matching `exportOne`'s own `exportedAt`.
 */
export function buildProvenanceExport(
  engagementId: string | null,
  orgName: string | null,
  exportedAt: string,
): ProvenanceLogExport {
  return {
    kind: 'godaitec.provenance-log',
    version: 1,
    exportedAt,
    engagementId,
    orgName,
    records: readProvenanceLog(engagementId),
  }
}
