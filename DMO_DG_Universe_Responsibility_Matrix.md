# PSW DMO — DG Universe Programme: Responsibility Matrix

**Source** — `DMO_DG_Universe_Program (Consolidated) P1 to P15 (1).docx`, Pakistan Single Window, Data Management Office, prepared for Omair Khan (CEDO), May 2026, marked Confidential. Converted from OOXML and read in full.

**Scope of this analysis** — read-only. It classifies what the document already says. It proposes no services, no scope and no pricing, and it does not assert who should supply any missing content.

## How each row was classified

| Class | Test | Evidence used |
|---|---|---|
| **PLATFORM** | PSW engineering builds or deploys it | the row's own `Type` (Build / Buy-Deploy / Configure) and the project's `Lead Team` |
| **CONTENT** | a document, dataset, rule set or definition must be **authored** before platform work has anything to execute | `Type = Process`, or a `Configure`/`Build` row whose description is a decision rather than a mechanism |
| **BOTH** | the row names a tool **and** the content it runs on, and the document does not separate them | a single row carrying an entity type / engine *and* the values that populate it |

`BOTH` is the class that matters. Every `BOTH` row is a place where a programme silently assumes the content exists, because the row will be reported complete when the tool ships.

---

## Summary of findings

| | |
|---|---|
| Deliverable rows classified | **160** (the cover says 120) |
| PLATFORM | **90** — 56.2% |
| CONTENT | **50** — 31.2% |
| BOTH — tool and content in one undivided row | **20** — 12.5% |
| **Content-bearing (CONTENT + BOTH)** | **70 of 160 — 43.8%** |
| Free variables with no artefact anywhere in the register | **9** |
| CONTENT/BOTH rows scheduled after a platform row that reads them | **14** (7 blocking) |
| CONTENT/BOTH rows with zero float against their consumer | **22** |
| DGIW pillars with no CONTENT deliverable at all | **1** — P02 Data Strategy & Business Alignment |
| Deliverable IDs used twice by different projects | **10** |

**The single finding worth most.** Nine executable checks in this programme run against a rule set,
threshold set, template or list that **no deliverable in any of the fifteen projects authors**. The
largest is the DQ rule library: DMO DataGuard is ranked #2 in the document's own tool-effectiveness
table, its whole purpose is to execute "every DQ rule registered in OpenMetadata", and P3's own scope
statement places *defining those rules* outside the project. There is no other project that picks them up.

**The second finding.** The 20 BOTH rows are where a programme silently assumes content exists. Each one
names a tool and the content it runs on in a single line with one type, one quarter and one owner. When
the tool ships, the row reports complete. Five of the twenty are in P10 (AI and RMS governance), four in
P08-pillar security and classification work, four in data quality.

---

## 1. The matrix

### P1 — OpenMetadata Platform Deployment

*Lead team (document): Data Platform + DG Lead · Duration: Months 1-3 · Phase 1 · 10 deliverables — PLATFORM 4 · CONTENT 6 · BOTH 0*

| ID | Deliverable | Doc `Type` | Q | Class | What must be authored / why |
|---|---|---|---|---|---|
| 1.1 | OpenMetadata Production Instance | Buy / Deploy | Q1 | **PLATFORM** | — |
| 1.2 | Oracle DWH Connector | Configure | Q1 | **PLATFORM** | — |
| 1.3 | OAS Connector | Configure | Q1 | **PLATFORM** | — |
| 1.4 | Governance Taxonomy | Process | Q1 | **CONTENT** | The classification tag values themselves (PII.Direct/Indirect, Sensitive.Financial/RiskProfile, Public, Restricted), the DQ risk-level bands and the DG Gate level definitions — a taxonomy, not a config file. |
| 1.5 | DMO Intelligence API | Build | Q1 | **PLATFORM** | — |
| 1.6 | Critical Asset Population | Process | Q2 | **CONTENT** | Owner, description, classification, DQ risk level and at least one DQ rule, authored per entity for the top 30 critical entities. |
| 1.7 | Business Glossary Structure | Process | Q2 | **CONTENT** | Glossary domain structure, term templates, the new-term submission workflow, and 50 drafted trade/customs KPI terms. |
| 1.8 | Metadata Completeness Baseline | Process | Q2 | **CONTENT** | The agreed target completeness thresholds (the baseline measurement is machine-produced; the thresholds are a decision). |
| 1.9 | Platform Operations Runbook | Process | Q2 | **CONTENT** | The operations runbook text: connector management, backup/recovery, user management, token rotation, escalation path. |
| 1.10 | Stakeholder Training | Process | Q2 | **CONTENT** | Training material and curriculum for DG, Data Products and Data Services. |

### P2 — Policy Sync Agent

*Lead team (document): Data Platform + DG Lead · Duration: Months 2-4 · Phase 2 · 7 deliverables — PLATFORM 6 · CONTENT 1 · BOTH 0*

| ID | Deliverable | Doc `Type` | Q | Class | What must be authored / why |
|---|---|---|---|---|---|
| 2.1 | Policy Sync Agent Core | Build | Q1 | **PLATFORM** | — |
| 2.2 | Oracle VPD Policy Generator | Build | Q2 | **PLATFORM** | — |
| 2.3 | OAS Security Sync Module | Build | Q2 | **PLATFORM** | — |
| 2.4 | Audit Event Logger | Build | Q2 | **PLATFORM** | — |
| 2.5 | Policy Conflict Detector | Build | Q2 | **PLATFORM** | — |
| 2.6 | Sync Dashboard in OpenMetadata | Build + Config | Q3 | **PLATFORM** | — |
| 2.7 | Manual Override Workflow | Process | Q3 | **CONTENT** | The emergency override procedure: who may invoke it, mandatory expiry rules, approver roles, audit obligations. |

### P3 — DMO DataGuard (DQ Execution Engine + DQ Passport)

*Lead team (document): Data Platform + DG Lead · Duration: Months 2-5 · Phase 2 · 9 deliverables — PLATFORM 7 · CONTENT 1 · BOTH 1*

| ID | Deliverable | Doc `Type` | Q | Class | What must be authored / why |
|---|---|---|---|---|---|
| 3.1 | DataGuard Core Engine | Build | Q1 | **PLATFORM** | — |
| 3.2 | OpenMetadata Test Suite Writer | Build | Q2 | **PLATFORM** | — |
| 3.3 | ClickUp Failure Task Creator | Build | Q2 | **PLATFORM** | — |
| 3.4 | ODI Pipeline Hold Trigger | Build | Q2 | **PLATFORM** | — |
| 3.5 | DG Gate DQ Enrichment | Build | Q2 | **PLATFORM** | — |
| 3.6 | Monthly DQ Scorecard Generator | Build | Q3 | **PLATFORM** | — |
| 3.7 | AI Readiness DQ Monitor | Build | Q3 | **PLATFORM** | — |
| 3.8 | DQ Rule Authoring Guide | Process | Q2 | **CONTENT** | The DQ rule authoring guide: rule syntax, threshold-setting method, failure-action selection, owner assignment. The rule set it teaches people to write is itself out of scope (see FREE VARIABLES). |
| 3.9 | DQ Passport Framework | Build + Config | Q3 | **BOTH** | Tool: a custom OpenMetadata entity type. Content: the fit-for-purpose certification matrix — which purposes exist, the DQ threshold per purpose, the expiry cycle, the steward narrative fields. |

### P4 — Lineage Publisher and Schema Change Control

*Lead team (document): Data Platform + Data Engineering · Duration: Months 3-6 · Phase 2 · 8 deliverables — PLATFORM 7 · CONTENT 1 · BOTH 0*

