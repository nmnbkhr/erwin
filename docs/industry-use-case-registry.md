# Industry use-case registry

The shared registry at `baiw/src/industry/` is the suite's factual index of
industry use cases. It normalises existing workbench datasets; it does not copy
or replace their content.

## Classification

Sector and source module are deliberately separate:

| Sector | Domain | Source module |
|---|---|---|
| banking | Banking Analytics & Profitability | BAIW |
| banking | Cash Operations | COE |
| banking | Treasury & ALM | ALM |
| trade | Trade Analytics | TAIW |
| health | Healthcare Analytics | HAIW |

COE and ALM are banking use-case domains, not industries of their own.

## Current boundary

The registry establishes identity, source provenance and the common shape needed
by DGIW. Its portfolio supports engagement-scoped selection under
`dgiw.use-cases::<engagement-id>`; selection changes scope only and does not
change source content or imply readiness. Governance relationships (`cdeRefs`,
`dqRuleRefs`, `policyRefs`) are explicit empty arrays until they are authored.
An empty relationship is displayed as pending mapping and never converted into
a readiness score.

HAIW's common workbench dataset contains seven canonical cases. Its separate
component-local specialist explorer contains eight other cases. The registry
does not silently union those sets: they require an authored reconciliation
that says which extend, overlap or replace the canonical cases.

## Integrity contract

`scripts/check/modules/_industry.mjs` enforces:

- exact source-ID parity for all five workbench inventories;
- globally unique namespaced IDs (`<module>:<source-id>`);
- the sector/domain/source-module classification above;
- a resolvable domain definition for every use case;
- explicit source dataset and source route citations;
- explicit governance-reference arrays, including when empty.

Readiness decisions must not be added until CDE, DQ-rule and policy relationships
have been authored and gated.
