/**
 * Model CONTENT — the counterpart to `CDM_MODELS`, which holds descriptors only.
 *
 * They are separate because they are read at different times and by different
 * things. A descriptor is small, always loaded, and is what CDM-VERSION-PIN and
 * the registry line need; content is the bulk, grows by an order of magnitude
 * per stage, and only the classes that walk records need it.
 *
 * ─── CONTENT IS NO LONGER IMPORTED HERE ────────────────────────────────────
 *
 * It used to be: this file imported four generated TS modules and CDM_CONTENT
 * held the arrays. CDM-P2c moved them to static JSON under
 * `public/cdm/iso20022/`, fetched on demand — see `../iso20022/loader.ts` for
 * why, and for the measurement that makes it a preventive change rather than a
 * saving.
 *
 * The consequence for readers: THERE IS NO SYNCHRONOUS WAY TO GET MODEL CONTENT
 * IN THE BROWSER ANY MORE, by design. A component that wants entities awaits the
 * loader. This file keeps the type and the small mappings that genuinely belong
 * in the bundle.
 *
 * The GATE does not use this file for content at all. `check/modules/cdm.mjs`
 * reads the JSON directly as declared datasets, so the registry validates the
 * same bytes the browser fetches rather than a second copy compiled from TS.
 * That is the point of the move: one artifact, two readers.
 */
import type { CdmModelContent, CdmUseCaseMapping } from './cdmMeta';
import { ISO20022_MAPPINGS } from '../iso20022/mappings';

/** Everything a bundle holds except the descriptor, which lives in CDM_MODELS. */
export type CdmModelBody = Omit<CdmModelContent, 'descriptor'>;

/**
 * Use-case mappings stay in TS and in the bundle.
 *
 * They are three records, not thousands, and they are the one part of a model
 * that is about THIS APP — a mapping names a page of this SPA, so a page that
 * wants to know "which model content am I about" should not pay a fetch to find
 * out. The bulk record sets, which are about the source model rather than about
 * us, are the ones that moved.
 */
export const CDM_MAPPINGS: Record<string, CdmUseCaseMapping[]> = {
  iso20022: ISO20022_MAPPINGS,
};
