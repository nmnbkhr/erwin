/**
 * DGIW — Data Governance Intelligence Workbench
 *
 * Two explicit layers run through every artefact in this module:
 *   'core'    — the horizontal chassis. Sector-neutral methodology, reusable anywhere.
 *   'banking' — the banking overlay. FSDM/core-banking/SBP specifics layered on top.
 *
 * Every data record carries a `layer`. The LayerContext toggle filters on it, so the
 * same instrument can be run as a generic engagement or as a banking engagement.
 */
export type Layer = 'core' | 'banking'

export type LayerFilter = Layer | 'all'

/** DAMA-DMBOK / DCAM aligned governance pillar. */
export interface Pillar {
  id: string
  name: string
  short: string
  description: string
  /** Why a buyer funds work in this pillar — used for pain-led positioning. */
  buyerPain: string
  coreArtefacts: string[]
  deliverables: string[]
  bankingOverlay: {
    focus: string
    artefacts: string[]
    drivers: string[]
  }
}

export interface DiagnosticQuestion {
  id: string
  pillarId: string
  layer: Layer
  text: string
  /** 1 = contextual, 2 = important, 3 = decisive. Drives the weighted score. */
  weight: 1 | 2 | 3
  levelDescriptions: Record<string, string>
}

export interface DiagnosticData {
  title: string
  description: string
  scale: Record<string, string>
  questions: DiagnosticQuestion[]
}

export interface PillarScore {
  pillarId: string
  name: string
  short: string
  /**
   * Weighted mean of answered questions, unrounded. `null` when nothing in this
   * pillar has been answered — deliberately not 0, because "not assessed" and
   * "assessed as worst possible" are different findings and a zero plots as a
   * catastrophic spike on the radar.
   */
  score: number | null
  answered: number
  total: number
  weightAnswered: number
  weightTotal: number
  /**
   * Share of the pillar's question weight that has been answered, 0..1.
   * A score carries no authority without it: one contextual question out of six
   * can otherwise make a pillar the headline strength of the report.
   */
  confidence: number
}

export interface LadderDeliverable {
  name: string
  format: string
  layer: Layer
}

export interface LadderRung {
  id: string
  rung: number
  name: string
  duration: string
  pricingModel: string
  purpose: string
  buyerSignal: string
  scope: string[]
  activities: string[]
  deliverables: LadderDeliverable[]
  exitCriteria: string[]
  qualifiesFor: string
  commercialNotes: string[]
  risks: string[]
}

export interface OperatingRole {
  id: string
  role: string
  sitsIn: string
  accountableFor: string[]
  timeAllocation: string
  layer: Layer
  failureMode: string
}

export interface RaciRow {
  activity: string
  dataOwner: string
  dataSteward: string
  dataCustodian: string
  dgCouncil: string
  dgOffice: string
}

/**
 * Resolves a job title used anywhere in the workbench to one of the ten governance
 * archetypes. Without it "Head of Credit Risk" and "Data Owner" are unrelated
 * strings, and no question of the form "who is accountable for this element, in
 * governance terms?" can be answered mechanically.
 */
export interface RoleRegistryEntry {
  name: string
  /** id of an entry in `roles` — RO1..RO11. */
  archetype: string
  layer: Layer
}

export interface OperatingModelData {
  principles: { title: string; statement: string; rationale: string }[]
  roles: OperatingRole[]
  roleRegistry: RoleRegistryEntry[]
  raci: RaciRow[]
  council: {
    charterPurpose: string
    chair: string
    cadence: string
    quorum: string
    members: string[]
    decisionRights: string[]
    escalationPath: string[]
  }
  gates: { id: string; name: string; blocking: boolean; test: string }[]
}

export interface CriticalDataElement {
  id: string
  element: string
  domain: string
  definition: string
  sourceSystem: string
  fsdmEntity: string
  /** Backward-derived: which consumption point makes this element critical. */
  consumers: string[]
  criticality: 'CRITICAL' | 'HIGH' | 'MEDIUM'
  /** Single accountable party, resolved through `OperatingModelData.roleRegistry`. */
  ownerRole: string
  /** Named supporting parties. Accountability stays singular; contribution does not. */
  support?: string[]
  dqDimensions: string[]
  layer: Layer
}

export interface DqRule {
  id: string
  cdeRef: string
  family: string
  dimension: 'Completeness' | 'Validity' | 'Accuracy' | 'Consistency' | 'Uniqueness' | 'Timeliness' | 'Integrity'
  name: string
  expression: string
  severity: 'BLOCKER' | 'HIGH' | 'MEDIUM'
  threshold: string
  remediation: string
  layer: Layer
}

export interface ProgramStep {
  id: string
  stream: string
  step: string
  owner: string
  support?: string[]
  inputs: string[]
  outputs: string[]
  durationDays: number
  layer: Layer
}

export interface ChecklistItem {
  id: string
  phase: string
  item: string
  artefact: string
  owner: string
  support?: string[]
  blocking: boolean
  pillarId: string
  layer: Layer
}

export interface ProgramSetupData {
  flows: {
    id: string
    name: string
    objective: string
    steps: ProgramStep[]
    /** ids into `OperatingModelData.gates`. Was free prose, which had already drifted. */
    gateIds: string[]
  }[]
  checklist: ChecklistItem[]
}

