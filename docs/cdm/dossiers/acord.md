---
modelId: acord
versionPin: "UNPINNED (stage-0)"
regime: derived-synthetic
verdict: wait
verifiedOn: 2026-08-28
---

# ACORD Reference Architecture — Stage 0 Model Dossier

## Identity
- **Model**: ACORD Reference Architecture — seven interrelated facets; the
  data-relevant three are the **Business Glossary**, **Information Model**
  (conceptual, all lines of business), and **Data Model** (design-level,
  warehouse-oriented). ACORD also publishes Data Standards (L&A, P&C XML,
  NGDS) which are messaging standards, not the enterprise model.
- **Publisher**: ACORD Corporation (Pearl River, NY) — the insurance
  industry's standards body.
- **Host workbench**: NEW — Insurance vertical ("IAIW" placeholder).

## Version (verified 2026-08-28)
- Latest publicly announced data-facet release found: **Reference
  Architecture v2.11** (announced August 2023), covering the Data Model,
  Information Model, and Business Glossary. Earlier public announcement:
  Data Model v2.7.2 (July 2020).
- Whether releases newer than 2.11 exist behind the subscription wall is not
  publicly determinable; the current version must be re-confirmed with ACORD
  Member Services at subscription time. **No pin is possible without
  subscription.**

## License analysis (basis of regime)
- Access: by **subscription**, available to members and non-members, per
  component or whole; some memberships bundle access (verified 2026-08-28,
  acord.org Reference Architecture page).
- IP: formal license agreement between licensee and ACORD Corporation, which
  owns the copyright in ACORD IP (verified via published ACORD license
  agreement text).
- Ruling → regime `derived-synthetic` (the FSDM regime):
  - MAY ship: our own insurance model structure informed by public
    documentation (facet descriptions, published subject-area overviews,
    press-release-level detail), synthetic demo content, and our own
    mappings — `method` limited to `derived`/`synthetic`; **`verbatim` is
    forbidden and enforced by CDM-PROVENANCE**.
  - MAY NOT ship: ACORD model content itself, even under subscription,
    absent explicit written permission — a subscription licenses internal
    use, not redistribution in a public repo.
  - A subscription still has value: it upgrades Stage 4 from impossible to
    possible (private reconciliation of our derived model against the real
    one, corrections expressed as our own content).

## Distribution & extraction tooling
- Subscriber downloads from acord.org; formats not publicly specified in
  detail (model files + documentation). Not actionable pre-subscription.

## Update cadence
- Periodic facet releases (2020, 2021, 2023 announcements observed);
  irregular from the outside. Not actionable pre-subscription.

## Commercial pull (Pakistan)
- **IFRS 17** adoption (SECP-driven) is the forced, dated compliance event —
  the best demand type; it is a *data* problem (contract grouping, cohorts,
  CSM calculation inputs) before it is an actuarial one.
- Takaful/health/motor growth; bancassurance ties into existing BAIW
  relationships; EFU/Jubilee/Adamjee-scale carriers as target logos, plus
  SECP itself as a DGIW prospect.
- Note: FSDM covers insurance subject areas in its FS-LDM lineage — meaning
  the Insurance vertical can bootstrap from expertise already in-house, which
  is precisely what the derivation regime requires.

## Risks / open items
- OI-1 (the blocker): subscription cost vs. commercial justification —
  obtain pricing from Member Services; decision gate is a signed or
  near-certain first insurance engagement, OR a decision to build
  derivation-only (viable but weaker Stage 4).
- OI-2: IFRS 17 as the Stage 3 flagship use case can be built *without*
  ACORD at all (IFRS 17 is IASB-published) — consider whether the vertical's
  v1 anchors on our own derived model + IFRS 17 requirements, with ACORD
  alignment deferred to a subscription-funded Stage 4.
- OI-3: verify SECP's current IFRS 17 effective-date/phasing for Pakistani
  insurers before any sales collateral cites it (do not recall it; look it
  up at authoring time).

## Verdict
**WAIT** — mirror of the NDGP/NDMI verdict pattern: real demand, blocked
artifact. Insurance vertical may still proceed on a derivation basis anchored
to IFRS 17 (OI-2) without this model reaching `go`; if that path is taken it
gets its own dossier (`ifrs17` as a requirements-anchor rather than a CDM)
and this dossier stays `wait` until a subscription decision.
