---
modelId: cdm-fixture-alt
versionPin: "fixture-alt-1.0.0"
regime: open-redistributable
verdict: go
verifiedOn: 2026-08-28
---

# CDM Check Fixture (alternate) — Dossier

The second fixture model's dossier. The alternate model exists only to give
CV-M3 and CV-M4 a foreign entity id that genuinely belongs to another model
rather than one that merely fails to resolve — two different defects, and a
fixture that could not tell them apart would let the `crossModel` branch pass
for the wrong reason.

## Verdict
**GO** — the descriptor declares `stage: 1`, so a non-`go` verdict here would
fail CDM-VERSION-PIN for a reason unrelated to the branch under test.
