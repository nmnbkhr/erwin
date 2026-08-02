/**
 * REPORT-SOURCES — the declared source set the three code-reading classes run over.
 *
 * It used to be `src/dgiw/report/` alone, which was right while that was the
 * only code building on the spine. Phase D migrated the three module generators
 * onto it, and they live outside that directory — so a scope that stayed at
 * src/dgiw/report/ would give the three generators MOST likely to forget a
 * content digest no digest check at all, being ported from a world where none
 * existed, and the build would report green while doing it.
 *
 * Declared, not globbed, for two reasons. A glob over src/ would sweep in every
 * file that happens to mention `header:` and turn CSV-HEADER into a repo-wide
 * style rule it was never designed to be. And a glob cannot tell "no generator
 * here" from "the directory moved": if a declared location disappears that is a
 * FINDING, below, not a silent shrink of the source set. This gate has passed
 * vacuously over an empty set before; it does not get to do it again.
 *
 * `kind` is asserted, not inferred. A location that flips from file to directory
 * or back is a restructure the rule file has to be told about.
 *
 * WHAT CHANGED IN D3: the list is no longer one array in one gate. Each module's
 * rule file declares its own locations and this concatenates them in registration
 * order — so adding a module's generator to the scope is part of adding the
 * module, not a separate edit to a file called check-dgiw.mjs that nobody
 * remembers governs their module.
 */
import fs from 'node:fs'
import path from 'node:path'
import { tsFilesIn } from '../lib/ts-ast.mjs'

export default {
  code: 'REPORT-SOURCES',

  run(ctx) {
    const { root, fail, modules } = ctx

    // Registration order, and each location remembers which module declared it —
    // so a stale path names the rule file to go and edit.
    const declared = []
    for (const mod of modules)
      for (const loc of mod.reportSources ?? []) declared.push({ ...loc, owner: mod.id })

    if (declared.length === 0)
      fail(`no module declares any report source location — CSV-HEADER, TEXT-MAXWIDTH and ARTEFACT-IMPL would each pass over an empty set`)

    // Every failure path here is a finding: the three checks below are only as
    // wide as this list, and a location that silently contributes nothing narrows
    // them without saying so.
    const files = []
    for (const loc of declared) {
      const abs = path.join(root, loc.rel)
      if (!fs.existsSync(abs)) {
        fail(`declared report source ${loc.rel} does not exist — either it moved, in which case this list is stale, or it was deleted; CSV-HEADER, TEXT-MAXWIDTH and ARTEFACT-IMPL are not checking it either way (declared by modules/${loc.owner}.mjs)`)
        continue
      }
      const stat = fs.statSync(abs)
      if (loc.kind === 'dir' && !stat.isDirectory()) {
        fail(`declared report source ${loc.rel} is declared a directory but is a file (declared by modules/${loc.owner}.mjs)`)
        continue
      }
      if (loc.kind === 'file' && !stat.isFile()) {
        fail(`declared report source ${loc.rel} is declared a file but is a directory (declared by modules/${loc.owner}.mjs)`)
        continue
      }
      const found = loc.kind === 'dir' ? tsFilesIn(abs) : /\.tsx?$/.test(abs) ? [abs] : []
      if (found.length === 0) {
        fail(`declared report source ${loc.rel} contributes no .ts sources — the check is looking in the wrong place (declared by modules/${loc.owner}.mjs)`)
        continue
      }
      /*
       * Attached per location, not just concatenated, because FINGERPRINT-COVERAGE
       * needs to know WHICH module's generators reach a dataset — a flat file list
       * cannot attribute a finding to the fingerprint that has to declare it.
       * Recorded here rather than recomputed there so the two cannot disagree about
       * what resolved: the printed count and the traversal are one walk.
       */
      loc.files = found
      files.push(...found)
    }
    if (declared.length > 0 && files.length === 0)
      fail(`no report sources resolved from any of the ${declared.length} declared locations — CSV-HEADER, TEXT-MAXWIDTH and ARTEFACT-IMPL would pass over an empty set`)

    // Read by the three classes that follow. Ordering dependency, and the only
    // hard one among the suite checks: check.mjs runs this first, by declaration.
    ctx.sources = files
    ctx.sourceLocations = declared

    return { examined: files.length, locations: declared.length }
  },
}
