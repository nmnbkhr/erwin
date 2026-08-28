/**
 * Runtime loader for ISO 20022 model content.
 *
 * ─── WHY FETCH RATHER THAN IMPORT ──────────────────────────────────────────
 *
 * The four datasets are 2.0 MB of generated records, of which attributes.json
 * alone is 1.15 MB. As TS modules they were reachable from the module graph, so
 * the day any component imported them they would have landed in the SPA bundle
 * whole. A lazy chunk would not have fixed it: a chunk still ships every byte to
 * anyone who opens the route, and no BAIW page needs attribute-level detail to
 * render a mapping.
 *
 * As static JSON under `public/` each file is fetched only when something asks
 * for it, and a page that needs entities never pays for attributes.
 *
 * MEASURED, NOT ASSUMED: before this refactor the content added ZERO bytes to
 * dist, because nothing imported it. This is therefore a PREVENTIVE change —
 * it stops a regression that had not happened yet, at the point where the first
 * consumer arrives (CDM-P3 onward). Do not read a flat dist number as evidence
 * that it did nothing.
 *
 * ─── THIS IS A NEW PATTERN IN THIS REPO, AND THAT IS DELIBERATE ────────────
 *
 * Every other dataset in the suite is imported and bundled — the architecture
 * note in CLAUDE.md is explicit that ~19 MB of JSON is bundled at build time,
 * and `fetch` appears nowhere in `src/`. This is the first exception, and it is
 * confined to CDM model content for the reason above: it is reference data that
 * grows per stage and per model, unlike the fixed workbench datasets.
 *
 * It introduces no backend. `public/` is served statically by vite in dev and
 * copied verbatim into `dist/` at build; the fetch is same-origin against the
 * app's own asset, not a network API. If a future model makes this a habit
 * rather than an exception, that is a decision to take deliberately.
 *
 * Results are cached per path, so two callers in one session fetch once.
 */
import type {
  CdmAttribute,
  CdmEntity,
  CdmRelationship,
  CdmSubjectArea,
} from '../meta/cdmMeta';

/** Base path under the served root. Matches public/cdm/iso20022/. */
const BASE = '/cdm/iso20022';

const cache = new Map<string, Promise<unknown>>();

/**
 * Fetch and parse one dataset, once per path per session.
 *
 * A failed fetch REJECTS rather than resolving to an empty array. An empty
 * result would be indistinguishable from a model with no records, and every
 * consumer downstream would render "nothing to show" for what is actually a
 * transport failure — the distinction CLAUDE.md requires a report page to make
 * between "the data failed to load" and "nothing has been answered yet".
 */
const load = <T>(file: string): Promise<T[]> => {
  const url = `${BASE}/${file}`;
  if (!cache.has(url)) {
    cache.set(
      url,
      fetch(url).then((r) => {
        if (!r.ok) throw new Error(`CDM content ${url} failed to load: HTTP ${r.status}`);
        return r.json();
      }),
    );
  }
  return cache.get(url) as Promise<T[]>;
};

export const loadIso20022SubjectAreas = () => load<CdmSubjectArea>('subjectAreas.json');
export const loadIso20022Entities = () => load<CdmEntity>('entities.json');
export const loadIso20022Attributes = () => load<CdmAttribute>('attributes.json');
export const loadIso20022Relationships = () => load<CdmRelationship>('relationships.json');

/** Everything at once, for a consumer that genuinely needs the whole model. */
export const loadIso20022Content = async () => {
  const [subjectAreas, entities, attributes, relationships] = await Promise.all([
    loadIso20022SubjectAreas(),
    loadIso20022Entities(),
    loadIso20022Attributes(),
    loadIso20022Relationships(),
  ]);
  return { subjectAreas, entities, attributes, relationships };
};

/** Test seam: drop the cache so a reload re-fetches. */
export const __resetCdmContentCache = () => cache.clear();
