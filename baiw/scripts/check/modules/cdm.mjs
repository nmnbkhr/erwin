/**
 * CDM — industry canonical data models.
 *
 * Three classes over the CDM meta-schema: CDM-VERSION-PIN (a descriptor never
 * outruns its dossier), CDM-PROVENANCE (every record says where it came from,
 * and the derived-synthetic firewall holds), CDM-COVERAGE (a declared stage is
 * backed by content, and every id resolves).
 *
 * ─── THESE CLASSES EXAMINE NOTHING ON A NORMAL BUILD, BY DESIGN ────────────
 *
 * `CDM_MODELS` lands EMPTY at CDM-P1 — the meta-schema ships before any model
 * content does. So all three declare `mayBeEmpty` with a reason, and they are
 * the first classes in this repo to do so. Read the REGISTRY and CDM summary
 * lines rather than the green verdict: green here means "no model is declared
 * yet", not "the declared models are sound".
 *
 * That is the same shape as `verify:quick` printing SKIP for check:selftest —
 * an expected absence, stated on stdout, rather than one a reader has to
 * notice. It stops being true the moment CDM-P2 registers a model, and nothing
 * has to be edited here for it to: the classes start examining real units and
 * `mayBeEmpty` simply stops being reached.
 *
 * ─── WHICH IS WHY THE FIXTURE EXISTS ───────────────────────────────────────
 *
 * A class that examines nothing on every build is indistinguishable from one
 * that stopped running, and `mayBeEmpty` buys silence rather than confidence.
 * `scripts/fixtures/cdm-fixture.mts` is the only thing that proves these three
 * can still FIRE. It is included ONLY under CDM_SELFTEST_FIXTURE=1, which
 * check/selftest.mjs sets for the seventeen CDM rows and nothing else sets.
 *
 * Gating on an env var rather than on the fixture's presence on disk is
 * deliberate: the fixture is a committed, tracked file, so "include it if it
 * exists" would mean the fixture is checked on every build and the empty
 * registry would never be visible. The declared behaviour — CDM_MODELS alone
 * in normal runs — is the thing being asserted, so it must be the default.
 */
import fs from 'node:fs'
import path from 'node:path'

/** The one switch. Set by check/selftest.mjs for the CDM rows; nothing else. */
const FIXTURE_ON = process.env.CDM_SELFTEST_FIXTURE === '1'

/**
 * Frontmatter, parsed strictly enough to tell "absent" from "empty".
 * Returns null when there is no parseable block at all — CDM-VERSION-PIN
 * distinguishes that from a block missing a key, because they are different
 * defects with different fixes.
 */
const frontmatter = (text) => {
  const m = /^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)/.exec(text)
  if (!m) return null
  const out = {}
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z][A-Za-z0-9_]*):\s*(.*)$/.exec(line)
    if (kv) out[kv[1]] = kv[2].trim().replace(/^["'](.*)["']$/, '$1')
  }
  return out
}

