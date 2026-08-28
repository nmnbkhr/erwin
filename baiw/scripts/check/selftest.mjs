#!/usr/bin/env node
/**
 * Fault injection for the suite gate and the geometry audit. Every finding code,
 * tripped on purpose.
 *
 * ─── WHY THIS EXISTS ───────────────────────────────────────────────────────
 *
 * A check that stopped running looks exactly like a check that passed. Its class
 * line still prints, its verdict still reads clean, the build still goes green.
 * This repo has shipped that shape thirteen times, and every one of them was
 * found by accident rather than by the gate.
 *
 * `examined: 0` failing as VACUOUS is the standing guard against it. This is the
 * other half: proof that each code can still be REACHED. A check can examine
 * plenty and still have lost the branch that fails.
 *
 * A refactor is when that happens, so a one-time transcript pasted into a commit
 * message is worth very little a phase later. This is a script; run it.
 *
 * ─── HOW IT WORKS ──────────────────────────────────────────────────────────
 *
 * NO TRACKED FILE IS EVER WRITTEN. A pristine copy of `src/` and `scripts/` goes
 * into a scratch root under node_modules (gitignored), with a node_modules of its
 * own whose entries symlink to the real ones so esbuild, typescript and react all
 * resolve. Each mutation edits the COPY, the gate runs against the COPY, and the
 * touched paths are restored from the real repo afterwards.
 *
 * The copy includes `scripts/`, not just `src/`, because three of the rows are
 * properties of the tooling rather than of a dataset: REGISTRY and VACUOUS are
 * the gate's own, and GEOMETRY-OVERFLOW exercises a different tool entirely —
 * `scripts/golden/geometry.mjs --fail-on-overflow`, over the captured PDFs in
 * `scripts/golden/raw/`, which the same copy carries.
 *
 * That last row needs `raw/` to be populated, and `raw/` is gitignored. On a
 * fresh clone it will report NOT TRIPPED and name the one command that fixes it
 * (`node scripts/golden/capture.mjs`). It does not skip: geometry.mjs found the
 * real magnitude of D-006 — two of the three instances were invisible to every
 * text-based check in the repo — and a flag that guards that cannot be allowed
 * to quietly not run.
 *
 * ─── READING THE MATRIX ────────────────────────────────────────────────────
 *
 * TRIPPED      the mutation produced its target code, and the tool exited 1.
 * NOT TRIPPED  it did not. That is a finding: either the mutation is wrong or the
 *              branch is gone. Both are worth knowing and both exit 1 here.
 * CONTROL OK   a NEGATIVE CONTROL: the edit is legal and the gate stayed green
 *              over it, as it must. Declared `expect: 'pass'`.
 * CONTROL BAD  the class fired on a legal edit. That is OVER-firing, and no
 *              positive row can detect it — a class that rejected everything
 *              would score a perfect matrix without one. Exits 1.
 *
 * Controls are excluded from the `codes demonstrated` tally on purpose: a row
 * asserting a code does NOT fire demonstrates nothing about whether it can.
 *
 * Two assertions close the matrix, not one: EVERY ROW must trip, and every CODE
 * must be demonstrated. The second alone was asserted until D5 stage H, which
 * let a dead row exit 0 behind a sibling sharing its code — the paragraph above
 * said "both exit 1 here" for two phases while a `92 of 93 · PASS` was possible.
 * See the end of this file.
 *
 * A mutation often trips codes besides its target — a compound owner string is
 * also an unresolved one. Those are listed as `+also` and are not failures. What
 * is checked is that the TARGET code appears.
 *
 *   node scripts/check/selftest.mjs            # every mutation
 *   node scripts/check/selftest.mjs --only FK  # one code
 *   node scripts/check/selftest.mjs --keep     # leave the scratch root in place
 */
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.resolve(HERE, '..', '..')
const SCRATCH = path.join(REPO, 'node_modules', '.check-selftest')

// ── mutation helpers ────────────────────────────────────────────────────────
const P = (rel) => path.join(SCRATCH, rel)
const readJson = (rel) => JSON.parse(fs.readFileSync(P(rel), 'utf8'))
const writeJson = (rel, v) => fs.writeFileSync(P(rel), JSON.stringify(v, null, 2))
/** Parse, mutate, write back. Formatting is irrelevant — the copy is throwaway. */
const json = (rel, fn) => {
  const v = readJson(rel)
  fn(v)
  writeJson(rel, v)
}
/** Exact string replacement. Throws if the anchor is not found, so a mutation
 *  cannot silently become a no-op and report NOT TRIPPED for the wrong reason. */
const sub = (rel, from, to) => {
  const text = fs.readFileSync(P(rel), 'utf8')
  if (!text.includes(from)) throw new Error(`anchor not found in ${rel}: ${JSON.stringify(from.slice(0, 60))}`)
  fs.writeFileSync(P(rel), text.replace(from, to))
}
const append = (rel, text) => fs.appendFileSync(P(rel), text)
const remove = (rel) => fs.rmSync(P(rel), { recursive: true, force: true })

/** The TCF id derivation, mirrored from modules/taiw.mjs so a mutation can avoid
 *  accidentally producing a compliant id. */
const slugOf = (s) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')

const DGIW = 'src/dgiw/data'
// Suite-level as of D5 stage B: DMBOK2, DCAM, DGI and COBIT 2019 belong to the
// suite, DGIW's crosswalk into its eleven pillars does not. Three rows below
// mutate the framework definitions and now reach for them here.
const FRAMEWORKS = 'src/frameworks/data'
const TAIW = 'src/data/taiw'
const HAIW = 'src/data/haiw'
/** BAIW's datasets sit at the top of src/data/, not in a module subdirectory. */
const BAIW_DATA = 'src/data'
/**
 * The CDM check fixture and its dossier — the targets of the seventeen CDM rows.
 *
 * These are the only mutation targets in this file that are not application data
 * or application source: CDM_MODELS lands empty at CDM-P1, so there is no real
 * model content to break yet and the fixture is what the three classes are
 * proved against. See check/modules/cdm.mjs for why it is env-gated.
 */
const CDM_FIXTURE = 'scripts/fixtures/cdm-fixture.mts'
const CDM_DOSSIER = 'scripts/fixtures/cdm-fixture-dossier.md'

/**
 * Append statements that mutate the already-exported fixture objects.
 *
 * The bundles are module-level consts and CDM_FIXTURE_BUNDLES holds references
 * to the same objects, so assigning a property after the exports is visible to
 * the gate. Preferred over substituting into the object literal because it
 * cannot be silently defeated by reformatting, and because the statement reads
 * as exactly the branch being broken.
 */
const cdmPatch = (...statements) => append(CDM_FIXTURE, `${CDM_ENTITY_HELPER}${statements.join('\n')}\n`)

/**
 * Emitted into the fixture ahead of every cdmPatch, so a row names the record it
 * breaks rather than indexing into an array whose order is not load-bearing.
 *
 * It THROWS when the id is gone rather than returning undefined. A row whose
 * target has been renamed would otherwise append a statement that quietly does
 * nothing, and report NOT TRIPPED for a reason that has nothing to do with the
 * branch — the same contract `sub` keeps by refusing a missing anchor.
 */
const CDM_ENTITY_HELPER = `
const cdmFixtureEntity = (id) => {
  const found = cdmFixtureBundle.entities.find((e) => e.id === id)
  if (!found) throw new Error('selftest: fixture has no entity ' + id + ' — this row is measuring nothing')
  return found
}
`

const RAW_BAIW = 'scripts/golden/raw/baiw'
const GEOM_PROBE = `${RAW_BAIW}/__geomprobe.pdf`

/**
 * Widen one real drawn box in a copy of a captured PDF until it crosses the
 * content column.
 *
 * An INSET box, never one starting at the sheet edge. A band running x=0 to the
 * full sheet width is deliberate cover chrome, and geometry.mjs excludes it by
 * design — probing with one of those would prove nothing except that the
 * exclusion works. The right edge goes to 570pt: past the 552.76pt content
 * column, short of the 595.28pt sheet, so it is unambiguously a margin break.
 *
 * The content streams jsPDF writes here are uncompressed, which is what makes a
 * plain string substitution possible and is the same property geometry.mjs
 * relies on to read them at all.
 */
const writeGeometryProbe = () => {
  const dir = P(RAW_BAIW)
  if (!fs.existsSync(dir)) throw new Error(`${RAW_BAIW} does not exist — run \`node scripts/golden/capture.mjs\` first (raw/ is gitignored)`)
  const pdfs = fs.readdirSync(dir).filter((f) => f.endsWith('.pdf') && !f.startsWith('__')).sort()
  if (pdfs.length === 0) throw new Error(`no captured PDF in ${RAW_BAIW} — run \`node scripts/golden/capture.mjs\` first (raw/ is gitignored)`)

  const s = fs.readFileSync(path.join(dir, pdfs[0]), 'latin1')
  const re = /(-?[\d.]+) (-?[\d.]+) (-?[\d.]+) (-?[\d.]+) re/g
  let m
  let pick = null
  while ((m = re.exec(s))) if (Number(m[1]) > 5) { pick = m; break }
  if (!pick) throw new Error(`no inset \`re\` operator in ${pdfs[0]} — every path starts at the sheet edge, so there is nothing to widen`)

  const widened = `${pick[1]} ${pick[2]} ${(570 - Number(pick[1])).toFixed(4)} ${pick[4]} re`
  fs.writeFileSync(P(GEOM_PROBE), s.replace(pick[0], widened), 'latin1')
  return { source: pdfs[0], before: pick[0], after: widened }
}

