/**
 * Bundle TypeScript to ESM and import it, so a check runs the real engine rather
 * than a copy of it.
 *
 * check.mjs is plain Node and cannot import TypeScript, so the modules a module
 * rule file declares in `tsModules` are bundled with the esbuild that vite
 * already depends on. No new dependency, and — the point — no second copy of the
 * maths. A check that reimplements the thing it is checking verifies its own
 * reimplementation and would pass a broken engine.
 *
 * Entry points are separate on purpose. DGIW's invariant I1 compares the pillar
 * scores the projection USED against pillar scores computed by calling scoring.ts
 * directly; sharing one bundle would make that comparison circular.
 *
 * OUTPUT LOCATION IS A CONSTRAINT, NOT A CONVENIENCE. It stays under the real
 * repo's node_modules even when --root points somewhere else, because layer.ts
 * pulls in `react` for its context, react is externalised, and Node resolves an
 * externalised import from the OUTPUT file's ancestors. An outdir in a scratch
 * tree outside node_modules fails to resolve it at import time. projection.ts
 * only ever calls the pure `layerShows`, so React is never executed.
 */
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { build as esbuildBuild } from 'esbuild'

/**
 * @param {string} outRoot  the REAL repo root (containing node_modules)
 * @param {string} srcRoot  the root entry paths are relative to (--root)
 * @param {Record<string,string>} specs  local name -> path relative to srcRoot
 * @returns {Promise<{ modules: Record<string,any>|null, error: string|null }>}
 *
 * Never throws. A load failure is returned, and every class that depends on the
 * load reports it under its OWN name — see the note in check.mjs. One esbuild
 * failure used to disable two DGIW classes while only one of them said so.
 */
export const loadTsModules = async (outRoot, srcRoot, specs) => {
  const names = Object.keys(specs)
  if (names.length === 0) return { modules: {}, error: null }

  let buildDir = null
  try {
    buildDir = fs.mkdtempSync(path.join(outRoot, 'node_modules', '.check-ts-'))
    await esbuildBuild({
      entryPoints: names.map((n) => path.join(srcRoot, specs[n])),
      bundle: true,
      format: 'esm',
      platform: 'node',
      outdir: buildDir,
      // esbuild names the output after the ENTRY's extension, so without this the
      // emitted file is projection.js and Node loads it as CommonJS and throws.
      outExtension: { '.js': '.mjs' },
      external: ['react'],
      logLevel: 'silent',
    })
    const modules = {}
    for (const n of names) {
      const base = path.basename(specs[n]).replace(/\.tsx?$/, '')
      modules[n] = await import(pathToFileURL(path.join(buildDir, `${base}.mjs`)).href)
    }
    return { modules, error: null }
  } catch (err) {
    return { modules: null, error: String(err?.message ?? err) }
  } finally {
    if (buildDir) fs.rmSync(buildDir, { recursive: true, force: true })
  }
}
