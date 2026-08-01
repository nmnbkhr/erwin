#!/usr/bin/env node
/**
 * Back-compat shim. The gate is scripts/check.mjs.
 *
 * The name was wrong: four of this gate's classes read the report code of every
 * module in the suite, and the three module generators most likely to forget a
 * content digest were governed by a file whose name said it had nothing to do
 * with them. D3 split it into scripts/check.mjs plus a per-module registry under
 * scripts/check/.
 *
 * This path survives because it is written down in several places that are not
 * this repo's to change quickly — docs/WORKBENCH_STATE.md, docs/known-defects.md,
 * source comments in six generators, and whatever is in anyone's shell history.
 * It runs the FULL suite check, identically to `npm run check`; it cannot drift,
 * because it does nothing but import it.
 */
import './check.mjs'