// ── the mutations ───────────────────────────────────────────────────────────
// `touches` is what gets restored from the real repo afterwards. A directory is
// restored wholesale. Everything a mutation writes must be listed, or the next
// mutation runs against a dirty tree.
const MUTATIONS = [
  // ── shared industry registry ────────────────────────────────────────────
  {
    code: 'INDUSTRY-SOURCE',
    what: 'an adapter silently drops a source use case from the shared portfolio',
    touches: ['src/industry/adapters/banking.ts'],
    apply: () => sub('src/industry/adapters/banking.ts',
      'profitabilityWorkbench.useCases.map((u) => ({',
      'profitabilityWorkbench.useCases.slice(1).map((u) => ({'),
  },
  {
    code: 'INDUSTRY-CONTRACT',
    what: 'COE is misclassified as trade instead of a banking use-case domain',
    touches: ['src/industry/adapters/cash.ts'],
    apply: () => sub('src/industry/adapters/cash.ts', "  sector: 'banking',", "  sector: 'trade',"),
  },
  {
    code: 'INDUSTRY-SELECTION',
    what: 'the stored selection guard accepts an id the source registry no longer contains',
    touches: ['src/industry/selection.ts'],
    apply: () => sub('src/industry/selection.ts',
      'ids.every((id) => IDS.has(id))',
      'ids.every(() => true)'),
  },
  {
    code: 'INDUSTRY-SELECTION',
    what: 'the selection storage base drops out of engagement export, duplicate and delete',
    touches: ['src/engagement/types.ts'],
    apply: () => sub('src/engagement/types.ts', "  'dgiw.use-cases',\n", ''),
  },

  // ── shared compliance assurance ─────────────────────────────────────────
  {
    code: 'ASSURANCE-REFERENTIAL',
    what: 'an obligation points to a control the assurance catalogue does not contain',
    touches: [`${DGIW}/complianceCatalogue.json`],
    apply: () => json(`${DGIW}/complianceCatalogue.json`, (d) => { d.obligations[0].controlIds[0] = 'CTL-MISSING' }),
  },
  {
    code: 'ASSURANCE-CLAIM',
    what: 'implemented work with no evidence is promoted past the evidence-pending boundary',
    touches: ['src/dgiw/assurance/registry.ts'],
    apply: () => sub(
      'src/dgiw/assurance/registry.ts',
      "  if (!assessment.evidenceReference.trim() || !assessment.evidenceSummary.trim()) return 'evidence-pending'",
      "  if (false) return 'evidence-pending'",
    ),
  },
  {
    code: 'ASSURANCE-CLAIM',
    what: 'HIPAA is made globally applicable instead of remaining US-only',
    touches: [`${DGIW}/complianceCatalogue.json`],
    apply: () => json(`${DGIW}/complianceCatalogue.json`, (d) => {
      d.instruments.find((row) => row.id === 'INST-HIPAA-SEC').jurisdictions = ['GLOBAL']
    }),
  },
  {
    code: 'ASSURANCE-STATE',
    what: 'the stored assurance guard accepts a malformed assessment',
    touches: ['src/dgiw/assurance/state.ts'],
    apply: () => sub(
      'src/dgiw/assurance/state.ts',
      '.every((assessment) => isAssessment(assessment))',
      '.every(() => true)',
    ),
  },
  {
    // Branch-isolated from the row above: that one is "malformed is rejected",
    // this one is "stale is PRUNED, not rejected". Collapsing them would prove
    // nothing about which half caught the regression, and the difference is the
    // one that decides whether an engagement keeps its evidence.
    code: 'ASSURANCE-STATE',
    what: 'a control id the catalogue dropped stops being pruned, so stale entries survive into the register',
    touches: ['src/dgiw/assurance/state.ts'],
    apply: () => sub(
      'src/dgiw/assurance/state.ts',
      '  if (staleExclusions.length === 0 && staleAssessments.length === 0) return state',
      '  if (true) return state',
    ),
  },
  {
    code: 'ASSURANCE-STATE',
    what: 'the assurance storage base drops out of engagement export, duplicate and delete',
    touches: ['src/engagement/types.ts'],
    apply: () => sub('src/engagement/types.ts', "  'dgiw.assurance',\n", ''),
  },
  {
    code: 'ASSURANCE-COVERAGE',
    what: 'TAIW loses every path from selected trade use cases to assurance obligations',
    touches: [`${DGIW}/complianceCatalogue.json`],
    apply: () => json(`${DGIW}/complianceCatalogue.json`, (d) => {
      for (const obligation of d.obligations) obligation.sourceModules = obligation.sourceModules.filter((module) => module !== 'taiw')
    }),
  },
  {
    code: 'ASSURANCE-OUTPUT',
    what: 'the assurance CSV drops its explicit non-certification claim boundary',
    touches: ['src/dgiw/report/complianceAssurance.ts'],
    apply: () => sub(
      'src/dgiw/report/complianceAssurance.ts',
      "        claimBoundary: 'Evidence register only — not a certification or legal opinion.',",
      "        claimBoundary: '',",
    ),
  },

  // ── §1–9: the eighteen codes no document names ──────────────────────────
  {
    code: 'LAYER',
    what: 'a diagnostic question tagged with a layer that is neither core nor banking',
    touches: [`${DGIW}/diagnostic.json`],
    apply: () => json(`${DGIW}/diagnostic.json`, (d) => { d.questions[0].layer = 'retail' }),
  },
  {
    code: 'UNIQUE',
    what: 'two CDEs sharing one id',
    touches: [`${DGIW}/cdeRegister.json`],
    apply: () => json(`${DGIW}/cdeRegister.json`, (c) => { c[1].id = c[0].id }),
  },
  {
    code: 'FK',
    what: 'a DQ rule pointing at a CDE that does not exist',
    touches: [`${DGIW}/dqRules.json`],
    apply: () => json(`${DGIW}/dqRules.json`, (r) => { r[0].cdeRef = 'CDE-DOES-NOT-EXIST' }),
  },
  {
    code: 'ENUM',
    what: 'a DQ rule with a severity outside BLOCKER/HIGH/MEDIUM',
    touches: [`${DGIW}/dqRules.json`],
    apply: () => json(`${DGIW}/dqRules.json`, (r) => { r[0].severity = 'CRITICAL' }),
  },
  {
    code: 'SHAPE',
    what: 'a CDE with no consumers — criticality derived from nothing',
    touches: [`${DGIW}/cdeRegister.json`],
    apply: () => json(`${DGIW}/cdeRegister.json`, (c) => { c[0].consumers = [] }),
  },
  {
    code: 'OWNER-COMPOUND',
    what: 'an owner string naming two accountable parties',
    touches: [`${DGIW}/cdeRegister.json`],
    apply: () => json(`${DGIW}/cdeRegister.json`, (c) => { c[0].ownerRole = 'Head of Data and the CRO' }),
  },
  {
    code: 'OWNER-UNRESOLVED',
    what: 'an owner string that is in no role registry entry',
    touches: [`${DGIW}/cdeRegister.json`],
    apply: () => json(`${DGIW}/cdeRegister.json`, (c) => { c[0].ownerRole = 'Nobody In Particular' }),
  },
  {
    code: 'OWNER-LAYER',
    what: 'a core record owned by a banking-only role',
    touches: [`${DGIW}/cdeRegister.json`],
    apply: () => {
      const om = readJson(`${DGIW}/operatingModel.json`)
      const bankingRole = om.roleRegistry.find((r) => r.layer === 'banking')
      if (!bankingRole) throw new Error('no banking-only role registry entry to borrow')
      json(`${DGIW}/cdeRegister.json`, (c) => {
        const core = c.find((x) => x.layer === 'core')
        if (!core) throw new Error('no core CDE')
        core.ownerRole = bankingRole.name
      })
    },
  },
  {
    code: 'GATE',
    what: 'a flow that passes through no gate',
    touches: [`${DGIW}/programSetup.json`],
    apply: () => json(`${DGIW}/programSetup.json`, (p) => { p.flows[0].gateIds = [] }),
  },
  {
    code: 'GATE-ORPHAN',
    what: 'a blocking gate no flow references — a control nobody runs',
    touches: [`${DGIW}/operatingModel.json`],
    apply: () => json(`${DGIW}/operatingModel.json`, (om) => {
      om.gates.push({ ...om.gates[0], id: 'G-SELFTEST', name: 'Unreferenced Control', blocking: true })
    }),
  },
  {
    code: 'GATE-DUP',
    what: 'one gate claimed by two flows',
    touches: [`${DGIW}/programSetup.json`],
    apply: () => json(`${DGIW}/programSetup.json`, (p) => { p.flows[1].gateIds.push(p.flows[0].gateIds[0]) }),
  },
  {
    code: 'WAVE',
    what: 'a wave with no dependsOn array at all',
    touches: [`${DGIW}/implementationPlan.json`],
    apply: () => json(`${DGIW}/implementationPlan.json`, (pl) => { delete pl.waves[1].dependsOn }),
  },
  {
    code: 'WAVE-ORDER',
    what: 'a wave depending on one not scheduled earlier',
    touches: [`${DGIW}/implementationPlan.json`],
    apply: () => json(`${DGIW}/implementationPlan.json`, (pl) => {
      const by = new Map(pl.waves.map((w) => [w.id, w]))
      const w = pl.waves.find((x) => (x.dependsOn ?? []).some((d) => by.has(d)))
      if (!w) throw new Error('no wave with a resolvable dependency')
      // Same wave number as its dependency: the dependency is no longer earlier.
      w.wave = by.get(w.dependsOn.find((d) => by.has(d))).wave
    }),
  },
  {
    code: 'WAVE-LAYER',
    what: 'a core wave depending on a banking wave — breaks a core-only engagement',
    touches: [`${DGIW}/implementationPlan.json`],
    apply: () => json(`${DGIW}/implementationPlan.json`, (pl) => {
      const by = new Map(pl.waves.map((w) => [w.id, w]))
      const w = pl.waves.find((x) => (x.dependsOn ?? []).some((d) => by.has(d)))
      if (!w) throw new Error('no wave with a resolvable dependency')
      w.layer = 'core'
      by.get(w.dependsOn.find((d) => by.has(d))).layer = 'banking'
    }),
  },
  {
    code: 'WAVE-CYCLE',
    what: 'two waves depending on each other',
    touches: [`${DGIW}/implementationPlan.json`],
    apply: () => json(`${DGIW}/implementationPlan.json`, (pl) => {
      pl.waves[0].dependsOn = [pl.waves[1].id]
      pl.waves[1].dependsOn = [pl.waves[0].id]
    }),
  },
  /*
   * ── PLACEMENT, five rows, EACH ISOLATING ONE BRANCH (G5) ────────────────
   *
   * The obvious mutation — delete a wave's artefactIds — trips the missing-key
   * branch AND leaves its ids uncovered, proving nothing about which assertion
   * caught what. Each row below leaves every other branch satisfied.
   */
  {
    code: 'PLACEMENT',
    what: 'a register id silently unscheduled — in no wave and not in the unplaced list',
    touches: [`${DGIW}/implementationPlan.json`],
    apply: () => json(`${DGIW}/implementationPlan.json`, (pl) => {
      pl.unplacedArtefactIds = pl.unplacedArtefactIds.filter((u) => u.id !== 'AR-01')
    }),
  },
  {
    code: 'PLACEMENT',
    what: 'one artefact placed in two waves — two claims about one document',
    touches: [`${DGIW}/implementationPlan.json`],
    apply: () => json(`${DGIW}/implementationPlan.json`, (pl) => {
      const [first] = pl.waves.find((w) => (w.artefactIds ?? []).length > 0).artefactIds
      pl.waves.find((w) => !(w.artefactIds ?? []).includes(first)).artefactIds.push(first)
    }),
  },
  {
    code: 'PLACEMENT',
    what: 'a wave placing an id the register does not catalogue — a scheduled document that does not exist',
    touches: [`${DGIW}/implementationPlan.json`],
    apply: () => json(`${DGIW}/implementationPlan.json`, (pl) => { pl.waves[0].artefactIds.push('AR-99') }),
  },
  {
    code: 'PLACEMENT',
    what: 'an unplaced entry with a blank reason — a decision nobody wrote down',
    touches: [`${DGIW}/implementationPlan.json`],
    apply: () => json(`${DGIW}/implementationPlan.json`, (pl) => { pl.unplacedArtefactIds[0].reason = '  ' }),
  },
  {
    code: 'PLACEMENT',
    what: 'an id both placed and unplaced — two contradictory claims about where it is delivered',
    touches: [`${DGIW}/implementationPlan.json`],
    apply: () => json(`${DGIW}/implementationPlan.json`, (pl) => {
      const [first] = pl.waves.find((w) => (w.artefactIds ?? []).length > 0).artefactIds
      pl.unplacedArtefactIds.push({ id: first, reason: 'selftest: contradicts its wave placement' })
    }),
  },
  {
    code: 'LAYER-COHERENCE',
    what: 'a core DQ rule referencing a banking-only CDE',
    touches: [`${DGIW}/dqRules.json`],
    apply: () => {
      const cdes = readJson(`${DGIW}/cdeRegister.json`)
      const banking = new Set(cdes.filter((c) => c.layer === 'banking').map((c) => c.id))
      json(`${DGIW}/dqRules.json`, (rules) => {
        const r = rules.find((x) => banking.has(x.cdeRef))
        if (!r) throw new Error('no rule references a banking CDE')
        r.layer = 'core'
      })
    },
  },
  {
    code: 'COVERAGE',
    what: 'a pillar the diagnostic has no questions for',
    touches: [`${DGIW}/diagnostic.json`],
    apply: () => json(`${DGIW}/diagnostic.json`, (d) => {
      const victim = d.questions[0].pillarId
      d.questions = d.questions.filter((q) => q.pillarId !== victim)
    }),
  },
  {
    code: 'ROADMAP',
    what: 'a pillar that is scorable but no wave addresses',
    touches: [`${DGIW}/implementationPlan.json`],
    apply: () => {
      const diag = readJson(`${DGIW}/diagnostic.json`)
      const victim = diag.questions[0].pillarId
      json(`${DGIW}/implementationPlan.json`, (pl) => {
        for (const w of pl.waves) w.pillarIds = w.pillarIds.filter((p) => p !== victim)
      })
    },
  },
  {
    code: 'CORE-CHASSIS',
    what: 'a core CDE with no core DQ rule — it cannot be measured',
    touches: [`${DGIW}/cdeRegister.json`],
    apply: () => json(`${DGIW}/cdeRegister.json`, (c) => {
      const core = c.find((x) => x.layer === 'core')
      if (!core) throw new Error('no core CDE to clone')
      // A clone, so every other rule about a CDE still passes: same owner, same
      // consumers, same criticality. Only the id is new, so no DQ rule names it.
      c.push({ ...core, id: 'CDE-SELFTEST', element: 'Selftest Element' })
    }),
  },

  /*
   * ── ARTEFACT-EVIDENCE, five rows, EACH ISOLATING ONE BRANCH ─────────────
   *
   * The obvious mutation — corrupt one builtFrom block — trips three of these at
   * once and proves nothing about which assertion caught it. That is the
   * `unique()`/UNIQUE lesson applied inside a single class, and the same
   * discipline HACR-INSTRUMENT's three rows follow: each mutation below leaves
   * every other branch satisfied.
   *
   * The last one is the branch that matters. The other four are shape.
   */
  {
    code: 'ARTEFACT-EVIDENCE',
    what: 'a catalogued artefact with no builtFrom — a shape with nothing recording what it rests on',
    touches: [`${DGIW}/implementationPlan.json`],
    apply: () => json(`${DGIW}/implementationPlan.json`, (pl) => { delete pl.artefactRegister[0].builtFrom }),
  },
  {
    code: 'ARTEFACT-EVIDENCE',
    what: 'a derived artefact naming a dataset that does not resolve — the REGISTRY rule one level down',
    touches: [`${DGIW}/implementationPlan.json`],
    apply: () => json(`${DGIW}/implementationPlan.json`, (pl) => {
      const a = pl.artefactRegister.find((x) => x.builtFrom?.evidence === 'derived')
      if (!a) throw new Error('no derived artefact to point at a missing file')
      a.builtFrom.datasets = ['dgiw/data/doesNotExist.json']
    }),
  },
  {
    code: 'ARTEFACT-EVIDENCE',
    what: 'an artefact blocked on a withdrawn one — a dead end wearing a roadmap costume',
    touches: [`${DGIW}/implementationPlan.json`],
    apply: () => json(`${DGIW}/implementationPlan.json`, (pl) => {
      const gone = pl.artefactRegister.find((x) => x.builtFrom?.evidence === 'withdrawn')
      const blocked = pl.artefactRegister.find((x) => x.builtFrom?.evidence === 'blocked')
      if (!gone || !blocked) throw new Error('need one withdrawn and one blocked artefact')
      // Replaces rather than appends: a second blocker would still resolve, and
      // the row would pass for a reason that has nothing to do with the branch.
      blocked.builtFrom.blockedOn = [gone.id]
    }),
  },
  {
    code: 'ARTEFACT-EVIDENCE',
    what: 'an observed artefact naming datasets — the invitation this class removes',
    touches: [`${DGIW}/implementationPlan.json`],
    apply: () => json(`${DGIW}/implementationPlan.json`, (pl) => {
      const a = pl.artefactRegister.find((x) => x.builtFrom?.evidence === 'observed')
      if (!a) throw new Error('no observed artefact')
      // A path that RESOLVES, so the unresolvable-dataset branch above stays
      // untripped and this row can only be reporting the scope rule.
      a.builtFrom.datasets = ['dgiw/data/cdeRegister.json']
    }),
  },
  {
    code: 'ARTEFACT-EVIDENCE',
    what: 'a generator for an artefact the register does not mark derived — the branch that matters',
    touches: [`${DGIW}/implementationPlan.json`],
    apply: () => json(`${DGIW}/implementationPlan.json`, (pl) => {
      // AR-13 has a generator (report/cdeRegister.ts). Marking it observed AND
      // dropping its datasets isolates this branch: leaving them would also trip
      // the scope rule above and the row would prove nothing about which caught it.
      const a = pl.artefactRegister.find((x) => x.id === 'AR-13')
      if (!a) throw new Error('AR-13 is not in the register')
      a.builtFrom.evidence = 'observed'
      delete a.builtFrom.datasets
    }),
  },

  /*
   * ── GENERATOR-SET, two rows, one per DIRECTION ──────────────────────────
   *
   * The two directions are different defects and a single mutation that broke
   * both would prove nothing about which assertion caught it — the discipline
   * ARTEFACT-EVIDENCE's five rows and HACR-INSTRUMENT's three already follow.
   *
   * Both edit the DECLARATION rather than the generators, because deleting a
   * generator file would also trip ARTEFACT-IMPL and REPORT-SOURCES.
   */
  {
    code: 'GENERATOR-SET',
    what: 'the declared built-artefact list omits a generator that exists — AR-54 would call its pillar unserved',
    touches: ['src/dgiw/report/programmeGap.ts'],
    // AR-17 has a generator (report/toolingRecommendation.ts). Dropping it from
    // the list leaves every other id correct, so only the missing direction trips.
    apply: () => sub('src/dgiw/report/programmeGap.ts', "'AR-17', ", ''),
  },
  {
    code: 'GENERATOR-SET',
    what: 'the declared list names an artefact no generator declares — a built count including a document nobody can produce',
    touches: ['src/dgiw/report/programmeGap.ts'],
    // AR-03 is catalogued and `observed`, so it can never acquire a generator.
    // Added rather than substituted so no existing id goes missing and the
    // other direction stays untripped.
    apply: () => sub('src/dgiw/report/programmeGap.ts', "'AR-01', ", "'AR-01', 'AR-03', "),
  },

  /*
   * ── G1: the intake gates — one row per branch ───────────────────────────
   *
   * INTAKE-SCOPE has three content branches and each row isolates one. The
   * fixture file itself is never removed or corrupted here: fingerprint-
   * coverage reads the same file and throws (rather than failing) on a
   * missing or unparseable fixture, so those two defensive branches cannot be
   * demonstrated without crashing the gate — they stay defensive, and the
   * rows below keep the file valid JSON throughout.
   *
   * INTAKE-MODE has two branches with opposite directions — the shared
   * predicate's import gone, and a second inline predicate appearing — and a
   * mutation that did both at once (delete the import, add a local copy)
   * would prove nothing about which assertion caught it.
   */
  {
    code: 'INTAKE-SCOPE',
    what: 'the intake fixture names a pillar id pillars.json does not contain — a renamed pillar or a stale fixture',
    touches: ['scripts/golden/fixtures/dgiw.json'],
    apply: () => json('scripts/golden/fixtures/dgiw.json', (f) => { f.intake.scope.pillarIds[0] = 'P99' }),
  },
  {
    code: 'INTAKE-SCOPE',
    what: 'the intake fixture loses its scope entirely — an unactionable fixture exercising nothing',
    touches: ['scripts/golden/fixtures/dgiw.json'],
    apply: () => json('scripts/golden/fixtures/dgiw.json', (f) => { f.intake.scope.pillarIds = [] }),
  },
  {
    code: 'INTAKE-SCOPE',
    what: 'the fixture stores no intake at all — the engagement-mode golden entries would silently render reference mode',
    touches: ['scripts/golden/fixtures/dgiw.json'],
    apply: () => json('scripts/golden/fixtures/dgiw.json', (f) => { delete f.intake }),
  },
  {
    code: 'INTAKE-MODE',
    what: 'the charter stops importing intakeIsActionable — the mode switch is no longer the shared predicate',
    touches: ['src/dgiw/report/charter.ts'],
    apply: () => sub('src/dgiw/report/charter.ts', '  intakeIsActionable,\n', ''),
  },
  {
    code: 'INTAKE-MODE',
    what: 'a second inline actionability predicate in the operating model — two copies that can drift apart',
    touches: ['src/dgiw/report/operatingModel.ts'],
    apply: () => append(
      'src/dgiw/report/operatingModel.ts',
      '\nconst __selftestIntakeActionable = (i: { org: { name: string } }) => i.org.name.length > 0\nvoid __selftestIntakeActionable\n',
    ),
  },

  /*
   * ── G2: tiers, answer shapes, targets — one row per branch ──────────────
   *
   * TIER-NESTING's three rows isolate its three data branches; the
   * computational nesting branch runs on every one of them (the compiled
   * scoring function is called either way) and needs no mutation of its own —
   * breaking applicableQuestions would trip the control, not a row.
   * TIER-DIGEST's row proves the tier actually reaches the /ID digest, which
   * is the difference between printing a tier and being unable to pass one
   * document off as the other. ANSWER-SHAPE's two rows break the two promises
   * separately: the validator's range, and the migration's losslessness.
   */
  {
    code: 'TIER-NESTING',
    what: 'a question with no tier field — it falls out of every tier comparison and silently stops being asked',
    touches: [`${DGIW}/diagnostic.json`],
    apply: () => json(`${DGIW}/diagnostic.json`, (d) => { delete d.questions[0].tier }),
  },
  {
    code: 'TIER-NESTING',
    what: 'a pillar with no quick-tier core question — invisible to a Quick pass forever',
    touches: [`${DGIW}/diagnostic.json`],
    apply: () => json(`${DGIW}/diagnostic.json`, (d) => {
      const q = d.questions.find((x) => x.pillarId === 'P01' && x.tier === 'quick' && x.layer === 'core')
      if (!q) throw new Error('P01 has no quick core question — update this mutation')
      q.tier = 'standard'
    }),
  },
  {
    code: 'TIER-NESTING',
    what: 'every banking question pushed to deep — the tier axis collapsing into the layer axis',
    touches: [`${DGIW}/diagnostic.json`],
    apply: () => json(`${DGIW}/diagnostic.json`, (d) => {
      for (const q of d.questions) if (q.layer === 'banking') q.tier = 'deep'
    }),
  },
  {
    code: 'TIER-DIGEST',
    what: 'the diagnostic report stops folding the tier into its /ID digest — a Quick PDF could impersonate a Deep one',
    touches: ['src/dgiw/report/diagnosticReport.ts'],
    apply: () => sub('src/dgiw/report/diagnosticReport.ts', '      `tier:${tier}`,\n', ''),
  },
  {
    code: 'ANSWER-SHAPE',
    what: 'the stored-answer validator loosened to accept 0..9 — an out-of-range score would reach the weighted mean',
    touches: ['src/dgiw/answerShape.ts'],
    apply: () => sub('src/dgiw/answerShape.ts', 'Number.isInteger(v) && v >= 1 && v <= 5', 'Number.isInteger(v) && v >= 0 && v <= 9'),
  },
  {
    code: 'ANSWER-SHAPE',
    what: 'the legacy upgrade stops being lossless — an invented empty evidence field on every migrated answer',
    touches: ['src/dgiw/answerShape.ts'],
    apply: () => sub(
      'src/dgiw/answerShape.ts',
      "out[id] = typeof v === 'number' ? { score: v } : v",
      "out[id] = typeof v === 'number' ? { score: v, evidence: '' } : v",
    ),
  },
  {
    code: 'TARGET-RANGE',
    what: 'a fixture target of 9 — outside the 1..5 scale the gap function derives from',
    touches: ['scripts/golden/fixtures/dgiw.json'],
    apply: () => json('scripts/golden/fixtures/dgiw.json', (f) => { f.targets.P01 = 9 }),
  },
  {
    code: 'TARGET-RANGE',
    what: 'a fixture target on a pillar pillars.json does not contain',
    touches: ['scripts/golden/fixtures/dgiw.json'],
    apply: () => json('scripts/golden/fixtures/dgiw.json', (f) => { f.targets.P99 = 3 }),
  },

  /*
   * ── G3: the gap gates — one row per branch ──────────────────────────────
   *
   * GAP-PAIR's two rows break the two halves of the pairing rule separately:
   * the register defaulting a missing TARGET (exclusion demoted to an entry),
   * and the register scoring an unassessed pillar (the not-assessed reason
   * neutered, caught by the gate's de-answer probe). GAP-PRIORITY's two rows
   * are a band made unreachable by DATA and a formula forked in CODE — the
   * gate recomputes from the module's own constants, so the fork cannot hide
   * behind them. GAP-DRIVER's three: a stale fixture id, an inference pattern
   * appearing in the engine, and the validity filter removed (caught by the
   * denominator assertion — a stale driver diluting the mapped count IS a
   * contribution). GAP-REFUSAL's three: each refusal branch neutered, then
   * the builder's throw removed while the predicate stands. The TIER-DIGEST
   * row proves the G3 extension actually reaches AR-06 — the class had three
   * declared generators for the whole of G2 and nothing would have noticed a
   * fourth being listed but not checked.
   */
  {
    code: 'GAP-PAIR',
    what: 'a pillar with ONE missing measurement becomes an entry instead of an exclusion — a defaulted gap',
    touches: ['src/dgiw/gap/register.ts'],
    apply: () => sub('src/dgiw/gap/register.ts', 'if (reasons.length > 0) {', 'if (reasons.length > 1) {'),
  },
  {
    code: 'GAP-PAIR',
    what: 'the not-assessed exclusion neutered — an unscored pillar with a target would be scored from nothing',
    touches: ['src/dgiw/gap/register.ts'],
    apply: () => sub('src/dgiw/gap/register.ts', "} else if (o.state === 'not-assessed') {", '} else if (false) {'),
  },
  {
    code: 'GAP-PRIORITY',
    what: "the fixture loses its only high-band gap — a band no baseline has ever rendered",
    touches: ['scripts/golden/fixtures/dgiw.json'],
    apply: () => json('scripts/golden/fixtures/dgiw.json', (f) => { delete f.targets.P06 }),
  },
  {
    code: 'GAP-PRIORITY',
    what: 'the score formula drops its driver term — printed inputs that no longer reproduce the rank',
    touches: ['src/dgiw/gap/register.ts'],
    apply: () => sub(
      'src/dgiw/gap/register.ts',
      'const score = gapSize * (1 + GAIN_DECISIVENESS * decisiveness + GAIN_DRIVER * driverAlignment)',
      'const score = gapSize * (1 + GAIN_DECISIVENESS * decisiveness)',
    ),
  },
  {
    code: 'GAP-DRIVER',
    what: 'the fixture maps a driver to a pillar pillars.json does not contain',
    touches: ['scripts/golden/fixtures/dgiw.json'],
    apply: () => json('scripts/golden/fixtures/dgiw.json', (f) => { f.intake.drivers.driverPillars['regulatory:0'] = ['P99'] }),
  },
  {
    code: 'GAP-DRIVER',
    what: 'name-matching inference appears in the gap engine — a priority steered by wording nobody declared',
    touches: ['src/dgiw/gap/register.ts'],
    apply: () => append(
      'src/dgiw/gap/register.ts',
      '\nconst __selftestInferAlignment = (driver: string, pillarName: string) => driver.toLowerCase().includes(pillarName)\nvoid __selftestInferAlignment\n',
    ),
  },
  {
    code: 'GAP-DRIVER',
    what: 'the mapping validity filter removed — a stale pillar id stays in the mapped-driver denominator',
    touches: ['src/dgiw/intake/types.ts'],
    apply: () => sub(
      'src/dgiw/intake/types.ts',
      'const pillarIds = (mapping[driverKey(list, index)] ?? []).filter((id) => PILLAR_ID_SET.has(id))',
      'const pillarIds = mapping[driverKey(list, index)] ?? []',
    ),
  },
  {
    code: 'GAP-REFUSAL',
    what: 'the non-actionable-intake refusal neutered — a reference-mode gap register would generate',
    touches: ['src/dgiw/report/gapStatements.ts'],
    apply: () => sub('src/dgiw/report/gapStatements.ts', 'if (!intake || !intakeIsActionable(intake)) {', 'if (false) {'),
  },
  {
    code: 'GAP-REFUSAL',
    what: 'the empty-register refusal neutered — a document documenting nothing would generate',
    touches: ['src/dgiw/report/gapStatements.ts'],
    apply: () => sub('src/dgiw/report/gapStatements.ts', 'if (entries.length === 0) {', 'if (false) {'),
  },
  {
    code: 'GAP-REFUSAL',
    what: "the builder stops throwing the predicate's refusal — the predicate and the builder fork",
    touches: ['src/dgiw/report/gapStatements.ts'],
    apply: () => sub('src/dgiw/report/gapStatements.ts', '  if (refusal) throw new Refusal(refusal)', '  void refusal'),
  },
  {
    code: 'TIER-DIGEST',
    what: 'AR-06 stops folding the tier into its /ID digest — the G3 extension must actually reach it',
    touches: ['src/dgiw/report/aiReadiness.ts'],
    apply: () => sub('src/dgiw/report/aiReadiness.ts', '      `tier:${tier}`,\n', ''),
  },

  /*
   * ── G4: the plan gates — one row per branch ─────────────────────────────
   *
   * SLICE-SOURCE's row makes the slice carry a deep COPY of its entry — field-
   * equal, identity-broken — which only the post-hoc-mutation probe can see.
   * SLICE-DEPS' two rows: the sequencer reduced to ordinal order (caught only
   * by the reversed-edge probe, because the real plan's ordinals happen to
   * satisfy dependsOn — WAVE-ORDER holds that), and a reversed sequence
   * (caught by the real-plan edge scan). PLAN-EFFORT's two: an effort figure
   * injected into a rendered string, and the assumptions block removed while
   * week windows still print. PLAN-REFUSAL's two: the zero-slice refusal
   * neutered, and the builder's throw removed while the predicate stands.
   * The TIER-DIGEST row proves the G4 extension actually reaches AR-56.
   */
  {
    code: 'SLICE-SOURCE',
    what: 'a slice carries a deep copy of its GapEntry — field-equal today, a fork the day the register moves',
    touches: ['src/dgiw/plan/slices.ts'],
    apply: () => sub(
      'src/dgiw/plan/slices.ts',
      '      entry,\n      deliverables,',
      '      entry: JSON.parse(JSON.stringify(entry)) as GapEntry,\n      deliverables,',
    ),
  },
  {
    code: 'SLICE-DEPS',
    what: 'the sequencer reduced to ordinal order — right by accident on this plan, wrong on any re-scoped one',
    touches: ['src/dgiw/plan/slices.ts'],
    apply: () => sub(
      'src/dgiw/plan/slices.ts',
      'const batch = ready.length > 0 ? ready : [remaining[0]]',
      'const batch = remaining',
    ),
  },
  {
    code: 'SLICE-DEPS',
    what: 'a slice sequence reversed — every dependsOn edge now points forward',
    touches: ['src/dgiw/plan/slices.ts'],
    apply: () => sub(
      'src/dgiw/plan/slices.ts',
      'sequence: fullSequence.filter((id) => sliceWaveIds.has(id)),',
      'sequence: fullSequence.filter((id) => sliceWaveIds.has(id)).reverse(),',
    ),
  },
  {
    code: 'PLAN-EFFORT',
    what: 'an invented effort figure in a rendered string — the fabrication the whole class exists for',
    touches: ['src/dgiw/report/pillarPlans.ts'],
    apply: () => sub(
      'src/dgiw/report/pillarPlans.ts',
      "['Wave sequence', s.sequence.length ? s.sequence.join(' -> ') : 'no wave lists this pillar'],",
      "['Wave sequence', (s.sequence.length ? s.sequence.join(' -> ') : 'no wave lists this pillar') + ' - estimated 40 person-days'],",
    ),
  },
  {
    code: 'PLAN-EFFORT',
    what: 'the assumptions block removed while week windows still print — durations without their disclaimer',
    touches: ['src/dgiw/report/pillarPlans.ts'],
    apply: () => sub(
      'src/dgiw/report/pillarPlans.ts',
      "  r.sectionHeading('Assumptions')\n  r.bullets([...PLAN_ASSUMPTIONS])\n",
      '',
    ),
  },
  {
    code: 'PLAN-REFUSAL',
    what: 'the zero-slice refusal neutered — a plan of nothing would generate',
    touches: ['src/dgiw/report/pillarPlans.ts'],
    apply: () => sub('src/dgiw/report/pillarPlans.ts', 'if (slices.length === 0) {', 'if (false) {'),
  },
  {
    code: 'PLAN-REFUSAL',
    what: "the builder stops throwing the predicate's refusal — the predicate and the builder fork",
    touches: ['src/dgiw/report/pillarPlans.ts'],
    apply: () => sub('src/dgiw/report/pillarPlans.ts', '  if (refusal) throw new Refusal(refusal)', '  void refusal'),
  },
  {
    code: 'TIER-DIGEST',
    what: 'AR-56 stops folding the tier into its /ID digest — the G4 extension must actually reach it',
    touches: ['src/dgiw/report/pillarPlans.ts'],
    apply: () => sub('src/dgiw/report/pillarPlans.ts', '      `tier:${tier}`,\n', ''),
  },

  /*
   * ── THE G5 TRACKING CLASSES, EACH ROW ISOLATING ONE BRANCH ──────────────
   *
   * KPI-ID's two rows split the id side from the capture side. STATUS-LOG's
   * four are the four assertions the class makes — rewrite, edit path,
   * neutered validator, defaulted state — and the obvious mutation (gut the
   * module) would trip all four at once and prove nothing. PACK-PERIOD's two
   * split the transition filter from the capture filter. REFUSAL-CHANNEL's
   * three: a builder downgraded to a bare Error, console output smuggled
   * into the refusal branch, and the REAL failure branch losing its one
   * legitimate console.error — the guard against over-rotating the fix.
   */
  {
    code: 'KPI-ID',
    what: 'two waves declaring the same KPI id — one capture would measure two different things',
    touches: [`${DGIW}/implementationPlan.json`],
    apply: () => json(`${DGIW}/implementationPlan.json`, (pl) => {
      pl.waves[1].kpis[0].id = pl.waves[0].kpis[0].id
    }),
  },
  {
    code: 'KPI-ID',
    what: 'a stored capture referencing a KPI id no wave declares — a measurement filed under nothing',
    touches: ['scripts/golden/fixtures/dgiw.json'],
    apply: () => json('scripts/golden/fixtures/dgiw.json', (f) => { f.kpi[0].kpiId = 'K-W9-99' }),
  },
  {
    code: 'STATUS-LOG',
    what: 'appendTransition rewrites history — the latest entry replaces the log instead of joining it',
    touches: ['src/dgiw/tracking/log.ts'],
    apply: () => sub(
      'src/dgiw/tracking/log.ts',
      '[...(log[artefactId] ?? []), transition]',
      '[transition]',
    ),
  },
  {
    code: 'STATUS-LOG',
    what: 'an exported edit path appears on the tracking module — append-only in name only',
    touches: ['src/dgiw/tracking/log.ts'],
    apply: () => sub(
      'src/dgiw/tracking/log.ts',
      'export function appendCapture',
      'export function removeTransition(log: StatusLog): StatusLog { return {} }\nexport function appendCapture',
    ),
  },
  {
    code: 'STATUS-LOG',
    what: 'the stored-shape validator neutered — a malformed log would flow into the pack as delivery fact',
    touches: ['src/dgiw/tracking/log.ts'],
    apply: () => sub(
      'src/dgiw/tracking/log.ts',
      'export function isStatusLog(parsed: unknown): boolean {',
      'export function isStatusLog(parsed: unknown): boolean { if (parsed !== undefined) return true;',
    ),
  },
  {
    code: 'STATUS-LOG',
    what: "an untracked artefact defaulted to 'planned' — a record nobody made",
    touches: ['src/dgiw/tracking/log.ts'],
    apply: () => sub(
      'src/dgiw/tracking/log.ts',
      "return entries && entries.length > 0 ? entries[entries.length - 1].to : null",
      "return entries && entries.length > 0 ? entries[entries.length - 1].to : ('planned' as StatusState)",
    ),
  },
  {
    code: 'PACK-PERIOD',
    what: 'the transition filter unbounded — every logged transition renders whatever the period says',
    touches: ['src/dgiw/report/councilPack.ts'],
    apply: () => sub(
      'src/dgiw/report/councilPack.ts',
      'const periodTransitions = transitionsInPeriod(statusLog, period)',
      "const periodTransitions = transitionsInPeriod(statusLog, { label: period.label, from: '', to: '' })",
    ),
  },
  {
    code: 'PACK-PERIOD',
    what: 'the capture filter dropped — out-of-period KPI values leak into the pack',
    touches: ['src/dgiw/report/councilPack.ts'],
    apply: () => sub(
      'src/dgiw/report/councilPack.ts',
      'const periodCaptures = capturesInPeriod(kpiLog, period)',
      'const periodCaptures = kpiLog',
    ),
  },
  {
    code: 'REFUSAL-CHANNEL',
    what: 'a builder downgraded to a bare Error — the refusal travels the failure channel again (D-020)',
    touches: ['src/dgiw/report/councilPack.ts'],
    apply: () => sub(
      'src/dgiw/report/councilPack.ts',
      'if (refusal) throw new Refusal(refusal)',
      'if (refusal) throw new Error(refusal)',
    ),
  },
  {
    code: 'REFUSAL-CHANNEL',
    what: 'console output smuggled into the refusal branch — two verdicts for one designed outcome',
    touches: ['src/dgiw/report/useDeliverable.ts'],
    apply: () => sub(
      'src/dgiw/report/useDeliverable.ts',
      "setMessage({ tone: 'info', text: err instanceof Error ? err.message : 'Generation refused.' })",
      "console.error('[dgiw] refusal', err); setMessage({ tone: 'info', text: err instanceof Error ? err.message : 'Generation refused.' })",
    ),
  },
  {
    code: 'REFUSAL-CHANNEL',
    what: 'the REAL failure branch loses its console.error — over-rotating the fix hides genuine breakage',
    touches: ['src/dgiw/report/useDeliverable.ts'],
    apply: () => sub(
      'src/dgiw/report/useDeliverable.ts',
      "console.error('[dgiw] deliverable generation failed', err)",
      'void err',
    ),
  },
  {
    code: 'TIER-DIGEST',
    what: 'AR-57 stops folding the tier into its /ID digest — the G5 extension must actually reach it',
    touches: ['src/dgiw/report/councilPack.ts'],
    apply: () => sub('src/dgiw/report/councilPack.ts', '      `tier:${tier}`,\n', ''),
  },

  /*
   * ── THE G6 TRAJECTORY CLASSES, EACH ROW ISOLATING ONE BRANCH ────────────
   *
   * SNAPSHOT-FROZEN's three: a copy-by-reference capture (freeze AND copy
   * removed together — removing only the copy leaves the freeze making the
   * probe's mutation a silent no-op, so the pair IS the one implementation
   * mistake), an exported edit path, and a stale fixture digest. DELTA-PAIR's
   * three are its three assertions — cross-tier guard, scored-both guard,
   * exclusion reasons — and the obvious mutation (gut snapshotDeltas) would
   * trip all of them and prove nothing. DELTA-CITE's row removes BOTH digest
   * renders (keyValue block and chart citation line), because the check
   * accepts a digest anywhere in the text and removing one render alone is
   * not a defect. TREND-EARNED's four: never earned, boundary ignored,
   * absence statement gutted, fixture stops seeding the excluded side.
   * CHART-HONEST's two: a bezier smoothing the segment (markers untouched —
   * a circle marker would trip both branches at once), and a value offset
   * moving markers off their recomputed positions. TIER-DIGEST's row proves
   * the G6 extension actually reaches AR-58.
   */
  {
    code: 'SNAPSHOT-FROZEN',
    what: 'capture by reference — the deep copy and the freeze removed together, so live edits reach the record',
    touches: ['src/dgiw/trajectory/snapshots.ts'],
    apply: () => {
      sub('src/dgiw/trajectory/snapshots.ts',
        'const answers = deepCopy(normaliseAnswers(live.answers))',
        'const answers = normaliseAnswers(live.answers)')
      sub('src/dgiw/trajectory/snapshots.ts', 'return deepFreeze({', 'return ({')
    },
  },
  {
    code: 'SNAPSHOT-FROZEN',
    what: 'an exported edit path appears on the snapshot store — append-only in name only',
    touches: ['src/dgiw/trajectory/snapshots.ts'],
    apply: () => sub(
      'src/dgiw/trajectory/snapshots.ts',
      'export function appendSnapshot',
      'export function removeSnapshot(list: AssessmentSnapshot[]): AssessmentSnapshot[] { return [] }\nexport function appendSnapshot',
    ),
  },
  {
    code: 'SNAPSHOT-FROZEN',
    what: 'a fixture snapshot digest goes stale — every golden citation of it becomes unverifiable',
    touches: ['scripts/golden/fixtures/dgiw.json'],
    apply: () => json('scripts/golden/fixtures/dgiw.json', (f) => {
      f.snapshots[0].digest = 'ABCDEF0123456789ABCDEF0123456789'
    }),
  },
  {
    code: 'DELTA-PAIR',
    what: 'the same-tier guard neutered — a Quick score moves against a Standard one and calls it a trend',
    touches: ['src/dgiw/trajectory/deltas.ts'],
    apply: () => sub(
      'src/dgiw/trajectory/deltas.ts',
      'if (a.tier !== b.tier || a.layer !== b.layer) {',
      'if (false) {',
    ),
  },
  {
    code: 'DELTA-PAIR',
    what: 'the scored-both guard loosened to either — a pillar measured once produces a delta',
    touches: ['src/dgiw/trajectory/deltas.ts'],
    apply: () => sub('src/dgiw/trajectory/deltas.ts', 'if (aScored && bScored) {', 'if (aScored || bScored) {'),
  },
  {
    code: 'DELTA-PAIR',
    what: 'exclusions lose their reasons — a silent drop wearing a label',
    touches: ['src/dgiw/trajectory/deltas.ts'],
    apply: () => sub(
      'src/dgiw/trajectory/deltas.ts',
      'exclusions.push({ pillarId: ao.pillarId, pillarName: ao.name, reasons })',
      'exclusions.push({ pillarId: ao.pillarId, pillarName: ao.name, reasons: [] })',
    ),
  },
  {
    code: 'DELTA-CITE',
    what: 'both digest renders removed from AR-58 — a delta claim nobody can trace to its two frozen states',
    touches: ['src/dgiw/report/deltaReport.ts'],
    apply: () => {
      sub('src/dgiw/report/deltaReport.ts', "    ['From digest', citations.aDigest],", "    ['From digest', 'redacted'],")
      sub('src/dgiw/report/deltaReport.ts',
        '`From "${citations.aLabel}" (${day(citations.aAt)}, digest ${citations.aDigest}) to `',
        '`From "${citations.aLabel}" (${day(citations.aAt)}) to `')
    },
  },
  {
    code: 'TREND-EARNED',
    what: 'the trend is never earned — two comparable in-period snapshots exist and the pack stays silent',
    touches: ['src/dgiw/report/councilPack.ts'],
    apply: () => sub(
      'src/dgiw/report/councilPack.ts',
      'const trendPair = comparableSnapshotPairs(eligible)[0] ?? null',
      'const trendPair = null',
    ),
  },
  {
    code: 'TREND-EARNED',
    what: 'the at-or-before-period-end boundary dropped — a post-period capture enters the cited pair',
    touches: ['src/dgiw/report/councilPack.ts'],
    apply: () => sub(
      'src/dgiw/report/councilPack.ts',
      "const eligible = snapshots.filter((s) => !period.to || s.capturedAt.slice(0, 10) <= period.to)",
      'const eligible = snapshots',
    ),
  },
  {
    code: 'TREND-EARNED',
    what: 'the absence statement gutted — the unearned trend section stops saying why it is absent',
    touches: ['src/dgiw/report/councilPack.ts'],
    apply: () => sub(
      'src/dgiw/report/councilPack.ts',
      "'because its input is, not because it was skipped — capture snapshots on the Diagnostic '",
      "'without further explanation. '",
    ),
  },
  {
    code: 'TREND-EARNED',
    what: 'the fixture stops seeding the excluded side — the boundary would be demonstrated against nothing',
    touches: ['scripts/golden/fixtures/dgiw.json'],
    apply: () => json('scripts/golden/fixtures/dgiw.json', (f) => {
      f.snapshots = f.snapshots.filter((s) => s.label === 'Baseline' || s.label === 'Wave 1 close')
    }),
  },
  {
    code: 'CHART-HONEST',
    what: 'the segment between two captured points becomes a bezier — smoothing, the banned operator itself',
    touches: ['src/dgiw/report/deltaReport.ts'],
    apply: () => sub(
      'src/dgiw/report/deltaReport.ts',
      '    pdf.line(xF, yF, xT, yT)',
      "    pdf.lines([[(xT - xF) / 2, -6, (xT - xF) / 2, 6, xT - xF, yT - yF]], xF, yF, [1, 1], 'S')",
    ),
  },
  {
    code: 'CHART-HONEST',
    what: 'a point drawn half a level above its captured value — a measurement the picture invented',
    touches: ['src/dgiw/report/deltaReport.ts'],
    apply: () => sub(
      'src/dgiw/report/deltaReport.ts',
      'const yF = deltaChartPointY(i, d.from)',
      'const yF = deltaChartPointY(i, d.from + 0.5)',
    ),
  },
  {
    code: 'TIER-DIGEST',
    what: 'AR-58 stops folding the tier into its /ID digest — the G6 extension must actually reach it',
    touches: ['src/dgiw/report/deltaReport.ts'],
    apply: () => sub('src/dgiw/report/deltaReport.ts', '      `tier:${tier}`,\n', ''),
  },

  // ── the four suite classes ──────────────────────────────────────────────
  {
    code: 'REPORT-SOURCES',
    what: 'a declared report source location that no longer exists',
    touches: ['src/taiw/utils/tradeReportGenerator.ts'],
    apply: () => remove('src/taiw/utils/tradeReportGenerator.ts'),
  },
  {
    code: 'CSV-HEADER',
    what: 'a CSV column header containing a comma — the header row is written unquoted',
    touches: ['src/dgiw/report/cdeRegister.ts'],
    apply: () => sub('src/dgiw/report/cdeRegister.ts', `header: 'CDE ID' }`, `header: 'CDE, ID' }`),
  },
  {
    code: 'TEXT-MAXWIDTH',
    what: 'a doc.text call passed maxWidth — jsPDF draws only the first line',
    touches: ['src/report/spine.ts'],
    apply: () => append('src/report/spine.ts', `
// selftest probe — the exact shape that lost three sentences from every HAIW PDF
function __selftestProbe(doc: jsPDF, s: string): void {
  doc.text(s, 0, 0, { maxWidth: 180 })
}
`),
  },
  {
    code: 'ARTEFACT-IMPL',
    what: 'a createReport call with no content digest — the /ID would ignore what it renders',
    touches: ['src/dgiw/report/cdeRegister.ts'],
    apply: () => sub(
      'src/dgiw/report/cdeRegister.ts',
      'createReport(meta, contentKey(rows.map((x) => x.id)))',
      'createReport(meta)',
    ),
  },
  {
    code: 'ARTEFACT-IMPL',
    what: 'a generator claiming an artefact id nothing declares',
    touches: ['src/utils/reportGenerator.ts'],
    apply: () => sub('src/utils/reportGenerator.ts', `= 'MR-BAIW-MATURITY'`, `= 'MR-BAIW-BOGUS'`),
  },

  // ── the crosswalk five ──────────────────────────────────────────────────
  {
    code: 'CROSSWALK-SHAPE',
    what: "a dimension weight typed as 'wieght' — reads as undefined, contributes nothing",
    touches: [`${FRAMEWORKS}/frameworks.json`],
    apply: () => json(`${FRAMEWORKS}/frameworks.json`, (fw) => {
      const d = fw.dimensions[0]
      d.wieght = d.weight
      delete d.weight
    }),
  },
  {
    code: 'CROSSWALK-WEIGHT',
    what: 'a leaf dimension whose coverageWeights no longer sum to 1.0',
    touches: [`${DGIW}/crosswalk.json`],
    apply: () => json(`${DGIW}/crosswalk.json`, (xw) => { xw.entries[0].coverageWeight -= 0.1 }),
  },
  {
    code: 'CROSSWALK-ORPHAN',
    what: 'a mapping attached to a parent dimension — leaf-only projection double-counts',
    touches: [`${DGIW}/crosswalk.json`],
    apply: () => {
      const fw = readJson(`${FRAMEWORKS}/frameworks.json`)
      const parents = new Set(fw.dimensions.map((d) => d.parentId).filter(Boolean))
      const parent = [...parents].sort()[0]
      if (!parent) throw new Error('no parent dimension')
      json(`${DGIW}/crosswalk.json`, (xw) => { xw.entries[0].dimensionId = parent })
    },
  },
  {
    code: 'CROSSWALK-ORPHAN',
    what: 'a pillar mapped by no crosswalk entry in any framework (the rule D3 added)',
    touches: [`${DGIW}/crosswalk.json`],
    apply: () => json(`${DGIW}/crosswalk.json`, (xw) => {
      // Repoint one pillar's mappings onto another. Every leaf dimension still
      // sums to 1.0, so this reaches the orphan rule and not the weight rule.
      const victim = xw.entries[0].pillarId
      const other = xw.entries.find((e) => e.pillarId !== victim).pillarId
      for (const e of xw.entries) if (e.pillarId === victim) e.pillarId = other
    }),
  },
  {
    // Was a FRAMEWORK-COVERAGE row. D5 stage C reclassified that class: its only
    // failure path was this layer gap, which does not exist on a layerless module,
    // so the assertion moved into CROSSWALK-WEIGHT — which already owned the
    // identical rule per leaf dimension — and the class stopped existing rather
    // than shipping inert on TAIW. The mutation is unchanged; the code it trips
    // is not.
    code: 'CROSSWALK-WEIGHT',
    what: 'a framework whose every mapping is banking-tagged — blank scorecard under core (was FRAMEWORK-COVERAGE)',
    touches: [`${DGIW}/crosswalk.json`],
    apply: () => {
      const fw = readJson(`${FRAMEWORKS}/frameworks.json`)
      const target = fw.frameworks[0].id
      const dims = new Set(fw.dimensions.filter((d) => d.frameworkId === target).map((d) => d.id))
      json(`${DGIW}/crosswalk.json`, (xw) => {
        for (const e of xw.entries) if (dims.has(e.dimensionId)) e.layer = 'banking'
      })
    },
  },
  {
    code: 'CROSSWALK-DISTINCTNESS',
    what: 'a near-uniform crosswalk — four frameworks collapsing into one scorecard',
    touches: [`${DGIW}/crosswalk.json`],
    apply: () => json(`${DGIW}/crosswalk.json`, (xw) => {
      // Everything onto one pillar. Every framework's induced weight vector
      // becomes the same basis vector, so every pairwise L1 distance is 0 — which
      // is the degenerate end of exactly what the floor exists to catch.
      for (const e of xw.entries) e.pillarId = xw.entries[0].pillarId
    }),
  },
  // ── D5 stage C: the crosswalk factory's new classes ─────────────────────
  // ONE ROW PER BRANCH. SPINE-UNIVERSE has two directions, FRAMEWORK-REACH has
  // three (undeclared gap, stale exception, unknown code) and CROSSWALK-
  // CONCENTRATION has two (over ceiling, stale exception). Nine rows for three
  // codes, because a code that passes on the wrong evidence is a check that has
  // stopped running wearing a green tick — which is what D-011's stale-exception
  // row did for a phase.
  {
    code: 'SPINE-UNIVERSE',
    what: 'TAIW: a mapping pointing at a section id the dataset does not yield — the renamed-section shape',
    touches: [`${TAIW}/crosswalk.json`],
    apply: () => json(`${TAIW}/crosswalk.json`, (xw) => { xw.entries[0].spineId = 'dg_dqlx' }),
  },
  {
    code: 'SPINE-UNIVERSE',
    what: 'TAIW: two sections deriving the same id — mappings to it would be ambiguous',
    touches: [`${TAIW}/tacrQuestions.json`],
    apply: () => json(`${TAIW}/tacrQuestions.json`, (d) => {
      // Re-prefix one section's questions onto another's id.
      const cat = d.categories.find((c) => c.name === 'Data Governance')
      for (const q of cat.sections[1].questions) q.id = q.id.replace(/^dg_msd/, 'dg_dql')
    }),
  },
  {
    code: 'FRAMEWORK-REACH',
    what: 'TAIW: a leaf with no mapping and no declared exception — DM07 without its reason',
    touches: [`${TAIW}/crosswalk.json`],
    apply: () => json(`${TAIW}/crosswalk.json`, (xw) => {
      // Strip every mapping off DCAM8 Analytics Management (DIM-019).
      xw.entries = xw.entries.filter((e) => e.dimensionId !== 'DIM-019')
    }),
  },
  {
    code: 'FRAMEWORK-REACH',
    what: 'TAIW: a STALE exception — DM07 given a mapping while its exception stands',
    touches: [`${TAIW}/crosswalk.json`],
    apply: () => json(`${TAIW}/crosswalk.json`, (xw) => {
      xw.entries.push({ id: 'CW-T-900', dimensionId: 'DIM-007', spineId: 'pa_cla', coverageWeight: 1,
        rationale: 'Forced mapping planted by the selftest to make the DM07 exception stale.' })
    }),
  },
  {
    code: 'FRAMEWORK-REACH',
    what: 'TAIW: an exception naming a dimension code the module does not carry',
    touches: ['scripts/check/modules/taiw.mjs'],
    apply: () => sub('scripts/check/modules/taiw.mjs', 'const REACH_EXCEPTIONS = Object.freeze({',
      "const REACH_EXCEPTIONS = Object.freeze({\n  DGI04: 'not a dimension TAIW crosswalks — DGI is out of scope here',"),
  },
  {
    code: 'CROSSWALK-CONCENTRATION',
    what: 'TAIW: every mapping onto one section — the scorecard becomes a restatement of it',
    touches: [`${TAIW}/crosswalk.json`],
    apply: () => json(`${TAIW}/crosswalk.json`, (xw) => {
      for (const e of xw.entries) e.spineId = 'dg_dql'
    }),
  },
  {
    code: 'CROSSWALK-CONCENTRATION',
    what: 'DGIW: a STALE exception — DGI rebalanced under the ceiling while its exception stands',
    touches: [`${DGIW}/crosswalk.json`],
    apply: () => {
      const fw = readJson(`${FRAMEWORKS}/frameworks.json`)
      const dgi = new Set(fw.dimensions.filter((d) => d.frameworkId === 'FW-03').map((d) => d.id))
      // Spread DGI's mappings across the pillars so its peak falls under 35%.
      const pillars = ['P01', 'P02', 'P03', 'P04', 'P05', 'P06', 'P07', 'P08', 'P09', 'P10', 'P11']
      json(`${DGIW}/crosswalk.json`, (xw) => {
        let i = 0
        for (const e of xw.entries) if (dgi.has(e.dimensionId)) e.pillarId = pillars[i++ % pillars.length]
      })
    },
  },
  // ── D5 stage D: HAIW's crosswalk and the instrument disclosure ───────────
  /*
   * HACR-INSTRUMENT HAS THREE BRANCHES AND EACH ROW ISOLATES ONE.
   *
   * That took effort and it is the point. The obvious mutation — rewrite one
   * question — trips all three at once, which proves the check runs and proves
   * nothing about which assertion caught it. Each row below moves the bank in a way
   * the other two assertions still accept, so a branch that silently stopped
   * asserting shows up as one NOT TRIPPED row rather than hiding behind its
   * neighbours. That is the `unique()`/`UNIQUE` lesson applied inside one class.
   */
  {
    code: 'HACR-INSTRUMENT',
    what: 'HAIW: one of the nine stems reworded across all 80 subcategories — the bank stays uniform, the disclosure goes stale',
    touches: [`${HAIW}/hacrQuestions.json`],
    apply: () => json(`${HAIW}/hacrQuestions.json`, (qs) => {
      // All 80 instances, so every subcategory still carries nine distinct stems
      // and every category still holds ten subcategories. ONLY the stem universe
      // moves — which is exactly the change that would make the printed
      // "nine template stems" disclosure false while the bank stayed uniform.
      for (const q of qs) q.question = q.question.replace("strategic planning for", 'strategy for')
    }),
  },
  {
    code: 'HACR-INSTRUMENT',
    what: 'HAIW: one question moved to a sibling subcategory — 8 and 10 where every node must carry 9',
    touches: [`${HAIW}/hacrQuestions.json`],
    apply: () => json(`${HAIW}/hacrQuestions.json`, (qs) => {
      const victim = qs.find((q) => q.subcategory === 'Data Quality Management')
      const to = qs.find((q) => q.subcategory === 'Master Data Management').subcategory
      // The text is rewritten too, so the stem still resolves to one of the nine
      // and branch A stays silent. Only the per-node coverage moves.
      victim.question = victim.question.replace(victim.subcategory.toLowerCase(), to.toLowerCase())
      victim.subcategory = to
    }),
  },
  {
    code: 'HACR-INSTRUMENT',
    what: 'HAIW: a whole subcategory moved between categories — 9 and 11 where the spine is 8 × 10',
    touches: [`${HAIW}/hacrQuestions.json`],
    apply: () => json(`${HAIW}/hacrQuestions.json`, (qs) => {
      // Category, categoryId and the id code all move together, so the subcategory
      // keeps its nine questions and its nine stems — branches A and B stay silent
      // and only the 10-per-category count is wrong.
      for (const q of qs)
        if (q.subcategory === 'Data Ethics') {
          q.category = 'Strategy & Leadership'
          q.categoryId = 'CAT-SL'
          q.id = q.id.replace('-DG-', '-SL-')
        }
    }),
  },
  {
    code: 'CROSSWALK-CONCENTRATION',
    what: "HAIW: DGI's G1 group collapsed onto one subcategory — proving the 25% ceiling is reachable, not decoration",
    touches: [`${HAIW}/crosswalk.json`],
    apply: () => {
      const fw = readJson(`${FRAMEWORKS}/frameworks.json`)
      // G1 Rules & Rules of Engagement is half of DGI. Its six leaves landing on one
      // subcategory is the PLAUSIBLE authoring error the ceiling exists for, and it
      // is the shape that produced DGI's 54.1% on DGIW's P01. If this row ever reads
      // NOT TRIPPED, 25% has stopped being a ceiling anything could cross.
      const g1 = new Set(fw.dimensions.filter((d) => d.parentId === 'DIM-020').map((d) => d.id))
      json(`${HAIW}/crosswalk.json`, (xw) => {
        for (const e of xw.entries) if (g1.has(e.dimensionId)) e.spineId = 'dg_data_governance_framework'
      })
    },
  },
  {
    code: 'PROJECTION-INVARIANT',
    what: "HAIW: src/haiw/projection.ts unbuildable — three classes lose their engine and all three must say so",
    touches: ['src/haiw/projection.ts'],
    // CLAUDE.md records the version of this that shipped: an esbuild failure loading
    // projection.ts disabled TWO classes while only PROJECTION-INVARIANT said so,
    // because CROSSWALK-DISTINCTNESS went quiet behind a `projection ? … : []`.
    // HAIW binds three classes to one module, so the row is worth having per module
    // rather than once for the code.
    apply: () => sub('src/haiw/projection.ts', 'export', 'this is not valid typescript export'),
  },
  {
    code: 'PROJECTION-INVARIANT',
    what: 'projection.ts unbuildable — the invariants cannot run',
    touches: ['src/dgiw/projection.ts'],
    apply: () => sub('src/dgiw/projection.ts', 'export', 'this is not valid typescript export'),
  },

  // ── TAIW, D4 ────────────────────────────────────────────────────────────
  {
    code: 'TACR-SHAPE',
    what: 'a TACR question whose levels are not 1..5',
    touches: [`${TAIW}/tacrQuestions.json`],
    apply: () => json(`${TAIW}/tacrQuestions.json`, (d) => { delete d.categories[0].sections[0].questions[0].levels['5'] }),
  },
  {
    code: 'TACR-SHAPE',
    what: 'totalQuestions disagreeing with the file — the progress bar never reaches 100%',
    touches: [`${TAIW}/tacrQuestions.json`],
    apply: () => json(`${TAIW}/tacrQuestions.json`, (d) => { d.totalQuestions = 639 }),
  },
  {
    code: 'TACR-UNIQUE',
    what: 'two TACR questions sharing one id — and therefore one answer',
    touches: [`${TAIW}/tacrQuestions.json`],
    apply: () => json(`${TAIW}/tacrQuestions.json`, (d) => {
      const qs = d.categories[0].sections[0].questions
      qs[1].id = qs[0].id
    }),
  },
  {
    code: 'TACR-CATEGORY-PREFIX',
    what: 'one id prefix used by two categories',
    touches: [`${TAIW}/tacrQuestions.json`],
    apply: () => json(`${TAIW}/tacrQuestions.json`, (d) => {
      // Re-prefix every question of category 1 with category 0's prefix.
      const p0 = d.categories[0].sections[0].questions[0].id.split('_')[0]
      for (const s of d.categories[1].sections)
        for (const q of s.questions) q.id = `${p0}_${q.id.split('_').slice(1).join('_')}`
    }),
  },
  {
    code: 'TCF-SHAPE',
    what: 'a capability priority outside the declared set',
    touches: [`${TAIW}/capabilities.json`],
    apply: () => json(`${TAIW}/capabilities.json`, (c) => { c[0].priority = 'URGENT' }),
  },
  {
    code: 'TCF-SHAPE',
    what: 'a theme block split in two — page 13 would count it twice',
    touches: [`${TAIW}/capabilities.json`],
    apply: () => json(`${TAIW}/capabilities.json`, (c) => {
      // Move the first capability to the end: its theme block now resumes after
      // every other theme has been walked.
      c.push(c.shift())
    }),
  },
  {
    code: 'TCF-SLUG',
    what: 'a capability id that is not slug(sub) — the rule D-007’s four broke',
    touches: [`${TAIW}/capabilities.json`],
    apply: () => json(`${TAIW}/capabilities.json`, (c) => {
      const victim = c.find((x) => x.id !== 'aeo_compliance_monitoring_aeo')
      victim.id = victim.id.replace(/_and_/g, '_')
      if (victim.id === slugOf(victim.sub)) victim.id = `${victim.id}_x`
    }),
  },
  {
    code: 'TCF-SLUG',
    what: 'a stale SLUG_EXCEPTIONS entry — a fixed defect leaving a permanent hole',
    touches: [`${TAIW}/capabilities.json`],
    apply: () => json(`${TAIW}/capabilities.json`, (c) => {
      // Give D-009's id the name its slug rule wants. The exception is now stale.
      const victim = c.find((x) => x.id === 'aeo_compliance_monitoring_aeo')
      if (!victim) throw new Error('D-009 id not present — update this mutation')
      victim.sub = 'AEO Compliance Monitoring Aeo'
    }),
  },
  {
    code: 'TCF-THEME-CONSISTENT',
    what: 'one theme carrying two themeIndex values',
    touches: [`${TAIW}/capabilities.json`],
    apply: () => json(`${TAIW}/capabilities.json`, (c) => {
      const t = c[0].theme
      const other = c.find((x) => x.theme === t && x !== c[0])
      if (!other) throw new Error('no second capability in the first theme')
      other.themeIndex = c[0].themeIndex + 50
    }),
  },
  {
    code: 'TCF-FK',
    what: 'a dangling capability id in dataRequirements — D-007 itself',
    touches: [`${TAIW}/dataRequirements.json`],
    apply: () => json(`${TAIW}/dataRequirements.json`, (d) => {
      const row = d.find((r) => (r.capabilities ?? []).length > 0)
      row.capabilities[0] = row.capabilities[0].replace(/_and_/g, '_') + '_gone'
    }),
  },
  {
    code: 'TCF-COVERAGE',
    what: 'the WCO DM relation gone entirely',
    touches: [`${TAIW}/dataRequirements.json`],
    apply: () => json(`${TAIW}/dataRequirements.json`, (d) => { for (const r of d) r.capabilities = [] }),
  },
  {
    code: 'TAIW-BENCHMARK-KEYS',
    what: 'a TACR category with no benchmark — the client is compared to a hardcoded constant',
    touches: [`${TAIW}/benchmarks.json`],
    apply: () => json(`${TAIW}/benchmarks.json`, (b) => { delete b.pakistanCustomsAverage['Data Governance'] }),
  },

  // ── HAIW, D4 ────────────────────────────────────────────────────────────
  {
    code: 'HACR-SHAPE',
    what: 'a HACR question with an empty capabilityLinks array',
    touches: [`${HAIW}/hacrQuestions.json`],
    apply: () => json(`${HAIW}/hacrQuestions.json`, (q) => { q[0].capabilityLinks = [] }),
  },
  {
    code: 'HACR-UNIQUE',
    what: 'two HACR questions sharing one id',
    touches: [`${HAIW}/hacrQuestions.json`],
    apply: () => json(`${HAIW}/hacrQuestions.json`, (q) => { q[1].id = q[0].id }),
  },
  {
    code: 'HACR-CATEGORY-MAP',
    what: 'a question whose id code and category field disagree — the screen and the PDF would bucket it differently',
    touches: [`${HAIW}/hacrQuestions.json`],
    apply: () => json(`${HAIW}/hacrQuestions.json`, (q) => { q[0].category = 'Outcomes & Impact' }),
  },
  {
    // A SECOND ROW FOR THE SAME CODE, because it is a second BRANCH. D-011's
    // stale-exception row reported TRIPPED for a phase while silently exercising
    // a different branch; one row per code cannot tell those apart.
    code: 'HACR-CATEGORY-MAP',
    what: 'a category no longer holding 90 questions — the count HaiwDashboard pads with, having answers but not the question bank',
    touches: [`${HAIW}/hacrQuestions.json`],
    apply: () => json(`${HAIW}/hacrQuestions.json`, (q) => {
      const i = q.findIndex((x) => x.id.startsWith('HACR-WS-'))
      q.splice(i, 1)
    }),
  },
  {
    code: 'HCF-SHAPE',
    what: 'a capability id outside the HCF-nnn shape',
    touches: [`${HAIW}/capabilities.json`],
    apply: () => json(`${HAIW}/capabilities.json`, (c) => { c[0].id = 'HCF-1' }),
  },
  {
    code: 'HCF-LINK',
    what: 'a capability no HACR question reaches — unscoreable, and indistinguishable from a scope decision',
    touches: [`${HAIW}/hacrQuestions.json`],
    apply: () => {
      const caps = readJson(`${HAIW}/capabilities.json`)
      const victim = (Array.isArray(caps) ? caps : caps.capabilities)[0].id
      json(`${HAIW}/hacrQuestions.json`, (qs) => {
        for (const q of qs) q.capabilityLinks = (q.capabilityLinks ?? []).filter((l) => l !== victim)
        // Keep every question linked to something, so HACR-SHAPE stays quiet and
        // this row demonstrates HCF-LINK's capability side on its own.
        for (const q of qs) if (q.capabilityLinks.length === 0) q.capabilityLinks = ['HCF-002']
      })
    },
  },
  {
    code: 'HCF-FK',
    what: 'a capability naming a FHIR resource that does not exist',
    touches: [`${HAIW}/capabilities.json`],
    apply: () => json(`${HAIW}/capabilities.json`, (c) => { c[0].fhirResources = ['NotAResource'] }),
  },

  /*
   * ── HCF-SYNTHETIC, two rows, one per branch ─────────────────────────────
   *
   * D5 stage E2. The class pins three positional HCF fields and asserts HAIW's
   * generator reads none of them. Its two branches fail for OPPOSITE reasons and a
   * single mutation cannot show both:
   *
   *   1. the data stopped being positional — the field was AUTHORED, which is good
   *      news that must still fail the build, because on that day omitting it from
   *      page 13 and MR-HAIW-REGISTER stops being the right call.
   *   2. the generator started reading one — the withdrawal being quietly undone,
   *      which is the D-008 shape.
   */
  {
    code: 'HCF-SYNTHETIC',
    // 4, not 0 or 9: `[2,3,3,1][0]` is 2, so 4 breaks the cycle while staying inside
    // HCF-SHAPE's `integer 1..5`. That is the point — the range assertion passed for
    // two phases over a counter, so a mutation that trips it too would not show that
    // this class sees something HCF-SHAPE cannot.
    what: 'a maturityLevelRequired that is authored rather than positional — good news, and it must still fail',
    touches: [`${HAIW}/capabilities.json`],
    apply: () => json(`${HAIW}/capabilities.json`, (c) => { c[0].maturityLevelRequired = 4 }),
  },
  {
    code: 'HCF-SYNTHETIC',
    what: 'the HAIW generator reading a withdrawn positional field again',
    touches: ['src/haiw/utils/healthReportGenerator.ts'],
    // A property ACCESS, which is what the check looks for — the field is discussed
    // at length in that file's comments and a rule that failed on the word would make
    // the explanation unwritable.
    apply: () => append(
      'src/haiw/utils/healthReportGenerator.ts',
      '\nexport const __selftestLevel = (c: HaiwCapability) => c.maturityLevelRequired\n',
    ),
  },
  {
    code: 'HAIW-WEIGHT',
    // ONE assertion, one row. The old rule was `> 0` and had two conceivable
    // branches; `=== 1` subsumes both, so a second row would exercise the same
    // comparison twice and report a branch coverage the check does not have.
    // 0.9 rather than 0 on purpose: 0 is the shape the old rule already caught,
    // and 0.9 is the shape it passed for two phases — a plausible weight, which
    // is what a counter looks like from outside.
    what: 'a weight of 0.9 — the five-cycle reinstated, or real weighting begun without the walk',
    touches: [`${HAIW}/hacrQuestions.json`],
    apply: () => json(`${HAIW}/hacrQuestions.json`, (q) => { q[0].weight = 0.9 }),
  },

  // ── BENCHMARK-ROLLUP, D-010 ─────────────────────────────────────────────
  // Five rows for one code because it has five distinct failure branches, and
  // the two exception branches are the ones that decay silently: both maps ship
  // EMPTY, so nothing in the live repo exercises them and they would rot
  // unnoticed exactly as FRAMEWORK-COVERAGE's `fail()` did for a whole phase.
  // The mismatch and stale-exception rows target TAIW, not BAIW. D-011 removed
  // BAIW's rollup keys entirely — HAIW's shape, and the safe one — so BAIW can no
  // longer exhibit either defect and both rows went quiet there. The first
  // reported NOT TRIPPED; the second kept reporting TRIPPED while silently
  // exercising the unknown-block branch instead, which is a code passing on the
  // wrong evidence. TAIW still carries three rollups and is where the class lives.
  {
    code: 'BENCHMARK-ROLLUP',
    what: 'D-010 itself — a rollup that disagrees with the components printed beside it',
    touches: [`${TAIW}/benchmarks.json`],
    // Move a component, leave the rollup. The exact shape of the real defect:
    // 3.18 against eight numbers averaging 3.3, on the page that tells a client
    // how far it is behind its peers.
    apply: () => json(`${TAIW}/benchmarks.json`, (b) => { b.regionalLeaders['Strategy & Vision'] = 1.1 }),
  },
  {
    code: 'BENCHMARK-ROLLUP',
    what: 'a stale exception — a corrected rollup leaving a permanent hole in the check',
    touches: ['scripts/check/modules/taiw.mjs'],
    // Declare an exception for a block that already reconciles. Both maps are
    // empty in the live repo, so this branch has no other way to be reached.
    apply: () => sub(
      'scripts/check/modules/taiw.mjs',
      'const ROLLUP_EXCEPTIONS = Object.freeze({})',
      "const ROLLUP_EXCEPTIONS = Object.freeze({ wcoTargets: 'selftest — a block that reconciles' })",
    ),
  },
  {
    code: 'BENCHMARK-ROLLUP',
    what: 'an exception for a block that carries no rollup — nothing for it to excuse',
    touches: ['scripts/check/modules/baiw.mjs'],
    apply: () => sub(
      'scripts/check/modules/baiw.mjs',
      'const ROLLUP_EXCEPTIONS = Object.freeze({})',
      "const ROLLUP_EXCEPTIONS = Object.freeze({ globalBest: 'selftest — a real block with no rollup key' })",
    ),
  },
  {
    code: 'BENCHMARK-ROLLUP',
    what: 'an exception naming a block the file does not carry — coverage that is not',
    touches: ['scripts/check/modules/baiw.mjs'],
    apply: () => sub(
      'scripts/check/modules/baiw.mjs',
      'const ROLLUP_EXCEPTIONS = Object.freeze({})',
      "const ROLLUP_EXCEPTIONS = Object.freeze({ noSuchBlock: 'selftest — names nothing' })",
    ),
  },
  {
    code: 'BENCHMARK-ROLLUP',
    what: 'a BACR category with no entry in a block — what makes the five hardcoded 1.86 fallbacks reachable',
    touches: [`${BAIW_DATA}/benchmarks.json`],
    apply: () => json(`${BAIW_DATA}/benchmarks.json`, (b) => { delete b.globalBest.Governance }),
  },
  {
    code: 'BENCHMARK-ROLLUP',
    what: "HAIW's DEFAULT_BENCHMARKS gaining an Overall Assessment key — regAvg would average it in with its own components",
    touches: ['src/haiw/utils/healthReportGenerator.ts'],
    apply: () => sub(
      'src/haiw/utils/healthReportGenerator.ts',
      "  regionalLeaders: {\n    'Strategy & Leadership': 3.4,",
      "  regionalLeaders: {\n    'Overall Assessment': 3.18,\n    'Strategy & Leadership': 3.4,",
    ),
  },

  // ── CATEGORY-UNIVERSE, D-011 ────────────────────────────────────────────
  // FIVE rows for one code, one per BRANCH. That distinction is not pedantry:
  // BENCHMARK-ROLLUP shipped with two branches under one code and a matrix that
  // could not tell them apart, so when D-011 removed BAIW's rollup keys the
  // stale-exception row kept reporting TRIPPED while silently exercising the
  // unknown-block branch instead. A code passing on the wrong evidence is a check
  // that has stopped running, wearing a green tick.
  {
    code: 'CATEGORY-UNIVERSE',
    what: 'D-011 itself — a rendered category the question dataset does not contain',
    touches: ['src/data/bacrCategories.ts'],
    apply: () => sub('src/data/bacrCategories.ts', "  'Outcomes',\n]", "  'Outcomes',\n  'Overall Assessment',\n]"),
  },
  {
    code: 'CATEGORY-UNIVERSE',
    what: 'a category with questions that nothing renders — D-011 inverted, and quieter',
    touches: ['src/data/bacrCategories.ts'],
    apply: () => sub('src/data/bacrCategories.ts', "  'Governance',\n  'Information',", "  'Information',"),
  },
  {
    code: 'CATEGORY-UNIVERSE',
    what: 'a fourth copy of the list — the shape three copies diverged from',
    touches: ['src/pages/MaturityAssessment.tsx'],
    apply: () => sub(
      'src/pages/MaturityAssessment.tsx',
      'export default function MaturityAssessment() {',
      "const CATEGORIES_AGAIN = ['Business', 'Culture', 'Governance', 'Information', 'Applications', 'Systems', 'Agility', 'Outcomes']\nvoid CATEGORIES_AGAIN\n\nexport default function MaturityAssessment() {",
    ),
  },
  {
    code: 'CATEGORY-UNIVERSE',
    what: 'the declared const renamed — the comparison would read nothing',
    touches: ['src/data/bacrCategories.ts'],
    apply: () => sub('src/data/bacrCategories.ts', 'export const BACR_CATEGORIES = [', 'export const BACR_CATEGORIES_RENAMED = ['),
  },
  {
    code: 'CATEGORY-UNIVERSE',
    what: 'the declared location gone — a scan that finds nothing looks like a scan that passed',
    touches: ['src/data/bacrCategories.ts'],
    apply: () => remove('src/data/bacrCategories.ts'),
  },
  {
    code: 'BACR-CATEGORY-PREFIX',
    what: 'one id prefix serving two categories — the relation MaturityRadarCard attributes by',
    touches: [`${BAIW_DATA}/bacrQuestions.json`],
    apply: () => json(`${BAIW_DATA}/bacrQuestions.json`, (q) => {
      const victim = q.find((x) => x.id.startsWith('business_'))
      victim.category = 'Outcomes'
    }),
  },

  // ── the gate's own two ──────────────────────────────────────────────────
  {
    code: 'REGISTRY',
    what: 'a declared dataset file that is missing',
    touches: [`${DGIW}/positioning.json`],
    apply: () => remove(`${DGIW}/positioning.json`),
  },
  {
    code: 'REGISTRY',
    what: 'an empty registry — the gate would otherwise print 0 entries, 0 checks and pass',
    touches: ['scripts/check/modules/index.mjs'],
    // ANCHORED ON THE OPENING, NOT THE WHOLE ARRAY. The anchor used to be the
    // full module list, so registering `cdm` invalidated it and this row went
    // NOT TRIPPED — the registry's own growth silently disarming the check that
    // guards the registry. `sub` refusing a missing anchor is what surfaced it
    // rather than letting the row no-op, and moving the anchor off the member
    // list means the next module addition cannot repeat it.
    apply: () => sub('scripts/check/modules/index.mjs', 'export default [spine', 'export default []\nconst __selftestDisabledRegistry = [spine'),
  },
  {
    code: 'REGISTRY',
    what: 'a phantom module registered with a dataset that does not resolve',
    touches: ['scripts/check/modules/index.mjs'],
    // THE OTHER DIRECTION FROM THE MISSING-DATASET ROW ABOVE. That one deletes a
    // file a real module declares; this one declares a file no module should. The
    // branch is the same resolution check, reached from the declaration side
    // rather than the filesystem side, and only this side proves an entry
    // APPENDED to the array is still seen at all.
    //
    // That is the surface the re-anchoring above moved. The empty-registry row
    // now rewrites the array's OPENING, so it would keep passing even if entries
    // after the first were being dropped on the floor; nothing else asserted that
    // a newly registered entry is read. `checks: []` keeps the entry legal in
    // every other respect, so REGISTRY is the only code that fires and the row
    // isolates one branch.
    apply: () => sub(
      'scripts/check/modules/index.mjs',
      'export default [spine',
      "export default [{ id: 'phantom', title: 'phantom module', checks: [], dataDir: 'src', datasets: { ghost: 'data/__phantom_does_not_exist__.json' } }, spine",
    ),
  },
  {
    code: 'VACUOUS',
    what: 'a check that examines nothing and reports nothing',
    touches: ['scripts/check/modules/dgiw.mjs'],
    apply: () => sub('scripts/check/modules/dgiw.mjs', 'return { examined: coreCdes.length }', 'return { examined: 0 }'),
  },

  /*
   * ── FINGERPRINT-COVERAGE, three rows, one per branch ────────────────────
   *
   * EACH ROW ISOLATES ONE BRANCH, on the HACR-INSTRUMENT precedent. The obvious
   * mutation — point a generator at any undeclared file — trips the class but
   * proves nothing about WHICH of its three assertions caught it, and two of the
   * three are the ones that matter:
   *
   *   1. the subset assertion itself, on a direct import
   *   2. the refusal to skip an import it cannot resolve
   *   3. the TRANSITIVE walk — the branch a direct-imports-only check would lack
   *      while looking identical from outside. Three of DGIW's nine dataset reads
   *      are reachable only through a binding, so this is not a hypothetical
   *      branch; it is most of the class's value.
   */
  {
    code: 'FINGERPRINT-COVERAGE',
    what: 'a fingerprint that stops declaring a dataset its own generator imports — D-010, made visible',
    touches: ['scripts/golden/fixtures/taiw.json'],
    apply: () => json('scripts/golden/fixtures/taiw.json', (f) => {
      const drop = 'src/data/taiw/capabilities.json'
      if (!(f.dataSources ?? []).includes(drop)) throw new Error(`taiw.json no longer declares ${drop} — this row is measuring nothing`)
      f.dataSources = f.dataSources.filter((s) => s !== drop)
    }),
  },
  {
    code: 'FINGERPRINT-COVERAGE',
    what: 'a generator reaching data through a template-string import — unresolvable, so unverifiable',
    touches: ['src/taiw/utils/tradeReportGenerator.ts'],
    // The `/* @vite-ignore */` idiom TAIW and HAIW use for their data loaders. A
    // specifier built at runtime can name any dataset in the tree, so the check
    // must refuse it rather than walk past it and report the module clean.
    apply: () => append(
      'src/taiw/utils/tradeReportGenerator.ts',
      '\nexport const __selftestLoad = (n: string) => import(/* @vite-ignore */ `../../data/taiw/${n}.json`)\n',
    ),
  },
  {
    code: 'FINGERPRINT-COVERAGE',
    what: 'an undeclared dataset reached only THROUGH a binding — what a direct-imports-only walk cannot see',
    // hacr.ts is imported by healthReportGenerator.ts, so this JSON is two hops
    // from the declared report source and zero hops from nothing. benchmarks.json
    // is read by no generator today (HAIW's report uses its own
    // DEFAULT_BENCHMARKS) and is declared by no fixture, so it is undeclared for
    // the right reason rather than by coincidence.
    touches: ['src/haiw/hacr.ts'],
    apply: () => append('src/haiw/hacr.ts', "\nimport __selftestBenchmarks from '../data/haiw/benchmarks.json'\nexport const __selftestUse = () => __selftestBenchmarks\n"),
  },

  // ── PROVENANCE-COVERAGE, D5 stage F1 — one row per branch ───────────────
  // A generator bypassing the recorder is the branch that matters: each of the
  // first three drops the (already-wired) provenance argument from one real
  // call site, which is exactly what a future edit dropping it by accident
  // would look like — the call still compiles, the file still downloads.
  {
    code: 'PROVENANCE-COVERAGE',
    what: 'a saveReport call with no provenance meta — the recorder is never invoked',
    touches: ['src/utils/reportGenerator.ts'],
    apply: () => sub(
      'src/utils/reportGenerator.ts',
      `saveReport(r.build(), reportFilename(reportMeta, 'pdf'), reportMeta)`,
      `saveReport(r.build(), reportFilename(reportMeta, 'pdf'))`,
    ),
  },
  {
    code: 'PROVENANCE-COVERAGE',
    what: 'a downloadCsv call with no provenance meta',
    touches: ['src/haiw/utils/healthReportGenerator.ts'],
    apply: () => sub(
      'src/haiw/utils/healthReportGenerator.ts',
      `return downloadCsv(rows, REGISTER_COLUMNS, reportFilename(meta, 'csv'), meta)`,
      `return downloadCsv(rows, REGISTER_COLUMNS, reportFilename(meta, 'csv'))`,
    ),
  },
  {
    code: 'PROVENANCE-COVERAGE',
    what: 'a saveMarkdown call with no provenance meta',
    touches: ['src/taiw/utils/tradeReportGenerator.ts'],
    apply: () => sub(
      'src/taiw/utils/tradeReportGenerator.ts',
      `saveMarkdown(md, reportFilename(meta, 'md'), meta)`,
      `saveMarkdown(md, reportFilename(meta, 'md'))`,
    ),
  },
  {
    code: 'PROVENANCE-COVERAGE',
    what: 'a reference to one of the three recorder exits reached through neither a named import nor a destructured binding — unresolvable, so unverifiable',
    // useDeliverable.ts is inside the declared dgiw report-source set and
    // imports none of the three names, so a bare property access here cannot
    // be resolved to any known local binding.
    touches: ['src/dgiw/report/useDeliverable.ts'],
    apply: () => append('src/dgiw/report/useDeliverable.ts', '\nexport const __selftestUse = (ns: any) => ns.saveReport\n'),
  },

  // ── the geometry audit ──────────────────────────────────────────────────
  // A different tool, and the reason it is here: geometry.mjs measures drawn
  // PATHS, which is the one thing no text-based check in this repo can see. Two
  // of D-006's three instances broke the margin by the same 5 mm as the third and
  // no glyph overflowed, so every check called those pages clean for the whole of
  // D2. `--fail-on-overflow` is what makes that measurable rather than merely
  // printable, and a flag nobody exercises is a flag nobody notices breaking.
  {
    code: 'GEOMETRY-OVERFLOW',
    tool: 'geometry',
    what: 'a drawn box widened past the content column — invisible to every glyph-based check',
    touches: [],
    creates: [GEOM_PROBE],
    apply: () => {
      const p = writeGeometryProbe()
      return `${p.source}: ${p.before} -> ${p.after}`
    },
  },

  // ── CDM, CDM-P1 — seventeen rows over the check fixture ─────────────────
  //
  // THESE ROWS ARE THE ONLY THING THAT PROVES THE THREE CDM CLASSES CAN FIRE.
  // CDM_MODELS lands empty, so on a normal build all three examine nothing and
  // declare `mayBeEmpty` — a state indistinguishable, in every printed line,
  // from three classes that stopped running. Hence CDM_SELFTEST_FIXTURE=1,
  // which puts scripts/fixtures/cdm-fixture.mts in scope for these rows and
  // nothing else. Without the env var every row below would report NOT TRIPPED
  // over an empty registry.
  //
  // ONE BRANCH PER ROW. Where breaking a branch would drag a second class in
  // with it, the row repairs the collateral: PR-M3 moves the regime in the
  // dossier as well as the descriptor, because changing only one of them also
  // trips CDM-VERSION-PIN's regime-drift branch and the row would then prove
  // nothing about which assertion caught it. That is the HACR-INSTRUMENT
  // lesson, applied across classes rather than within one.
  //
  // Content mutations are appended as statements rather than substituted into
  // the literal: the bundle objects are module-level and CDM_FIXTURE_BUNDLES
  // holds references to them, so `bundle.x = y` after the exports is both
  // formatting-proof and readable as exactly the branch being broken.
  ...[
    // ── CDM-VERSION-PIN: a descriptor must never outrun its dossier ───────
    {
      code: 'CDM-VERSION-PIN',
      what: 'the dossier a model descriptor names is not on disk',
      touches: [CDM_DOSSIER],
      apply: () => remove(CDM_DOSSIER),
    },
    {
      code: 'CDM-VERSION-PIN',
      what: 'a descriptor versionPin bumped past the version its dossier records',
      touches: [CDM_FIXTURE],
      apply: () => cdmPatch("cdmFixtureBundle.descriptor.versionPin = 'fixture-9.9.9'"),
    },
    {
      code: 'CDM-VERSION-PIN',
      what: 'a model built past a dossier verdict that is not go',
      touches: [CDM_FIXTURE, CDM_DOSSIER],
      apply: () => {
        cdmPatch('cdmFixtureBundle.descriptor.stage = 1')
        sub(CDM_DOSSIER, 'verdict: go', 'verdict: wait')
      },
    },
    {
      code: 'CDM-VERSION-PIN',
      what: 'the licensing regime in the dossier drifts from the one the descriptor declares',
      touches: [CDM_DOSSIER],
      apply: () => sub(CDM_DOSSIER, 'regime: open-redistributable', 'regime: open-use-restricted'),
    },
    {
      code: 'CDM-VERSION-PIN',
      what: 'a model built past an UNPINNED version — pinning is the first act of Stage 1',
      touches: [CDM_FIXTURE, CDM_DOSSIER],
      // The dossier moves too, so the mismatch branch above stays quiet and this
      // row isolates the unpinned-at-stage>=1 branch alone.
      apply: () => {
        cdmPatch("cdmFixtureBundle.descriptor.stage = 1", "cdmFixtureBundle.descriptor.versionPin = 'UNPINNED (stage-0)'")
        sub(CDM_DOSSIER, 'versionPin: "fixture-1.0.0"', 'versionPin: "UNPINNED (stage-0)"')
      },
    },

    // ── CDM-PROVENANCE: the fabrication firewall, at record level ─────────
    {
      code: 'CDM-PROVENANCE',
      what: 'a non-extension entity carries no provenance — content nobody can trace',
      touches: [CDM_FIXTURE],
      apply: () => cdmPatch("delete cdmFixtureEntity('ent-account').provenance"),
    },
    {
      code: 'CDM-PROVENANCE',
      what: 'a record cites a sourceId the descriptor does not declare — a dangling citation',
      touches: [CDM_FIXTURE],
      apply: () => cdmPatch("cdmFixtureEntity('ent-account').provenance.sourceId = 'nonexistent-src'"),
    },
    {
      code: 'CDM-PROVENANCE',
      what: "a 'verbatim' record under a derived-synthetic regime — the FSDM/D-001 firewall",
      touches: [CDM_FIXTURE, CDM_DOSSIER],
      // The dossier regime moves with the descriptor's, so CDM-VERSION-PIN's
      // drift branch stays quiet and this row measures the firewall alone.
      apply: () => {
        cdmPatch("cdmFixtureBundle.descriptor.regime = 'derived-synthetic'", "cdmFixtureEntity('ent-party').provenance.method = 'verbatim'")
        sub(CDM_DOSSIER, 'regime: open-redistributable', 'regime: derived-synthetic')
      },
    },
    {
      code: 'CDM-PROVENANCE',
      what: 'a blank locator — a citation a human cannot re-find is not a citation',
      touches: [CDM_FIXTURE],
      apply: () => cdmPatch("cdmFixtureEntity('ent-party').provenance.locator = '   '"),
    },
    {
      code: 'CDM-PROVENANCE',
      what: "a use-case mapping recorded as 'synthetic' — a mapping is authored judgment by definition",
      touches: [CDM_FIXTURE],
      apply: () => cdmPatch("cdmFixtureBundle.useCaseMappings[0].provenance.method = 'synthetic'"),
    },
    {
      code: 'CDM-PROVENANCE',
      expect: 'pass',
      what: 'NEGATIVE CONTROL: the same provenance-less entity, flagged workbenchExtension — the escape hatch must hold',
      touches: [CDM_FIXTURE],
      // Identical to PR-M1 except for the flag. If this fires, the class rejects
      // the documented way to declare a workbench-specific addition, and every
      // TAIW-additions-shaped record in CDM-P2 would have to be smuggled past it.
      apply: () => cdmPatch(
        "delete cdmFixtureEntity('ent-account').provenance",
        "cdmFixtureEntity('ent-account').workbenchExtension = true",
      ),
    },

    // ── CDM-COVERAGE: a declared stage is a claim, and it must cost ───────
    {
      code: 'CDM-COVERAGE',
      what: 'stage 3 declared with no use-case mappings — a roadmap wearing a completion badge',
      touches: [CDM_FIXTURE],
      apply: () => cdmPatch('cdmFixtureBundle.useCaseMappings = []'),
    },
    {
      code: 'CDM-COVERAGE',
      what: 'an entity pointing at a subject area its model does not contain',
      touches: [CDM_FIXTURE],
      apply: () => cdmPatch("cdmFixtureEntity('ent-account').subjectAreaId = 'sa-nonexistent'"),
    },
    {
      code: 'CDM-COVERAGE',
      what: 'a mapping reaching an entity in a SECOND model without declaring crossModel',
      touches: [CDM_FIXTURE],
      apply: () => cdmPatch("cdmFixtureBundle.useCaseMappings[0].entityIds.push('alt-ent-counterparty')"),
    },
    {
      code: 'CDM-COVERAGE',
      expect: 'pass',
      what: 'NEGATIVE CONTROL: the same cross-model reach WITH crossModel: true — the reserved flag must be honoured',
      touches: [CDM_FIXTURE],
      apply: () => cdmPatch(
        "cdmFixtureBundle.useCaseMappings[0].entityIds.push('alt-ent-counterparty')",
        'cdmFixtureBundle.useCaseMappings[0].crossModel = true',
      ),
    },
    {
      code: 'CDM-COVERAGE',
      what: 'a duplicate entity id — every reference to it becomes ambiguous',
      touches: [CDM_FIXTURE],
      apply: () => cdmPatch("cdmFixtureBundle.entities.push({ ...cdmFixtureEntity('ent-party') })"),
    },
    {
      code: 'CDM-COVERAGE',
      what: 'a mapping naming a use-case page the host workbench registry does not contain',
      touches: [CDM_FIXTURE],
      apply: () => cdmPatch("cdmFixtureBundle.useCaseMappings[0].useCasePageId = 'fixture-page-unregistered'"),
    },
    {
      code: 'CDM-COVERAGE',
      what: 'a fixture-hosted mapping reaching a REAL baiw page — cross-workbench resolution must not leak',
      touches: [CDM_FIXTURE],
      // DISTINCT FROM THE ROW ABOVE, and the distinction is the whole point.
      // That one names an id nothing registers; this one names
      // `cash-optimization`, which is a real, registered BAIW page — just not
      // one belonging to this model's workbench. Resolving against the whole
      // registry instead of the hostWorkbench's slice would pass this and
      // silently let a fixture model reach a live BAIW page. Only a real id
      // from another workbench can tell those two implementations apart.
      apply: () => cdmPatch("cdmFixtureBundle.useCaseMappings[0].useCasePageId = 'cash-optimization'"),
    },
  ].map((m) => ({ ...m, env: { CDM_SELFTEST_FIXTURE: '1' } })),

  // ── PAGE-REGISTRY-SYNC, CDM-P2b — one row per DIRECTION ─────────────────
  // The registry and the app can disagree two ways and they are different
  // defects: a page registered that the app does not serve, and a page the app
  // serves that nothing registered. One row each, because a single mutation
  // that broke both would not say which direction the check can still see.
  //
  // These rows need no fixture env: the check reads App.tsx, Sidebar.tsx and
  // the real registry, all of which the scratch copy already carries.
  {
    code: 'PAGE-REGISTRY-SYNC',
    what: 'a page registered in useCasePages.ts that the app does not serve',
    touches: ['src/cdm/meta/useCasePages.ts'],
    apply: () => sub(
      'src/cdm/meta/useCasePages.ts',
      "  { pageId: 'architecture', workbenchId: 'baiw', title: 'Architecture Cockpit' },",
      "  { pageId: 'architecture', workbenchId: 'baiw', title: 'Architecture Cockpit' },\n  { pageId: 'phantom-page', workbenchId: 'baiw', title: 'Phantom' },",
    ),
  },
  {
    code: 'PAGE-REGISTRY-SYNC',
    what: 'a route the app serves that the registry does not carry — the SuiteLanding drift shape',
    touches: ['src/App.tsx'],
    // Renames the route rather than adding one, so the mutation cannot depend
    // on a component that does not exist.
    apply: () => sub(
      'src/App.tsx',
      '<Route path="/architecture" element={<ArchitectureCockpit />} />',
      '<Route path="/architecture-v2" element={<ArchitectureCockpit />} />',
    ),
  },

]

