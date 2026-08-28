---
modelId: iec-cim
versionPin: "UNPINNED (stage-0)"
regime: open-redistributable
verdict: go
verifiedOn: 2026-08-28
---

# IEC CIM (Common Information Model) — Stage 0 Model Dossier

## Identity
- **Model**: IEC Common Information Model for the electric utility enterprise —
  the UML model underlying IEC 61970 (EMS/transmission), IEC 61968
  (distribution/enterprise), IEC 62325 (energy markets).
- **Publisher/steward**: UCA International Users Group (UCAIug / CIM Users
  Group, CIMug) maintains and copyrights the UML; IEC TC57 publishes the
  derived standards.
- **Host workbench**: NEW — Energy & Utilities vertical ("EAIW" placeholder;
  naming decision open).

## Version (verified 2026-08-28)
- Current stable CIM UML releases are published by UCAIug task forces
  (TF13/TF14/TF16) as Enterprise Architect project files. Release ids are
  composite, of the form
  `iec61970cimXX_iec61968cimYY_iec62325cimZZ` (the concrete example seen in
  community documentation, `iec61970cim16v29a_iec61968cim12v08_iec62325cim03v01a`,
  is an **older** release cited here only to document the id format — the
  current id must be read off the CIMug "Current Official CIM Model Releases"
  page at download time and becomes the versionPin).

## License analysis (basis of regime) — KEY FINDING
- **The CIM UML model is copyrighted by UCAIug and licensed under
  Apache 2.0** (verified 2026-08-28 via CIMTool project documentation and a
  PNNL developer's guide; both state independently that purchasing the IEC
  standards is NOT necessary to use the CIM).
- Access mechanics: current releases publicly downloadable from the CIMug
  site (registration form, no fee); **past** releases are member-gated
  (individual membership US$350 — only relevant if we ever need to pin a
  superseded release).
- Ruling → regime `open-redistributable`: verbatim structure — packages,
  classes, attributes, associations, definitions — may ship with provenance
  and Apache 2.0 attribution (license text + UCAIug copyright notice
  reproduced in the repo per Apache 2.0 §4).
- This REVERSES the earlier working assumption that Energy would run the
  FSDM-style derivation regime. The paid IEC 61970/61968/62325 documents are
  *derived standards*, not the model itself; we never need them for
  Stages 1–4.

## Distribution & extraction tooling — the real Stage 1 cost
- Distribution format: Sparx Enterprise Architect project files
  (.eap/.eapx/.qea/.qeax). This is the one materially awkward property.
- Extraction options, to be decided by trial at CDM-P3 completion:
  1. **CIMTool** (open source, ucaiug.io) — purpose-built, can emit profiles;
     likely fastest route to a clean package/class listing.
  2. .qea files are SQLite databases — direct query is plausible and
     script-friendly; .eap is JET/Access format (worse; avoid if the current
     release offers .qea).
  3. Community-exported artifacts (XMI/RDFS exports) — usable for
     cross-checking but the pin and provenance must point at the official
     UCAIug artifact, not a third-party export.
- Decision rule: whichever route is chosen, locators in provenance records
  cite UML package paths (e.g. `TC57CIM::IEC61970::Base::Core::...` style),
  which survive tooling changes.

## Update cadence
- Task-force releases periodically (roughly annual major cycles historically);
  confirm current rhythm at download. Stage 4 aligns to an official release.

## Commercial pull (Pakistan)
- DISCOs/K-Electric: AT&C loss analytics is the flagship money use case (the
  COE-equivalent); NEPRA performance reporting; smart-meter rollout data
  volumes; grid-modernization lending programs (WB/ADB) that *require* data
  capability the utilities don't have — donor-funded buyers are a distinct
  and reachable segment.
- Use-case shelf candidates for Stage 3: loss decomposition, outage/SAIDI-SAIFI
  analytics, asset health & maintenance, load forecasting readiness, market
  settlement (CTBCM makes 62325 relevant), theft analytics.

## Risks / open items
- OI-1: hands-on confirmation of extraction route (download + trial parse) —
  the only remaining Stage 0→1 unknown.
- OI-2: CIM is very large; Stage 1 decision rule needed on subject-area
  granularity (top-level packages of the three standards families, not the
  full package tree).
- OI-3: Apache 2.0 attribution placement in a client-side SPA — a NOTICE
  route exists and is boring; just do it correctly.
- OI-4: vertical naming and BVF-equivalent capability framing for energy —
  business-layer work, not model work.

## Verdict
**GO.** Licensing objection removed; Energy sequencing is now a purely
commercial decision. Recommended: run CDM-P2 (ISO 20022) first as pipeline
shakedown, with the CIM download-and-trial-parse (OI-1) proceeding in
parallel as research.
