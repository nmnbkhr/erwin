---
modelId: cdm-fixture
versionPin: "fixture-1.0.0"
regime: open-redistributable
verdict: go
verifiedOn: 2026-08-28
---

# CDM Check Fixture — Dossier

Not a real model dossier. This file exists so CDM-VERSION-PIN has a real
descriptor/dossier pair to compare, and so VP-M1 has a file to delete.

Its frontmatter deliberately mirrors the shape the three Stage-0 dossiers under
`docs/cdm/dossiers/` carry, because a fixture that conformed to a laxer shape
would prove the check passes over something the real dossiers are not.

## Identity
- **Model**: synthetic fixture, authored for the suite gate.
- **Publisher**: erwin suite gate.

## Licensing
No third-party material. `open-redistributable` is asserted here only so the
descriptor's `regime` has something to equal; PR-M3 flips it to
`derived-synthetic` to exercise the verbatim firewall.

## Verdict
**GO** — required, because the descriptor declares `stage: 3` and
CDM-VERSION-PIN fails any descriptor at `stage >= 1` whose dossier verdict is
not `go`. VP-M3 breaks exactly that pairing.
