/**
 * ISO 20022 use-case mappings — which pages of this SPA a model's content is
 * about.
 *
 * EMPTY IS THE HONEST STATE AT STAGE 2, not a placeholder. The descriptor
 * claims stage 2 and CDM-COVERAGE requires exactly subject areas and entities,
 * no more. Filling this array is what advances the model to stage 3, and the
 * stage number moves in the same commit as the content or the claim is false.
 *
 * Mappings stay in the bundle while the record sets moved to fetched JSON,
 * because a mapping is the one part of a model that is about THIS APP: it names
 * a page id from src/cdm/meta/useCasePages.ts. A page asking "which model
 * content am I about" should not pay a network fetch to find out.
 */
import type { CdmUseCaseMapping } from '../meta/cdmMeta';

export const ISO20022_MAPPINGS: CdmUseCaseMapping[] = [];