/** ISO calendar date, and a date that actually exists — `2026-02-30` is not one. */
const isIsoDate = (s) => {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  const d = new Date(`${s}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s
}

/**
 * `dossierPath` is repo-relative, and the repo root is one level ABOVE the
 * root check.mjs runs against — `docs/cdm/dossiers/` sits beside `baiw/`, not
 * inside it, while the fixture's own dossier sits under `scripts/`. Both
 * locations are tried and the miss is reported with both, so a path that
 * resolves nowhere names the two places it was looked for rather than one.
 */
const dossierCandidates = (root, rel) => [path.join(root, rel), path.join(root, '..', rel)]

/**
 * The model set the three classes range over.
 *
 * At CDM-P1 there is no bundle store: CDM_MODELS holds DESCRIPTORS and the only
 * content bundles in the repo are the fixture's. CDM-P2 adds the real store and
 * widens this function; until then a registered descriptor with no bundle is
 * reported by CDM-COVERAGE rather than skipped, because a model that is declared
 * and has no content is exactly the condition the stage floors exist to catch.
 */
const modelsOf = (ctx) => {
  const declared = ctx.ts?.meta?.CDM_MODELS ?? []
  const bundles = FIXTURE_ON ? (ctx.ts?.fixture?.CDM_FIXTURE_BUNDLES ?? []) : []
  const byId = new Map(bundles.map((b) => [b.descriptor.modelId, b]))
  const out = bundles.map((b) => ({ descriptor: b.descriptor, bundle: b }))
  for (const d of declared) if (!byId.has(d.modelId)) out.push({ descriptor: d, bundle: null })
  return out
}

/** The use-case page registry a mapping's `useCasePageId` must resolve into. */
const pageRegistryFor = (ctx, hostWorkbench) => {
  const fixtureReg = FIXTURE_ON ? (ctx.ts?.fixture?.CDM_FIXTURE_PAGE_REGISTRY ?? {}) : {}
  return fixtureReg[hostWorkbench] ?? null
}

/** Shared load-failure guard. examined 0, never a phantom 1 — the _industry rule. */
const loadFailed = (ctx) => {
  if (ctx.ts?.meta) return false
  ctx.fail(`src/cdm/meta/cdmMeta.ts could not be loaded: ${ctx.tsLoadError ?? 'unknown error'}`)
  return true
}

const EMPTY_REASON =
  'CDM_MODELS lands empty at CDM-P1 — the meta-schema ships before any model content. ' +
  'The seventeen fixture mutations in check:selftest are what prove this class can fire; ' +
  'this stops being reached the moment CDM-P2 registers a model.'

// ── CDM-VERSION-PIN ─────────────────────────────────────────────────────────
// A descriptor must never outrun its dossier. The dossier is the reviewed
// artefact — licensing, feasibility, the go/wait verdict — and the descriptor is
// what the code builds from. When they disagree, the code is building on a claim
// nobody reviewed.
const versionPin = {
  code: 'CDM-VERSION-PIN',
  mayBeEmpty: EMPTY_REASON,
  run(ctx) {
    if (loadFailed(ctx)) return { examined: 0 }
    const models = modelsOf(ctx)
    let examined = 0
    for (const { descriptor: d } of models) {
      examined++
      const tried = dossierCandidates(ctx.root, d.dossierPath)
      const found = tried.find((p) => fs.existsSync(p) && fs.statSync(p).isFile())
      if (!found) {
        ctx.fail(`${d.modelId} declares dossierPath ${d.dossierPath} and no file is there — looked in ${tried.join(' and ')}`)
        continue
      }
      const fm = frontmatter(fs.readFileSync(found, 'utf8'))
      if (!fm) {
        ctx.fail(`${d.modelId}: ${d.dossierPath} has no parseable YAML frontmatter block`)
        continue
      }
      for (const key of ['modelId', 'versionPin', 'regime', 'verdict']) {
        // Absent and empty are one finding here on purpose: both leave the
        // descriptor unbacked, and `versionPin:` with nothing after it is the
        // more likely of the two to be written by hand and skimmed past.
        if (!(key in fm) || fm[key] === '') ctx.fail(`${d.modelId}: ${d.dossierPath} frontmatter is missing ${key} — an unpinned model is the condition this class exists to prevent`)
      }
      if ('modelId' in fm && fm.modelId !== d.modelId) ctx.fail(`${d.modelId}: dossier frontmatter names modelId ${JSON.stringify(fm.modelId)} — the descriptor and its dossier are not about the same model`)
      if ('versionPin' in fm && fm.versionPin !== d.versionPin) ctx.fail(`${d.modelId}: descriptor versionPin ${JSON.stringify(d.versionPin)} but dossier says ${JSON.stringify(fm.versionPin)} — the descriptor has outrun the reviewed dossier`)
      if ('regime' in fm && fm.regime !== d.regime) ctx.fail(`${d.modelId}: descriptor regime ${JSON.stringify(d.regime)} but dossier says ${JSON.stringify(fm.regime)} — licensing drift between the code and the reviewed analysis`)
      if (d.stage >= 1 && fm.verdict !== 'go') ctx.fail(`${d.modelId}: descriptor declares stage ${d.stage} while the dossier verdict is ${JSON.stringify(fm.verdict)} — building past a verdict that is not go`)
      // Pinning the exact downloaded version is the FIRST act of Stage 1, so an
      // UNPINNED value is legal at stage 0 and nowhere else.
      if (d.stage >= 1 && typeof d.versionPin === 'string' && d.versionPin.startsWith('UNPINNED')) ctx.fail(`${d.modelId}: versionPin ${JSON.stringify(d.versionPin)} at stage ${d.stage} — pinning the exact downloaded version is the first act of Stage 1, so building past an unpinned model is a fail`)
    }
    return { examined, models: models.length }
  },
}

// ── CDM-PROVENANCE ──────────────────────────────────────────────────────────
// The fabrication firewall, at record level. D-001's rule — when an input is
// unavailable, produce nothing and say so — reaches the model layer here: a
// record with no citation is content nobody can trace, and a `verbatim` record
// under a derived-synthetic regime is a licensing claim nobody can defend.
const provenance = {
  code: 'CDM-PROVENANCE',
  mayBeEmpty: EMPTY_REASON,
  run(ctx) {
    if (loadFailed(ctx)) return { examined: 0 }
    let examined = 0
    for (const { descriptor: d, bundle } of modelsOf(ctx)) {
      if (!bundle) continue
      const sourceIds = new Set((d.sources ?? []).map((s) => s.id))
      // `extendable` says whether workbenchExtension is a legal excuse for this
      // KIND of record. Subject areas and mappings can never be extensions:
      // a subject area is the source model's own partition, and a mapping is
      // authored judgment that must cite what it was authored from.
      const collections = [
        ['subjectArea', bundle.subjectAreas ?? [], false],
        ['entity', bundle.entities ?? [], true],
        ['attribute', bundle.attributes ?? [], true],
        ['relationship', bundle.relationships ?? [], true],
        ['useCaseMapping', bundle.useCaseMappings ?? [], false],
      ]
      for (const [kind, records, extendable] of collections) {
        for (const r of records) {
          examined++
          const where = `${d.modelId} ${kind} ${r.id}`
          if (!r.provenance) {
            if (extendable && r.workbenchExtension === true) continue
            ctx.fail(extendable
              ? `${where} has no provenance and is not flagged workbenchExtension — a record with no citation is content nobody can trace back to a source`
              : `${where} has no provenance — a ${kind} can never be a workbench extension, so provenance is unconditional here`)
            continue
          }
          const p = r.provenance
          if (!sourceIds.has(p.sourceId)) ctx.fail(`${where} cites sourceId ${JSON.stringify(p.sourceId)}, which is not in the descriptor's sources[] — a dangling citation is unverifiable, not merely untidy`)
          if (typeof p.locator !== 'string' || p.locator.trim() === '') ctx.fail(`${where} has an empty locator — a citation a human cannot re-find is not a citation`)
          if (!isIsoDate(p.verifiedOn)) ctx.fail(`${where} has verifiedOn ${JSON.stringify(p.verifiedOn)}, which is not a valid ISO date`)
          if (d.regime === 'derived-synthetic' && p.method === 'verbatim') ctx.fail(`${where} is method 'verbatim' under a derived-synthetic regime — copying source text under a derivation licence is the claim this firewall exists to stop`)
          if (kind === 'useCaseMapping' && p.method !== 'derived') ctx.fail(`${where} is method ${JSON.stringify(p.method)} — a mapping is authored judgment by definition, so anything but 'derived' is a category error`)
        }
      }
    }
    return { examined }
  },
}