// ── scratch root ────────────────────────────────────────────────────────────
/**
 * `docs` joined the list when CDM-P2 registered the first real model. A CDM
 * descriptor's `dossierPath` is repo-root-relative, so CDM-VERSION-PIN reads
 * docs/cdm/dossiers/ — and with only src and scripts copied, the PRISTINE
 * CONTROL failed: the dossier was simply not in the scratch tree. The harness
 * has to copy everything a check reads, and what checks read grew.
 */
const COPY = ['src', 'scripts', 'docs']

/**
 * Where a scratch-relative path comes FROM. `docs/` lives at the repo root,
 * one level above baiw/, so it cannot be joined onto REPO like the other two.
 * Used by both the initial copy and `restore`, so the two cannot disagree —
 * a restore that looked in the wrong place would put back nothing and leave
 * every later row measuring a dirty tree.
 */
const sourceOf = (rel) =>
  rel === 'docs' || rel.startsWith('docs/') ? path.join(REPO, '..', rel) : path.join(REPO, rel)

/**
 * A node_modules of the scratch root's own, entry by entry, symlinked to the
 * real ones. esbuild, typescript and react all resolve through it, and the temp
 * bundle directory esbuild creates lands INSIDE the scratch rather than inside
 * the real node_modules.
 */
const linkNodeModules = () => {
  const dest = path.join(SCRATCH, 'node_modules')
  fs.mkdirSync(dest, { recursive: true })
  const real = path.join(REPO, 'node_modules')
  for (const e of fs.readdirSync(real)) {
    if (e === '.check-selftest') continue
    const link = path.join(dest, e)
    if (!fs.existsSync(link)) fs.symlinkSync(path.join(real, e), link)
  }
}

