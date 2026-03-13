# HAIW — Healthcare Analytics Intelligence Workbench
## Complete Design Specification

**Module Position:** Third module in the Analytics Intelligence Suite
**Color Theme:** Emerald/Green gradient (`from-emerald-600 to-green-600`)
**Route Prefix:** `/haiw/*`
**Data Model Foundation:** HL7 FHIR R5 Resources + Teradata HCDM Subject Areas

---

## 1. Concept — BAIW/TAIW Parallel

| Dimension | BAIW (Banking) | TAIW (Trade) | HAIW (Healthcare) |
|-----------|---------------|-------------|-------------------|
| **Data Model** | FSDM v13 (3,917 entities, 16 domains) | WCO DM v4.2 (727 elements, 14 domains) | HL7 FHIR R5 (~157 resources, 8 categories) + HCDM (2,400 entities, 12 subject areas) |
| **Capability Framework** | BVF (112 capabilities) | TCF (96 capabilities) | HCF — Healthcare Capability Framework (108 capabilities) |
| **Maturity Assessment** | BACR (793 questions) | TACR (640+ questions) | HACR — Healthcare Analytics Capability Review (720+ questions) |
| **Star Schema** | FACT_CUSTOMER_PROFITABILITY (7 dims) | FACT_TRADE_TRANSACTION (10 dims) | FACT_PATIENT_ENCOUNTER (12 dims) |
| **Gap Extensions** | 5 modules (ABC, CLV, Budget, BPM, Ops) | 5 modules (AEO, Origin, Valuation, Risk, E-Commerce) | 5 modules (Population Health, Claims Intelligence, Quality Outcomes, Pharmacy Analytics, Maternal & Child Health) |
| **Country Context** | Pakistan Banking (SBP, KIBOR, Islamic) | Pakistan Trade (FBR, WeBOC, PSW, CPEC) | Pakistan Healthcare (NHSR&C, Sehat Sahulat, DRAP, NADRA, HMIS) |

---

## 2. Data Model — HL7 FHIR R5 Resources + HCDM Subject Areas

### 2.1 Why FHIR (not just HCDM)?

Teradata's HCDM is proprietary (licensed ERwin files, ~2,400 entities). HL7 FHIR R5 is open-standard, internationally adopted, and Pakistan's Digital Health Vision references FHIR compliance. We use FHIR as our primary data model and map HCDM subject areas as the analytical overlay — same approach as TAIW used WCO DM (open standard) rather than a proprietary model.

### 2.2 FHIR R5 Resource Categories (8 categories, ~157 resources)

**Category 1: Foundation (22 resources)**
Infrastructure resources that underpin the entire specification.
- CapabilityStatement, OperationDefinition, SearchParameter, CompartmentDefinition
- ImplementationGuide, StructureDefinition, StructureMap
- CodeSystem, ValueSet, ConceptMap, NamingSystem
- Bundle, Subscription, MessageDefinition, MessageHeader
- OperationOutcome, Parameters, Binary, Basic
- Provenance, AuditEvent, Consent

**Category 2: Base (18 resources)**
Core administrative and identification resources.
- Patient, Practitioner, PractitionerRole, RelatedPerson, Person, Group
- Organization, HealthcareService, Endpoint, Location
- Device, DeviceDefinition, DeviceMetric
- Substance, BiologicallyDerivedProduct
- Account, ChargeItem, ChargeItemDefinition

**Category 3: Clinical (32 resources)**
Patient care and clinical data.
- Condition, Procedure, Observation, DiagnosticReport
- CarePlan, CareTeam, Goal, ServiceRequest
- Encounter, EpisodeOfCare, Flag
- AllergyIntolerance, AdverseEvent, DetectedIssue
- ClinicalImpression, FamilyMemberHistory
- ImagingStudy, ImagingSelection, BodyStructure
- Specimen, MolecularSequence, GenomicStudy
- NutritionOrder, NutritionIntake, RiskAssessment
- Communication, CommunicationRequest
- Composition, DocumentReference, QuestionnaireResponse
- RequestOrchestration

**Category 4: Financial (16 resources)**
Healthcare financial transactions and insurance.
- Claim, ClaimResponse, ExplanationOfBenefit
- Coverage, CoverageEligibilityRequest, CoverageEligibilityResponse
- EnrollmentRequest, EnrollmentResponse
- PaymentNotice, PaymentReconciliation
- Invoice, Account, ChargeItem
- Contract, InsurancePlan
- ExplanationOfBenefit

**Category 5: Medications (9 resources)**
Pharmaceutical and medication management.
- Medication, MedicationRequest, MedicationDispense
- MedicationAdministration, MedicationStatement
- MedicationKnowledge, FormularyItem
- Immunization, ImmunizationRecommendation