| ID | Deliverable | Doc `Type` | Q | Class | What must be authored / why |
|---|---|---|---|---|---|
| 4.1 | ODI Lineage Extractor | Build | Q2 | **PLATFORM** | — |
| 4.2 | Lineage Publisher Service | Build | Q2 | **PLATFORM** | — |
| 4.3 | OAS Lineage Mapper | Build | Q2 | **PLATFORM** | — |
| 4.4 | Schema Change Detector | Build | Q2 | **PLATFORM** | — |
| 4.5 | New Column Classification Gate | Build | Q3 | **PLATFORM** | — |
| 4.6 | Impact Analysis Report Generator | Build | Q3 | **PLATFORM** | — |
| 4.7 | Lineage Completeness Monitor | Build + Config | Q3 | **PLATFORM** | — |
| 4.8 | Schema Change Governance SOP | Process | Q2 | **CONTENT** | The schema change SOP: request process, mandatory impact-analysis step, DG Gate routing rules, post-change lineage verification. |

### P5 — Data Services Assistant and Business Glossary Engine

*Lead team (document): Data Products + DG Lead · Duration: Months 1-3 · Phase 1 · 8 deliverables — PLATFORM 6 · CONTENT 2 · BOTH 0*

| ID | Deliverable | Doc `Type` | Q | Class | What must be authored / why |
|---|---|---|---|---|---|
| 5.1 | Data Services Assistant Web App | Build | Q1 | **PLATFORM** | — |
| 5.2 | OpenMetadata Glossary API Integration | Build | Q1 | **PLATFORM** | — |
| 5.3 | OAS Report Suggester | Build | Q1 | **PLATFORM** | — |
| 5.4 | Missing Term Capture | Build | Q2 | **PLATFORM** | — |
| 5.5 | Query Frequency Analytics | Build | Q2 | **PLATFORM** | — |
| 5.6 | Slack / Teams Bot | Build | Q3 | **PLATFORM** | — |
| 5.7 | Initial 100 Glossary Terms | Process | Q1 | **CONTENT** | 100 business glossary terms: definition, formula, approved source, related report, common-misuse note — authored by the DG team with Data Services. |
| 5.8 | Data Services Usage Protocol | Process | Q1 | **CONTENT** | The Data Services operating protocol: Assistant search mandatory first step, referencing rule, missing-term flagging rule. |

### P6 — Access Request Portal and Purpose Registry

*Lead team (document): DG Lead + Data Platform · Duration: Months 3-6 · Phase 2 · 9 deliverables — PLATFORM 8 · CONTENT 0 · BOTH 1*

| ID | Deliverable | Doc `Type` | Q | Class | What must be authored / why |
|---|---|---|---|---|---|
| 6.1 | Access Request Portal Web App | Build | Q2 | **PLATFORM** | — |
| 6.2 | Classification-Based Routing Engine | Build | Q2 | **PLATFORM** | — |
| 6.3 | Automated Access Provisioning | Build | Q2 | **PLATFORM** | — |
| 6.4 | Access Audit Trail in OpenMetadata | Build | Q2 | **PLATFORM** | — |
| 6.5 | Purpose and Consent Registry | Build + Config | Q3 | **BOTH** | Tool: an OpenMetadata custom entity / tag-linked document. Content: the legal basis, collection purpose and permitted secondary uses, authored per PII and sensitive dataset, with legal and compliance. |
| 6.6 | Purpose Limitation Checker | Build | Q3 | **PLATFORM** | — |
| 6.7 | Access Expiry and Renewal Manager | Build | Q3 | **PLATFORM** | — |
| 6.8 | Access Inventory Dashboard | Build + Config | Q4 | **PLATFORM** | — |
| 6.9 | Ad-hoc Request Pre-Screener | Build | Q3 | **PLATFORM** | — |

### P7 — Inbound Data Contract Monitor and External Sharing Controller

*Lead team (document): Data Platform + DG Lead + Data Services · Duration: Months 4-7 · Phase 2 · 9 deliverables — PLATFORM 7 · CONTENT 0 · BOTH 2*

| ID | Deliverable | Doc `Type` | Q | Class | What must be authored / why |
|---|---|---|---|---|---|
| 7.1 | Inbound Feed Contract Registry | Build + Config | Q2 | **BOTH** | Tool: a custom entity type or structured tag. Content: per feed — the agreed delivery schedule, the agreed schema, the DQ thresholds, the named contact and the contract reference. None of that exists yet. |
| 7.2 | Feed Delivery Monitor | Build | Q3 | **PLATFORM** | — |
| 7.3 | Feed Schema Conformance Checker | Build | Q3 | **PLATFORM** | — |
| 7.4 | Supplier Performance Report | Build | Q3 | **PLATFORM** | — |
| 7.5 | DSA Registry | Build + Config | Q3 | **BOTH** | Tool: a custom OpenMetadata entity. Content: each DSA — covered datasets and columns, permitted use, signatory, dates. P7 puts legal drafting of DSAs out of scope, so the register has nothing to hold. |
| 7.6 | Export DSA Validator | Build | Q3 | **PLATFORM** | — |
| 7.7 | Data Export Controller | Build | Q4 | **PLATFORM** | — |
| 7.8 | DSA Expiry Alert Service | Build | Q4 | **PLATFORM** | — |
| 7.9 | Export Audit Trail | Build | Q4 | **PLATFORM** | — |

### P8 — Metadata Health Monitor and Retention Enforcement Agent

*Lead team (document): DG Lead + Data Platform · Duration: Months 4-7 · Phase 2 · 8 deliverables — PLATFORM 6 · CONTENT 2 · BOTH 0*

| ID | Deliverable | Doc `Type` | Q | Class | What must be authored / why |
|---|---|---|---|---|---|
| 8.1 | Metadata Health Monitor | Build | Q2 | **PLATFORM** | — |
| 8.2 | Staleness Detector | Build | Q3 | **PLATFORM** | — |
| 8.3 | Unclassified Column Alerter | Build | Q2 | **PLATFORM** | — |
| 8.4 | Retention Policy Registry | Process | Q3 | **CONTENT** | The retention schedule itself: a period per dataset and per classification tier, plus the retention-hold rules for DSA-obligated and regulatory data. P8 puts legal schedule definition out of scope. |
| 8.5 | Retention Enforcement Agent | Build | Q3 | **PLATFORM** | — |
| 8.6 | Deletion Approval Workflow | Build + Config | Q3 | **PLATFORM** | — |
| 8.7 | Monthly Data Lifecycle Report | Build | Q4 | **PLATFORM** | — |
| 8.8 | Metadata Health KPI in Executive Brief | Process | Q3 | **CONTENT** | The KPI definition and the 95% completeness target as an agreed standing measure in the executive brief. |

### P9 — Governed Handoff Contracts, Release Bot, GWE, Inception Gate

*Lead team (document): DG Lead + Data Products + Data Platform · Duration: Months 3-5 · Phase 2 · 10 deliverables — PLATFORM 8 · CONTENT 1 · BOTH 1*

| ID | Deliverable | Doc `Type` | Q | Class | What must be authored / why |
|---|---|---|---|---|---|
| 9.1 | ClickUp Webhook Listener | Build | Q2 | **PLATFORM** | — |
| 9.2 | Handoff Condition Validator | Build | Q2 | **PLATFORM** | — |
| 9.3 | ClickUp Stage Blocker | Build | Q2 | **PLATFORM** | — |
| 9.4 | Release Readiness Bot | Build | Q2 | **PLATFORM** | — |
| 9.5 | Release Approval Gate | Build | Q3 | **PLATFORM** | — |
| 9.6 | Governance Event Logger for Handoffs | Build | Q3 | **PLATFORM** | — |
| 9.7 | Readiness Dashboard | Build + Config | Q3 | **PLATFORM** | — |
| 9.8 | Handoff Requirements Matrix | Process | Q2 | **CONTENT** | The exact OpenMetadata fields required at each ClickUp stage transition, for each of the six value streams — the rule table 9.2 executes. |
| 9.9 | DMO Governance Workflow Engine (GWE) | Build + Config | Q3 | **BOTH** | Tool: the workflow engine (or Collate Workflow Builder). Content: the SOPs themselves as workflow templates for all six value streams, the approval-routing rules per risk tier, the SLA values. Nothing in the register authors an SOP body. |
| 9.10 | Product Inception Gate | Build | Q3 | **PLATFORM** | — |

### P10 — RMS Governance Module and AI Governance Engine