const buildScratch = () => {
  fs.rmSync(SCRATCH, { recursive: true, force: true })
  fs.mkdirSync(SCRATCH, { recursive: true })
  for (const d of COPY) fs.cpSync(sourceOf(d), path.join(SCRATCH, d), { recursive: true })
  linkNodeModules()
}

/** Put back exactly what a mutation touched, and delete what it created. */
const restore = (m) => {
  for (const rel of m.touches ?? []) {
    const from = sourceOf(rel)
    const to = P(rel)
    fs.rmSync(to, { recursive: true, force: true })
    fs.cpSync(from, to, { recursive: true })
  }
  for (const rel of m.creates ?? []) fs.rmSync(P(rel), { recursive: true, force: true })
  // Anything written outside both lists would survive here, which is why the
  // pristine control is re-run at the end.
}

/** Never throws — the exit code and both output streams are data. */
const run = (script, args, env) => {
  // Node 22's Console may lose buffered writes when a short-lived child exits
  // with stdout/stderr as anonymous pipes. Real files give console synchronous
  // descriptors and make the failure transcript reliably readable.
  const stdoutPath = path.join(SCRATCH, '.selftest.stdout')
  const stderrPath = path.join(SCRATCH, '.selftest.stderr')
  const stdout = fs.openSync(stdoutPath, 'w')
  const stderr = fs.openSync(stderrPath, 'w')
  let result
  try {
    result = spawnSync(process.execPath, [path.join(SCRATCH, ...script), ...args], {
      stdio: ['ignore', stdout, stderr],
      // Per-row env. The CDM rows are the only users: their classes examine
      // nothing unless the fixture is switched on, which is the behaviour under
      // test — see check/modules/cdm.mjs.
      env: env ? { ...process.env, ...env } : process.env,
    })
  } finally {
    fs.closeSync(stdout)
    fs.closeSync(stderr)
  }
  const out = fs.readFileSync(stdoutPath, 'utf8')
  const err = fs.readFileSync(stderrPath, 'utf8')
  fs.rmSync(stdoutPath, { force: true })
  fs.rmSync(stderrPath, { force: true })
  return { status: result.status ?? 1, out, err: err || result.error?.message || '' }
}

