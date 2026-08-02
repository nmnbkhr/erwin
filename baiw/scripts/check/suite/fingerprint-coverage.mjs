/**
 * FINGERPRINT-COVERAGE — every dataset a generator reads is inside the fingerprint
 * that module's baselines record.
 *
 * ─── THE DEFECT ─────────────────────────────────────────────────────────────
 *
 * A baseline records a `datasets` fingerprint so that a dataset edit surfaces as
 * its own finding instead of leaving a spine edit holding the blame. If a
 * generator reads a file the fingerprint does not hash, the signal is simply
 * absent: the edit changes what the client reads and `compare.mjs` still prints
 * `stable`. That is D-010, and it is not hypothetical — `benchmarks.json`'s
 * `regionalLeaders["Overall Assessment"]` went 3.18 → 3.3, page 16 of every BAIW
 * report moved from "0.4 levels behind regional leaders" to 0.5, and the golden
 * record printed `exit 0 — no actionable differences`.
 *
 * ─── WHY A CHECK AND NOT CARE ───────────────────────────────────────────────
 *
 * THE PATTERN HAS FAILED TWICE AND A HUMAN CAUGHT IT BOTH TIMES.
 *
 *   D5 stage B  `frameworks.json` left `src/dgiw/data/` while `projection.ts`
 *               kept importing it. DGIW's fingerprint was the directory, so the
 *               move silently shrank it from eleven files to ten. Caught, and
 *               fixed with SHARED_DATASETS.
 *   D5 stage E3 `crosswalk.json` is about to be read by a TAIW/HAIW generator
 *               while neither module's fingerprint declares it. Caught in
 *               advance, which is why this class exists before the generator.
 *
 * Both are the same event: a file the fingerprint does not cover becoming, or
 * already being, a file a generator reads. Nothing measured it, in a repo whose
 * standing rule is that a class which cannot fail is decoration.
 *
 * ─── THE ASYMMETRY IS DELIBERATE ────────────────────────────────────────────
 *
 *   imported, not declared    FAIL. This is the defect: an invisible edit.
 *   declared, not imported    REPORTED. Hashing a file nobody reads costs a
 *                             spurious `source datasets` finding at worst, and
 *                             never hides a real change.
 *
 * The second direction has three legitimate producers today, which is why it is
 * not a failure and why the count is printed rather than hidden:
 *
 *   - HAIW freezes `capabilities` and `questions` OUTSIDE the `data` block and
 *     passes them to the generator as parameters (CLAUDE.md: hacrQuestions.json is
 *     1.18 MB and stays out of the report chunk). The generator therefore imports
 *     neither, and both must still be fingerprinted — the whole point of
 *     `dataSources`.
 *   - DGIW's fingerprint is a DIRECTORY hash. `ladder.json` and `positioning.json`
 *     live there and no report reads them. Narrowing the hash to what the
 *     generators import would reopen stage B's hole for the next file to move in.
 *   - A pre-emptive declaration, which is what E1 does for `crosswalk.json`:
 *     declared now, read by a generator in E3, so the fingerprint is right on the
 *     commit that starts reading it rather than one stage later.
 *
 * ─── RESOLUTION IS TRANSITIVE, AND THAT IS NOT OPTIONAL ─────────────────────
 *
 * Measured before it was written: three of DGIW's nine dataset reads are reachable
 * ONLY through a binding.
 *
 *   src/dgiw/data/crosswalk.json      frameworkAlignment.ts → projection.ts
 *   src/frameworks/data/frameworks.json  frameworkAlignment.ts → projection.ts
 *   src/dgiw/data/operatingModel.json    cdeRegister.ts → roles.ts
 *
 * A direct-imports-only check would report `stable` over a third of DGIW's
 * surface — including the exact file whose relocation is one of the two failures
 * above. It would also have been indistinguishable from a working check, because
 * the other six resolve directly.
 *
 * ─── FAIL, NEVER SKIP ───────────────────────────────────────────────────────
 *
 * An import this cannot resolve FAILS. A relative specifier that resolves to
 * nothing, a `import(\`…${x}…\`)` template string, a resolved extension this does
 * not handle: each is a path along which a dataset read could hide, and a check
 * that shrugs at one is a check whose green means "I did not look". Same rule as
 * ARTEFACT-IMPL's unresolvable `createReport` — unverifiable is not acceptable.
 *
 * TYPE-ONLY IMPORTS ARE NOT FOLLOWED. `import type { X } from './y'` is erased at
 * compile time and reads nothing at runtime, so following it would attribute
 * `y`'s datasets to a generator that never loads them — a false FAIL, which
 * teaches people to route around the check. Both forms are detected: the clause
 * marker (`import type {…}`) and an all-specifiers-type-only clause
 * (`import { type A, type B }`).
 *
 * ─── WHAT IT DOES NOT CHECK ─────────────────────────────────────────────────
 *
 * That the RECORDED baselines agree with the declaration. This class reads the
 * declaration — the fixture and `SHARED_DATASETS` — so it answers "will the next
 * capture cover what the generators read". Whether the baselines on disk were
 * captured before the declaration moved is `compare.mjs`'s job, and it reports it
 * under `source datasets`. Two tools, two questions; neither implies the other.
 */
