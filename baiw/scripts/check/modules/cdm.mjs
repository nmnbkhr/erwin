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
 * CDM-P2 added the real store, which is what this function was always going to
 * need to be widened for. A descriptor's content comes from CDM_CONTENT keyed
 * by modelId; the fixture's comes from its own bundles, which carry their own
 * descriptors and never enter CDM_MODELS.
 *
 * A registered descriptor with NO content at all still produces an entry with a
 * null bundle rather than being skipped, and CDM-COVERAGE reports it: a model
 * that is declared and has no content is exactly the condition the stage floors
 * exist to catch, and skipping it would make the worst case invisible.
 */
const modelsOf = (ctx) => {
  const declared = ctx.ts?.meta?.CDM_MODELS ?? []
  const content = ctx.ts?.content?.CDM_CONTENT ?? {}
  const bundles = FIXTURE_ON ? (ctx.ts?.fixture?.CDM_FIXTURE_BUNDLES ?? []) : []
  const byId = new Map(bundles.map((b) => [b.descriptor.modelId, b]))
  const out = bundles.map((b) => ({ descriptor: b.descriptor, bundle: b }))
  for (const d of declared) {
    if (byId.has(d.modelId)) continue
    const body = content[d.modelId]
    out.push({ descriptor: d, bundle: body ? { descriptor: d, ...body } : null })
  }
  return out
}

/**
 * The use-case page registry a mapping's `useCasePageId` must resolve into.
 *
 * ONE registry for every workbench, real or fixture — src/cdm/meta/useCasePages.ts.
 * This used to read a private map the fixture carried, so every real
 * hostWorkbench resolved to null and failed as "unresolvable by design". That
 * was honest while no real model existed and is now simply wrong: iso20022 is
 * hosted on baiw, and baiw has eighteen pages.
 *
 * A workbench nobody has registered yields an EMPTY list, not null, and a
 * mapping into it fails as an unresolvable page id — which is the same finding
 * a typo'd id gets, because they are the same defect from the reader's side.
 */