const runGate = (env) => run(['scripts', 'check.mjs'], ['--root', SCRATCH], env)
const runGeometry = () => run(['scripts', 'golden', 'geometry.mjs'], ['--module', 'baiw', '--fail-on-overflow'])

/** Codes named in the problem list, in first-seen order. */
const codesIn = (stderr) => {
  const seen = []
  for (const line of stderr.split('\n')) {
    const m = /^\s{2}([A-Z][A-Z0-9-]*): /.exec(line)
    if (m && !seen.includes(m[1])) seen.push(m[1])
  }
  return seen
}

/**
 * geometry.mjs reports rather than emitting codes, so its verdict is read from
 * the count line and the exit status. Both halves are asserted: an overflowing
 * path must be counted, AND the full-bleed bands must still be excluded — a
 * "fix" that made every band count as an overflow would turn the flag red for
 * the wrong reason and read identically from the exit code alone.
 */
const GEOM_LINE = /(\d+) path\(s\) past the content column, (\d+) full-bleed band\(s\) ignored/

const geometryVerdict = (r) => {
  const m = GEOM_LINE.exec(r.out)
  if (!m) return { hit: false, sample: '', note: 'geometry.mjs printed no count line — its output format changed and this row is no longer measuring anything' }
  const [, over, bleed] = m.map(Number)
  if (over < 1) return { hit: false, sample: m[0], note: 'the widened box was not counted as past the content column' }
  if (bleed < 1) return { hit: false, sample: m[0], note: 'no full-bleed band was excluded — legitimate cover chrome is now being counted as an overflow' }
  if (r.status === 0) return { hit: false, sample: m[0], note: '--fail-on-overflow counted an overflow but still exited 0' }
  const detail = r.out.split('\n').find((l) => l.includes('PAST the margin'))
  return { hit: true, sample: (detail ?? m[0]).trim() }
}