*Lead team (document): AI Enablement + DG Lead + Data Platform · Duration: Months 5-9 · Phase 3 · 12 deliverables — PLATFORM 6 · CONTENT 1 · BOTH 5*

| ID | Deliverable | Doc `Type` | Q | Class | What must be authored / why |
|---|---|---|---|---|---|
| 10.1 | RMS Entity Registry in OpenMetadata | Build + Config | Q3 | **BOTH** | Tool: a custom entity type. Content: the RMS rule and model inventory with RMC decision references, input dependencies and validation history — an authored register of what exists today. |
| 10.2 | RMS Five-Gate Change Workflow | Build + Config | Q3 | **BOTH** | Tool: the ClickUp workflow. Content: the pass criteria for each of the five gates, and the parallel-run validation standard. |
| 10.3 | AI Use Case Register | Build + Config | Q3 | **BOTH** | Tool: the intake form and entity. Content: the governance risk-level scheme and the oversight-tier vocabulary the form asks people to select from. |
| 10.4 | AI Data Readiness Checker | Build | Q3 | **PLATFORM** | — |
| 10.5 | Bias Risk and Oversight Classifier | Build + Config | Q3 | **BOTH** | Tool: the gate. Content: the criteria that make a use case Low/Medium/High bias risk and the rules assigning an oversight tier. The gate enforces a classification whose definition is unwritten. |
| 10.6 | Model Registry | Build + Config | Q4 | **BOTH** | Tool: the registry. Content: per model — monitoring thresholds, drift alert levels and retraining schedule, which are judgements not measurements. |
| 10.7 | Model Drift Monitor | Build | Q4 | **PLATFORM** | — |
| 10.8 | AI Governance Event Logger | Build | Q4 | **PLATFORM** | — |
| 10.9 | AI Readiness Executive View | Build | Q4 | **PLATFORM** | — |
| 10.10 | AI Practitioner Governance Certification | Process | Q4 | **CONTENT** | The competency standard and curriculum for AI practitioners: governance model, bias classification, oversight tiers, registry maintenance, drift duties. |
| 10.11 | AI Registration Completeness Gate | Build | Q3 | **PLATFORM** | — |
| 10.12 | AI Oversight Tier Assessment Gate | Build | Q4 | **PLATFORM** | — |

### P11 — Master Data Management

*Lead team (document): DG Lead + Data Platform + Data Engineering · Duration: Months 2-8 · Phase 1 · 16 deliverables — PLATFORM 8 · CONTENT 6 · BOTH 2*

| ID | Deliverable | Doc `Type` | Q | Class | What must be authored / why |
|---|---|---|---|---|---|
| 11.1 | Master Data Domain Analysis | Process | Q1 | **CONTENT** | The per-domain source analysis: attribute-by-attribute coverage, quality and frequency, and the conflict/duplicate patterns for each of the seven domains. |
| 11.2 | Survivorship Rule Definitions | Process | Q1 | **CONTENT** | Survivorship rules per domain per attribute: which source wins, tie-break logic, escalation path. This is the rule set 11.7 executes. |
| 11.3 | Entity Matching Design | Process | Q1 | **CONTENT** | The matching specification: deterministic rules (NTN, CNIC) and probabilistic rules (name similarity, address normalisation) with confidence bands. |
| 11.4 | Master Data Hub Schema Design | Process | Q1 | **CONTENT** | The Hub schema design document: golden record, provenance, match group, exception queue and audit tables per domain. |
| 11.5 | MDM Hub Tables in Oracle DWH | Build | Q2 | **PLATFORM** | — |
| 11.6 | Entity Matching Engine | Build | Q2 | **PLATFORM** | — |
| 11.7 | Survivorship Engine | Build | Q2 | **PLATFORM** | — |
| 11.8 | Initial Full Load | Build | Q2 | **PLATFORM** | — |
| 11.9 | Golden Record ID Publication | Build | Q2 | **PLATFORM** | — |
| 11.10 | OpenMetadata Master Entity Registration | Configure | Q2 | **BOTH** | Tool: OpenMetadata registration. Content: the domain owner, data steward, classification and DQ rule assignment decided per master entity — a Configure type over seven authored decisions. |
| 11.11 | Master Data DQ Rules in DataGuard | Build + Config | Q3 | **BOTH** | Tool: DataGuard execution. Content: the master-data DQ rule set — golden record uniqueness, mandatory attribute completeness, cross-domain referential integrity, survivorship conflict rate. |
| 11.12 | Exception Queue Management Tool | Build | Q3 | **PLATFORM** | — |
| 11.13 | Stewardship Process and SLAs | Process | Q3 | **CONTENT** | Steward review cadence per domain, exception-queue SLAs by confidence band, and the escalation path for unresolvable conflicts. |
| 11.14 | Incremental Refresh Pipeline | Build | Q3 | **PLATFORM** | — |
| 11.15 | RMS Golden Record Integration | Build + Config | Q4 | **PLATFORM** | — |
| 11.16 | MDM Governance Policy | Process | Q4 | **CONTENT** | The MDM governance policy: domain ownership, stewardship duties, survivorship principles, change control for survivorship rules, onboarding requirements for new consumers. |

### P11 (continued) — Reference Data Management  [rows numbered 12.x]

*Lead team (document): DG Lead + Data Platform · Duration: Months 2-6 · Phase 1 · 14 deliverables — PLATFORM 9 · CONTENT 2 · BOTH 3*

| ID | Deliverable | Doc `Type` | Q | Class | What must be authored / why |
|---|---|---|---|---|---|
| 12.1 | Reference Data Inventory | Process | Q1 | **CONTENT** | The reference data inventory: for every code list — where it lives, who maintains it, which systems consume it, last update, and known cross-system version inconsistencies. |
| 12.2 | Reference Data Registry Schema | Build | Q1 | **PLATFORM** | — |
| 12.3 | Initial Load of All Ten Domains | Build | Q1 | **PLATFORM** | — |
| 12.4 | OpenMetadata Reference Data Registration | Configure | Q2 | **BOTH** | Tool: OpenMetadata registration. Content: owner, steward, classification and consumer lineage decided per code list. |
| 12.5 | Versioned Reference Data Views | Build | Q2 | **PLATFORM** | — |
| 12.6 | Reference Data Change Management Process | Process | Q2 | **CONTENT** | The change management SOP: change request form, DG Gate Level 2 review, approval with effective date, distribution trigger, version update rules, and the Level 1/3 tiering. |
| 12.7 | ODI Distribution Pipelines | Build | Q2 | **PLATFORM** | — |
| 12.8 | Reference Data API | Build | Q2 | **PLATFORM** | — |
| 12.9 | Reference Data Drift Detector | Build | Q2 | **PLATFORM** | — |
| 12.10 | Exchange Rate Daily Feed | Build | Q2 | **PLATFORM** | — |
| 12.11 | HS Code Annual Revision Manager | Build + Config | Q3 | **BOTH** | Tool: the revision manager service. Content: the old-code-to-new-code mapping for each HS edition and the revision SOP with its 6-week planning window — both authored per revision. |
| 12.12 | RMS Reference Data Integration | Build + Config | Q3 | **PLATFORM** | — |
| 12.13 | OpenMetadata Dependency Mapping | Configure | Q3 | **BOTH** | Tool: OpenMetadata link configuration. Content: the dependency relation itself — which glossary term, DQ rule and design sheet depends on which code list. No dataset carries this; someone must assert every edge. |
| 12.14 | Reference Data Health Dashboard | Build + Config | Q3 | **PLATFORM** | — |

### P12 — TDX (Trade Data Exchange)

*Lead team (document): DMO DG Lead + Data Products + Data Platform · Duration: Months 1-3 · Phase 1 · 10 deliverables — PLATFORM 1 · CONTENT 7 · BOTH 2*

