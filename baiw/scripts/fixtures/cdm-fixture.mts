/**
 * CDM check fixture — one minimal well-formed model, plus a second model that
 * exists only so the cross-model branch has a real foreign id to reach for.
 *
 * WHY THIS FILE EXISTS. CDM_MODELS lands empty at CDM-P1, so the three CDM
 * classes examine nothing on a normal build and declare `mayBeEmpty`. A class
 * that cannot fail is decoration, and a class that examines nothing every time
 * is indistinguishable from one that stopped running. This bundle is the target
 * the selftest mutations break, and it is the ONLY thing that proves the three
 * classes can still fire before any real model content exists.
 *
 * It is deliberately NOT read on a normal `npm run check` — see
 * scripts/check/modules/cdm.mjs for the gate and the reason.
 *
 * The bundle is well-formed as it stands: unmutated, every CDM class passes
 * over it. Each mutation breaks exactly one branch, which is what makes a
 * NOT TRIPPED row diagnostic rather than ambiguous.
 */
import type {
  CdmModelContent,
  CdmProvenance,
} from '../../src/cdm/meta/cdmMeta.ts'

/** Every fixture record cites the one fixture source, verified on one date. */
const prov = (locator: string, method: CdmProvenance['method'] = 'derived'): CdmProvenance => ({
  sourceId: 'fixture-src',
  locator,
  method,
  verifiedOn: '2026-08-28',
})

/**
 * The primary fixture. stage 3, so all three of CDM-COVERAGE's stage floors
 * are live: subjectAreas, entities AND useCaseMappings must all be non-empty.
 * A lower stage would leave CV-M1 with nothing to overdeclare.
 */
export const cdmFixtureBundle: CdmModelContent = {
  descriptor: {
    modelId: 'cdm-fixture',
    name: 'CDM Check Fixture Model',
    publisher: 'erwin suite gate',
    versionPin: 'fixture-1.0.0',
    regime: 'open-redistributable',
    dossierPath: 'scripts/fixtures/cdm-fixture-dossier.md',
    sources: [
      {
        id: 'fixture-src',
        title: 'CDM Check Fixture Source',
        publisher: 'erwin suite gate',
        version: 'fixture-1.0.0',
        accessed: '2026-08-28',
        licenseNote: 'Synthetic fixture content authored for the gate; no third-party material.',
      },
    ],
    stage: 3,
    hostWorkbench: 'fixture',
  },
  subjectAreas: [
    {
      id: 'sa-party',
      modelId: 'cdm-fixture',
      name: 'Party',
      description: 'Parties and the accounts they hold.',
      provenance: prov('fixture://model/subject-areas#party'),
    },
    {
      id: 'sa-instrument',
      modelId: 'cdm-fixture',
      name: 'Instrument',
      description: 'Instruments referenced by settlement.',
      provenance: prov('fixture://model/subject-areas#instrument'),
    },
  ],
  entities: [
    {
      id: 'ent-party',
      modelId: 'cdm-fixture',
      subjectAreaId: 'sa-party',
      name: 'Party',
      definition: 'A legal or natural person known to the institution.',
      provenance: prov('fixture://model/entities#party'),
    },
    {
      id: 'ent-account',
      modelId: 'cdm-fixture',
      subjectAreaId: 'sa-party',
      name: 'Account',
      definition: 'An account held by a party.',
      provenance: prov('fixture://model/entities#account'),
    },
    {
      // The extension escape hatch, carrying NO provenance on purpose. This is
      // the record PR-M6 flags to prove CDM-PROVENANCE is not over-firing.
      id: 'ent-local-tag',
      modelId: 'cdm-fixture',
      subjectAreaId: 'sa-instrument',
      name: 'Local Instrument Tag',
      definition: 'Workbench-specific annotation absent from the source model.',
      workbenchExtension: true,
    },
  ],
  attributes: [
    {
      id: 'attr-party-name',
      modelId: 'cdm-fixture',
      entityId: 'ent-party',
      name: 'legalName',
      definition: 'Registered legal name of the party.',
      datatypeNote: 'string',
      provenance: prov('fixture://model/attributes#party.legalName'),
    },
  ],
  relationships: [
    {
      id: 'rel-party-holds-account',
      modelId: 'cdm-fixture',
      fromEntityId: 'ent-party',
      toEntityId: 'ent-account',
      label: 'holds',
      cardinalityNote: '1..*',
      provenance: prov('fixture://model/relationships#party-holds-account'),
    },
  ],
  useCaseMappings: [
    {
      id: 'map-party-360',
      modelId: 'cdm-fixture',
      useCasePageId: 'fixture-page-party-360',
      entityIds: ['ent-party', 'ent-account'],
      rationale: 'Party 360 reads the party and its accounts.',
      // Mappings are authored judgment by definition, so method is always
      // 'derived'; PR-M5 breaks exactly this.
      provenance: prov('fixture://model/mappings#party-360', 'derived'),
    },
  ],
}

