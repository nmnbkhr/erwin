#!/usr/bin/env node
/**
 * Drive POLICY-ENFORCEMENT and POLICY-AUTHORED, which the gate cannot run.
 *
 * ─── WHY THIS EXISTS ───────────────────────────────────────────────────────
 *
 * `src/dgiw/data/policies.json` does not exist, so both classes are written and
 * neither is in `modules/dgiw.mjs`'s `checks` array — a class over an empty set
 * is a VACUOUS failure. That leaves them in exactly the state CLAUDE.md warns
 * about: "a class that cannot fail is decoration", and FRAMEWORK-COVERAGE sat in
 * that state for a whole phase while this file's ancestor called it a guard.
 *
 * `check/selftest.mjs` is the standing answer to that, and it cannot help here
 * either — it mutates a dataset that is not there. So this is the interim
 * instrument, in `dashboard-drive.mjs`'s and `provenance-drive.mjs`'s style: it
 * builds a policy set in memory, runs both classes over it, and shows every
 * branch failing on its own mutation and the clean set passing.
 *
 * It is DELETED, not kept, when `policies.json` lands: at that point the two
 * classes join `checks`, `POLICY_SELFTEST_ROWS` is spread into `MUTATIONS`, and
 * `npm run check:selftest` proves the same eight branches against the real data
 * with a stronger assertion than this makes. Carrying both would be a second
 * copy of a matrix, which is the duplication this repo keeps paying for.
 *
 * ─── THE FIXTURE CONTAINS NO AUTHORED POLICY TEXT, DELIBERATELY ────────────
 *
 * Not one sentence here was written for this file. Each probe policy's statement
 * IS `operatingModel.principles[i].statement`, already in the repo and already
 * reviewed, and its title is that principle's title. Two reasons, and the second
 * is the one that matters:
 *
 *   - A policy set goes to a bank's legal head. A plausible draft sitting in a
 *     harness is one copy-paste from being mistaken for the real thing, and
 *     "dead content that becomes live on repair" is the D-008 shape. A probe
 *     whose statements are visibly the governance principles cannot be mistaken
 *     for a policy set by anyone who opens it.
 *   - The principles are the corpus POLICY-AUTHORED's floors were MEASURED from
 *     (100.0% distinct openings, 0.124 length CV, 100.0% stem reduction). So the
 *     pass case is not a fixture tuned until it went green — it is the exact
 *     population the thresholds were declared against, which is the only pass
 *     case that demonstrates anything.
 *
 * Ids in `enforcedBy` are real ids read out of the live datasets, never invented.
 *
 *   node scripts/policy-drive.mjs          # the matrix
 *   node scripts/policy-drive.mjs --verbose # every finding in full
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { policyEnforcement, policyAuthored, POLICY_SELFTEST_ROWS } from './check/lib/policies.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.resolve(HERE, '..')
const D = path.join(REPO, 'src/dgiw/data')
const J = (f) => JSON.parse(fs.readFileSync(path.join(D, f), 'utf8'))

const VERBOSE = process.argv.includes('--verbose')

const om = J('operatingModel.json')
const pillars = J('pillars.json')
const rules = J('dqRules.json')
const prog = J('programSetup.json')

const C = { R: '\x1b[31m', G: '\x1b[32m', Y: '\x1b[33m', D: '\x1b[2m', B: '\x1b[1m', X: '\x1b[0m' }
const paint = (c, s) => `${c}${s}${C.X}`

/* ── the probe set ──────────────────────────────────────────────────────────
 *
 * Seven policies, one per principle, carrying that principle's own title and
 * statement. Every id, ref and owner below is read from the live datasets.
 */
const stepIds = prog.flows.flatMap((f) => f.steps.map((s) => s.id))
const ruleIds = (Array.isArray(rules) ? rules : rules.rules).map((r) => r.id)
const coreOwner = om.roleRegistry.find((r) => r.layer === 'core').name
const corePillars = pillars.map((p) => p.id)

const baseline = () => ({
  policies: om.principles.map((pr, i) => ({
    id: `POL-${String(i + 1).padStart(2, '0')}`,
    title: pr.title,
    statement: pr.statement,
    pillarId: corePillars[i % corePillars.length],
    principleRef: pr.id,
    owner: coreOwner,
    // Rotated across the three resolvable kinds plus one external, so every
    // branch of the ref resolver is exercised by the clean set too.
    enforcedBy:
      i % 4 === 3
        ? [{ kind: 'external', ref: 'HR joiners-movers-leavers process', note: 'probe fixture — an external control resolves against no dataset in this repo, which is why the note is mandatory' }]
        : i % 4 === 0
          ? [{ kind: 'dqRule', ref: ruleIds[i] }]
          : i % 4 === 1
            ? [{ kind: 'gate', ref: om.gates[i % om.gates.length].id }]
            : [{ kind: 'activity', ref: stepIds[i] }],
    exceptionPolicy: `probe fixture — not authored text; see this file's header`,
    reviewCycle: 'Annual',
    layer: 'core',
  })),
})

/* ── a ctx the two classes can run against ──────────────────────────────── */
const runClass = (check, policies) => {
  const found = []
  const ctx = {
    data: { policies, om, rules, prog },
    state: { pillarIds: new Set(corePillars) },
    results: {},
    fail: (msg) => found.push([check.code, msg]),
    failAs: (code, msg) => found.push([code, msg]),
  }
  let res, threw = null
  try {
    res = check.run(ctx)
  } catch (err) {
    threw = String(err?.message ?? err)
  }
  return { found, res, threw }
}