| ID | Deliverable | Doc `Type` | Q | Class | What must be authored / why |
|---|---|---|---|---|---|
| 12.1 | Current State Data Sharing Assessment | Process | Q1 | **CONTENT** | The current-state inventory: every existing and planned sharing arrangement — agency, data, purpose, granularity, mechanism, approval status, owner. |
| 12.2 | TDX CDE Identification | Process | Q1 | **CONTENT** | Per TDX product: the CDE list, fields excluded, grain, aggregation logic, PII status and classification tier. |
| 12.3 | TDX CDE Classification | Configure | Q1 | **CONTENT** | The classification decision for every TDX CDE across four tiers. The Configure type is the tagging mechanism; the deliverable is the judgement, and P2 only enforces what has already been decided. |
| 12.4 | CDE Glossary | Process | Q1 | **CONTENT** | The CDE Glossary: business definition, calculation logic, grain, source table, known limitations and approved version for every metric and dimension in a TDX product. |
| 12.5 | CDE Access Control Matrix | Process | Q1 | **CONTENT** | The access control matrix: product tier, CDEs included, columns masked or excluded, DSA requirement, DG Gate level, approved consumer list, delivery channel. |
| 12.6 | DQ Passport Certification for TDX Products | Build + Config | Q2 | **BOTH** | Tool: DataGuard execution of the passport. Content: per-product dimension thresholds, known-limitation narrative, steward sign-off and expiry policy. |
| 12.7 | DSA Registry in OpenMetadata | Configure | Q2 | **BOTH** | Tool: OpenMetadata entity registration. Content: each DSA — agency, products, authorised columns, purpose, dates, signatory. Legal review and signing are declared out of scope, so the content has no owner in this programme. |
| 12.8 | Migration Plan — Current Sharing Mechanisms | Process | Q2 | **CONTENT** | The migration plan for all five current sharing mechanisms, with stop dates and repointing steps. |
| 12.9 | Consumer Onboarding Process | Process | Q2 | **CONTENT** | The consumer onboarding SOP: DSA first, tier and product assignment, gate completion, channel provisioning, monitoring activation. |
| 12.10 | TDX Usage and Audit Dashboard | Build + Config | Q2 | **PLATFORM** | — |

### P13 — Establish DG Council

*Lead team (document): CEDO + DMO DG Lead · Duration: Months 1-3 · Phase 1 · 8 deliverables — PLATFORM 0 · CONTENT 7 · BOTH 1*

| ID | Deliverable | Doc `Type` | Q | Class | What must be authored / why |
|---|---|---|---|---|---|
| 13.1 | DGC Office Memo and Constitution | Process | Q1 | **CONTENT** | The office memo constituting the Council: membership list, quorum, meeting frequency, authority scope. |
| 13.2 | DGC Membership Register in OpenMetadata | Configure | Q1 | **CONTENT** | The membership roster and per-member domain responsibility. The OpenMetadata registration is trivial; the roster is the deliverable. |
| 13.3 | Conflict Resolution Framework | Process | Q1 | **CONTENT** | The conflict resolution framework: escalation trigger, resolution process and outcome format for each of definitional conflicts, resource disputes and policy disagreements. |
| 13.4 | Secretariat Operating Procedure | Process | Q1 | **CONTENT** | The secretariat SOP: notice period, agenda structure, mandatory agenda items, attendee management, minutes and distribution. |
| 13.5 | DGC Meeting Template Pack | Process | Q1 | **CONTENT** | The template pack: announcement, minutes, action register, escalation request form. |
| 13.6 | PMO Integration for DGC-Initiated Projects | Process | Q1 | **CONTENT** | The PMO handover process definition: 5-day handover rule, PM assignment, tracking and report-back cadence. |
| 13.7 | DGC Decision and Escalation Log | Build + Config | Q1 | **BOTH** | Tool: the ClickUp register linked to OpenMetadata governance events. Content: the decision-log schema and the classification of what constitutes a Council decision versus an action point. |
| 13.8 | First DGC Meeting — Facilitation and Baseline Agenda | Process | Q2 | **CONTENT** | The baseline agenda and the prioritised list of cross-departmental definitional conflicts to be tabled. |

### P14 — DG Shield on Data Products

*Lead team (document): DG Lead + Data Products + Data Platform · Duration: Months 2-8 · Phase 2 · 12 deliverables — PLATFORM 5 · CONTENT 6 · BOTH 1*

| ID | Deliverable | Doc `Type` | Q | Class | What must be authored / why |
|---|---|---|---|---|---|
| 14.1 | Data Product CDE Inventory | Process | Q1 | **CONTENT** | Per data product: every CDE with field name, business definition, source table, classification tier, data type, known quality issues and glossary-term status. |
| 14.2 | CDE Classification in OpenMetadata | Configure | Q1 | **CONTENT** | The classification decision for every CDE against the six-value PSW taxonomy. Configure is the tagging step; the decision is the work. |
| 14.3 | CDE Glossary — Data Products | Process | Q2 | **CONTENT** | The data-product CDE Glossary: definition, calculation logic, grain, source, limitations, owner, approved version, effective date. |
| 14.4 | CDE Access Control Matrix — Data Products | Process | Q2 | **CONTENT** | The product access control matrix: CDE set, tier per CDE, consumer entitlement conditions, masked columns per tier, approved channels. |
| 14.5 | DG Shield — Product Inception Gate Integration | Build + Config | Q2 | **PLATFORM** | — |
| 14.6 | DG Shield — DQ Passport Enforcement | Build + Config | Q2 | **PLATFORM** | — |
| 14.7 | DG Shield — Inbound Contract Extension (P7 Integration) | Build + Config | Q3 | **BOTH** | Tool: the P7 integration. Content: CDE identification and a classification decision for every upstream feed — an authoring job on someone else's data, with no upstream system change to hide behind. |
| 14.8 | DG Shield — External Sharing Controller Extension (P7 Integration) | Build + Config | Q3 | **PLATFORM** | — |
| 14.9 | DG Shield Compliance Monitor | Build | Q3 | **PLATFORM** | — |
| 14.10 | Shield Remediation Workflow | Process | Q3 | **CONTENT** | The remediation policy: 48-hour acknowledgement SLA, 10-day deadline, escalation ladder to DG Lead and CEDO at 20 days. |
| 14.11 | DG Shield Dashboard | Build + Config | Q4 | **PLATFORM** | — |
| 14.12 | DG Shield Governance Policy | Process | Q4 | **CONTENT** | The Shield governance policy: what a shielded product is, the four Shield conditions, consequences of non-compliance, remediation process, DGC escalation path, applicability outside DMO. |

### P15 — Architecture Alignment with Data Governance

*Lead team (document): CEDO + DG Lead + Data Architecture · Duration: Months 3-6 · Phase 3 · 10 deliverables — PLATFORM 2 · CONTENT 7 · BOTH 1*

| ID | Deliverable | Doc `Type` | Q | Class | What must be authored / why |
|---|---|---|---|---|---|
| 15.1 | Enterprise Data Architecture Standard | Process | Q2 | **CONTENT** | The Enterprise Data Architecture Standard: layering, OLTP-to-unified-model conversion rules, domain alignment with MDM/RDM, surrogate key design, historical record management. |
| 15.2 | DG Application Review Checklist | Process | Q2 | **CONTENT** | The application review checklist — sixteen named assessment areas from encryption capability to data subject consent features. |
| 15.3 | DG Architecture Review Process | Process | Q2 | **CONTENT** | The review SOP: trigger conditions, submission route, 10-day SLA, the three outcome states, condition tracking and registration rules. |
| 15.4 | Application Architecture Inventory in OpenMetadata | Configure | Q2 | **BOTH** | Tool: OpenMetadata registration. Content: the application inventory itself — owner, domains touched, classification of data processed, integration points, known governance gaps, per application. |
| 15.5 | Data Acquisition Standards Register | Process | Q3 | **CONTENT** | The acquisition standards register: approved modes, governance requirement per mode, deviation approval process, DGC escalation trigger. |
| 15.6 | Data Dissemination Standards Register | Process | Q3 | **CONTENT** | The dissemination standards register: approved modes, DSA obligations, access control and audit requirements, DGC approval conditions. |
| 15.7 | MDM and RDM Architecture Alignment Review | Process | Q3 | **CONTENT** | The alignment review criteria: what counts as a duplicate surrogate key, a local code table for a governed domain, or a layering violation. |
| 15.8 | Architecture Conflict Escalation Pathway | Process | Q3 | **CONTENT** | The escalation pathway definition: conflict identification criteria, brief format, submission route, direction publication as standard amendments. |
| 15.9 | Architecture Compliance Monitor | Build + Config | Q4 | **PLATFORM** | — |
| 15.10 | Architecture Governance Health Dashboard | Build + Config | Q4 | **PLATFORM** | — |

