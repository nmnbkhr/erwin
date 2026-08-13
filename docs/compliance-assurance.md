# DGIW compliance assurance

The DGIW page at `/dg/compliance` is an engagement-scoped evidence assurance
register. It turns selected industry use cases into a reviewable chain:

`use-case scope → jurisdiction → obligation → control → evidence → reviewer → CSV output`

It does not certify an organisation, provide a legal opinion, or infer legal
compliance from a maturity score or framework crosswalk.

## Sources and bodies

`baiw/src/dgiw/data/complianceCatalogue.json` holds the source catalogue. Every
instrument names its issuing authority or standards body, official HTTPS source,
version, legal force, source-check date, sector and jurisdiction scope, review
state, and a written limitation. The initial set covers:

- DAMA, EDM Association, Data Governance Institute and ISACA for the shared
  governance chassis;
- Basel Committee and State Bank of Pakistan for banking, COE and ALM;
- World Customs Organization for TAIW;
- World Health Organization and the US Department of Health and Human Services
  for HAIW.

HIPAA obligations are candidates only when the United States jurisdiction is
selected. Pakistan is the default jurisdiction. DCAM v3 and WCO Data Model
4.3.0 are recorded as current sources; the existing DCAM v2.2 scorecard and
TAIW's bundled WCO 4.2 model remain visibly legacy content until their authored
question and mapping datasets are migrated. A current source label never
relabels legacy content.

## Applicability and control status

Candidate obligations derive from the selected use cases' source modules and
the selected jurisdiction. A consultant may remove a candidate only by recording
a reason; reviewer and date are retained with the exclusion. This is a scoped
working decision and should be confirmed by the organisation's legal or
regulatory owner.

Controls use these states only:

- `not-assessed`
- `in-progress`
- `evidence-pending`
- `review-pending`
- `verified`
- `rejected`

`verified` requires implemented status, an evidence reference, an evidence
summary, independent reviewer, review date and accepted decision. There is no
`compliant` state. A verified record means that reviewer accepted that evidence
for that control and date; it says nothing broader.

## Persistence and output

Use-case scope is stored under `dgiw.use-cases::<engagement-id>` and assurance
work under `dgiw.assurance::<engagement-id>` through the shared engagement state
layer. Both bases participate in engagement duplicate, export/import and delete.

AR-59, the Industry Compliance Assurance Register, is CSV-first. Every
applicable control-obligation row carries assessment state, evidence, reviewer,
instrument/version, issuing body, official source, legal force, source review
state, limitation, selected use-case IDs and the non-certification boundary.
Reasoned exclusions do not appear as applicable rows; their rationale remains
in engagement state for review.

## Integrity checks

`baiw/scripts/check/modules/_assurance.mjs` gates referential integrity, status
claim boundaries, jurisdiction behavior, engagement storage registration,
coverage for BAIW/COE/ALM/TAIW/HAIW, and AR-59 provenance. Fault injection in
`baiw/scripts/check/selftest.mjs` proves each check can fail. The real-browser
flow is covered by `baiw/scripts/dgiw-compliance-clickthrough.mjs`.

## Deliberate gaps

The catalogue is a maintained starting set, not an exhaustive legal register.
There is no authored policy dataset yet, so `policyRefs` remain explicit empty
arrays and the gate rejects invented policy links. Direct use-case-to-CDE and
use-case-to-DQ-rule relationships also remain pending. Those gaps are shown as
gaps rather than filled by title matching or other inference.