// ── run ─────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2)
let only = null
let keep = false
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--only') { only = argv[i + 1]; i++ }
  else if (argv[i].startsWith('--only=')) only = argv[i].slice(7)
  else if (argv[i] === '--keep') keep = true
  else { console.error(`selftest: unknown argument ${JSON.stringify(argv[i])}`); process.exit(2) }
}

console.log('check selftest — every finding code, tripped on a copy\n')
console.log(`  scratch root: ${path.relative(REPO, SCRATCH)}  (copies ${COPY.join(', ')}; no tracked file is written)`)

buildScratch()

// CONTROL. If the pristine copy does not pass, every NOT TRIPPED below would be
// unreadable — you could not tell a missing failure path from a broken copy.
const control = runGate()
if (control.status !== 0) {
  console.error(`\n  CONTROL FAILED — the unmutated copy does not pass, so no mutation result below would mean anything.\n`)
  console.error(control.err || control.out)
  process.exit(1)
}
const geomControl = runGeometry()
if (geomControl.status !== 0) {
  console.error(`\n  CONTROL FAILED — geometry.mjs --fail-on-overflow is already red on the unmutated copy, so its row below would prove nothing.\n`)
  console.error(geomControl.err || geomControl.out)
  process.exit(1)
}
console.log(`  control: pristine copy passes the gate (exit 0) and geometry --fail-on-overflow (exit 0)\n`)

