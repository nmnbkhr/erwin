# CDM Incremental Pipeline (CDM-P)

Status: PROPOSED — not yet wired into erwin. This document is the specification;
`prompts/cdm-p1-metaschema.md` is the first execution prompt.

## Purpose

A repeatable, gate-controlled pipeline for adding industry canonical data models
(CDMs) to the workbench suite, generalizing what BAIW (Teradata FSDM v13),
TAIW (WCO DM v4.2), and HAIW (HL7 FHIR R5 + Teradata HCDM) each did ad hoc.

Two axioms carried over from the G-series:

1. **No fabricated specificity (D-001).** No entity, attribute, mapping, score,
   or version number ships without a provenance record resolving to a verified
   source. Anything derived or synthetic is labeled as such at the record level.
2. **Every gate is demonstrated failing before it is trusted.** Each new check
   class lands with selftest mutations that prove it fires.

## Licensing regimes

The regime is decided at Stage 0 and constrains every later stage. It is a
property of the model *distribution*, not of the industry.

| Regime | Definition | What may ship in the repo (client-side SPA, public GitHub) | Verified examples |
|---|---|---|---|
| `open-redistributable` | Model content published under an explicit open license permitting redistribution | Verbatim structure: subject areas, entities, attributes, relationships, with provenance | IEC CIM UML (Apache 2.0, UCAIug copyright) |
| `open-use-restricted` | Content freely accessible and royalty-free to *use*, but redistribution terms are narrower or ambiguous | Structure and names with provenance; verbatim definitions only after per-model legal note in dossier | ISO 20022 repository content (royalty-free third-party use license; e-Repository in EMF/ecore); HL7 FHIR (already handled in HAIW) |
| `derived-synthetic` | Model is member/subscription-licensed proprietary IP | Own synthetic derivation only: structure informed by public documentation, populated with synthetic content; `method: 'verbatim'` is **forbidden** and enforced by CDM-PROVENANCE | Teradata FSDM (existing BAIW practice), ACORD Reference Architecture (subscription + license agreement, ACORD Corporation copyright) |

Regime assignment requires a citation in the dossier. "I believe it is open" is
not a regime; it is a Stage 0 blocker.

## Stages

Each stage is a separable commit (or short commit series) with its own gate.
A vertical is demo-able from Stage 1 and sellable from Stage 3. Stages are
per-model, tracked in the model descriptor's `stage` field, asserted by
CDM-COVERAGE.

### Stage 0 — Model dossier
- Deliverable: `docs/cdm/dossiers/<modelId>.md` with YAML frontmatter
  (`modelId`, `versionPin`, `regime`, `verdict`) and body sections: publisher,
  exact current version *as verified on a stated date*, license class with
  citation, distribution format, extraction tooling required, update cadence,
  what-may-ship ruling, go/no-go verdict.
- Gate: dossier exists, frontmatter parses, `verdict` is one of
  `go | wait | no-go`. A `wait` verdict (the NDGP/NDMI case) is a valid,
  successful Stage 0 outcome — the pipeline's job includes producing red lights.
- No build work of any kind before a `go` verdict.

### Stage 1 — Subject-area skeleton
- Deliverable: `CdmSubjectArea[]` for the model, every record carrying a
  provenance entry resolving to a dossier-registered source.