const pageIdsFor = (ctx, hostWorkbench) => {
  const pages = ctx.ts?.pages?.USE_CASE_PAGES ?? []
  return pages.filter((p) => p.workbenchId === hostWorkbench).map((p) => p.pageId)
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
  // Where a source carries a sha256, its SHAPE is asserted: 64 lowercase hex.
  // matching the external artifact is human pre-flight by design; this check
  // asserts shape only.
  //
  // The artifact lives outside the repo — ~/erwin-artifacts/ is never
  // committed — so no check running here can hash it, and one that claimed to
  // would be worse than one that states its limit. What this catches is the
  // realistic error: a digest truncated on paste, upper-cased, or carrying a
  // stray `sha256:` prefix.
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
      for (const src of d.sources ?? []) {
        if (src.sha256 === undefined) continue
        if (typeof src.sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(src.sha256)) ctx.fail(`${d.modelId} source ${src.id} carries sha256 ${JSON.stringify(src.sha256)}, which is not 64 lowercase hex characters — matching the external artifact is human pre-flight by design, so shape is all this check can assert and it must assert that much`)
      }
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
        // CROSS-WORKBENCH RESOLUTION MUST NOT LEAK. The list is filtered to this
        // descriptor's OWN hostWorkbench before the membership test, so a
        // mapping naming a real page belonging to another workbench fails
        // exactly as a nonexistent one does. Resolving against every page in
        // the registry would silently let a fixture model reach a live BAIW
        // page — a join across two workbenches that nothing declared.
        const pages = pageIdsFor(ctx, d.hostWorkbench)
        if (!pages.includes(m.useCasePageId)) ctx.fail(`${d.modelId} mapping ${m.id} names useCasePageId ${JSON.stringify(m.useCasePageId)}, which the ${d.hostWorkbench} page registry does not contain (${pages.length} page(s) registered for that workbench)`)
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


// ── PAGE-REGISTRY-SYNC ──────────────────────────────────────────────────────
// The registry must MIRROR the app, and nothing re-made that claim until now.
//
// useCasePages.ts' baiw rows were derived once, by hand, from two sources that
// were asserted equal at the time: the <Route> paths inside App.tsx's path="*"
// block, and Sidebar.tsx's navItems. A hand assertion made once is exactly the
// SuiteLanding.tsx shape CLAUDE.md records — hardcoded counts that were right
// when typed and wrong four datasets later. Add a route without a nav item, or
// rename either, and the registry silently stops describing the app while every
// other check stays green.
//
// THREE SOURCES, ASSERTED PAIRWISE. Reading only the routes would let the nav
// drift; reading only the nav would let a route go unregistered. The registry
// is the third, and it is the one a CDM mapping actually resolves against.
//
// It reads the .tsx as TEXT rather than executing it. These are React component
// modules — importing them pulls the whole render tree — and the declarations
// wanted are literal arrays a regex can read exactly. A parse that finds NO
// routes or NO navItems fails rather than reporting an empty set equal to an
// empty set, which is the VACUOUS shape one level down.
const pageRegistrySync = {
  code: 'PAGE-REGISTRY-SYNC',
  run(ctx) {
    const read = (rel) => {
      const abs = path.join(ctx.root, rel)
      return fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : null
    }
    const appSrc = read('src/App.tsx')
    const navSrc = read('src/components/layout/Sidebar.tsx')
    if (appSrc === null || navSrc === null) {
      ctx.fail(`cannot read the routing sources: src/App.tsx ${appSrc === null ? 'MISSING' : 'ok'}, src/components/layout/Sidebar.tsx ${navSrc === null ? 'MISSING' : 'ok'} — the registry cannot be checked against an app that is not there`)
      return { examined: 0 }
    }

    // BAIW is the catch-all, so its routes are the ones after `path="*"`.
    const marker = appSrc.indexOf('<Route path="*"')
    const inner = marker === -1 ? '' : appSrc.slice(marker)
    const routes = [...inner.matchAll(/<Route path="\/([^"*][^"]*)"/g)].map((m) => m[1])
    const nav = [...navSrc.matchAll(/\{ path: '\/([^']+)', label: '([^']+)'/g)].map((m) => ({ id: m[1], label: m[2] }))

    if (routes.length === 0) {
      ctx.fail(`no BAIW routes parsed out of src/App.tsx — either the catch-all block moved or the <Route> form changed. Reporting zero routes as "equal to the registry" would be a check that stopped running`)
      return { examined: 0 }
    }
    if (nav.length === 0) {
      ctx.fail(`no navItems parsed out of src/components/layout/Sidebar.tsx — the declaration form changed and this check can no longer see it`)
      return { examined: 0 }
    }

    const registry = (ctx.ts?.pages?.USE_CASE_PAGES ?? []).filter((p) => p.workbenchId === 'baiw')
    const diff = (a, b) => a.filter((x) => !b.includes(x))
    const routeIds = routes
    const navIds = nav.map((n) => n.id)
    const regIds = registry.map((p) => p.pageId)

    for (const [missing, where, from] of [
      [diff(routeIds, regIds), 'the registry', 'App.tsx routes'],
      [diff(regIds, routeIds), 'App.tsx routes', 'the registry'],
      [diff(navIds, regIds), 'the registry', 'Sidebar.tsx navItems'],
      [diff(regIds, navIds), 'Sidebar.tsx navItems', 'the registry'],
    ]) {
      if (missing.length) ctx.fail(`${missing.length} page(s) in ${from} and not in ${where}: ${missing.join(', ')} — useCasePages.ts must MIRROR the app, and a CDM mapping resolves against the registry rather than against the routes`)
    }

    // Titles come from the nav, so a renamed label must move the registry too.
    for (const n of nav) {
      const row = registry.find((p) => p.pageId === n.id)
      if (row && row.title !== n.label) ctx.fail(`page ${n.id} is titled ${JSON.stringify(row.title)} in the registry and ${JSON.stringify(n.label)} in Sidebar.tsx navItems`)
    }

    return { examined: routeIds.length + navIds.length + regIds.length, routes: routeIds.length, nav: navIds.length, registry: regIds.length }
  },
}

export default {
  id: 'cdm',
  title: 'CDM — industry canonical data models',
  tsModules: {
    meta: 'src/cdm/meta/cdmMeta.ts',
    content: 'src/cdm/meta/content.ts',
    pages: 'src/cdm/meta/useCasePages.ts',
    fixture: 'scripts/fixtures/cdm-fixture.mts',
  },
  checks: [versionPin, provenance, coverage, pageRegistrySync],
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