const selected = only ? MUTATIONS.filter((m) => m.code === only) : MUTATIONS
if (only && selected.length === 0) {
  console.error(`selftest: no mutation targets ${JSON.stringify(only)}. Codes: ${[...new Set(MUTATIONS.map((m) => m.code))].sort().join(', ')}`)
  process.exit(2)
}

const rows = []
for (const m of selected) {
  let result
  try {
    const detail = m.apply()
    if (m.tool === 'geometry') {
      const r = runGeometry()
      const v = geometryVerdict(r)
      result = { code: m.code, what: m.what, control: false, tripped: v.hit, satisfied: v.hit, exit: r.status, also: [], sample: v.sample, note: v.note ?? null, detail }
    } else {
      const r = runGate(m.env)
      const codes = codesIn(r.err)
      const hit = codes.includes(m.code)
      // A NEGATIVE CONTROL inverts the expectation: the mutation is a legal
      // edit and the gate must stay green over it. Without these a class that
      // fired on everything would score a perfect matrix — every row TRIPPED,
      // every code demonstrated — while being useless. `expect: 'pass'` is how
      // a row asserts the class is not over-firing.
      const control = m.expect === 'pass'
      result = {
        code: m.code,
        what: m.what,
        control,
        tripped: hit && r.status !== 0,
        satisfied: control ? !hit && r.status === 0 : hit && r.status !== 0,
        exit: r.status,
        also: control ? codes : codes.filter((c) => c !== m.code),
        // First line of the target code's finding, for the transcript.
        sample: (r.err.split('\n').find((l) => l.trim().startsWith(`${m.code}: `)) ?? '').trim(),
        note: control
          ? (hit ? `${m.code} fired on a legal edit — the class is over-firing` : r.status !== 0 ? `gate exited ${r.status} on a legal edit` : null)
          : hit && r.status === 0 ? 'code reported but the gate exited 0' : null,
      }
    }
  } catch (err) {
    result = { code: m.code, what: m.what, control: m.expect === 'pass', tripped: false, satisfied: false, exit: null, also: [], sample: '', note: `mutation could not be applied: ${err?.message ?? err}` }
  }
  restore(m)
  rows.push(result)
  const verdict = result.control
    ? (result.satisfied ? 'CONTROL OK ' : 'CONTROL BAD')
    : (result.tripped ? 'TRIPPED    ' : 'NOT TRIPPED')
  process.stdout.write(`  ${verdict}  ${result.code.padEnd(23)} ${result.what}\n`)
  if (result.sample) console.log(`                 ↳ ${result.sample.slice(0, 150)}${result.sample.length > 150 ? '…' : ''}`)
  if (result.also.length) console.log(`                 +also ${result.also.join(', ')}`)
  if (result.note) console.log(`                 NOTE ${result.note}`)
}

