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
 *              code is unreachable. Both are worth knowing and both exit 1 here.
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

const DGIW = 'src/dgiw/data'
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
    touches: [`${DGIW}/frameworks.json`],
    apply: () => json(`${DGIW}/frameworks.json`, (fw) => {
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
      const fw = readJson(`${DGIW}/frameworks.json`)
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
    code: 'FRAMEWORK-COVERAGE',
    what: 'a framework whose every mapping is banking-tagged — blank scorecard under core (the rule D3 added)',
    touches: [`${DGIW}/crosswalk.json`],
    apply: () => {
      const fw = readJson(`${DGIW}/frameworks.json`)
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
  {
    code: 'PROJECTION-INVARIANT',
    what: 'projection.ts unbuildable — the invariants cannot run',
    touches: ['src/dgiw/projection.ts'],
    apply: () => sub('src/dgiw/projection.ts', 'export', 'this is not valid typescript export'),
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

if (unreachable.length) {
  console.error(`\n  ${unreachable.length} code(s) NOT DEMONSTRATED: ${unreachable.join(', ')}`)
  console.error(`  A code with no reachable failure path is decoration. Either the mutation is wrong or the branch is gone.`)
  process.exit(1)
}
console.log(`\n  OK — every code has a reachable failure path`)
