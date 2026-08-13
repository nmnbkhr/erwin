/**
 * THE REGISTRY.
 *
 * The order of this array is the order findings and summary lines are printed
 * in. `fails` prints in insertion order, so run order is observable output —
 * which is why it is declared here and never sorted, globbed or left to emerge
 * from import order. Reordering this array reorders every problem list.
 *
 * Adding a module is one import and one slot. Everything else follows from the
 * object: its report sources join REPORT-SOURCES, its artefact ids join
 * ARTEFACT-IMPL and widen the accepted `MR-` prefix, its datasets are loaded, its
 * checks are run, its summary lines are printed.
 *
 * A module that declares nothing is legal — see modules/coe.mjs. A registry with
 * no entries at all is not: check.mjs fails REGISTRY on an empty list, because a
 * gate whose registry failed to populate would otherwise print `0 entries, 0
 * checks` and exit 0.
 */
import spine from './_spine.mjs'
import industry from './_industry.mjs'
import baiw from './baiw.mjs'
import taiw from './taiw.mjs'
import haiw from './haiw.mjs'
import coe from './coe.mjs'
import alm from './alm.mjs'
import dgiw from './dgiw.mjs'

/**
 * The shared spine first — every generator goes through it, so it is the floor
 * the three code-reading classes measure from. Then the six modules in the order
 * CLAUDE.md's module table lists them. That table is the repo's own declared
 * order and a better authority than the order the sections happened to sit in
 * inside check-dgiw.mjs.
 */
export default [spine, industry, baiw, taiw, haiw, coe, alm, dgiw]