// The copy must still pass after every mutation has been reverted. If it does
// not, a mutation leaked outside its declared `touches`/`creates` and some of the
// results above were measured against a dirty tree.
const after = runGate()
if (after.status !== 0) {
  console.error(`\n  RESTORE FAILED — the copy no longer passes the gate after reverting. A mutation wrote outside its declared touches, so results above are not trustworthy.\n`)
  console.error(after.err)
  process.exit(1)
}
const geomAfter = runGeometry()
if (geomAfter.status !== 0) {
  console.error(`\n  RESTORE FAILED — geometry.mjs is still red after reverting. The probe PDF was not cleaned up.\n`)
  console.error(geomAfter.out)
  process.exit(1)
}

if (!keep) fs.rmSync(SCRATCH, { recursive: true, force: true })

// A NEGATIVE CONTROL demonstrates nothing, by construction — it asserts a code
// does NOT fire. Counting one toward `codes` would let a class whose only rows
// were controls report itself demonstrated while never having fired once.
const codes = [...new Set(selected.filter((m) => m.expect !== 'pass').map((m) => m.code))].sort()
const trippedCodes = new Set(rows.filter((r) => r.tripped).map((r) => r.code))
const unreachable = codes.filter((c) => !trippedCodes.has(c))
const controls = rows.filter((r) => r.control)
const positives = rows.filter((r) => !r.control)

console.log(`\n  ${positives.filter((r) => r.tripped).length} of ${positives.length} mutations tripped their target`)
if (controls.length) {
  // The trailing clause is CONDITIONAL. `0 of 1 negative control(s) stayed
  // green — the classes are not over-firing` asserted the opposite of what had
  // just happened, which is the exact shape recorded against compare.mjs: a
  // summary reading clean above its own rejection.
  const green = controls.filter((r) => r.satisfied).length
  console.log(`  ${green} of ${controls.length} negative control(s) stayed green` +
    (green === controls.length ? ' — the classes are not over-firing' : ' — SEE BELOW, a class fired on a legal edit'))
}
console.log(`  ${trippedCodes.size} of ${codes.length} distinct codes demonstrated${keep ? `\n  scratch root kept at ${path.relative(REPO, SCRATCH)}` : ''}`)

// TWO assertions, because they answer two different questions and only one of
// them was asked until D5 stage H.
//
// `unreachable` asks whether a CODE still has a failure path ANYWHERE.
// `dead` asks whether THIS ROW still proves the BRANCH it was written for.
//
// A code-level assertion alone exits 0 on a row that has stopped tripping,
// whenever any sibling row shares its code — and 35 of these 93 rows have a
// sibling. They are precisely the rows that exist to isolate one branch each:
// ARTEFACT-EVIDENCE ×5, PROVENANCE-COVERAGE ×4, HACR-INSTRUMENT ×3,
// CROSSWALK-WEIGHT ×2, written that way because corrupting one block trips
// three at once and proves nothing about which assertion caught it. The
// discipline was real in the rows and absent from the verdict, and the header
// of this file claimed NOT TRIPPED "exits 1 here" while it did not.
//
// This is the third time in this project a check has worked while its verdict
// lied: `unique()` hardcoding one code so two rules failed under a name neither
// declared, `compare.mjs`'s summary reading clean above a rejection, and now a
// sibling row masking a dead one. The check running is not the same fact as the
// check reporting what it found.
// `satisfied`, not `tripped`: a row is judged against its OWN expectation, so a
// negative control that started firing fails here exactly as a positive row that
// stopped firing does. Both mean the row no longer proves what it was written
// to prove.
const dead = rows.filter((r) => !r.satisfied)
let failed = false

if (dead.length) {
  console.error(`\n  ${dead.length} row(s) DID NOT MEET THEIR EXPECTATION:`)
  for (const r of dead) console.error(`    ${r.control ? 'control fired ' : 'NOT TRIPPED  '} ${r.code.padEnd(23)} ${r.what}`)
  console.error(`  A row that stops tripping has stopped proving its branch, whether or not a sibling row shares its code.`)
  console.error(`  A negative control that fires means the class rejects a legal edit — over-firing, which no positive row can detect.`)
  failed = true
}
if (unreachable.length) {
  console.error(`\n  ${unreachable.length} code(s) NOT DEMONSTRATED: ${unreachable.join(', ')}`)
  console.error(`  A code with no reachable failure path is decoration. Either the mutation is wrong or the branch is gone.`)
  failed = true
}
if (failed) process.exit(1)
console.log(`\n  OK — every row met its expectation and every code has a reachable failure path`)
