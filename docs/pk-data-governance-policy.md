# Pakistan's National Data Governance Policy — assessment

**Nothing in the suite has been changed on the strength of this document.** No
crosswalk entry, no catalogue instrument, no pillar. This is the reading that has
to happen before any of that, and its conclusion for now is *wait*.

Source: `DNP-D.001 POL`, *Data Governance Policy 2026*, Government of Pakistan,
Ministry of Information Technology & Telecommunication, June 2026. 25 pages,
19 clauses, three normative annexes.
<https://moitt.gov.pk/SiteImage/Policies/Data%20Governance%20Policy%20June%202026.pdf>

---

## The two-minute version

| | |
|---|---|
| **Is it in force?** | **No.** Its own metadata block reads `"status": "FD"`, `"maturityLevel": "PROPOSED"`, `"dateApproved": "2026-05-XX"`, `"dateEffective": "[Upon Gazette notification]"`, `"gazetteReference": "[Pending Cabinet approval and SRO assignment]"`. Annex III.1 agrees. |
| **What does it require today?** | Almost nothing operable. It declares positions and authorises **19 supporting instruments (Annex II) of which none exist**. The requirements live in those. |
| **Is NDMI a crosswalk candidate?** | **No — it fails all three of this repo's preconditions.** Seven dimension names, no sub-structure, no weights, no scale, and an unpublished aggregation operator. See §4. |
| **Does it belong in `complianceCatalogue.json`?** | **Not yet, and not as `regulation`.** No `force` value in the catalogue describes a proposed instrument. See §6. |
| **Is it commercially relevant?** | **Yes, and significantly.** Clause 19(a) creates an annual self-assessment obligation, signed by an Agency CDO, for every federal public body — which is a maturity-diagnostic market. |
| **What is the honest position?** | Track it. Re-read on Gazette notification and again when `DNP-D.107 STD` publishes NDMI's scoring scheme. |

---

## 1. Status is the first finding, not a footnote

The document is a **final-draft policy published for consultation**, sitting in a
`/Policies/` directory in a way that reads as promulgated. It is not. Every
placeholder in the machine-readable block on the last page is still a
placeholder — `urn`, `doi`, gazette reference, and the approval date's day field
(`2026-05-XX`).

This matters more than a status line usually would, because the whole document is
written in binding voice — `SHALL` throughout — and a consultant quoting clause
8.2 at a client would be quoting a proposal in the register of law. Read every
clause below as *prospective*.

## 2. The architecture: a shell that delegates

Clause 17.1 sets the hierarchy — Policy → National Data Governance Framework →
standards and profiles → procedures and guidance → National Data Strategy.
Annex II names the instruments that must exist for the policy to operate:

| Ref | Instrument | Nearest DGIW surface |
|---|---|---|
| `DNP-D.001 FWK` | National Data Governance Framework | P01, operating model (AR-09) |
| `DNP-D.100 STD` | Data Classification and Handling | P08 |
| `DNP-D.101 STD` | Metadata and National Catalogue | P04, business glossary |
| `DNP-D.102 STD` | Data Quality and Standardisation | **P05/P06, CDE register, DQ rule library** |
| `DNP-D.103 STD` | Data Security Standards (incl. PET profiles) | P08 |
| `DNP-D.300 TS` | WASL National Data Exchange Specification | P10 |
| `DNP-D.200 GDL` | Open Data and Controlled Access | *no pillar* |
| `DNP-D.050 REG` | Pakistan Open Government Licence | *no pillar* |
| `DNP-D.400 PRF` | Sovereignty, Residency, Cross-Border Controls | P08, P09 |
| `DNP-D.104 STD` | Privacy by Design and Impact Assessment | P08 |
| `DNP-D.105 STD` | Citizen Identity and Credentials | *no pillar* |
| `DNP-D.401 PRF` | AI, ADM, Emerging Technology, Spatial | P11 |
| `DNP-D.201 GDL` | Data Value and Re-Use | P02 |
| `DNP-D.106 STD` | Preservation, Retention, and Disposal | P09 |
| `DNP-D.107 STD` | Compliance, Audit, Certification, **and Maturity** | **NDMI scoring lives here** |
| `DNP-D.108 STD` | Rights Handling, Notices, and Redress | *no pillar* |
| `DNP-D.202 GDL` | Training and Capacity-Building | *no pillar* |
| `DNP-D.002 RA` | WASL Reference Architecture | P10 |
| `DNP-D.100 STR` | National Data Strategy | sequencing, priority datasets |

**The delegation has a hard consequence.** Clause 8.2 — residency tiers, the most
operationally expensive clause in the document — keys off classification levels
`RESTRICTED`, `CONFIDENTIAL`, `INTERNAL` and `OPEN`. Each of those four strings
appears **exactly once in the entire policy**, inside that one table. The taxonomy
itself is delegated to `DNP-D.100 STD`, which is unwritten. A public body cannot
determine its Tier 1 obligations from this document.

