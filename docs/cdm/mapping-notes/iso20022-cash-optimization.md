# ISO 20022 -> `cash-optimization` — mapping notes

Review of 2026-08-28, between Noman and Claude, over the CDM-P2b evidence
reports. This is the trail for `src/cdm/iso20022/mappings.ts`: what was
approved and on what warrant, what was cut and why, and what is deliberately
left unmapped. **Read this before adding a fourth mapping.**

The grades are the point. **E** means the artifact describes the subject in its
own vocabulary and nobody had to reach. **J** means the claim rests on
banking-domain judgment rather than on text. A J is not a weaker mapping — it
is one whose warrant is expertise, and a reader re-examining it later needs to
know which kind it is.

## Approved

| id | entities | covers | grade |
|---|---|---|---|
| `iso20022-coe-m1` | CashBalance, CashAccount, Balance | UC-01, UC-03, UC-04 (balance dimension only) | **E** |
| `iso20022-coe-m2` | ATMTotal, CashAccount | UC-02, UC-07 | **E — strongest in the set** |
| `iso20022-coe-m3` | CashAccount, Settlement, Liquidity, LiquidityManagementLimit | UC-05, UC-06 | **J** |

**m2 is the exemplar of an E-grade rationale.** `ATMTotal`'s own repository
definition is *"Current totals of the ATM"*, and its attributes are
`ATMBalance`, `ATMCurrent`, `ATMCurrentNumber`, `ATMBalanceNumber` —
denomination-level cassette state. UC-02 is ATM cash replenishment
optimization. The artifact independently describes the use case's subject in
its own words; the mapping records an agreement that already existed rather
than asserting one.

**m3's J flag stands and should not be quietly upgraded.** Nostro/vostro
optimization as correspondent-account liquidity against expected settlement
flows is sound banking reasoning, and the component names are the natural
correspondent-banking vocabulary — but nothing in the repository says so. The
flag is the review trail.

## Cut

**Cluster 4 — `Payment`, `PaymentInstruction`, `PaymentExecution` — CUT.**

Two reasons, and they are correlated rather than independent:

1. **The rationale proved too much.** "The page touches payments because cash
   demand comes from transactions" is true of nearly every BAIW page. A
   rationale that cannot distinguish this page from the others maps nothing.
2. **Its FSDM-side evidence leaned almost entirely on `FINANCIAL_TRANSACTION`,
   which does not exist** — see **D-025**. That name is referenced by 7 of
   `coe.json`'s 10 use cases and resolves against none of `entities.json`'s
   3,917 entities.

The correlation is the finding. A rationale resting on a name that resolves to
nothing is a rationale **nobody could have checked**, which is why it read as
plausible. When D-025 is fixed, whatever `FINANCIAL_TRANSACTION` is corrected
to may or may not support this cluster — that is a reviewable question, not a
restoration. The payment components stay unmapped until a page has a specific
claim on them.

## Deliberately unmapped

**UC-04's regulatory-parameter dimension.** m1 covers UC-04's balance dimension
(`AGREEMENT_BALANCE_TYPE_METRIC`, *"Daily reserve balance positions"*). Its
regulatory dimension — the SBP CRR requirement and the policy rate — has no ISO
20022 grounding, and this is measured rather than unexplored:

- The **`auth` (Authorities) business area is CCP clearing regulation**, not
  central-bank reserve requirements: 177 message definitions, all CCP-shaped
  (`CCPAccountPositionReport`, `CCPAvailableFinancialResourcesReport`,
  `CCPDailyCashFlowsReport`, `CCPCollateralReport`). A different regulator and
  a different obligation.
- Across all **791 business components: zero** named `Reserve`, zero
  `Compliance`, zero rate-shaped.
- Six match `Regulat*` — `RegulatoryAuthorityRole`, `RegulatoryDocument`,
  `RegulatoryReport`, `RegulatoryReportingRole`, `SecuritiesRegulatoryDetails`,
  `TradeRegulator`. **Rejected on the verb.** CRR float engineering is
  *managing a balance against a requirement*; these model *submitting a report*.
  Mapping there would be D-001 at the level of the predicate rather than the
  join — a plausible-looking connection under a heading that makes it
  defensible.

This gap is **correlated with D-025 too**: UC-04 is the worst-hit use case at 1
of 3 names resolving, and both phantoms — `REGULATION` ("SBP CRR requirement
parameters and thresholds") and `MARKET_MEASURE` ("SBP policy rate and money
market rates") — sit on exactly the dimension left unmapped. Re-examine this
gap in the same pass that fixes D-025.

## Near-miss: `customer-profitability-workbench`

CPW **passes evidence-presence and fails vocabulary-resolution**, and the
distinction is why the Stage 3 scope rule is worded as it is.

It carries `profitabilityWorkbench.json` with 8 authored use cases and a
`dataEntities` field — so under "does this page have use-case evidence?" it
qualifies. But its ten distinct `dataEntities` resolve **0 of 10** against
`entities.json`:

```
FACT_CUSTOMER_PROFITABILITY, DIM_CUSTOMER, DIM_AGREEMENT, DIM_PRODUCT,
DIM_BRANCH, DIM_BUSINESS_SEGMENT, AGG_BRANCH_PROFITABILITY,
CUSTOMER_LIFETIME_VALUE, CLV_SCENARIO, COST_ALLOCATION_RESULT
```

**This is not a defect and must not be filed as one.** That is a star-schema
warehouse design — facts, dimensions, aggregates — a physical modelling layer,
deliberately not FSDM's conceptual one. `DIM_CUSTOMER` and FSDM's `PARTY` are
the same subject at two layers. The field is even named `dataEntities` rather
than `fsdmEntities`, which suggests the authors knew exactly which vocabulary
they were writing in.

So CPW's evidence can reach neither registered CDM model without a
conceptual-to-dimensional translation nobody has authored. It is reported here
with its reason rather than silently included or silently dropped.

## Method note

The scope walk that found CPW initially **missed it**, returning 1 page instead
of 2: `profitabilityWorkbench.json` is loaded through a *dynamic*
`await import('../data/profitabilityWorkbench.json')` in
`src/utils/profitabilityWorkbench.ts`, which a static `from '...json'` scan
cannot see. It was caught because a BAIW dataset with 8 authored use cases
going unclaimed was implausible — not because the walk complained. It reported
a clean, wrong answer. Hence the scope rule's third sentence in PIPELINE.md.