---

## 2 (a). Counts

### Overall

| Class | Count | Share |
|---|---:|---:|
| PLATFORM | 90 | 56.2% |
| CONTENT | 50 | 31.2% |
| BOTH | 20 | 12.5% |
| **Total deliverable rows** | **160** | |

CONTENT and BOTH together are **70 of 160 rows (43.8%)** — that is the share of the programme that cannot start with an engineer.

### Per project

| Project | Rows | PLATFORM | CONTENT | BOTH | Content-bearing share |
|---|---:|---:|---:|---:|---:|
| P1 | 10 | 4 | 6 | 0 | 60% |
| P2 | 7 | 6 | 1 | 0 | 14% |
| P3 | 9 | 7 | 1 | 1 | 22% |
| P4 | 8 | 7 | 1 | 0 | 12% |
| P5 | 8 | 6 | 2 | 0 | 25% |
| P6 | 9 | 8 | 0 | 1 | 11% |
| P7 | 9 | 7 | 0 | 2 | 22% |
| P8 | 8 | 6 | 2 | 0 | 25% |
| P9 | 10 | 8 | 1 | 1 | 20% |
| P10 | 12 | 6 | 1 | 5 | 50% |
| P11 | 16 | 8 | 6 | 2 | 50% |
| P11 (continued) | 14 | 9 | 2 | 3 | 36% |
| P12 | 10 | 1 | 7 | 2 | 90% |
| P13 | 8 | 0 | 7 | 1 | 100% |
| P14 | 12 | 5 | 6 | 1 | 58% |
| P15 | 10 | 2 | 7 | 1 | 80% |
| **Total** | **160** | **90** | **50** | **20** | **44%** |

---

## 2 (b). Content scheduled behind the platform that consumes it

This is the AR-11 shape: an executable check with a free variable and no artefact binding it. Three tiers, ordered by severity.

### B1 — Free variables with no artefact anywhere in the register (9)

These are the strongest findings. In each case a **Build** deliverable executes against a rule set, threshold set, template or list, and **no deliverable in any of the 160 rows authors it**. Verified by reading all 160 names and descriptions, not by keyword match.

#### The DQ rule set

| | |
|---|---|
| **Consumed by** | P3:3.1 DataGuard Core Engine (Build, Q1) — "reads every DQ rule registered in OpenMetadata" |
| **Authored by** | *nothing in the register* |
| **Document's own words** | P3 In/Out of Scope: **"Defining DQ rules in OpenMetadata (DG team responsibility)"**. 1.6 requires "at least one DQ rule" for the top 30 entities only; 3.8 is a guide on how to write them. No deliverable produces the rule library. |
| **Why it matters** | The single most consequential one. DataGuard is ranked #2 in the document's own tool-effectiveness table and is the tool the credibility loop (R2) turns on. It executes a set that nothing in 160 rows authors. |

#### The ten-point operational readiness checklist

| | |
|---|---|
| **Consumed by** | P9:9.4 Release Readiness Bot (Build, Q2) — "checks all ten readiness checklist items in ClickUp" |
| **Authored by** | *nothing in the register* |
| **Document's own words** | P9 Out of Scope: **"Defining the readiness checklist (Project 1 process)"**. P1 carries ten deliverables, 1.1–1.10, and **none of them is a readiness checklist**. The attribution points at a project that does not hold the item. |
| **Why it matters** | A dangling attribution, not merely an omission — the reader is told where it lives, and it is not there. |

#### AI readiness DQ thresholds

| | |
|---|---|
| **Consumed by** | P3:3.7 AI Readiness DQ Monitor (Build, Q3) and P10:10.4 AI Data Readiness Checker (Build, Q3) — both "check against AI readiness thresholds defined in OpenMetadata" |
| **Authored by** | *nothing in the register* |
| **Document's own words** | No deliverable in any project defines those thresholds. Two independently built services both read a value set that nothing writes. |
| **Why it matters** | Two consumers, zero producers. The gate that stalls an AI use case at Data Assessment turns on a number nobody has been asked to choose. |

#### Masking rules

| | |
|---|---|
| **Consumed by** | P7:7.7 Data Export Controller (Build, Q4) — "applies masking rules from OpenMetadata" |
| **Authored by** | *nothing in the register* |
| **Document's own words** | The classification taxonomy (1.4) defines tags. No deliverable defines what masking each tag implies. |
| **Why it matters** | Column exclusion is derived from tags; masking is not. The export controller is the last gate before data leaves PSW. |

#### The Data Sharing Agreements themselves

| | |
|---|---|
| **Consumed by** | P7:7.5 DSA Registry (Build+Config, Q3), P7:7.6 Export DSA Validator (Build, Q3), P12:12.7 DSA Registry in OpenMetadata (Configure, Q2) |
| **Authored by** | *nothing in the register* |
| **Document's own words** | P7 Out of Scope: "Legal drafting of DSAs (legal team responsibility)". P12 Out of Scope: "Legal review and signing of DSA terms (Legal)". Both projects register DSAs; neither produces one, and no other project does either. |
| **Why it matters** | Three deliverables read the DSA register. The register is empty until a party outside the programme acts, and the programme names no trigger, date or owner for that. |

#### SOP bodies for the Governance Workflow Engine

| | |
|---|---|
| **Consumed by** | P9:9.9 GWE (Build+Config, Q3) — "SOP templates as executable workflows for all six value streams and governance processes" |
| **Authored by** | *nothing in the register* |
| **Document's own words** | The engine executes SOPs. The SOPs for the six value streams are authored by no deliverable. 9.8 authors the handoff *field requirements*, which is a different artefact. |
| **Why it matters** | The document's own systems analysis ranks GWE #4 and says "SOPs as executable workflows eliminate the gap between governance intent and governance execution". The intent side is unwritten. |

#### Bias risk and oversight tier criteria

| | |
|---|---|
| **Consumed by** | P10:10.5 Bias Risk and Oversight Classifier (Build+Config, Q3) and P10:10.12 AI Oversight Tier Assessment Gate (Build, Q4) |
| **Authored by** | *nothing in the register* |
| **Document's own words** | The gate blocks a transition when risk is High and tier is Automated. Nothing defines what makes a use case High, or which tier a given risk profile warrants. 10.10 teaches practitioners to apply criteria that do not exist. |
| **Why it matters** | 10.12 states the gate "cannot be bypassed by changing the ClickUp task status manually". A non-bypassable gate on an undefined predicate. |

#### The Product Design Sheet template

| | |
|---|---|
| **Consumed by** | P9:9.10 Product Inception Gate (Build, Q3) — "assigns a template in ClickUp with pre-filled fields" |
| **Authored by** | *nothing in the register* |
| **Document's own words** | The auto-population logic is built; the template it fills is authored nowhere. The systems analysis credits this template with cutting brief creation "from 3 days to 30 minutes". |
| **Why it matters** | A quantified benefit attached to an unauthored artefact. |

#### The seven TDX certified data products

| | |
|---|---|
| **Consumed by** | P12:12.2 TDX CDE Identification (Process, Q1) — "For each of the seven TDX certified data products…" |
| **Authored by** | *nothing in the register* |
| **Document's own words** | The seven products are referenced throughout P12 as an existing set. No deliverable in P12 or anywhere else defines what the seven are, and P12 In Scope does not include building them. |
| **Why it matters** | Every P12 deliverable is scoped per product. The product list is the free variable underneath all ten. |

