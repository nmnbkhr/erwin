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

export interface ImplementationPlanData {
  first90Days: Day90Row[]
  waves: PlanWave[]
  artefactRegister: {
    id: string
    artefact: string
    pillarId: string
    rung: number
    owner: string
    support?: string[]
    format: string
    layer: Layer
  }[]
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

/** A published framework the diagnostic can be projected onto. */
export interface Framework {
  id: string
  /** The framework's own short code — DMBOK2, DCAM, DGI, COBIT2019. */
  code: string
  name: string
  publisher: string
  versionLabel: string
  /**
   * The framework's own maturity scale, which is NOT DGIW's 1-5 in every case:
   * DCAM scores 1-6 and COBIT 2019 uses capability levels 0-5. Recorded so C2
   * rescales explicitly rather than silently presenting a 1-5 score under a
   * 0-5 heading.
   */
  scaleMin: number
  scaleMax: number
  /** How far the authored structure can be trusted against the publication. */
  structureConfidence: 'high' | 'medium-high' | 'medium' | 'low'
  /** What specifically is uncertain, and what a reviewer should check first. */
  structureNotes: string
}

/**
 * One dimension of a framework — a knowledge area, component or objective.
 *
 * PROJECTION IS LEAF-ONLY. A dimension with children carries no crosswalk
 * entries; its score rolls up from its children inside the framework. COBIT's
 * APO14 and its sub-practices must never both count a pillar.
 */
export interface FrameworkDimension {
  id: string
  frameworkId: string
  /** null at level 1. Frameworks without hierarchy use null throughout. */
  parentId: string | null
  /** The framework's own code — DM01, DCAM5, APO14.02. */
  code: string
  name: string
  /**
   * Share of the parent (of the framework, at level 1). DGIW's editorial
   * judgement — none of these four frameworks publishes dimension weights.
   * Siblings sum to 1.0, so effective leaf weights sum to 1.0 per framework.
   */
  weight: number
  /** 1 = top level, 2 = child. */
  level: number
}

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

export interface FrameworksData {
  frameworks: Framework[]
  dimensions: FrameworkDimension[]
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