**Category 6: Workflow (14 resources)**
Care coordination and task management.
- Task, Appointment, AppointmentResponse
- Schedule, Slot, DeviceRequest, DeviceDispense
- SupplyRequest, SupplyDelivery
- VisionPrescription, Transport
- InventoryItem, InventoryReport
- DeviceAssociation

**Category 7: Public Health & Research (12 resources)**
Population health and clinical research.
- ResearchStudy, ResearchSubject, Citation
- Evidence, EvidenceReport, EvidenceVariable
- MeasureReport, Measure
- Library, ActivityDefinition, PlanDefinition
- ObservationDefinition

**Category 8: Conformance & Terminology (34 resources)**
Terminology services and conformance infrastructure.
- CodeSystem, ValueSet, ConceptMap
- TerminologyCapabilities, NamingSystem
- TestScript, TestPlan, TestReport
- Requirements, ActorDefinition, ExampleScenario
- GraphDefinition, SubscriptionTopic, SubscriptionStatus
- Plus remaining infrastructure resources

### 2.3 HCDM Subject Areas (12 domains mapped to FHIR)

| # | HCDM Subject Area | Entity Count (est.) | Primary FHIR Resources | Color |
|---|-------------------|--------------------|-----------------------|-------|
| 1 | **Party** | ~350 | Patient, Practitioner, Organization, RelatedPerson, Person, Group | slate |
| 2 | **Event** | ~280 | Encounter, EpisodeOfCare, Appointment, Communication | violet |
| 3 | **Clinical** | ~320 | Condition, Procedure, Observation, DiagnosticReport, CarePlan | rose |
| 4 | **Claim** | ~200 | Claim, ClaimResponse, ExplanationOfBenefit, Coverage | amber |
| 5 | **Financial Management** | ~180 | Account, Invoice, PaymentNotice, PaymentReconciliation, ChargeItem | yellow |
| 6 | **Pharmacy** | ~150 | Medication, MedicationRequest, MedicationDispense, MedicationAdministration, Immunization | cyan |
| 7 | **Membership & Enrollment** | ~120 | Coverage, EnrollmentRequest, InsurancePlan, Contract | indigo |
| 8 | **Provider** | ~180 | Practitioner, PractitionerRole, HealthcareService, Location, Endpoint | emerald |
| 9 | **Campaign & Outreach** | ~90 | Communication, CommunicationRequest, PlanDefinition, Measure | pink |
| 10 | **Quality & Outcomes** | ~140 | MeasureReport, RiskAssessment, AdverseEvent, DetectedIssue | orange |
| 11 | **Geography** | ~80 | Location, Organization (hierarchical) | teal |
| 12 | **Research & Public Health** | ~110 | ResearchStudy, ResearchSubject, Evidence, Library | purple |
| | **TOTAL** | **~2,200** | **~157 FHIR Resources** | |

---

## 3. Healthcare Capability Framework (HCF) — 108 Sub-Capabilities

### Theme 1: Patient Intelligence & Experience (Emerald — 20 capabilities)

**1.1 Patient 360° Analytics (8)**
1. Patient master data integration & deduplication
2. Patient demographic profiling & segmentation
3. Patient journey mapping across care settings
4. Patient risk stratification & scoring
5. Social determinants of health (SDOH) integration
6. Patient engagement & activation scoring
7. Patient longitudinal health record analytics
8. Patient cohort identification & analysis

**1.2 Patient Access & Experience (6)**
9. Wait time & appointment access analytics
10. Patient satisfaction & NPS measurement
11. Telemedicine utilization analytics
12. Patient portal adoption & engagement
13. Referral pattern analysis & leakage detection
14. Patient communication preference analytics

**1.3 Patient Safety & Risk (6)**
15. Adverse event detection & reporting
16. Medication error analytics
17. Hospital-acquired infection (HAI) tracking
18. Fall risk & prevention analytics
19. Patient readmission prediction
20. Clinical alert fatigue monitoring

### Theme 2: Clinical Analytics & Quality (Red — 22 capabilities)

**2.1 Clinical Decision Support (8)**
21. Evidence-based clinical pathway analytics
22. Diagnosis pattern analysis & validation
23. Lab result trending & critical value alerting
24. Imaging utilization & appropriateness
25. Clinical documentation quality scoring
26. Comorbidity & risk factor analysis
27. Antimicrobial stewardship analytics
28. Chronic disease management effectiveness

**2.2 Quality Measurement & Reporting (8)**
29. Quality indicator dashboard (national & international)
30. Clinical outcome benchmarking
31. Mortality rate analytics (risk-adjusted)
32. Surgical site infection tracking
33. Compliance with clinical guidelines
34. Peer comparison & variation analysis
35. Accreditation readiness analytics (JCI, PHCIP)
36. Quality improvement initiative tracking

