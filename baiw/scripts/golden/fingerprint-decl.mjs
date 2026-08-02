/**
 * WHAT A MODULE'S DATASET FINGERPRINT DECLARES — one declaration, two readers.
 *
 * ─── WHY THIS FILE EXISTS ───────────────────────────────────────────────────
 *
 * `harness.mjs::fingerprintFor` computes the `datasets` field every baseline
 * records. `check/suite/fingerprint-coverage.mjs` asserts that the set covers
 * every JSON file the module's generators actually read. Those two need the SAME
 * answer to "what does this module's fingerprint declare", and the gate cannot
 * get it by importing `harness.mjs` — that pulls in Vite and would add seconds to
 * a check that runs in two.
 *
 * So the declaration lives here, in a file with no dependency beyond `node:fs`,
 * and both sides import it. The alternative — the gate carrying its own copy of
 * the union rule — is the shape this repo has been burned by repeatedly: capture
 * and compare each held their own `module === 'dgiw' ? … : null` until D-010, and
 * the `null` half was the bug.
 *
 * ─── THE TWO SHAPES, AND WHY THEY DIFFER ────────────────────────────────────
 *
 * DGIW reads live data, so its fingerprint is a DIRECTORY HASH plus an explicit
 * list of files read from outside that directory. A new dataset dropped into
 * `src/dgiw/data/` is covered by existing, which is right for a module whose
 * baselines describe live production data.
 *
 * BAIW, TAIW and HAIW freeze their datasets into the fixture, so their
 * fingerprint is over the LIVE files that frozen content came from — the `data`
 * block's own keys (which are repo-relative paths, so the freeze is
 * self-declaring) plus a `dataSources` array for content the fixture freezes
 * outside that block. Full reasoning in `harness.mjs::fixtureDataSources`.
 *
 * ─── THE FAILURE THIS EXISTS TO MAKE VISIBLE ────────────────────────────────
 *
 * A generator reading a file the fingerprint does not cover means a dataset edit
 * moves what the client reads while every baseline still reports `stable`. That
 * is D-010, and it has happened twice by the same route — a file moving out from
 * under a fingerprint while the code kept reading it:
 *
 *   `frameworks.json` left `src/dgiw/data/` in D5 stage B and `projection.ts`
 *   kept importing it. Covering only the directory would have shrunk DGIW's
 *   fingerprint from eleven files to ten and made a DMBOK edit invisible to all
 *   fourteen DGIW baselines. SHARED_DATASETS is the fix, and a human caught it.
 *
 * Under-declaring is the defect. OVER-declaring is safe: it hashes a file nobody
 * reads, which costs a spurious `source datasets` finding at worst and never
 * hides a real change. The check is asymmetric for exactly that reason.
 */
import fs from 'node:fs'
import path from 'node:path'

/**
 * The modules that record a `datasets` fingerprint per baseline.
 *
 * Mirrors `harness.mjs::MODULES`. Kept here rather than imported from there
 * because that import is the Vite one this file exists to avoid — and asserted
 * against it, so the two cannot silently diverge (see `assertModulesMatch`).
 */
export const FINGERPRINTED_MODULES = Object.freeze(['baiw', 'taiw', 'haiw', 'dgiw'])

/**
 * Files DGIW's generators read from outside `src/dgiw/data/`.
 *
 * Named in the fingerprint output, not just folded into the hash: a reader
 * comparing two baselines has to be able to see WHICH files it claims to cover,
 * or the number is just a number that changed.
 */
export const SHARED_DATASETS = Object.freeze(['src/frameworks/data/frameworks.json'])

/** The directory whose every `.json` DGIW's fingerprint hashes. */
export const DGIW_DATA_DIR = 'src/dgiw/data'

/**
 * The LIVE files a frozen fixture's data came from: the `data` block's own keys
 * plus any `dataSources` it declares for content frozen outside that block.
 *
 * @returns repo-relative paths, sorted, deduplicated.
 */
export function fixtureDataSources(fixture) {
  return [...new Set([...Object.keys(fixture.data ?? {}), ...(fixture.dataSources ?? [])])].sort()
}

/**
 * `dir/*.json`, repo-relative, sorted — NON-recursive, matching
 * `harness.mjs::datasetFingerprint`, which uses a flat `readdirSync` filter.
 *
 * If that ever becomes recursive the two must move together, which is the whole
 * reason this is one function in one file.
 */
export function jsonFilesIn(appRoot, dir) {
  const abs = path.join(appRoot, dir)
  if (!fs.existsSync(abs)) return []
  return fs
    .readdirSync(abs)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => `${dir}/${f}`)
}

/** Where a fixture lives, given a root. Used by both the harness and the gate. */
export const fixturePath = (appRoot, module) => path.join(appRoot, 'scripts', 'golden', 'fixtures', `${module}.json`)

/**
 * Every repo-relative file this module's recorded fingerprint hashes.
 *
 * THROWS rather than returning an empty set when a module declares nothing: a
 * fingerprint over no files records `datasets: null`, `diffCommon`'s check is
 * guarded on that field being truthy, and the module silently loses the signal
 * entirely. That is D-010's blind spot restated, and it must not be a shrug.
 */
export function declaredFingerprintSources(module, appRoot, fixture) {
  if (module === 'dgiw') {
    const dir = jsonFilesIn(appRoot, DGIW_DATA_DIR)
    if (dir.length === 0)
      throw new Error(
        `${DGIW_DATA_DIR} contains no .json — datasetFingerprint() returns null for an empty directory, so every DGIW ` +
          `baseline would record \`datasets: null\` and a dataset edit would be invisible to compare.mjs.`,
      )
    return [...dir, ...SHARED_DATASETS].sort()
  }
  const sources = fixtureDataSources(fixture ?? {})
  if (sources.length === 0)
    throw new Error(
      `fixture ${module}.json declares neither a \`data\` block nor \`dataSources\`, so its baselines would record ` +
        `\`datasets: null\` and a live dataset edit would be invisible to compare.mjs — which is D-010. Declare the ` +
        `files this fixture's frozen content comes from.`,
    )
  return sources
}

/**
 * The file to go and edit when a generator reads something undeclared.
 *
 * A finding that names the defect without naming the edit sends the reader
 * looking, and this declaration is in a genuinely surprising place — the fixture,
 * not the module's rule file, because for the three freezing modules the frozen
 * `data` block IS the declaration.
 */
export const declarationSite = (module) =>
  module === 'dgiw'
    ? `scripts/golden/fingerprint-decl.mjs (SHARED_DATASETS) — or move the file under ${DGIW_DATA_DIR}/, which the directory hash already covers`
    : `scripts/golden/fixtures/${module}.json (\`dataSources\`) — declaring is enough, it does not freeze the file`

/**
 * Assert this file's module list still matches the harness's.
 *
 * Called from `harness.mjs`, where `MODULES` lives. A list duplicated for a
 * performance reason is still a list duplicated; this makes the divergence a
 * throw at capture time rather than a module the gate quietly stops checking.
 */
export function assertModulesMatch(harnessModules) {
  const a = [...FINGERPRINTED_MODULES].sort().join(',')
  const b = [...harnessModules].sort().join(',')
  if (a !== b)
    throw new Error(
      `fingerprint-decl.mjs FINGERPRINTED_MODULES (${a}) disagrees with harness.mjs MODULES (${b}). ` +
        `FINGERPRINT-COVERAGE checks the modules named here, so a module present only in the harness would record a ` +
        `fingerprint nothing verifies the coverage of.`,
    )
}
