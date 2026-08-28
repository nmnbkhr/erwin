/**
 * ISO 20022 use-case mappings — which pages of this SPA a model's content is
 * about.
 *
 * REVIEWED CONTENT. These three records were authored in review on 2026-08-28
 * against the CDM-P2b evidence reports, not generated from the artifact and not
 * inferred here. Each carries a review grade in the comment above it: E where
 * the artifact describes the subject in its own vocabulary, J where the claim
 * rests on banking-domain judgment. The grade is the review trail — a J is not
 * a weaker mapping, it is one whose warrant is expertise rather than text, and
 * a reader re-examining these later needs to know which is which.
 *
 * The full trail, including what was CUT and what is deliberately unmapped,
 * is docs/cdm/mapping-notes/iso20022-cash-optimization.md. Read it before
 * adding a fourth.
 *
 * Mappings stay in the bundle while the record sets moved to fetched JSON,
 * because a mapping is the one part of a model that is about THIS APP: it names
 * a page id from src/cdm/meta/useCasePages.ts. A page asking "which model
 * content am I about" should not pay a network fetch to find out.
 *
 * `method: 'derived'` on all three, and it is the only correct value: a mapping
 * is authored judgment by definition, which CDM-PROVENANCE enforces. The
 * locator points at the review rather than at a repository path, because the
 * review IS what produced these records.
 */
import type { CdmUseCaseMapping } from '../meta/cdmMeta';

/** Every mapping cites the same review, on the same date. */
const reviewProvenance = {
  sourceId: 'iso20022-erepo',
  locator: 'review 2026-08-28, mapping-notes iso20022-cash-optimization',
  method: 'derived',
  verifiedOn: '2026-08-28',
} as const;

export const ISO20022_MAPPINGS: CdmUseCaseMapping[] = [
  // Grade E. Covers UC-01, UC-03, UC-04 — UC-04's BALANCE dimension only.
  {
    id: 'iso20022-coe-m1',
    modelId: 'iso20022',
    useCasePageId: 'cash-optimization',
    entityIds: [
      'iso20022-ent-cashbalance',
      'iso20022-ent-cashaccount',
      'iso20022-ent-balance',
    ],
    rationale:
      "Branch and vault position tracking, inter-branch netting, and reserve balance positions all read a balance per account per day; camt is the ISO 20022 reporting vocabulary for exactly this. Covers UC-04's balance dimension only — its regulatory-parameter dimension is deliberately unmapped (see mapping notes).",
    provenance: reviewProvenance,
  },
  // Grade E, and the strongest in the set: the artifact describes UC-02's
  // subject in its own vocabulary, with nobody reaching. Covers UC-02, UC-07.
  {
    id: 'iso20022-coe-m2',
    modelId: 'iso20022',
    useCasePageId: 'cash-optimization',
    entityIds: ['iso20022-ent-atmtotal', 'iso20022-ent-cashaccount'],
    rationale:
      "ATMTotal's repository definition is 'Current totals of the ATM' with denomination-level cassette attributes (ATMBalance, ATMCurrent, ATMCurrentNumber, ATMBalanceNumber) — the artifact independently describes ATM cash management in its own vocabulary.",
    provenance: reviewProvenance,
  },
  // Grade J — banking-domain judgment, flag standing as the review trail.
  // Covers UC-05, UC-06.
  {
    id: 'iso20022-coe-m3',
    modelId: 'iso20022',
    useCasePageId: 'cash-optimization',
    entityIds: [
      'iso20022-ent-cashaccount',
      'iso20022-ent-settlement',
      'iso20022-ent-liquidity',
      'iso20022-ent-liquiditymanagementlimit',
    ],
    rationale:
      'Nostro/vostro optimization is correspondent-account liquidity management against expected settlement flows. Authored on banking-domain judgment (review grade J); the component names are the natural correspondent-banking vocabulary.',
    provenance: reviewProvenance,
  },
];