**2.3 Care Coordination (6)**
37. Care team performance analytics
38. Discharge planning & transition analytics
39. Referral network optimization
40. Multidisciplinary team collaboration metrics
41. Episode of care analytics
42. Care gap identification & closure

### Theme 3: Financial Analytics & Revenue (Blue — 18 capabilities)

**3.1 Revenue Cycle Analytics (8)**
43. Claims submission & denial analytics
44. Revenue leakage detection
45. Coding accuracy & optimization (ICD-10, CPT)
46. Prior authorization analytics
47. Accounts receivable aging & collection
48. Payer contract performance
49. Out-of-pocket cost estimation
50. Revenue forecasting & budgeting

**3.2 Cost Management (6)**
51. Cost per patient/episode/DRG analytics
52. Department-level cost allocation
53. Supply chain cost optimization
54. Labor cost & productivity analytics
55. Capital expenditure ROI analysis
56. Variance analysis (budget vs. actual)

**3.3 Insurance & Payer Analytics (4)**
57. Payer mix & reimbursement analytics
58. Insurance claim processing efficiency
59. Benefit utilization & coverage analytics
60. Sehat Sahulat / social insurance analytics

### Theme 4: Operational Analytics (Violet — 20 capabilities)

**4.1 Capacity & Resource Management (8)**
61. Bed occupancy & turnover analytics
62. Operating theater utilization
63. Staff scheduling & workload optimization
64. Equipment utilization & maintenance
65. Emergency department throughput
66. ICU capacity planning
67. Outpatient clinic flow optimization
68. Ambulance & transport analytics

**4.2 Supply Chain & Pharmacy Operations (6)**
69. Drug inventory optimization
70. Formulary management analytics
71. Drug utilization review
72. Medical supply consumption tracking
73. Vendor performance & procurement analytics
74. Cold chain monitoring & compliance

**4.3 Facility Management (6)**
75. Energy & utility consumption analytics
76. Waste management & compliance tracking
77. Biomedical equipment lifecycle analytics
78. Facility compliance & safety scoring
79. Space utilization & planning
80. Environmental monitoring (infection control)

### Theme 5: Population Health & Public Health (Teal — 16 capabilities)

**5.1 Population Health Management (8)**
81. Disease burden & prevalence analytics
82. Health risk assessment & stratification
83. Chronic disease registry management
84. Preventive care gap analysis
85. Vaccination coverage & campaign analytics
86. Maternal & child health analytics
87. Communicable disease surveillance
88. Non-communicable disease (NCD) trend analysis

**5.2 Public Health Intelligence (8)**
89. Outbreak detection & early warning system
90. Syndromic surveillance analytics
91. Environmental health risk analytics
92. Nutrition & malnutrition tracking
93. Water & sanitation health impact
94. Geographic health disparity mapping
95. Epidemic preparedness & response analytics
96. One Health (human-animal-environment) analytics

### Theme 6: Digital Health & Data Governance (Indigo — 12 capabilities)

**6.1 Health Information Systems (6)**
97. HMIS data quality & completeness scoring
98. FHIR interoperability readiness assessment
99. EHR/EMR adoption & utilization analytics
100. Health data exchange & integration monitoring
101. Master data management (patient, provider, facility)
102. Health information exchange (HIE) analytics

**6.2 Data Governance & Compliance (6)**
103. Data privacy & consent management analytics
104. Regulatory compliance dashboard (DRAP, PMDC, PHCIP)
105. Clinical data standardization (ICD-10, LOINC, SNOMED CT)
106. Data quality scorecarding (completeness, accuracy, timeliness)
107. AI/ML model governance & bias monitoring
108. Digital health maturity roadmap tracking

---

## 4. HACR Maturity Assessment — 8 Categories, 720+ Questions

### Maturity Levels

| Level | Label | Description |
|-------|-------|-------------|
| 1 | **Paper-Based** | Manual records, no digital systems, fragmented data |
| 2 | **Digitizing** | Basic HIS/EMR in some facilities, partial data capture |
| 3 | **Connected** | Integrated systems, FHIR APIs, cross-facility data sharing |
| 4 | **Analytical** | Advanced analytics, predictive models, population health insights |
| 5 | **Intelligent** | AI/ML-driven care, real-time decision support, autonomous quality monitoring |

### Assessment Categories

| # | Category | Questions | Key Focus Areas |
|---|----------|-----------|-----------------|
| 1 | Strategy & Leadership | ~80 | Digital health vision, analytics strategy, leadership commitment, UHC alignment |
| 2 | Workforce & Skills | ~90 | Health informatics capacity, data science, clinical informaticists, training programs |
| 3 | Data Governance & Standards | ~100 | FHIR adoption, ICD-10 coding, LOINC, SNOMED CT, master data, data sharing agreements |
| 4 | Infrastructure & Systems | ~85 | HIS/EMR/EHR, HMIS, lab systems, radiology PACS, pharmacy systems, telemedicine |
| 5 | Analytics & Intelligence | ~90 | BI tools, predictive analytics, clinical decision support, AI/ML, NLP |
| 6 | Integration & Interoperability | ~80 | FHIR endpoints, HL7v2 interfaces, health information exchange, API management |
| 7 | Patient & Community Engagement | ~80 | Patient portals, mHealth, health literacy, community health worker tools |
| 8 | Outcomes & Impact | ~115 | Clinical outcomes, financial performance, patient experience, population health KPIs |
| | **TOTAL** | **~720** | |