/** The `h` helper POLICY_SELFTEST_ROWS is written against, applied in memory. */
const inMemory = (doc) => ({ json: (_rel, fn) => fn(doc) })

console.log(paint(C.B, '\npolicy-drive — the two classes the gate cannot run\n'))

// ── 1. the clean set must PASS both ────────────────────────────────────────
console.log(paint(C.B, 'CONTROL — the probe set, statements taken verbatim from operatingModel.principles'))
let controlClean = true
for (const check of [policyEnforcement, policyAuthored]) {
  const { found, res, threw } = runClass(check, baseline())
  const ok = !threw && found.length === 0
  controlClean &&= ok
  console.log(
    `  ${check.code.padEnd(20)} ${ok ? paint(C.G, 'PASS') : paint(C.R, 'FAIL')}` +
      `  examined ${res?.examined ?? '-'}` +
      (check.code === 'POLICY-AUTHORED' && res
        ? `  openings ${(res.openingShare * 100).toFixed(1)}%  lenCV ${res.cv.toFixed(3)}${res.cvAsserted ? '' : ' (not asserted)'}  stem ${(res.stemShare * 100).toFixed(1)}%`
        : '') +
      (check.code === 'POLICY-ENFORCEMENT' && res
        ? `  ${res.policies - res.unenforced.length}/${res.policies} enforced  ${Object.entries(res.byKind).map(([k, n]) => `${k} ${n}`).join(', ')}`
        : ''),
  )
  for (const [code, msg] of found) console.log(`      ${paint(C.R, code)} ${msg.slice(0, 160)}`)
  if (threw) console.log(`      ${paint(C.R, 'THREW')} ${threw}`)
}

// A pass case that passes for the wrong reason proves nothing. The margin on the
// length-CV branch is 0.124 against a floor of 0.12 — three per cent — and that
// is stated rather than left for someone to discover the day it flips.
console.log(paint(C.D, '  the length-CV branch clears its floor by ~3%: the floor was declared FROM this corpus,'))
console.log(paint(C.D, '  so there is no headroom by construction. Read it as a tripwire for CV -> 0, not a discriminator.\n'))

// ── 2. every branch must FAIL on its own mutation ──────────────────────────
console.log(paint(C.B, 'MUTATIONS — each targets one branch and no other'))
let tripped = 0
const missed = []
for (const row of POLICY_SELFTEST_ROWS) {
  const doc = baseline()
  let applyError = null
  try {
    row.apply(inMemory(doc))
  } catch (err) {
    applyError = String(err?.message ?? err)
  }
  const all = []
  for (const check of [policyEnforcement, policyAuthored]) {
    const { found, threw } = runClass(check, doc)
    all.push(...found)
    if (threw) all.push(['THREW', threw])
  }
  const codes = new Set(all.map(([c]) => c))
  const hit = codes.has(row.code) && !applyError
  if (hit) tripped++
  else missed.push(row)
  const also = [...codes].filter((c) => c !== row.code)
  console.log(
    `  ${(hit ? paint(C.G, 'TRIPPED') : paint(C.R, 'NOT TRIPPED')).padEnd(20)} ${row.code.padEnd(20)} ${row.what}` +
      (also.length ? paint(C.Y, `  +also ${also.join(', ')}`) : ''),
  )
  if (applyError) console.log(`      ${paint(C.R, 'MUTATION FAILED TO APPLY')} ${applyError}`)
  if (VERBOSE) for (const [code, msg] of all) console.log(paint(C.D, `      ${code}: ${msg}`))
}

// ── verdict ────────────────────────────────────────────────────────────────
const codes = new Set(POLICY_SELFTEST_ROWS.map((r) => r.code))
const demonstrated = new Set(missed.length ? POLICY_SELFTEST_ROWS.filter((r) => !missed.includes(r)).map((r) => r.code) : codes)
console.log()
console.log(paint(C.B, 'summary'))
console.log(`  control            ${controlClean ? paint(C.G, 'both classes PASS over the clean set') : paint(C.R, 'the clean set did NOT pass — the fixture or a threshold is wrong')}`)
console.log(`  mutations          ${tripped} of ${POLICY_SELFTEST_ROWS.length} tripped`)
console.log(`  codes              ${demonstrated.size} of ${codes.size} distinct codes demonstrated (${[...codes].join(', ')})`)
for (const m of missed) console.log(`  ${paint(C.R, 'NOT TRIPPED')} ${m.code} — ${m.what}`)

// Both halves are asserted, for the reason D5 stage H recorded: a matrix that
// checks only "every code was demonstrated" lets a dead row exit 0 behind a
// sibling sharing its code, and seven of these eight rows have a sibling.
const ok = controlClean && tripped === POLICY_SELFTEST_ROWS.length && demonstrated.size === codes.size
console.log()
if (!ok) {
  console.log(paint(C.R, '  exit 1') + ' — a branch is unreachable, or the clean set does not pass.')
  process.exit(1)
}
console.log(paint(C.G, '  exit 0') + ' — every branch reachable, and the corpus the floors were declared from passes.')
console.log(paint(C.D, '  NOT a substitute for check:selftest. This drives an in-memory fixture; it does not prove'))
console.log(paint(C.D, '  the classes are wired into the gate, because they are not. Delete this file when they are.'))
