/**
 * Dataset loading, from a module's declared `dataDir` + `datasets`.
 *
 * The suite puts datasets in two places — src/data/<module>/ for BAIW, TAIW,
 * HAIW and COE, src/<module>/data/ for ALM and DGIW. That inconsistency is real
 * and CLAUDE.md says to follow whichever a module already uses, so it is absorbed
 * here once: each rule file states its own `dataDir` and no check has to know the
 * rule.
 *
 * A declared file that does not exist or does not parse is a REGISTRY finding,
 * never a skip. Same principle as REPORT-SOURCES: a gate that quietly runs over
 * less than it claims is worse than no gate.
 */
import fs from 'node:fs'
import path from 'node:path'

/**
 * @returns {{ data: Record<string, any>, files: number }} `data` carries only the
 * datasets that loaded; a check reading a missing one gets undefined and will
 * throw, which the runner reports under that check's own code.
 */
export const loadDatasets = (root, mod, fail) => {
  const specs = Object.entries(mod.datasets ?? {})
  if (specs.length === 0) return { data: {}, files: 0 }

  if (!mod.dataDir) {
    fail('REGISTRY', `module ${mod.id} declares ${specs.length} dataset(s) but no dataDir`)
    return { data: {}, files: 0 }
  }
  const dir = path.join(root, mod.dataDir)
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    fail('REGISTRY', `module ${mod.id} declares dataDir ${mod.dataDir}, which is not a directory — either it moved, in which case the rule file is stale, or it was deleted; ${specs.length} dataset(s) are not being checked either way`)
    return { data: {}, files: 0 }
  }

  const data = {}
  let files = 0
  for (const [name, file] of specs) {
    const abs = path.join(dir, file)
    if (!fs.existsSync(abs)) {
      fail('REGISTRY', `module ${mod.id} declares dataset ${name} at ${mod.dataDir}/${file}, which does not exist`)
      continue
    }
    try {
      data[name] = JSON.parse(fs.readFileSync(abs, 'utf8'))
      files++
    } catch (err) {
      fail('REGISTRY', `module ${mod.id} dataset ${name} (${mod.dataDir}/${file}) is not valid JSON: ${err?.message ?? err}`)
    }
  }
  return { data, files }
}