---

## 5. Healthcare Analytics Star Schema — FACT_PATIENT_ENCOUNTER

### Fact Table: FACT_PATIENT_ENCOUNTER

**Value Measures:**
- total_charge_pkr, total_charge_usd
- total_payment_pkr, insurance_payment, patient_copay
- cost_of_care, drug_cost, lab_cost, imaging_cost, supply_cost
- reimbursement_amount, write_off_amount, outstanding_balance

**Clinical Measures:**
- diagnosis_count, procedure_count, medication_count
- lab_order_count, imaging_order_count
- length_of_stay_hours, icu_hours
- readmission_flag, readmission_days
- mortality_flag, complication_flag
- acuity_score, risk_score, charlson_comorbidity_index

**Operational Measures:**
- wait_time_minutes, door_to_doctor_minutes
- triage_to_treatment_minutes, ed_to_admission_minutes
- discharge_to_departure_minutes
- bed_days, nursing_hours, physician_minutes

**Quality Measures:**
- patient_satisfaction_score, nps_score
- hai_flag, adverse_event_flag, medication_error_flag
- clinical_pathway_adherence_pct
- documentation_completeness_score

**Pakistan-Specific Measures:**
- sehat_sahulat_flag, sehat_card_claim_amount
- bisp_beneficiary_flag, poverty_score_pmt
- nadra_cnic_verified_flag
- district_health_score, hmis_reporting_flag

### Dimensions (12)

| Dimension | Key Attributes | Pakistan Context |
|-----------|---------------|-----------------|
| **DIM_DATE** | fiscal_year (July-June), quarter, month, day, hijri_date, ramadan_flag, public_holiday | Pakistan fiscal calendar |
| **DIM_PATIENT** | patient_id, age_group, gender, cnic_hash, district, poverty_quintile, insurance_type, chronic_condition_count | NADRA CNIC linkage, BISP score |
| **DIM_PROVIDER** | provider_id, pmdc_registration, specialty, qualification, facility_affiliation | PMDC registration, specialty codes |
| **DIM_FACILITY** | facility_id, facility_type (BHU/RHC/THQ/DHQ/Teaching), province, district, tehsil, urban_rural, bed_count, accreditation | Pakistan health facility hierarchy |
| **DIM_DIAGNOSIS** | icd10_code, icd10_chapter, diagnosis_group, chronic_flag, notifiable_flag, priority_disease_flag | Pakistan priority diseases |
| **DIM_PROCEDURE** | procedure_code, procedure_type, surgical_flag, day_case_flag, complexity | CPT/local procedure codes |
| **DIM_MEDICATION** | drug_code, generic_name, brand_name, atc_code, drap_registration, controlled_flag, essential_medicine_flag | DRAP registration, EML |
| **DIM_PAYER** | payer_id, payer_type (Sehat_Sahulat/Private_Insurance/Self_Pay/Zakat/Bait_ul_Mal/NGO/Donor), plan_name | Pakistan payer landscape |
| **DIM_DEPARTMENT** | department_id, department_name, service_line, cost_center | Hospital department structure |
| **DIM_ENCOUNTER_TYPE** | encounter_type (Inpatient/Outpatient/Emergency/Day_Case/Telemedicine/Home_Visit/LHW_Visit), encounter_class | Pakistan encounter types |
| **DIM_GEOGRAPHY** | province, division, district, tehsil, union_council, latitude, longitude, population, poverty_rate | Pakistan 4-tier admin hierarchy |
| **DIM_PROGRAM** | program_id (EPI, MNCH, TB_DOTS, Malaria, Polio, LHW, Nutrition), program_type, donor, funding_source | National health programs |

### Aggregate Tables

- **AGG_MONTHLY_FACILITY**: Monthly KPIs per facility (admissions, revenue, LOS, mortality, bed occupancy)
- **AGG_DISEASE_BURDEN**: Monthly disease counts by district, age group, gender
- **AGG_PROVIDER_PERFORMANCE**: Quarterly provider metrics (patient volume, outcomes, cost)
- **AGG_PROGRAM_COVERAGE**: Program-level coverage rates by district (EPI, MNCH, TB, etc.)
- **AGG_PAYER_PERFORMANCE**: Claims, payments, denials, turnaround by payer type

### Analytical Views

