/**
 * CDM meta-schema — the single shape every industry canonical data model
 * conforms to from CDM-P2 onward. BAIW/TAIW/HAIW repositories are NOT yet
 * migrated to this shape; retrofit is a scheduled later migration.
 *
 * Design intent mirrors DGIW's single-source-of-truth pattern:
 *   CDM_MODELS registry  ~  PERSISTED_BASES
 *   provenance records   ~  gapRegister evidence discipline
 *
 * Target location in erwin: baiw/src/cdm/meta/cdmMeta.ts
 */

/** Licensing regime, decided at Stage 0, cited in the dossier. */
export type CdmLicenseRegime =
  | 'open-redistributable' // e.g. IEC CIM UML (Apache 2.0)
  | 'open-use-restricted'  // e.g. ISO 20022 repository content
  | 'derived-synthetic';   // e.g. Teradata FSDM, ACORD RA

/** How a record's content came to exist. The fabrication firewall. */
export type CdmProvenanceMethod =
  | 'verbatim'  // copied from an open distribution; FORBIDDEN under derived-synthetic
  | 'derived'   // authored by us from a cited source (mappings, rationales, paraphrase)
  | 'synthetic';// invented for demo purposes; must be visibly labeled in UI

export interface CdmSource {
  /** Stable id referenced by provenance records, e.g. 'iso20022-erepo'. */
  id: string;
  title: string;
  publisher: string;
  /** Exact version string of the source artifact, e.g. 'e-Repository 2026 Q2'. */
  version: string;
  url?: string;
  /** ISO date the source was accessed/downloaded. */
  accessed: string;
  /** One-line license characterization; full analysis lives in the dossier. */
  licenseNote: string;
}

export interface CdmProvenance {
  /** Must resolve into the owning model descriptor's sources[]. */
  sourceId: string;
  /**
   * Locator inside the source: UML package path, document section, page,
   * message-set id, URL fragment. Specific enough for a human to re-find it.
   */
  locator: string;
  method: CdmProvenanceMethod;
  /** ISO date the citation was last verified against the source. */
  verifiedOn: string;
}

export type CdmStage = 0 | 1 | 2 | 3 | 4;

export interface CdmModelDescriptor {
  /** e.g. 'iso20022' | 'iec-cim' | 'acord' | (retrofit later:) 'fsdm' */
  modelId: string;
  name: string;
  publisher: string;
  /**
   * Exact pinned version. CDM-VERSION-PIN asserts equality with the dossier
   * frontmatter — the descriptor never outruns the dossier.
   */
  versionPin: string;
  regime: CdmLicenseRegime;
  /** Repo-relative path, e.g. 'docs/cdm/dossiers/iso20022.md'. */
  dossierPath: string;
  sources: CdmSource[];
  /** Highest completed pipeline stage. Gated by CDM-COVERAGE. */
  stage: CdmStage;
  /**
   * Which vertical hosts this model: 'baiw' | 'taiw' | 'haiw' | future ids.
   * Composite models (HCDM-over-FHIR, ISO20022-alongside-FSDM) are separate
   * descriptors sharing a hostWorkbench.
   */
  hostWorkbench: string;
}

export interface CdmSubjectArea {
  id: string;
  modelId: string;
  name: string;
  description: string;
  provenance: CdmProvenance;
}

export interface CdmEntity {
  id: string;
  modelId: string;
  subjectAreaId: string;
  name: string;
  definition: string;
  /**
   * True = workbench-specific addition not present in the source model
   * (the TAIW-additions pattern). Extensions carry no provenance requirement
   * but MUST be flagged, and Stage 4 enrichment re-verifies the flags.
   */
  workbenchExtension?: boolean;
  /** Required unless workbenchExtension === true. */
  provenance?: CdmProvenance;
}

export interface CdmAttribute {
  id: string;
  modelId: string;
  entityId: string;
  name: string;
  definition: string;
  datatypeNote?: string;
  workbenchExtension?: boolean;
  provenance?: CdmProvenance;
}

export interface CdmRelationship {
  id: string;
  modelId: string;
  fromEntityId: string;
  toEntityId: string;
  /** Coarse verb phrase, e.g. 'settles', 'is party to'. */
  label: string;
  cardinalityNote?: string;
  workbenchExtension?: boolean;
  provenance?: CdmProvenance;
}

export interface CdmUseCaseMapping {
  id: string;
  modelId: string;
  /** Resolves into the host workbench's use-case page registry. */
  useCasePageId: string;
  entityIds: string[];
  /** Authored judgment; provenance method is 'derived'. */
  rationale: string;
  provenance: CdmProvenance;
  /**
   * Reserved for the future cross-model crosswalk (FSDM Party ↔ FHIR Patient
   * ↔ WCO Trader). Until that engine exists, CDM-COVERAGE rejects any mapping
   * whose entityIds span models unless this flag is true, and the flag's use
   * before the engine lands is itself a review item.
   */
  crossModel?: boolean;
}

/** The per-model content bundle a workbench loads. */
export interface CdmModelContent {
  descriptor: CdmModelDescriptor;
  subjectAreas: CdmSubjectArea[];
  entities: CdmEntity[];
  attributes: CdmAttribute[];
  relationships: CdmRelationship[];
  useCaseMappings: CdmUseCaseMapping[];
}

/**
 * Single registry — the only place models are declared.
 * Populated by CDM-P2 onward; empty on landing is valid (CDM checks
 * vacuously green over an empty registry, and the selftest mutations
 * exercise them against fixture content instead).
 */
export const CDM_MODELS: CdmModelDescriptor[] = [];