// ── CDM-COVERAGE ────────────────────────────────────────────────────────────
// A declared stage is a claim about what has been done. This class is what makes
// the claim cost something: stage 3 with no mappings is a roadmap wearing a
// completion badge.
const coverage = {
  code: 'CDM-COVERAGE',
  mayBeEmpty: EMPTY_REASON,
  run(ctx) {
    if (loadFailed(ctx)) return { examined: 0 }
    let examined = 0
    const models = modelsOf(ctx)
    // Cross-model ids are resolved against every model in scope, so CV-M3 can
    // tell "belongs to another model" from "belongs to nothing".
    const entityOwner = new Map()
    for (const { bundle } of models) {
      for (const e of bundle?.entities ?? []) if (!entityOwner.has(e.id)) entityOwner.set(e.id, e.modelId)
    }

    for (const { descriptor: d, bundle } of models) {
      examined++
      if (!bundle) {
        // A descriptor with no content bundle cannot be checked for closure, and
        // saying nothing would make it look sound. Stage 0 is the one honest
        // case: nothing has been extracted yet.
        if (d.stage >= 1) ctx.fail(`${d.modelId} declares stage ${d.stage} and has no content bundle — the stage floors cannot be checked against content that does not exist`)
        continue
      }
      const sa = bundle.subjectAreas ?? []
      const ent = bundle.entities ?? []
      const attr = bundle.attributes ?? []
      const rel = bundle.relationships ?? []
      const map = bundle.useCaseMappings ?? []

      if (d.stage >= 1 && sa.length === 0) ctx.fail(`${d.modelId} declares stage ${d.stage} with no subject areas — stage 1 is the subject-area extraction`)
      if (d.stage >= 2 && ent.length === 0) ctx.fail(`${d.modelId} declares stage ${d.stage} with no entities — stage 2 is the entity extraction`)
      if (d.stage >= 3 && map.length === 0) ctx.fail(`${d.modelId} declares stage ${d.stage} with no use-case mappings — stage 3 is the mapping onto the workbench`)
      if (d.stage >= 4) {
        // Stage 4 adds no collection; its artefact is the enrichment report, so
        // the assertion is a file-exists condition rather than a count.
        const tried = dossierCandidates(ctx.root, 'docs/cdm/enrichment')
        if (!tried.some((p) => fs.existsSync(p))) ctx.fail(`${d.modelId} declares stage 4 and docs/cdm/enrichment/ does not exist — stage 4's artefact is the enrichment report`)
      }

      const saIds = new Set(sa.map((r) => r.id))
      const entIds = new Set(ent.map((r) => r.id))
      for (const e of ent) {
        examined++
        if (!saIds.has(e.subjectAreaId)) ctx.fail(`${d.modelId} entity ${e.id} points at subjectAreaId ${JSON.stringify(e.subjectAreaId)}, which this model does not contain`)
      }
      for (const a of attr) {
        examined++
        if (!entIds.has(a.entityId)) ctx.fail(`${d.modelId} attribute ${a.id} points at entityId ${JSON.stringify(a.entityId)}, which this model does not contain`)
      }
      for (const r of rel) {
        examined++
        for (const [side, id] of [['fromEntityId', r.fromEntityId], ['toEntityId', r.toEntityId]]) {
          if (!entIds.has(id)) ctx.fail(`${d.modelId} relationship ${r.id} ${side} ${JSON.stringify(id)} does not resolve within this model`)
        }
      }
      for (const m of map) {
        examined++
        for (const id of m.entityIds ?? []) {
          if (entIds.has(id)) continue
          const owner = entityOwner.get(id)
          if (owner && owner !== d.modelId) {
            // The reserved cross-model flag. Until the crosswalk engine exists,
            // spanning models without saying so is a silent join across two
            // vocabularies — the D-001 shape at model scope.
            if (m.crossModel !== true) ctx.fail(`${d.modelId} mapping ${m.id} reaches entity ${JSON.stringify(id)} in model ${owner} without crossModel: true — a mapping that spans models is a cross-model join, and the engine for those does not exist yet`)
          } else {
            ctx.fail(`${d.modelId} mapping ${m.id} references entityId ${JSON.stringify(id)}, which no model in scope contains`)
          }
        }
        const pages = pageRegistryFor(ctx, d.hostWorkbench)
        if (pages === null) ctx.fail(`${d.modelId} mapping ${m.id} cannot be resolved: no use-case page registry is known for hostWorkbench ${JSON.stringify(d.hostWorkbench)} — an unresolvable page id is unverifiable, not acceptable`)
        else if (!pages.includes(m.useCasePageId)) ctx.fail(`${d.modelId} mapping ${m.id} names useCasePageId ${JSON.stringify(m.useCasePageId)}, which the ${d.hostWorkbench} page registry does not contain`)
      }

      for (const [kind, records] of [['subjectAreas', sa], ['entities', ent], ['attributes', attr], ['relationships', rel], ['useCaseMappings', map]]) {
        const seen = new Set()
        for (const r of records) {
          if (seen.has(r.id)) ctx.fail(`${d.modelId} ${kind} contains duplicate id ${JSON.stringify(r.id)} — a duplicate id makes every reference to it ambiguous`)
          seen.add(r.id)
        }
      }
    }
    return { examined, models: models.length }
  },
}

export default {
  id: 'cdm',
  title: 'CDM — industry canonical data models',
  tsModules: {
    meta: 'src/cdm/meta/cdmMeta.ts',
    fixture: 'scripts/fixtures/cdm-fixture.mts',
  },
  checks: [versionPin, provenance, coverage],
  summary(ctx) {
    const declared = ctx.ts?.meta?.CDM_MODELS ?? []
    const models = modelsOf(ctx)
    const lines = [
      `CDM ${declared.length} model(s) declared in CDM_MODELS, ${models.length} in scope` +
        (FIXTURE_ON ? '  — CDM_SELFTEST_FIXTURE=1, the check fixture is in scope' : ''),
    ]
    if (declared.length === 0 && !FIXTURE_ON) {
      lines.push(`  the registry is EMPTY, so all three classes examined 0 and declare mayBeEmpty — green here means`)
      lines.push(`  "no model is declared yet", NOT "the declared models are sound". check:selftest's CDM rows are`)
      lines.push(`  what prove the three can still fire; this line changes the day CDM-P2 registers a model.`)
    }
    return lines
  },
}