### B2 — Strict quarter inversions: CONTENT/BOTH scheduled after a PLATFORM row that reads it

Computed by comparing each content-bearing row's `Quarter` against the `Quarter` of the platform deliverable(s) that consume it. The **Verdict** column is a judgement and is labelled as such: *Blocking* means the platform row cannot do its stated job, *Partial* means it runs but ungoverned, *Trailing* means documentation legitimately following a build.

| ID | Deliverable | Class | Q | Consumed by (earlier) | Lag | Verdict | Reason |
|---|---|---|---|---|---|---|---|
| P2:2.7 | Manual Override Workflow | CONTENT | Q3 | P2:2.1 Q1; P2:2.2 Q2 | 2Q | Partial | The override *capability* exists in the agent from Q1; the procedure governing who may use it and with what expiry arrives in Q3. Two quarters of ungoverned override. |
| P11:11.11 | Master Data DQ Rules in DataGuard | BOTH | Q3 | P3:3.1 Q1 | 2Q | **Blocking** | DataGuard core is Q1; the master-data rule set it must execute is Q3. The engine has no master-data rules to run for two quarters. |
| P11:11.16 | MDM Governance Policy | CONTENT | Q4 | P11:11.5 Q2; P11:11.7 Q2 | 2Q | Partial | The Hub and survivorship engine are Q2; the policy setting change control over survivorship rules is Q4. Rules can move for two quarters with no change control. |
| P14:14.12 | DG Shield Governance Policy | CONTENT | Q4 | P14:14.5 Q2; P14:14.6 Q2; P14:14.8 Q3; P14:14.9 Q3 | 2Q | **Blocking** | Shield enforcement blocks product distribution from Q2 (14.5, 14.6) and Q3 (14.8, 14.9). The policy defining what a shielded product is, and what non-compliance costs, is Q4. |
| P1:1.6 | Critical Asset Population | CONTENT | Q2 | P2:2.1 Q1; P3:3.1 Q1 | 1Q | **Blocking** | The Policy Sync Agent (2.1) and DataGuard (3.1) both read classification and DQ-rule metadata for the critical entities. Q1 code, Q2 metadata. |
| P1:1.7 | Business Glossary Structure | CONTENT | Q2 | P5:5.1 Q1; P5:5.2 Q1 | 1Q | **Blocking** | The Assistant web app and its glossary integration ship in Q1 against a glossary structure and term template that arrive in Q2 — and 5.7 authors 100 terms in Q1, into a structure that does not exist yet. |
| P1:1.9 | Platform Operations Runbook | CONTENT | Q2 | P1:1.1 Q1 | 1Q | Trailing | A runbook written after the platform is live is the normal order. Recorded for completeness. |
| P1:1.10 | Stakeholder Training | CONTENT | Q2 | P1:1.1 Q1; P1:1.2 Q1 | 1Q | Trailing | Training after deployment is the normal order. |
| P3:3.8 | DQ Rule Authoring Guide | CONTENT | Q2 | P3:3.1 Q1 | 1Q | **Blocking** | DataGuard executes rules in Q1; the guide telling the DG team how to write them lands in Q2 — and the rule set itself is out of scope entirely (see B1). |
| P3:3.9 | DQ Passport Framework | BOTH | Q3 | P12:12.6 Q2; P14:14.6 Q2 | 1Q | **Blocking** | The DQ Passport framework is Q3, but TDX 12.6 certifies TDX products with a passport in Q2 and Shield 14.6 enforces passport currency in Q2. Two Q2 deliverables consume a Q3 artefact. |
| P8:8.8 | Metadata Health KPI in Executive Brief | CONTENT | Q3 | P8:8.1 Q2 | 1Q | Trailing | The KPI definition follows the monitor that produces it. |
| P10:10.10 | AI Practitioner Governance Certification | CONTENT | Q4 | P10:10.3 Q3; P10:10.5 Q3 | 1Q | Partial | The AI use case register (10.3) and the bias/oversight classifier (10.5) are operated from Q3 by practitioners whose competency standard is authored in Q4. |
| P11:11.13 | Stewardship Process and SLAs | CONTENT | Q3 | P11:11.8 Q2 | 1Q | **Blocking** | The initial full load (11.8, Q2) populates the exception queue. The steward cadence, SLAs and escalation path that make the queue workable are Q3. |
| RDM:12.11 | HS Code Annual Revision Manager | BOTH | Q3 | RDM:12.7 Q2 | 1Q | Partial | Distribution pipelines run from Q2; the HS revision mapping and SOP are Q3. The first revision inside that window has no governed path. |

**14 strict inversions. 7 are blocking**, 4 are partial, 3 are documentation trailing a build.

### B3 — Zero-slack: content and the platform that reads it land in the same quarter

Not an inversion, but no float. Every one of these requires the authoring to finish inside the same quarter as the build that consumes it, and the plan records no ordering within a quarter.

| ID | Deliverable | Class | Q | Consumed in the same quarter by |
|---|---|---|---|---|
| P1:1.4 | Governance Taxonomy | CONTENT | Q1 | P2:2.1 Q1 |
| P1:1.8 | Metadata Completeness Baseline | CONTENT | Q2 | P8:8.1 Q2 |
| P4:4.8 | Schema Change Governance SOP | CONTENT | Q2 | P4:4.4 Q2 |
| P5:5.7 | Initial 100 Glossary Terms | CONTENT | Q1 | P5:5.1 Q1; P5:5.2 Q1; P5:5.3 Q1 |
| P5:5.8 | Data Services Usage Protocol | CONTENT | Q1 | P5:5.1 Q1 |
| P6:6.5 | Purpose and Consent Registry | BOTH | Q3 | P6:6.6 Q3; P6:6.9 Q3 |
| P7:7.5 | DSA Registry | BOTH | Q3 | P7:7.6 Q3 |
| P8:8.4 | Retention Policy Registry | CONTENT | Q3 | P8:8.5 Q3; P8:8.6 Q3 |
| P9:9.8 | Handoff Requirements Matrix | CONTENT | Q2 | P9:9.2 Q2; P9:9.3 Q2 |
| P10:10.1 | RMS Entity Registry in OpenMetadata | BOTH | Q3 | P10:10.2 Q3 |
| P10:10.3 | AI Use Case Register | BOTH | Q3 | P10:10.4 Q3; P10:10.11 Q3 |
| P10:10.6 | Model Registry | BOTH | Q4 | P10:10.7 Q4 |
| RDM:12.1 | Reference Data Inventory | CONTENT | Q1 | RDM:12.2 Q1; RDM:12.3 Q1 |
| RDM:12.4 | OpenMetadata Reference Data Registration | BOTH | Q2 | RDM:12.9 Q2 |
| RDM:12.6 | Reference Data Change Management Process | CONTENT | Q2 | RDM:12.5 Q2; RDM:12.7 Q2 |
| RDM:12.13 | OpenMetadata Dependency Mapping | BOTH | Q3 | RDM:12.11 Q3; RDM:12.14 Q3 |
| P12:12.3 | TDX CDE Classification | CONTENT | Q1 | P2:2.1 Q1 |
| P12:12.6 | DQ Passport Certification for TDX Products | BOTH | Q2 | P14:14.6 Q2 |
| P13:13.8 | First DGC Meeting — Facilitation and Baseline Agenda | CONTENT | Q2 | P5:5.5 Q2 |
| P14:14.2 | CDE Classification in OpenMetadata | CONTENT | Q1 | P2:2.1 Q1 |
| P14:14.7 | DG Shield — Inbound Contract Extension (P7 Integration) | BOTH | Q3 | P7:7.2 Q3; P7:7.3 Q3 |
| P14:14.10 | Shield Remediation Workflow | CONTENT | Q3 | P14:14.9 Q3 |

**22 rows.**

### B4 — The same shape at project level, in the document's own phasing