## 3. The legal dependency

The abbreviations table says it plainly: **PDPL — Personal Data Protection Law
(anticipated)**. Clauses 11.3, 13.6 and 16.9 each defer to "the authority
designated under the personal data protection law". The conflict rule they
share — the more protective provision applies — is sensible and currently
vacuous, because there is no second regime to be more protective than.

Against that, PECA 2016 *is* a normative anchor (Annex I.4), and clause 7.4
permits an "adapted regime" for national-security, defence, intelligence,
parliamentary and judicial matters, negotiated with PDA. So the citizen-rights
architecture of clause 12 rests on a statute that does not exist, beside a
carve-out whose boundary is administrative rather than statutory. That is a fair
observation about sequencing, not an accusation — but it is the reason the
citizen-empowerment clauses cannot yet be treated as assessable obligations.

## 4. NDMI, and why it is not a crosswalk candidate

Clause 18.3 establishes the **National Data Maturity Index** as "the principal
national instrument for measuring data-governance maturity across public bodies",
assessing seven dimensions. Clause 19(a) makes it operational: **annual
self-assessment by every public body, signed by the Agency CDO**, in the form NDMI
prescribes. Clause 16.3 puts the national dashboard under the National CDO.

CLAUDE.md's crosswalk preconditions are published structure with identifiable
leaf dimensions, a checked aggregation operator, and an explicit scale.
**NDMI meets none of them today:**

| Precondition | NDMI as published |
|---|---|
| Published structure, leaf dimensions | seven dimension *names*, no sub-structure |
| Aggregation operator | unpublished — delegated to `DNP-D.107 STD` |
| `scaleMin` / `scaleMax` | not stated |

Authoring a `CW-D-` set against it now would be the EMRAM mistake exactly:
projecting onto an instrument whose own arithmetic nobody has seen, and handing a
public body a number its assessor will not recognise. **Wait for
`DNP-D.107 STD`.** Until then NDMI is a positioning input, not a fifth framework.

### The coverage gap is the useful finding

Mapping NDMI's seven dimensions onto the eleven pillars:

| NDMI dimension (18.3) | DGIW pillar |
|---|---|
| governance | P01 Governance & Operating Model, P02 Data Strategy |
| quality | P05 Data Quality Management, P06 Master & Reference Data |
| security | P08 Security, Privacy & Classification |
| sharing | P10 Platform, Integration & Automation — **partial** (WASL exchange only) |
| openness | **none** |
| citizen empowerment | **none** |
| capability | **none** |

P03 (Architecture), P04 (Metadata & Glossary), P07 (Lineage) and P09 (Lifecycle &
Retention) have no NDMI dimension of their own; NDMI is coarse enough to absorb
them under governance or quality, so that direction is not a gap.

The other direction is. **Three of the seven axes a Pakistani public body will be
assessed on have no DGIW pillar at all** — open data publication, licensing and
disclosure-risk; consent, access transparency, portability and rights handling;
and competency, training and capacity. A public-sector engagement scored on the
current eleven would be silent on three of seven, and by the module's own rules
that is `not-applicable`, never `0`.

Note also that these are **public-sector** obligations. DGIW's layer model is
core chassis + banking overlay; Pakistani federal government is a third context,
not the banking one.

## 5. What is substantively strong

- **Clause 12.3, access transparency** — the citizen's right to know *who inside
  Government* accessed their personal data, when, and for what purpose. Heavier
  than GDPR Article 15, and the most demanding technical obligation in the
  document: a per-subject, queryable access log across every public body.
- **Clause 12.5** — where a claim can be verified by zero-knowledge proof or
  selective disclosure, public bodies **shall not require** the underlying data.
  A mandatory PET obligation written as a prohibition, not a "should consider".
- **Clause 14.5 A** — a public PDA-maintained registry of automated
  decision-making systems with legal or similarly significant effect. Same family
  as EU AI Act Art. 71 and the Amsterdam/Helsinki algorithm registers.
- **Clauses 5.5, 6.3, 12.8** — federation as the architecture. Custody stays with
  the collecting body; coherence comes from common standards and governed
  exchange (WASL) rather than a central pool, with personal data explicitly not
  to be duplicated or centrally pooled. The Estonian X-Road model, and the
  bibliography names it.

The tension worth watching is **6.4 A Primary Data Registers against 6.3/12.8**.
A designated national register of natural persons is a central pool under another
name; the policy reconciles it by requiring other bodies to *consume* rather than
copy ("shall not maintain duplicate copies"). That reconciliation is sound in
principle and entirely dependent on WASL actually working.

## 6. Relationship to `complianceCatalogue.json`