- **VW_PATIENT_360**: Complete patient profile with encounters, diagnoses, medications, costs
- **VW_DISEASE_SURVEILLANCE**: Real-time notifiable disease counts with geographic mapping
- **VW_SEHAT_SAHULAT_UTILIZATION**: SSP-specific claims, beneficiaries, hospital performance
- **VW_MATERNAL_CHILD_HEALTH**: MNCH indicators by district (ANC, delivery, immunization)
- **VW_FACILITY_SCORECARD**: Composite facility performance (quality, financial, operational)
- **VW_POPULATION_HEALTH_EQUITY**: Health outcome disparities by geography, income, gender

---

## 6. Healthcare Gap Extensions — 5 Modules, 25 Tables

### Module 1: Population Health Analytics (5 tables)

| Table | Key Columns | Purpose |
|-------|-------------|---------|
| POP_HEALTH_COHORT | cohort_id, name, inclusion_criteria, patient_count, risk_level | Define patient cohorts by condition, geography, risk |
| POP_HEALTH_MEASURE | measure_id, indicator_name, numerator_sql, denominator_sql, benchmark | WHO/SDG health indicators |
| POP_HEALTH_INTERVENTION | intervention_id, cohort_id, program_type, start_date, target_outcome | Track interventions per cohort |
| POP_SDOH_FACTOR | factor_id, patient_id, factor_type (housing, income, education, food_security), score | Social determinants tracking |
| POP_HEALTH_OUTCOME | outcome_id, cohort_id, measure_id, period, actual_value, target_value, trend | Outcome measurement over time |

### Module 2: Claims Intelligence (5 tables)

| Table | Key Columns | Purpose |
|-------|-------------|---------|
| CLAIM_SUBMISSION | claim_id, patient_id, facility_id, payer_id, submission_date, total_amount, status | Claim lifecycle tracking |
| CLAIM_DENIAL | denial_id, claim_id, denial_reason_code, denial_category, appeal_status, resolution_date | Denial pattern analysis |
| CLAIM_FRAUD_FLAG | flag_id, claim_id, rule_triggered, risk_score, investigation_status | Fraud detection & alerting |
| CLAIM_BENCHMARK | benchmark_id, procedure_code, payer_type, avg_reimbursement, p25, p50, p75, p90 | Reimbursement benchmarking |
| CLAIM_SEHAT_SAHULAT | ssp_claim_id, claim_id, sehat_card_number, package_code, hospital_tier, approved_amount | SSP-specific claim tracking |

### Module 3: Quality & Outcomes (5 tables)

| Table | Key Columns | Purpose |
|-------|-------------|---------|
| QUALITY_INDICATOR | indicator_id, name, category (safety/effectiveness/experience/timeliness), data_source | Quality measure definitions |
| QUALITY_SCORE | score_id, facility_id, indicator_id, period, numerator, denominator, rate, benchmark | Facility quality scores |
| PATIENT_OUTCOME | outcome_id, patient_id, encounter_id, outcome_type, severity, contributing_factors | Individual patient outcomes |
| ADVERSE_EVENT_LOG | event_id, patient_id, event_type (HAI, fall, medication_error, surgical), severity, root_cause | Adverse event registry |
| ACCREDITATION_CHECKLIST | item_id, facility_id, standard (JCI, PHCIP, ISO), criterion, status, evidence, gap_action | Accreditation readiness |

### Module 4: Pharmacy Analytics (5 tables)

| Table | Key Columns | Purpose |
|-------|-------------|---------|
| DRUG_UTILIZATION | utilization_id, drug_code, facility_id, period, quantity_dispensed, cost, ddd_per_1000 | Drug usage patterns (DDD methodology) |
| FORMULARY_COMPLIANCE | compliance_id, prescription_id, formulary_status, generic_available, switch_recommendation | Formulary adherence tracking |
| ANTIMICROBIAL_STEWARDSHIP | stewardship_id, encounter_id, antibiotic_code, indication, duration_days, culture_ordered, appropriate_flag | AMR stewardship analytics |
| DRUG_INTERACTION_ALERT | alert_id, patient_id, drug_pair, severity, action_taken, override_flag | Drug-drug interaction monitoring |
| DRUG_SUPPLY_CHAIN | supply_id, drug_code, facility_id, stock_level, reorder_point, expiry_date, stockout_days | Pharmacy inventory & stockout |

### Module 5: Maternal & Child Health (5 tables)