| Finding | Evidence |
|---|---|
| **P12 (TDX) is a Phase 1 project that depends on a Phase 2 project.** | P12's own header: *"Dependencies P1 (OpenMetadata live), P2 (classification enforced), **P7** (Inbound Contract Monitor and External Sharing Controller **active**)"*. The phasing page puts P12 in Phase 1, Months 1–3, starting Month 1. P7 is Phase 2, Months 4–7. P12 must finish one month before its declared dependency starts. |
| It contradicts the document's own stated rule. | The phasing page states: *"Phase boundary rule: No Phase 2 project begins before its declared Phase 1 dependencies have reached their Q1 milestone."* The rule is written for the Phase-1→Phase-2 direction only, and P12 breaks it in the direction the rule does not cover. |
| **P14 14.5 integrates in Q2 with a gate delivered in Q3.** | 14.5 is *"Integration with P9-9.10 (Product Inception Gate)"*, Q2. P9-9.10 is Q3. |
| **P14 14.8 extends in Q3 a controller delivered in Q4.** | 14.8 is *"Extension of Shield enforcement to the External Sharing Controller"*, Q3. P7-7.7 Data Export Controller is Q4. |
| P13 is declared a prerequisite for everything and cited by one project. | P13 header: *"Dependencies None — prerequisite for all other projects"*. Only P15 lists P13 in its own dependencies. The programme dependency table gives P13 "Enables: All projects" and no other project's header names it. |

---

## 2 (c). DGIW pillar placement for the content

The eleven pillars are the DGIW capability model (`src/dgiw/data/pillars.json`). Each CONTENT row is placed under exactly one; each BOTH row is placed by its **embedded content**, not by its tool.

| Pillar | | CONTENT | BOTH | Deliverables |
|---|---|---:|---:|---|
| **P01** | Governance & Operating Model | 16 | 2 | P5:5.8, P9:9.8, P9:9.9, P11:11.13, P11:11.16, P12:12.8, P12:12.9, P13:13.1, P13:13.2, P13:13.3, P13:13.4, P13:13.5, P13:13.6, P13:13.7, P13:13.8, P14:14.10, P14:14.12, P15:15.8 |
| **P02** | Data Strategy & Business Alignment | 0 | 0 | **— none —** |
| **P03** | Data Architecture & Modelling | 7 | 1 | P11:11.4, P15:15.1, P15:15.2, P15:15.3, P15:15.4, P15:15.5, P15:15.6, P15:15.7 |
| **P04** | Metadata & Business Glossary | 9 | 0 | P1:1.6, P1:1.7, P1:1.8, P5:5.7, P8:8.8, P12:12.2, P12:12.4, P14:14.1, P14:14.3 |
| **P05** | Data Quality Management | 1 | 4 | P3:3.8, P3:3.9, P7:7.1, P11:11.11, P12:12.6 |
| **P06** | Master & Reference Data | 5 | 3 | P11:11.1, P11:11.2, P11:11.3, P11:11.10, RDM:12.1, RDM:12.4, RDM:12.6, RDM:12.11 |
| **P07** | Lineage & Traceability | 1 | 1 | P4:4.8, RDM:12.13 |
| **P08** | Security, Privacy & Classification | 7 | 4 | P1:1.4, P2:2.7, P6:6.5, P7:7.5, P12:12.1, P12:12.3, P12:12.5, P12:12.7, P14:14.2, P14:14.4, P14:14.7 |
| **P09** | Data Lifecycle & Retention | 1 | 0 | P8:8.4 |
| **P10** | Platform, Integration & Automation | 2 | 0 | P1:1.9, P1:1.10 |
| **P11** | Analytics, AI & Consumption Governance | 1 | 5 | P10:10.1, P10:10.2, P10:10.3, P10:10.5, P10:10.6, P10:10.10 |

### Pillars the programme leaves with no CONTENT deliverable at all

**P02 — Data Strategy & Business Alignment: zero.** No row in the register authors anything that sits here.

This is the pillar that ties governance work to funded business outcomes. The programme has a systems analysis arguing the economics of productisation, and a Deliverable Summary by Type — but no numbered deliverable produces a value case, a benefits baseline, a prioritised business-outcome map, or a funding argument. The nearest thing in the document is the "How to Make Product Cost Lower Than Ad-hoc Cost" page, which is narrative in the front matter and carries no deliverable ID, no owner, no type and no quarter. Its own strongest recommendation — *"Log actual analyst time on every ad-hoc response. After 3 months, show leadership the hours consumed. That number is the productisation business case"* — is not a deliverable in any of the fifteen projects.

### Pillars carried by a single content deliverable

| Pillar | | Sole CONTENT row | Exposure |
|---|---|---|---|
| **P05** | Data Quality Management | P3:3.8 DQ Rule Authoring Guide | Data Quality Management is the pillar the whole programme rests on — DataGuard is ranked #2 in the document's own leverage table. Its only CONTENT row is a *guide to writing rules*. The rules themselves are the first free variable in B1. |
| **P07** | Lineage & Traceability | P4:4.8 Schema Change Governance SOP | P4 carries seven PLATFORM rows (4.1–4.7) and exactly one authored artefact: a schema-change SOP. |
| **P09** | Data Lifecycle & Retention | P8:8.4 Retention Policy Registry | Data Lifecycle & Retention: one retention schedule, against three Build rows that archive and delete. P8 puts the legal retention schedule out of scope. |
| **P11** | Analytics, AI & Consumption Governance | P10:10.10 AI Practitioner Governance Certification | Analytics, AI & Consumption Governance: one CONTENT row (a competency standard) against five BOTH rows whose embedded content — risk schemes, gate criteria, drift thresholds — is unwritten. |

---

## 2 (d). The document's own defects — measured, not assumed

Every figure below was extracted from `word/document.xml` and counted by script. Where the document and
the count disagree, the count is stated and the diagnosis given.

### D1. The cover says 12 projects and 120 deliverables. There are 15 and 160.

| | Cover claim | Measured |
|---|---:|---:|
| Projects | **12** | **15** (P1–P15), plus a sixteenth deliverable set carried as "P11 (continued)" |
| Deliverables | **120** | **160** numbered rows |

The overview paragraph repeats it and its own table refutes it in the next line: *"The **twelve** projects
below constitute the complete Integrated Data Governance Program"* — above a table with **15 rows**,
P1 through P15.

**The diagnosis is exact, and it is not a rounding error.** Count the rows for P1 through P11 including
the Reference Data Management pages:

```
P1  10   P2   7   P3   9   P4   8   P5   8   P6   9
P7   9   P8   8   P9  10   P10 12   P11 16   RDM 14      =  120
```

**Exactly 120.** And if Reference Data Management is counted as its own project — which is what its
deliverable numbering says it once was — that is **exactly 12 projects**. The cover is a correct
description of an earlier programme. P12 (TDX), P13 (DG Council), P14 (DG Shield) and P15 (Architecture
Alignment) added **40 deliverables** and the cover did not move.

### D2. P11's declared count is arithmetically right and referentially broken

P11's header declares *"Deliverables / 30 deliverables (MDM + RDM combined)"*.

| | Declared | Rows present |
|---|---:|---:|
| P11 Master Data Management | — | **16** (11.1 – 11.16) |
| P11 (continued) Reference Data Management | *"Deliverables / 14 items"* | **14** (12.1 – 12.14) |
| **Combined** | **30** | **30** ✓ |

The arithmetic holds. What does not hold is the numbering: **the fourteen RDM rows are numbered
12.1 – 12.14, and P12 (TDX) numbers its ten rows 12.1 – 12.10.**

**Ten deliverable IDs are used twice in this document**, each by two different projects with different
owners, quarters and types:

| Duplicated ID | P11-continued (Reference Data) | P12 (TDX) |
|---|---|---|
| 12.1 | Reference Data Inventory (Process, Q1) | Current State Data Sharing Assessment (Process, Q1) |
| 12.2 | Reference Data Registry Schema (Build, Q1) | TDX CDE Identification (Process, Q1) |
| 12.3 | Initial Load of All Ten Domains (Build, Q1) | TDX CDE Classification (Configure, Q1) |
| 12.4 | OpenMetadata Reference Data Registration (Configure, Q2) | CDE Glossary (Process, Q1) |
| 12.5 | Versioned Reference Data Views (Build, Q2) | CDE Access Control Matrix (Process, Q1) |
| 12.6 | Reference Data Change Management Process (Process, Q2) | DQ Passport Certification for TDX Products (Build + Config, Q2) |
| 12.7 | ODI Distribution Pipelines (Build, Q2) | DSA Registry in OpenMetadata (Configure, Q2) |
| 12.8 | Reference Data API (Build, Q2) | Migration Plan — Current Sharing Mechanisms (Process, Q2) |
| 12.9 | Reference Data Drift Detector (Build, Q2) | Consumer Onboarding Process (Process, Q2) |
| 12.10 | Exchange Rate Daily Feed (Build, Q2) | TDX Usage and Audit Dashboard (Build + Config, Q2) |

So the register holds **160 rows carrying only 150 distinct ID strings**. Any tracker keyed on the
deliverable ID — which is what a ClickUp list is — silently merges ten pairs. `12.6` is both a governance
SOP owned by the DG Lead and a DataGuard-executed certification owned jointly with Data Products.

This is the same root cause as D1: RDM was P12 until TDX took the number, and the IDs were never renumbered.

Two smaller consequences of the same drift:

- The programme dependency table and the programme overview table both carry **no row for Reference Data
  Management at all**, though its own header declares dependencies (`P1`, `P11`) that appear nowhere in
  the dependency table.
- RDM's own Out of Scope cell reads *"MDM entities (covered in **P11** — HS codes are reference data…)"*.
  RDM **is** P11. The cell points at itself.

### D3. The Deliverable Summary by Type sums to 1,220 against 160 actual rows

As printed:

| Deliverable Type | Count |
|---|---:|
| Build (custom tools) | 71 |
| Buy / Deploy (platform) | 1 |
| Configure (connectors) | 5 |
| Build + Configure | **1120** |
| Process (SOPs) | 23 |
| **Printed sum** | **1,220** |

Counted over all 160 rows:

| Type | Printed | Actual (160 rows) | Actual (P1–P11 only, 120 rows) |
|---|---:|---:|---:|
| Build | 71 | 72 | **71** ✓ |
| Buy / Deploy | 1 | 1 | **1** ✓ |
| Configure | 5 | 10 | **5** ✓ |
| Build + Configure | 1120 | 30 | **20** |
| Process | 23 | 47 | **23** ✓ |
| **Sum** | 1,220 | **160** | **120** |

**Four of the five numbers are exactly correct for the 120-deliverable programme.** The fifth reads
`1120` where `20` is correct, and `71 + 1 + 5 + 20 + 23 = 120` — the cover's own figure. The stray `1`
is a typing error; everything else is scope drift, identical to D1 and D2. The table is a faithful
snapshot of a programme that no longer exists.

Two secondary points:

- The `Buy / Deploy (platform)` row is described as *"OpenMetadata platform deployment **and commercial
  connectors**"*, count 1. The connectors (1.2 Oracle DWH, 1.3 OAS) are typed `Configure`, not
  `Buy / Deploy`. The description and the count describe different sets.
- `Process (SOPs)` is described as *"Standard operating procedures, governance frameworks, and training
  programmes"* — 23 declared, **47 actual**. The four appended projects are 24 of the 47: P12–P15 are
  **24 Process, 5 Configure, 10 Build + Config and 1 Build**, i.e. the programme's centre of gravity
  moved decisively from engineering to authoring, and the summary table is the one place a reader would
  look to see that and cannot.

### D4. Empty cells in the dependency table

The Project Dependencies table has 15 rows and **6 empty cells**, all in the three projects appended last:

| Project | Name | Depends On | Enables |
|---|---|---|---|
| P12 | TDX (Trade Data Exchange) | *(empty)* | *(empty)* |
| P14 | DG Shield on Data Products | *(empty)* | *(empty)* |
| P15 | Architecture Alignment with Data Governance | *(empty)* | *(empty)* |

**The dependencies are not unknown. They are stated on each project's own page and were never copied
back:**

| Project | Its own header declares |
|---|---|
| P12 | `P1` (OpenMetadata live), `P2` (classification enforced), `P7` (Inbound Contract Monitor and External Sharing Controller active) |
| P14 | `P1`, `P2`, `P3` (DataGuard active), `P7`, `P9` (Handoff Contracts) |
| P15 | `P1` (OpenMetadata live), `P13` (DGC constituted) |

An empty cell in a dependency table does not read as "not filled in" — it reads as "no dependencies",
which is what the same table says for P1 (*"None — foundation project"*) and P13 (*"None – Major
project"*). Three of fifteen projects are presented as unconstrained when their own pages constrain them
with eleven declared dependencies between them. This is what conceals **B4** — a Phase 1 project
depending on a Phase 2 project is invisible in the table where a reader would look for it.

Related, in the same table:

- **P13's cell reads `"None – Major project"`** where every comparable cell reads `"None — foundation
  project"`. P13's own page says *"None — prerequisite for all other projects"*. Three different phrasings
  for one status.
- **P11's `Enables` reads `"All projects"`** with no qualification, while P11's own page lists specific
  integrations (P3 DataGuard, P9 Handoff Contracts, RMS).

And in the TDX scope table, the same shape again: **11 In Scope rows against 7 Out of Scope rows — 4
empty Out-of-Scope cells** rendered as blank table cells rather than a merged or shortened column.

### D5. Smaller verified defects

| # | Defect | Evidence |
|---|---|---|
| 1 | **14.2 cites a deliverable ID that does not exist in its project.** | 14.2 reads *"Apply the PSW classification taxonomy … to every CDE identified in **15.1**"*. The CDE inventory is **14.1**. `15.1` is the Enterprise Data Architecture Standard in P15. A leftover from when DG Shield was numbered P15. |
| 2 | **Phase 1 is declared "Months 1–3" and contains a project running Months 2–8.** | The phasing page: *"Phase 1 — Now · Months 1–3 · 5 Projects"*, listing P11. P11's own header: *"Duration / Months 2–8"*. P11 spans five months past the phase it is placed in. |
| 3 | **The Phase 2 note contradicts the Phase 1 list.** | Under P7 in Phase 2: *"Note: P7 inbound contract monitoring is integrated under P12 (TDX) — external sharing governance is delivered as part of the TDX framework in Phase 1."* P12's own header declares the opposite direction — that it depends on P7 being **active**. |
| 4 | **P14's Out of Scope points reference data at the wrong project.** | *"Reference data management (P11)"* is correct only if the reader knows RDM is P11-continued rather than the P12 its IDs imply. Adjacent line correctly reads *"MDM entity golden record creation (P11)"*. |
| 5 | **`Scenarios Covered` and `Deliverables` are used interchangeably as the header label.** | P1–P10 headers read *"Scenarios Covered / N deliverables"*; P11–P15 read *"Deliverables / N"*. The two label the same count. |
| 6 | **Per-project declared counts are otherwise correct.** | Verified for all sixteen sections: 10, 7, 9, 8, 8, 9, 9, 8, 10, 12, 16+14=30, 10, 8, 12, 10. P11 is the only one needing the parenthetical to reconcile. Recorded because it is the one class of number in this document that holds. |

---

## What this analysis does not cover

- **It classifies what the document says, not what is true at PSW.** A row typed `Build` is counted as
  PLATFORM on the strength of that word and its lead team. No system was inspected.
- **The consuming-platform link in section 2(b) is read from the deliverable descriptions**, which are
  the only statement of it the document makes. Where a description names no consumer, the row carries
  none and is excluded from the inversion analysis rather than guessed at.
- **The Verdict column in B2 is a judgement, labelled as such.** The quarter comparison beneath it is
  arithmetic.
- **BOTH is a statement about the document, not about the work.** A BOTH row may be perfectly well
  understood by the team that wrote it. What is measurable is that the row will report complete when the
  tool ships, and the content it runs on has no separate line, owner, quarter or acceptance test.
- **No recommendation is made about who supplies any missing content.** The matrix states what is
  missing. That is a separate decision.
