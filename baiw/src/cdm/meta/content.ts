/**
 * Model CONTENT, keyed by modelId — the counterpart to `CDM_MODELS`, which
 * holds descriptors only.
 *
 * They are separate because they are read at different times and by different
 * things. A descriptor is small, always loaded, and is what CDM-VERSION-PIN
 * and the registry line need; content is the bulk, grows by two orders of
 * magnitude per stage, and only the classes that walk records need it. Putting
 * the arrays inside the descriptor would make importing the registry pull
 * every subject area, entity and mapping of every model.
 *
 * A model may legitimately appear here with empty collections, or not appear
 * at all, while it is at stage 0 — that is what stage 0 MEANS. CDM-COVERAGE is
 * what makes a stage claim cost something: from stage 1 it requires subject
 * areas, from 2 entities, from 3 mappings, and a descriptor that declares a
 * stage with no content bundle fails by name.
 */
import type { CdmModelContent } from './cdmMeta';
import { ISO20022_SUBJECT_AREAS } from '../iso20022/subjectAreas';
import { ISO20022_ENTITIES } from '../iso20022/entities';
import { ISO20022_ATTRIBUTES } from '../iso20022/attributes';
import { ISO20022_RELATIONSHIPS } from '../iso20022/relationships';

/** Everything a bundle holds except the descriptor, which lives in CDM_MODELS. */
export type CdmModelBody = Omit<CdmModelContent, 'descriptor'>;

export const CDM_CONTENT: Record<string, CdmModelBody> = {
  iso20022: {
    subjectAreas: ISO20022_SUBJECT_AREAS,
    entities: ISO20022_ENTITIES,
    attributes: ISO20022_ATTRIBUTES,
    relationships: ISO20022_RELATIONSHIPS,
    // Stage 3. Empty is the honest state at stage 2, not a placeholder: the
    // descriptor claims stage 2 and CDM-COVERAGE requires exactly this much and
    // no more. Filling this is what advances the stage, and the stage number
    // moves in the same commit as the content or the claim is false.
    useCaseMappings: [],
  },
};
