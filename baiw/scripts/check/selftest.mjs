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
import { execFileSync } from 'node:child_process'
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
    apply: () => sub('scripts/check/modules/index.mjs', 'export default [spine, baiw, taiw, haiw, coe, alm, dgiw]', 'export default []'),
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
]

// ── scratch root ────────────────────────────────────────────────────────────
const COPY = ['src', 'scripts']

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
  for (const d of COPY) fs.cpSync(path.join(REPO, d), path.join(SCRATCH, d), { recursive: true })
  linkNodeModules()
}

/** Put back exactly what a mutation touched, and delete what it created. */
const restore = (m) => {
  for (const rel of m.touches ?? []) {
    const from = path.join(REPO, rel)
    const to = P(rel)
    fs.rmSync(to, { recursive: true, force: true })
    fs.cpSync(from, to, { recursive: true })
  }
  for (const rel of m.creates ?? []) fs.rmSync(P(rel), { recursive: true, force: true })
  // Anything written outside both lists would survive here, which is why the
  // pristine control is re-run at the end.
}

/** Never throws — the exit code is the datum, not an accident. */
const run = (script, args) => {
  try {
    const out = execFileSync(process.execPath, [path.join(SCRATCH, ...script), ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    return { status: 0, out, err: '' }
  } catch (e) {
    return { status: e.status ?? 1, out: e.stdout ?? '', err: e.stderr ?? String(e) }
  }
}

const runGate = () => run(['scripts', 'check.mjs'], ['--root', SCRATCH])
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
      result = { code: m.code, what: m.what, tripped: v.hit, exit: r.status, also: [], sample: v.sample, note: v.note ?? null, detail }
    } else {
      const r = runGate()
      const codes = codesIn(r.err)
      const hit = codes.includes(m.code)
      result = {
        code: m.code,
        what: m.what,
        tripped: hit && r.status !== 0,
        exit: r.status,
        also: codes.filter((c) => c !== m.code),
        // First line of the target code's finding, for the transcript.
        sample: (r.err.split('\n').find((l) => l.trim().startsWith(`${m.code}: `)) ?? '').trim(),
        note: hit && r.status === 0 ? 'code reported but the gate exited 0' : null,
      }
    }
  } catch (err) {
    result = { code: m.code, what: m.what, tripped: false, exit: null, also: [], sample: '', note: `mutation could not be applied: ${err?.message ?? err}` }
  }
  restore(m)
  rows.push(result)
  process.stdout.write(`  ${result.tripped ? 'TRIPPED    ' : 'NOT TRIPPED'}  ${result.code.padEnd(23)} ${result.what}\n`)
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

const codes = [...new Set(selected.map((m) => m.code))].sort()
const trippedCodes = new Set(rows.filter((r) => r.tripped).map((r) => r.code))
const unreachable = codes.filter((c) => !trippedCodes.has(c))

console.log(`\n  ${rows.filter((r) => r.tripped).length} of ${rows.length} mutations tripped their target`)
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
const dead = rows.filter((r) => !r.tripped)
let failed = false

if (dead.length) {
  console.error(`\n  ${dead.length} row(s) NOT TRIPPED:`)
  for (const r of dead) console.error(`    ${r.code.padEnd(23)} ${r.what}`)
  console.error(`  A row that stops tripping has stopped proving its branch, whether or not a sibling row shares its code.`)
  failed = true
}
if (unreachable.length) {
  console.error(`\n  ${unreachable.length} code(s) NOT DEMONSTRATED: ${unreachable.join(', ')}`)
  console.error(`  A code with no reachable failure path is decoration. Either the mutation is wrong or the branch is gone.`)
  failed = true
}
if (failed) process.exit(1)
console.log(`\n  OK — every row tripped its branch and every code has a reachable failure path`)
