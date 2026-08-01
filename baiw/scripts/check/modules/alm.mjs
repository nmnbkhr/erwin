/**
 * ALM — Asset-Liability Management.
 *
 * Declares nothing, for the same reason as modules/coe.mjs: registered so that
 * its absence from the gate is printed rather than merely true.
 *
 * Note for whoever adds rules here: ALM's datasets are colocated at
 * `src/alm/data/`, not under `src/data/alm/`. `dataDir` exists to absorb that.
 */
export default {
  id: 'alm',
  title: 'ALM — Asset-Liability Mgmt',
  checks: [],
}
