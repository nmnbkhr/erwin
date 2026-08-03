/**
 * Vite plugin: bakes a build-time dataset fingerprint per module into the
 * client bundle, via Vite's `define`.
 *
 * ─── WHY THIS EXISTS ─────────────────────────────────────────────────────────
 *
 * `src/report/provenance.ts` records, per generated artefact, the dataset
 * fingerprint of the module that produced it — so a client asking "what data
 * was this report built from" gets a real answer, not a guess. The fingerprint
 * has to be a hash of SOURCE BYTES on disk (exactly what
 * `scripts/golden/harness.mjs::datasetFingerprint` computes for a golden
 * baseline), and the browser never holds those: by the time a JSON dataset
 * reaches client code it has been parsed and possibly reordered by the
 * bundler, so a runtime `crypto.subtle.digest()` over it could never equal the
 * Node-side hash and the two could never be compared against each other. This
 * plugin computes the real thing, in Node, once — at dev-server start or at
 * `vite build` — and injects it as a plain object literal.
 *
 * `define` performs a raw textual substitution, so the injected identifier
 * (`__PROVENANCE_FINGERPRINT__`) must be read defensively wherever it is
 * referenced: `scripts/golden/harness.mjs` boots its OWN bare Vite server
 * (`configFile: false`) for golden capture/compare and never loads this
 * plugin, so the identifier is genuinely undefined in that process. See
 * `src/report/provenance.ts`'s own header and its `typeof` guard.
 *
 * ─── BUILD VS DEV ────────────────────────────────────────────────────────────
 *
 * `npm run build` runs `node scripts/check.mjs` first, and FINGERPRINT-COVERAGE
 * already fails the whole build if a module's fixture cannot be read — so by
 * the time `vite build` reaches this plugin, every fixture is guaranteed
 * present, and a throw here would mean that guarantee broke and should stop
 * the build outright. `vite dev` has no such gate in front of it; a
 * contributor mid-refactor with a temporarily broken fixture should still get
 * a working dev server, with that one module's fingerprint recording as `null`
 * rather than crashing on every keystroke.
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { FINGERPRINTED_MODULES, computeModuleFingerprint } from './golden/fingerprint-decl.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
/** `baiw/` — this file lives in `scripts/`, one level below the app root. */
const APP_ROOT = path.resolve(HERE, '..')

export function provenanceFingerprintPlugin() {
  return {
    name: 'godaitec-provenance-fingerprint',
    config(_config, env) {
      const fingerprints = {}
      for (const module of FINGERPRINTED_MODULES) {
        try {
          fingerprints[module] = computeModuleFingerprint(module, APP_ROOT)
        } catch (err) {
          if (env.command === 'build') {
            throw new Error(
              `provenanceFingerprintPlugin: could not compute ${module}'s dataset fingerprint during \`vite build\` ` +
                `— \`node scripts/check.mjs\` (which npm run build runs first) should already have failed on this: ${err.message}`,
            )
          }
          console.warn(`[provenance-fingerprint] ${module}: ${err.message} — recording null for this dev session`)
          fingerprints[module] = null
        }
      }
      return { define: { __PROVENANCE_FINGERPRINT__: JSON.stringify(fingerprints) } }
    },
  }
}