The catalogue currently holds twelve instruments, three of them `PK` and all
three State Bank of Pakistan, all `force: "regulation"`. This policy would be the
fourth Pakistani instrument and the first non-SBP one — **but it cannot be added
today without misrepresenting it.**

`force` accepts `guidance`, `regulation`, `regulatory-standard`, `standard`. None
of those describes a proposed instrument pending Cabinet approval, and filing a
final draft as `regulation` is the fabrication shape this suite has a rule
against: an obligation a client is told they are subject to, that does not yet
bind them.

Two honest options when the time comes, in preference order:

1. **Add it on Gazette notification, as `regulation`, jurisdiction `PK`** with
   `sourceVerifiedOn` set to the date the gazetted text was read — not the date
   this draft was read. The gazetted text may differ.
2. If it is wanted in the catalogue *before* then, it needs a new `force` value
   (`proposed`) and a `reviewState` that says so, plus a `limitation` stating that
   no obligation arises until notification. That is a catalogue schema change,
   a gate change in `_assurance.mjs`, and a selftest row — not a data edit.

**Do not derive obligations from the supporting instruments.** They are named but
unwritten; a control mapped to `DNP-D.102 STD` today maps to a title, not a
requirement.

## 7. Defects in the source document

Reported because clause numbers are the citation surface, and a deliverable that
cites `6.4` is ambiguous:

1. **Two clause numbers are used twice.** `6.4 Authoritative source discipline`
   and `6.4 A Primary Data Registers`; `14.5 Procurement and assurance` and
   `14.5 A Algorithmic transparency`. Both are late insertions numbered to avoid
   renumbering. Clause 3.18 already cites the first as "clause 6.4A" while the
   heading reads "6.4 A" — two spellings of one reference.
2. **Annex II breaks its own rule.** It requires each instrument to be issued
   "under a **distinct** DNP-D series reference", then lists `DNP-D.100 STD`
   (Classification) beside `DNP-D.100 STR` (National Data Strategy), and
   `DNP-D.001 POL` (this policy) beside `DNP-D.001 FWK` (the Framework). Distinct
   only if the type suffix is part of the identity, which the sentence does not
   say.
3. **The metadata block cites the wrong document** — "in accordance with clause 13
   and Annex A.6 of DNP-X.001 FWK". Clause 13 here is cross-border transfer, and
   this policy's annexes are I, II and III. It reads as an uncorrected template
   reference.
4. **The review clause is stated twice**, identically, at 18.6 and Annex III.5.
   Duplication in a normative text is a divergence waiting for the first
   amendment.
5. **Terms carry obligations without definitions** — the National Data Catalogue
   (16.1), the National Open Data Portal (9.1), and data trusts and
   intermediaries (15.3) appear in no clause-3 definition.
6. **One dated obligation in the whole document.** Annex III.4 gives twelve months
   from the effective date to remediate existing processing contracts. Everything
   else is sequenced by a National Data Strategy that does not exist. There is
   also no funding provision: clause 16.4 requires the Agency CDO to have
   "sufficient authority, access, budget" without saying whose budget.
7. **Clause 3.14 attributes WASL's establishment to `DNP-D.002 RA`**, a reference
   architecture. Annex II gives the specification as `DNP-D.300 TS`. A reference
   architecture does not establish an exchange.

## 8. What would have to be true before the suite does anything

| Trigger | Action |
|---|---|
| Gazette notification | Re-read the gazetted text against this draft; then `complianceCatalogue.json` entry per §6 option 1 |
| `DNP-D.107 STD` publishes NDMI scoring | Re-run §4's crosswalk preconditions; author `CW-D-` entries only if the operator is a weighted mean |
| `DNP-D.102 STD` published | Compare against the 76 CDEs and 115 DQ rules; that instrument becomes the authoritative vocabulary for a Pakistani public-sector engagement |
| PDPL enacted | Clause 12 becomes assessable; the three unmapped NDMI dimensions become a real product gap |
| A public-sector engagement is actually in prospect | Decide whether a public-sector layer joins core/banking — not before |

Until at least the first two, the correct entry in any deliverable is that the
policy is **proposed, not in force**, and that its maturity instrument has no
published scoring scheme. Saying that is worth more to a client than a scorecard
against seven dimension names.

---

## What this assessment cannot tell you

It is a reading of one PDF. It has not been checked against the Gazette, against
the Digital Nation Pakistan Act 2025 as enacted, or against any PDA publication
on `standards.dnp.gov.pk` (clause 17.4's register of live instruments). It is not
legal advice and no obligation stated here has been confirmed with counsel. The
status finding in §1 rests entirely on the document's own metadata block and
Annex III.1 — if a gazette notification exists that this file does not mention,
§1 is wrong and everything downstream of it changes.