/**
 * A SECOND model, minimal. It exists for one reason: CV-M3 and CV-M4 need a
 * foreign entity id that genuinely belongs to another model, not merely one
 * that fails to resolve. Those are different defects and a fixture that could
 * not tell them apart would let the crossModel branch pass for the wrong
 * reason.
 *
 * stage 1, so it needs subjectAreas but not entities or mappings — it still
 * carries one entity, which is the id CV-M3 reaches for.
 */
export const cdmFixtureAltBundle: CdmModelContent = {
  descriptor: {
    modelId: 'cdm-fixture-alt',
    name: 'CDM Check Fixture Model (alternate)',
    publisher: 'erwin suite gate',
    versionPin: 'fixture-alt-1.0.0',
    regime: 'open-redistributable',
    dossierPath: 'scripts/fixtures/cdm-fixture-alt-dossier.md',
    sources: [
      {
        id: 'fixture-alt-src',
        title: 'CDM Check Fixture Source (alternate)',
        publisher: 'erwin suite gate',
        version: 'fixture-alt-1.0.0',
        accessed: '2026-08-28',
        licenseNote: 'Synthetic fixture content authored for the gate; no third-party material.',
      },
    ],
    stage: 1,
    hostWorkbench: 'fixture',
  },
  subjectAreas: [
    {
      id: 'alt-sa-counterparty',
      modelId: 'cdm-fixture-alt',
      name: 'Counterparty',
      description: 'Counterparties in the alternate model.',
      provenance: {
        sourceId: 'fixture-alt-src',
        locator: 'fixture-alt://model/subject-areas#counterparty',
        method: 'derived',
        verifiedOn: '2026-08-28',
      },
    },
  ],
  entities: [
    {
      id: 'alt-ent-counterparty',
      modelId: 'cdm-fixture-alt',
      subjectAreaId: 'alt-sa-counterparty',
      name: 'Counterparty',
      definition: 'A counterparty to a trade.',
      provenance: {
        sourceId: 'fixture-alt-src',
        locator: 'fixture-alt://model/entities#counterparty',
        method: 'derived',
        verifiedOn: '2026-08-28',
      },
    },
  ],
  attributes: [],
  relationships: [],
  useCaseMappings: [],
}

/**
 * The tiny use-case page registry CDM-COVERAGE resolves `useCasePageId`
 * against, keyed by `hostWorkbench`. The real workbenches resolve into
 * src/industry/registry.ts; the fixture host is 'fixture' and has its own,
 * so a mutation cannot accidentally depend on live use-case content.
 */
export const CDM_FIXTURE_PAGE_REGISTRY: Record<string, readonly string[]> = {
  fixture: ['fixture-page-party-360', 'fixture-page-settlement'],
}

/** Declared, never globbed — the order is the order findings print in. */
export const CDM_FIXTURE_BUNDLES: CdmModelContent[] = [cdmFixtureBundle, cdmFixtureAltBundle]