- Extraction is from the downloaded distribution, **never from recall**. If the
  distribution needs tooling (e.g. CIM's Enterprise Architect .eap file), the
  tooling path is part of this stage and documented in the dossier.
- Gate: CDM-PROVENANCE green over subject areas; CDM-VERSION-PIN green.

### Stage 2 — Entity layer
- Deliverable: `CdmEntity[]` (and coarse `CdmRelationship[]`) per subject area.
  Workbench-specific additions allowed but must set `workbenchExtension: true`
  (the TAIW-additions pattern, now schematized).
- Gate: CDM-PROVENANCE green over entities/relationships; no orphaned
  `subjectAreaId` references (CDM-COVERAGE).

### Stage 3 — Use-case mapping
- Deliverable: `CdmUseCaseMapping[]` linking entities to the vertical's
  use-case pages (the COE→BVF→FSDM pattern). Each mapping carries a rationale;
  the rationale is authored judgment and is labeled `method: 'derived'`.
- Gate: every mapping's `useCasePageId` and `entityIds` resolve
  (CDM-COVERAGE); no mapping cites entities from a different `modelId` unless
  flagged `crossModel: true` (reserved for the future cross-model crosswalk).

### Stage 4 — Enrichment against authoritative artifact
- Deliverable: reconciliation report + corrections. Discrepancies between
  shipped content and the authoritative distribution are filed as D-numbers,
  not silently patched. Workbench extensions are preserved and re-verified as
  still-flagged.
- The already-written WCO DM enrichment prompt is the Stage 4 exemplar; it
  should be retro-labeled as such when it runs.
- Gate: post-enrichment CDM-* all green; enrichment report filed in
  `docs/cdm/enrichment/<modelId>-<date>.md`.

## Meta-schema

Single JSON/TS shape for all models: see `schema/cdmMeta.ts`. Design points:

- `CdmModelDescriptor` is the registry entry; the registry array
  (`CDM_MODELS`) is the single source of truth for which models exist and at
  what stage — the `PERSISTED_BASES` pattern applied to models.
- Provenance is a first-class record (`sourceId` + `locator` + `method` +
  `verifiedOn`), not a free-text note. `sourceId` must resolve into the
  descriptor's `sources` list, which itself mirrors the dossier.
- `method` is the fabrication firewall: `verbatim` (copied from an open
  distribution), `derived` (authored from a source, e.g. a mapping rationale),
  `synthetic` (invented for demo purposes, permitted only where labeled).
- Existing BAIW/TAIW/HAIW repositories are **not** migrated now. The fourth
  model is born conformant; retrofit is a later mechanical migration and gets
  its own defect-style tracking entry when scheduled.

## Check classes

Full specs with mutation lists: `docs/cdm/CHECK-CLASSES.md`. Summary:

| Class | Asserts | Fails when |
|---|---|---|
| CDM-VERSION-PIN | Descriptor `versionPin` equals the dossier frontmatter version; dossier exists and parses | Missing dossier, unparseable frontmatter, mismatch, or descriptor stage ≥ 1 with verdict ≠ `go` |
| CDM-PROVENANCE | Every subject area / entity / attribute / relationship has provenance resolving to a registered source, or is flagged `workbenchExtension`; `verbatim` forbidden under `derived-synthetic` regime | Dangling `sourceId`, missing provenance on a non-extension record, verbatim-under-derivation, missing `verifiedOn` |
| CDM-COVERAGE | Declared stage implies required collections populated and referentially closed (stage 1 → subject areas; 2 → entities; 3 → mappings); no orphan FKs anywhere regardless of stage | Empty required collection for declared stage, orphaned `subjectAreaId` / `entityIds` / `useCasePageId`, cross-model reference without `crossModel` flag |

All three follow standing conventions: registered in the `scripts/check.mjs`
module registry, each demonstrated failing via selftest mutations before the
first green run is believed, SKIP inside `verify:quick` expected.

The three CDM classes are mayBeEmpty — green on a normal build means no model is
declared yet, not that declared models are sound.

## Execution order

1. **CDM-P1**: meta-schema module + three check classes + selftest mutations
   into erwin (prompt: `prompts/cdm-p1-metaschema.md`).
2. **CDM-P2**: ISO 20022 Stage 0→3 into BAIW as reference implementation.
   Open-ish regime, adjacent domain, composite-model shakedown (extends BAIW
   alongside FSDM the way HCDM overlays FHIR). Stage 1 extraction runs against
   the downloaded e-Repository — business areas and message sets are *not*
   seeded from recall even where well known.
3. **CDM-P3 (parallel research, no build)**: IEC CIM and ACORD dossiers are
   already drafted from this session's verification (`dossiers/`). Remaining
   Stage 0 work: CIM — confirm current release id and extraction tooling by
   actually downloading; ACORD — decision on whether a subscription is
   commercially justified before any Insurance build, since without it the
   vertical runs pure derivation.
4. **CDM-P4**: WCO enrichment prompt executes as the Stage 4 exemplar;
   results feed back into this spec if the stage definition needs amendment.
5. **Energy vertical go/no-go** on the strength of the completed CIM dossier —
   note the regime finding (Apache 2.0) removes the licensing objection that
   originally ranked Energy behind the open-model candidates; sequencing is
   now purely a commercial-priority decision.

## Interaction with existing discipline

- One separable change per commit; reasoning in body. Anything touching
  `scripts/` gates on full `npm run verify`; dossier-only commits gate on
  `verify:quick`.
- Feature branch per CDM-P prompt, cut from `wip/phase-a`.
- Concurrent-session freeze coordination applies before any CDM-P prompt runs,
  since `scripts/check.mjs` is shared surface with `erwin-01`.
- Out-of-scope defects observed during extraction are filed as D-numbers.
