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
import { createHash } from 'node:crypto'

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

/**
 * ─── THE SAME HASH, FOR A SECOND READER ─────────────────────────────────────
 *
 * `harness.mjs::datasetFingerprint` / `datasetFingerprintOf` compute the exact
 * shape below — sha256 of each declared file, joined `path:hash` lines, sha256
 * of the joined text — for `capture.mjs`/`compare.mjs`'s golden baselines. D5
 * stage F1 needs the SAME algorithm, computed at BUILD TIME instead of at
 * capture time, and baked into the client bundle by
 * `scripts/vite-plugin-provenance-fingerprint.mjs` — so an artefact's provenance
 * record can name the dataset state it was generated from (`src/report/
 * provenance.ts`'s whole reason for existing).
 *
 * This is a second, small implementation of that hash rather than a shared
 * call into `harness.mjs`, on purpose: that file imports `{ createServer } from
 * 'vite'` and pulls in `dom-sink.mjs`, `spawnSync`-based locale pinning and the
 * whole golden artefact REGISTRY, none of which a Vite plugin computing one
 * hash at config time has any business loading. The five lines that actually do
 * the hashing are not the part D-010 was about — the DECLARED FILE SET is, and
 * that is not duplicated: both readers call `declaredFingerprintSources` /
 * `DGIW_DATA_DIR` / `SHARED_DATASETS` above, the one place that list is written
 * down. `scripts/provenance-drive.mjs` asserts this produces what a golden
 * capture would compute for the same declared list, so the two hashes cannot
 * silently diverge unnoticed either.
 */
function sha256Hex(buf) {
  return createHash('sha256').update(buf).digest('hex')
}

/** sha256 over an explicit, ordered list of repo-relative files. */
export function fingerprintOfSources(appRoot, sources) {
  const lines = sources.map((rel) => {
    const abs = path.join(appRoot, rel)
    return `${rel}:${fs.existsSync(abs) ? sha256Hex(fs.readFileSync(abs)) : 'MISSING'}`
  })
  return { sources, files: sources.length, sha256: sha256Hex(lines.join('\n')) }
}

/** sha256 over every `.json` in one directory (non-recursive) plus an explicit shared list — DGIW's shape. */
export function fingerprintOfDirectory(appRoot, dir, sharedRel = []) {
  const files = jsonFilesIn(appRoot, dir)
  const lines = files.map((rel) => `${rel}:${sha256Hex(fs.readFileSync(path.join(appRoot, rel)))}`)
  const shared = [...sharedRel].sort()
  for (const rel of shared) {
    const abs = path.join(appRoot, rel)
    if (!fs.existsSync(abs))
      throw new Error(`fingerprintOfDirectory: declared shared source ${rel} does not exist`)
    lines.push(`${rel}:${sha256Hex(fs.readFileSync(abs))}`)
  }
  return { dir, files: files.length + shared.length, ...(shared.length ? { shared } : {}), sha256: sha256Hex(lines.join('\n')) }
}

/**
 * One module's fingerprint, computed fresh from whatever is on disk right now —
 * the build-time value. THROWS on a module whose declaration cannot be
 * established (missing fixture, empty directory), same discipline as
 * `declaredFingerprintSources`: an un-established fingerprint must not be
 * silently reported as `null` and mistaken for "no dataset dependency".
 */
export function computeModuleFingerprint(module, appRoot) {
  if (module === 'dgiw') return fingerprintOfDirectory(appRoot, DGIW_DATA_DIR, SHARED_DATASETS)
  const fp = fixturePath(appRoot, module)
  if (!fs.existsSync(fp)) throw new Error(`scripts/golden/fixtures/${module}.json does not exist`)
  const fixture = JSON.parse(fs.readFileSync(fp, 'utf8'))
  const sources = declaredFingerprintSources(module, appRoot, fixture)
  return fingerprintOfSources(appRoot, sources)
}