export interface PlanWave {
  id: string
  wave: number
  name: string
  weeks: string
  theme: string
  objectives: string[]
  deliverables: string[]
  pillarIds: string[]
  kpis: string[]
  /** Wave ids this wave cannot start without. Validated acyclic, and a core wave
   *  may never depend on a banking one — the overlay is additive, not required. */
  dependsOn: string[]
  /** Preconditions outside the plan's control: access, approvals, people's time. */
  externalDependencies: string[]
  exitCriteria: string
  layer: Layer
}

export interface Day90Row {
  weeks: string
  focus: string
  activities: string[]
  exitArtefact: string
}

/**
 * WHAT EVIDENCE STANDS BEHIND A CATALOGUED ARTEFACT.
 *
 * The register catalogued a SHAPE — id, rung, owner, format — and recorded
 * nothing about what the document would be built from. That is how AR-46 got a
 * framework alignment pack: the shape matched and nothing else did, and it took a
 * reader noticing to move it to a new AR-47. Eight further entries were found in
 * D5 stage G to be buildable only by synthesising a relation no dataset carries.
 *
 * An id in this register is a standing invitation to build against it, and
 * ARTEFACT-IMPL validates the id, not the claim. This field is the claim, and
 * ARTEFACT-EVIDENCE in check/modules/dgiw.mjs is what makes it binding: a
 * generator may only exist for a `derived` entry, and a `derived` entry must name
 * datasets that resolve.
 *
 *   derived    a generator can build it from the named datasets
 *   authored   library content nobody has written yet; a generator follows it
 *   observed   measured at the client, or the artefact IS the running thing
 *   blocked    buildable once a named catalogued artefact lands
 *   withdrawn  the register named a shape the data cannot support
 *
 * `note` is mandatory and carries the relation — or, for the other four, the
 * apparent path that does not hold. It is prose on purpose: the reason a mapping
 * is not real is not a value that can be enumerated.
 */
export type ArtefactEvidence = 'derived' | 'authored' | 'observed' | 'blocked' | 'withdrawn'

export interface ArtefactProvenance {
  evidence: ArtefactEvidence
  /** Paths under `src/`. Declared only by `derived`; every one must resolve. */
  datasets?: string[]
  /** Register ids. Declared only by `blocked`; every one must be catalogued. */
  blockedOn?: string[]
  note: string
}

export interface ArtefactRegisterEntry {
  id: string
  artefact: string
  pillarId: string
  rung: number
  owner: string
  support?: string[]
  format: string
  layer: Layer
  builtFrom: ArtefactProvenance
}

export interface ImplementationPlanData {
  first90Days: Day90Row[]
  waves: PlanWave[]
  artefactRegister: ArtefactRegisterEntry[]
}

/* ── Framework crosswalk (Phase C) ──────────────────────────────────────
 *
 * One assessment, four framework scorecards. The eleven pillars stay the
 * canonical capability model; a framework is a different vocabulary and a
 * different emphasis over the same evidence, never a second capability model.
 *
 * Nothing imports these shapes in C1 — the datasets exist and check-dgiw.mjs
 * validates them, but no code reads them until the projection engine in C2.
 * They are declared here anyway so the check has a contract to be reviewed
 * against rather than being its own specification.
 */

/*
 * Framework structure is SUITE-LEVEL as of D5 stage B.
 *
 * `frameworks.json` moved to `src/frameworks/data/` and these three types with
 * it, because DMBOK2, DCAM and COBIT 2019 are shared with TAIW and HAIW while
 * `crosswalk.json` — which holds every pillar reference — stays DGIW's. The seam
 * was already in the right place; the move followed it.
 *
 * RE-EXPORTED, NOT REDECLARED. Every `import type { Framework } from './types'`
 * in this module keeps working, against one declaration. Two structurally
 * identical copies would compile and would drift, which is the shape
 * CATEGORY-UNIVERSE rejects one level up.
 */
export type { Framework, FrameworkDimension, FrameworksData } from '../frameworks/types'

/**
 * A defensible mapping from one leaf dimension to one pillar.
 *
 * `coverageWeight` is the share of THIS DIMENSION that THIS PILLAR accounts
 * for, and the weights within a leaf dimension sum to 1.0 across the full entry
 * set. It is not "how much of the pillar this dimension covers" — under that
 * reading a dimension score is not a weighted mean and the four scorecards
 * cannot be reconciled.
 */
export interface CrosswalkEntry {
  id: string
  dimensionId: string
  pillarId: string
  /** In (0, 1]. Sums to 1.0 per leaf dimension over the full entry set. */
  coverageWeight: number
  /** Why this mapping holds. A mapping nobody can defend is not a mapping. */
  rationale: string
  /**
   * 'both' is visible under every filter; 'core'/'banking' follow layerShows.
   * A dimension carrying a banking-only entry retains less than 1.0 under a
   * core-only engagement — C2 renormalises the visible subset and must print
   * the retained share, as scoring.ts prints confidence for a pillar.
   */
  layer: Layer | 'both'
  /**
   * Reserved, unused in C1. Lets a dimension needing finer resolution than a
   * pillar name specific diagnostic questions without a schema change.
   */
  questionIds?: string[]
}


export interface CrosswalkData {
  entries: CrosswalkEntry[]
}

export interface PositioningData {
  thesis: string
  wedges: { id: string; name: string; pain: string; trigger: string; opener: string; layer: Layer }[]
  differentiators: { title: string; detail: string }[]
  failureModes: { failure: string; symptom: string; counterMeasure: string }[]
  toolingTiers: {
    tier: string
    posture: string
    components: { capability: string; product: string; note: string }[]
  }[]
  accelerators: { name: string; what: string; effect: string; layer: Layer }[]
}