import fs from 'node:fs'
import path from 'node:path'
import { ts, parseFile } from '../lib/ts-ast.mjs'
import {
  FINGERPRINTED_MODULES,
  declaredFingerprintSources,
  declarationSite,
  fixturePath,
} from '../../golden/fingerprint-decl.mjs'

/** Resolved extensions that are code to walk into. */
const CODE = /\.tsx?$/
/**
 * Resolved extensions that are neither code nor data.
 *
 * Listed rather than defaulted: an extension nobody thought about FAILS below, so
 * adding an asset type to the report path is a decision someone writes down.
 */
const ASSET = /\.(css|svg|png|jpe?g|gif|webp|woff2?|ttf|eot|txt|md)$/

/** Node-style resolution for a relative specifier, in TypeScript's own order. */
const candidates = (base) => [base, `${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts'), path.join(base, 'index.tsx')]

const resolveRelative = (fromAbs, spec) => {
  const base = path.resolve(path.dirname(fromAbs), spec)
  for (const c of candidates(base)) if (fs.existsSync(c) && fs.statSync(c).isFile()) return c
  return null
}

/**
 * True when this import declaration contributes nothing at runtime.
 *
 * `import type {…}` is the marked form. `import { type A }` is the same thing
 * spelled per specifier, and a clause whose every named binding is type-only —
 * with no default and no namespace binding — is equally erased.
 */
const isTypeOnlyImport = (node) => {
  const clause = node.importClause
  if (!clause) return false // `import './side-effect'` — runtime, and can pull data
  if (clause.isTypeOnly) return true
  if (clause.name) return false // a default binding is a value
  const named = clause.namedBindings
  if (!named || !ts.isNamedImports(named)) return false // namespace import is a value
  return named.elements.length > 0 && named.elements.every((el) => el.isTypeOnly)
}

/** Every module specifier this file pulls in at runtime, with its node for locating. */
const runtimeSpecifiers = (sf) => {
  const out = []
  const visit = (node) => {
    if (ts.isImportDeclaration(node)) {
      if (!isTypeOnlyImport(node) && ts.isStringLiteralLike(node.moduleSpecifier))
        out.push({ spec: node.moduleSpecifier.text, node })
    } else if (ts.isExportDeclaration(node) && node.moduleSpecifier) {
      // `export * from './x'` / `export { v } from './x'` re-export a value and
      // therefore load x. `export type { T } from './x'` does not.
      if (!node.isTypeOnly && ts.isStringLiteralLike(node.moduleSpecifier))
        out.push({ spec: node.moduleSpecifier.text, node })
    } else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      const arg = node.arguments[0]
      // A template-string dynamic import is the TAIW/HAIW loader idiom
      // (`/* @vite-ignore */`). Statically unresolvable, so it fails rather than
      // being skipped — see the header.
      out.push({ spec: arg && ts.isStringLiteralLike(arg) ? arg.text : null, node, dynamic: true })
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)
  return out
}

export default {
  code: 'FINGERPRINT-COVERAGE',

  run(ctx) {
    const { root, fail, modules, sourceLocations } = ctx

    /*
     * Entry points per declaring module, from REPORT-SOURCES' resolved set.
     *
     * `loc.files` is attached there rather than recomputed here: two walks of the
     * same declared locations could disagree about what resolved, and the printed
     * REPORT-SOURCES count would then describe a different set from the one this
     * class measured.
     */
    const rootsByOwner = new Map()
    for (const loc of sourceLocations ?? []) {
      if (!Array.isArray(loc.files)) continue // REPORT-SOURCES already failed on it, by name
      rootsByOwner.set(loc.owner, [...(rootsByOwner.get(loc.owner) ?? []), ...loc.files])
    }

    /*
     * Shared report code — the spine — belongs to every module's traversal.
     *
     * `src/report/` is declared by `_spine`, which records no fingerprint of its
     * own, and every generator in the suite goes through it. A JSON import added
     * there would be read by all four modules, so all four must declare it. The
     * spine imports no JSON today; including it costs nothing and means the answer
     * does not depend on that staying true.
     */
    const sharedRoots = [...rootsByOwner]
      .filter(([owner]) => !FINGERPRINTED_MODULES.includes(owner))
      .flatMap(([, files]) => files)

    const perModule = []
    let examined = 0

    for (const mod of modules) {
      if (!FINGERPRINTED_MODULES.includes(mod.id)) continue

      const own = rootsByOwner.get(mod.id) ?? []
      const roots = [...own, ...sharedRoots]

      if (roots.length === 0) {
        // Unverifiable, not passing. A module whose generators cannot be located
        // has had its fingerprint coverage checked exactly as much as one nobody
        // wrote a check for.
        fail(
          `${mod.id} records a dataset fingerprint but no declared report source resolved for it, so the set of datasets ` +
            `its generators read could not be established — this module's coverage is unverified, not clean ` +
            `(declare a reportSources entry in modules/${mod.id}.mjs, or see the REPORT-SOURCES findings above)`,
        )
        perModule.push({ id: mod.id, imported: 0, declared: 0, unverified: true })
        continue
      }

      // rel -> the chain of files through which a generator reaches it.
      const reached = new Map()
      const seen = new Set()

      const walk = (abs, chain) => {
        if (seen.has(abs)) return
        seen.add(abs)
        const { sf } = parseFile(root, abs)
        const here = [...chain, path.relative(root, abs)]

        for (const { spec, node, dynamic } of runtimeSpecifiers(sf)) {
          const at = `${path.relative(root, abs)}:${sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1}`

          if (spec === null) {
            fail(
              `${at} ${mod.id}'s generator set reaches a dynamic import whose specifier is not a string literal — a ` +
                `template-string import can name any dataset in the tree, so this cannot establish what the module reads. ` +
                `An unresolvable read is unverifiable, not acceptable: give it a literal specifier, or move the load ` +
                `behind a module that has one.`,
            )
            continue
          }
          // Bare specifier — node_modules. Not a repo dataset, and not something a
          // fingerprint over src/ is meant to cover.
          if (!spec.startsWith('.')) continue

          const abs2 = resolveRelative(abs, spec)
          if (abs2 === null) {
            fail(
              `${at} ${mod.id}'s generator set imports ${JSON.stringify(spec)}, which resolves to no file — so whatever ` +
                `it reads cannot be checked against the fingerprint. Either the path is stale or this check's resolution ` +
                `is missing a form; both are findings.`,
            )
            continue
          }

          const rel = path.relative(root, abs2)
          if (rel.endsWith('.json')) {
            if (!reached.has(rel)) reached.set(rel, here)
          } else if (CODE.test(rel)) {
            walk(abs2, here)
          } else if (!ASSET.test(rel)) {
            fail(
              `${at} ${mod.id}'s generator set imports ${JSON.stringify(spec)}, resolving to ${rel}, whose extension this ` +
                `check does not handle — it is neither code to walk into nor a declared asset type, so a dataset read ` +
                `could hide behind it. Add the extension to CODE or ASSET in this file, deliberately.`,
            )
          }
        }
      }
      for (const r of roots) walk(r, [])

      let declared
      try {
        const fp = fixturePath(root, mod.id)
        const fixture = fs.existsSync(fp) ? JSON.parse(fs.readFileSync(fp, 'utf8')) : null
        if (mod.id !== 'dgiw' && fixture === null)
          throw new Error(`scripts/golden/fixtures/${mod.id}.json does not exist, so nothing declares what its baselines hash`)
        declared = declaredFingerprintSources(mod.id, root, fixture)
      } catch (err) {
        fail(`${mod.id}'s fingerprint declaration could not be read, so its coverage is unverified: ${err?.message ?? err}`)
        perModule.push({ id: mod.id, imported: reached.size, declared: 0, unverified: true })
        examined += reached.size
        continue
      }

      const declaredSet = new Set(declared)
      for (const [rel, chain] of [...reached].sort()) {
        if (declaredSet.has(rel)) continue
        fail(
          `${mod.id} reads ${rel} but no fingerprint declares it — reached via ${chain.join(' → ')}. An edit to that file ` +
            `moves what the generator renders while every ${mod.id} baseline still records the same \`datasets\` hash and ` +
            `compare.mjs prints \`stable\`, which is D-010. Declare it in ${declarationSite(mod.id)}.`,
        )
      }

      examined += reached.size
      perModule.push({
        id: mod.id,
        imported: reached.size,
        declared: declared.length,
        // Reported, never failed — see the header for the three legitimate producers.
        overDeclared: declared.filter((rel) => !reached.has(rel)),
      })
    }

    /*
     * Zero fingerprinted modules in scope means this class measured nothing. Under
     * `--module coe` that is legitimate and the runner's VACUOUS rule would flag
     * it, so say which case it is rather than letting `examined: 0` stand alone.
     */
    if (perModule.length === 0 && (modules ?? []).length > 0)
      fail(
        `no registry entry in scope records a dataset fingerprint — FINGERPRINT-COVERAGE examined nothing, so no module's ` +
          `dataset reads were checked against its baselines' hash (expected one of ${FINGERPRINTED_MODULES.join(', ')})`,
      )

    return { examined, perModule }
  },
}