| Table | Key Columns | Purpose |
|-------|-------------|---------|
| MNCH_REGISTRATION | registration_id, mother_id, lmp_date, edd, risk_category, anc_visits, delivery_facility | Maternal registration & ANC tracking |
| MNCH_DELIVERY | delivery_id, registration_id, delivery_type (SVD/CS/Assisted), birth_weight, apgar_score, complication | Delivery outcomes |
| CHILD_IMMUNIZATION | immunization_id, child_id, vaccine_code (BCG/OPV/Pentavalent/Measles/PCV), dose_number, date_given, facility | EPI tracking per child |
| CHILD_GROWTH | growth_id, child_id, age_months, weight_kg, height_cm, muac_mm, wasting_flag, stunting_flag | Nutritional surveillance |
| LHW_VISIT | visit_id, lhw_id, household_id, visit_date, services_provided, referral_flag, children_screened | Lady Health Worker visits |

---

## 7. Pakistan Healthcare Context

### 7.1 Institutional Framework

| Institution | Role | Key Systems |
|-------------|------|-------------|
| **Ministry of NHSR&C** | Federal health policy, regulation, coordination | National Health Vision 2016-2025 |
| **Provincial Health Departments** | Service delivery (post-18th Amendment devolution) | Punjab, Sindh, KP, Balochistan + AJK, GB |
| **DRAP** | Drug Regulatory Authority of Pakistan | Drug registration, GMP, pharmacovigilance |
| **PMDC/PMC** | Pakistan Medical Commission | Medical education, practitioner licensing |
| **PHCIP** | Primary & Secondary Healthcare Department (Punjab) | BHU/RHC management, HMIS |
| **Sehat Sahulat Program** | Universal health coverage (SSP) via SLIC | Insurance claims, hospital empanelment |
| **NADRA** | National identity & biometric verification | CNIC-based patient identification |
| **PBS** | Pakistan Bureau of Statistics | Census, demographic health surveys |
| **NIH** | National Institute of Health | Disease surveillance, FELTP, lab reference |
| **EPI** | Expanded Program on Immunization | Routine immunization, polio campaigns |

### 7.2 Key Health Statistics (2024-25 estimates)

| Metric | Value | Source Context |
|--------|-------|---------------|
| Population | ~240 million | 6th most populous globally |
| Health expenditure (% GDP) | ~2.95% | Well below WHO recommended 5% |
| Out-of-pocket (% health spend) | ~78% | Among highest globally |
| Life expectancy | 67.94 years (2024) | Up from 61.1 in 1990 |
| Infant mortality | 69.3 per 1,000 live births | Declining but still high |
| Maternal mortality | ~186 per 100,000 live births | 30% reduction since 2000 |
| Hospitals | 1,201 | |
| Basic Health Units (BHUs) | 5,518 | Primary care, rural |
| Rural Health Centers (RHCs) | 683 | |
| Hospital beds | 123,394 | ~0.5 per 1,000 population |
| Doctors | ~260,000 registered | Doctor-to-population ~1:1,000 |
| Lady Health Workers | 100,000 | Covering 100M people |
| Sehat Sahulat coverage | 164 million persons (2023) | Across all provinces/regions |
| Sehat Sahulat annual limit | PKR 1 million/family | ~$3,500 |
| Psychiatrists | ~500 | For 240M population |
| UHC Service Coverage Index | 45 (2017) | Up from 23 in 2000 |
| HAQ Index | 37.6 (2016) | Rank 124th of 195 countries |

### 7.3 Health Facility Hierarchy (Pakistan-Specific)

```
Federal Level
├── Teaching Hospitals & Medical Universities (tertiary)
├── Federal Government Hospitals (PIMS, Polyclinic)
└── Specialized Institutes (NICVD, SIUT, Shaukat Khanum)

Provincial Level
├── Teaching/Tertiary Hospitals (DHQ+)
├── District Headquarters Hospitals (DHQ) — one per district
├── Tehsil Headquarters Hospitals (THQ) — one per tehsil
├── Rural Health Centers (RHC) — ~25,000-50,000 population
├── Basic Health Units (BHU) — ~10,000-25,000 population
├── Civil Dispensaries & MCH Centers
└── Lady Health Workers (community level)

Private Sector
├── Private Tertiary Hospitals (Aga Khan, Shifa, South City)
├── Private Secondary Hospitals
├── Clinics & Diagnostic Centers
├── Pharmacies & Retail Health
└── Traditional/Unani Medicine
```

### 7.4 Pakistan Priority Disease Programs

| Program | Abbreviation | Key Indicators |
|---------|-------------|----------------|
| Expanded Program on Immunization | EPI | Coverage rates per antigen, dropout rates |
| Maternal, Newborn & Child Health | MNCH | ANC coverage, skilled birth attendance, neonatal mortality |
| National TB Control | NTP/TB-DOTS | Case detection rate, treatment success rate |
| Malaria Control | MCP | Incidence, ITN coverage, test positivity rate |
| Polio Eradication | PEI | WPV cases, AFP surveillance, campaign coverage |
| HIV/AIDS | NACP | Prevalence (key populations), ART coverage |
| Hepatitis Prevention | NHPC | Prevalence (HBV/HCV), treatment coverage |
| Nutrition Program | NP | Stunting, wasting, micronutrient deficiency |
| Lady Health Worker | LHW | Coverage, visit frequency, referral rates |
| Non-Communicable Diseases | NCD | Diabetes, hypertension, cancer screening |

### 7.5 Key Challenges (Analytics Opportunities)

1. **HMIS Data Falsification**: ~30% of district-level decisions affected by unreliable data — data quality analytics critical
2. **78% Out-of-Pocket**: No unified claims database — SSP is building one, but fragmented
3. **30-40% Ghost Facilities**: Some BHUs exist on paper only — geospatial verification needed
4. **Coding Gaps**: ICD-10 adoption is low; most facilities use free-text diagnoses — NLP opportunity
5. **Provider Brain Drain**: 10,000+ doctors emigrate annually — workforce analytics needed
6. **Disease Double Burden**: Communicable diseases (TB, hepatitis) + rising NCDs (diabetes, CVD) simultaneously
7. **Maternal Health Inequity**: MMR ranges from ~100 (urban Punjab) to ~400+ (rural Balochistan)
8. **Pharmaceutical Unregulated**: Fake drug market costs ~$200M/year — pharmacovigilance analytics
9. **Mental Health Desert**: 500 psychiatrists for 240M people — service gap analytics
10. **Data Silos**: HMIS, DHIS2, SSP, EPI, LMIS all operate independently — integration analytics

---

## 8. Application Modules — 8 Tabs

### Tab 1: Dashboard (`/haiw`)
- **Hero Stats**: 157 FHIR resources, 12 HCDM subject areas, 108 HCF capabilities, 720+ HACR questions
- **Patient Encounter Chart**: Monthly encounters by type (inpatient, outpatient, emergency, telemedicine)
- **FHIR Category Donut**: 8 categories with resource counts
- **HCF Capability Bar**: 6 themes with sub-capability counts
- **Pakistan Health Metrics**: Key stats (life expectancy, IMR, bed ratio, doctor ratio, UHC index)
- **Quick Nav Cards**: 8 cards linking to other modules with live data counts
- **Maturity Radar**: Current HACR scores across 8 categories (preview)

### Tab 2: FHIR Resource Explorer (`/haiw/model`)
- **3-Level Hierarchy**: 8 Categories → Resources → Elements (attributes)
- **Resource Detail Panel**: Name, description, elements list, references (what it links to), search parameters
- **"Used By Capabilities" Badge**: Shows which HCF capabilities use this resource
- **Search & Filter**: Search across all resources, filter by category, maturity level, Pakistan relevance
- **HCDM Mapping Column**: Shows which HCDM subject area each FHIR resource maps to
- **Element Count Badges**: Per resource

### Tab 3: HCF Capability Navigator (`/haiw/capabilities`)
- **6 Themes → 14 Groups → 108 Capabilities**: Collapsible tree with theme colors
- **Capability Detail**: Description, FHIR resources required, HACR questions linked, maturity level needed, Pakistan enrichment
- **Related Capabilities**: Cross-theme links
- **Pakistan Enrichment Panel**: Institution, systems, challenges specific to each capability

### Tab 4: Dependency Graph (`/haiw/graph`)
- **Force-Directed View**: HCF capabilities ↔ FHIR resources with bidirectional links
- **Sankey View**: Themes → Groups → FHIR Categories → Resources flow
- **Click-to-Navigate**: Click node to open in Explorer or Navigator

### Tab 5: Maturity Assessment (`/haiw/maturity`)
- **HACR Wizard**: 8 categories, 720+ questions, current vs. desired slider (1-5)
- **Radar Chart**: 8-axis showing current vs. target maturity
- **Gap Heat Map**: Categories × Levels showing biggest gaps
- **Category Stepper**: Navigate categories with progress indicator
- **Export**: PDF report, JSON data

### Tab 6: Healthcare Analytics Engine (`/haiw/analytics`)
- **Star Schema ERD**: FACT_PATIENT_ENCOUNTER + 12 dimensions, interactive
- **Patient Encounter Waterfall**: Charges → Insurance → Copay → Write-off → Net Revenue
- **Dimension Explorer**: 12 cards showing each dimension's attributes
- **Gap Extensions Deep Dive**: 5 modules with 25 tables, expandable
- **Analytical View Definitions**: 6 pre-built views with SQL-like definitions

### Tab 7: Roadmap Builder (`/haiw/roadmap`)
- **Capability Picker**: Select from 108 HCF capabilities
- **Templates**: Quick Wins, Patient Safety First, Revenue Cycle Optimization, Population Health, UHC Readiness, Full HCF
- **3-Phase Gantt**: Foundation → Integration → Intelligence
- **PKR Investment Calculator**: Cost estimation per capability
- **Shared Data Foundation**: FHIR resources shared across selected capabilities

### Tab 8: Pakistan Healthcare Reference (`/haiw/pakistan`)
- **Institutional Framework**: NHSR&C, Provincial Health Departments, DRAP, PMC hierarchy
- **Facility Map**: 4-tier facility hierarchy (Teaching → DHQ → THQ → RHC → BHU)
- **Sehat Sahulat Section**: Coverage by province, claim statistics, hospital empanelment
- **Priority Programs**: EPI, MNCH, TB, Malaria, Polio with key indicators
- **Health Indicators Table**: Sortable by province/district
- **Coding Standards**: ICD-10, LOINC, SNOMED CT adoption status

---

## 9. Folder Structure

```
src/
├── components/          # BAIW components (UNTOUCHED)
├── data/                # BAIW data (UNTOUCHED)
├── data/taiw/           # TAIW data (UNTOUCHED)
├── data/haiw/           # ★ HAIW data (Prompt 1 output)
│   ├── fhirResources.json       # ~157 resources with elements
│   ├── resourceCategories.json  # 8 FHIR categories
│   ├── hcdmSubjectAreas.json    # 12 HCDM domains
│   ├── fhirHcdmMapping.json     # Resource → Subject Area mapping
│   ├── capabilities.json        # 108 HCF capabilities
│   ├── dataRequirements.json    # Capability → Resource links
│   ├── dependencies.json        # Cross-capability dependencies
│   ├── hacrQuestions.json       # 720+ maturity questions
│   ├── starSchema.json          # Fact + 12 dims + 5 aggs + 6 views
│   ├── gapExtensions.json       # 5 modules, 25 tables
│   ├── enrichment.json          # Pakistan context per capability
│   ├── pakistanContext.json     # Pakistan healthcare reference data
│   └── index.json               # Metadata
├── taiw/                # TAIW module (UNTOUCHED)
├── haiw/                # ★ HAIW module (Prompts 2-4)
│   ├── components/
│   ├── hooks/
│   ├── utils/
│   └── index.tsx
├── shared/              # Shared components
└── App.tsx              # Modified: add /haiw/* routes
```

---

## 10. Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/haiw` | HaiwDashboard | Healthcare analytics dashboard |
| `/haiw/model` | FHIRResourceExplorer | FHIR resource hierarchy browser |
| `/haiw/capabilities` | HCFCapabilityNavigator | 108 healthcare capabilities |
| `/haiw/graph` | HealthDependencyGraph | Force-directed + Sankey |
| `/haiw/maturity` | HealthMaturityAssessment | HACR 720+ question wizard |
| `/haiw/analytics` | HealthAnalyticsEngine | Star schema + gap extensions |
| `/haiw/roadmap` | HealthRoadmapBuilder | Capability-driven roadmap |
| `/haiw/pakistan` | PakistanHealthReference | Pakistan healthcare context |

---

## 11. Color Theme

| Element | BAIW | TAIW | HAIW |
|---------|------|------|------|
| Primary Gradient | `from-purple-600 to-blue-600` | `from-teal-600 to-cyan-600` | `from-emerald-600 to-green-600` |
| Accent | Purple-500 | Teal-500 | Emerald-500 |
| Background | Slate-900 | Slate-900 | Slate-900 |
| localStorage prefix | `maturity_*`, `roadmap_*` | `taiw_maturity_*`, `taiw_roadmap_*` | `haiw_maturity_*`, `haiw_roadmap_*` |

---

## 12. Build Sequence — 4 Prompts

| Prompt | Scope | Output | Time Est. |
|--------|-------|--------|-----------|
| **Prompt 1** | Generate Data Repository | Python script → 13 JSON files in `src/data/haiw/` | 15-25 min |
| **Prompt 2** | Build HAIW App Module | 8 page components + layout + routes in `src/haiw/` | 30-45 min |
| **Prompt 3** | Phase 2 Depth Enhancements | 25 features across 8 modules, cross-module navigation | 30-45 min |
| **Prompt 4** | Audit, Suite Landing Update & Polish | Cmd+K scope, exports, suite landing card, mobile | 20-30 min |
| | **TOTAL** | | **~2-3 hours** |

---

## 13. By The Numbers

| Metric | BAIW | TAIW | HAIW | Suite Total |
|--------|------|------|------|-------------|
| Data Elements | 3,917 entities | 727 elements | ~2,200 (157 resources + elements) | ~6,844 |
| Capabilities | 112 (BVF) | 96 (TCF) | 108 (HCF) | 316 |
| Maturity Questions | 793 (BACR) | 640+ (TACR) | 720+ (HACR) | 2,153+ |
| Star Schema Tables | 10 | 21 | 24 (1 fact + 12 dims + 5 aggs + 6 views) | 55 |
| Gap Extension Tables | 21 | 25 | 25 | 71 |
| Interactive Pages | 8 | 8 | 8 | 24 |
