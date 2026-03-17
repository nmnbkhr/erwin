# HAIW — Healthcare Analytics Intelligence Workbench
## Complete Claude Code Build Prompts (4 Prompts)

**Position:** Third standalone module in the Analytics Intelligence Suite
**Data Model:** HL7 FHIR R5 (157 resources) + Teradata HCDM (12 subject areas)
**Theme:** Emerald/Green gradient (`from-emerald-600 to-green-600`)
**Git:** Existing repo on `origin/master`, current tag after v3.0.0
**Design Doc:** Reference /mnt/user-data/outputs/haiw-complete-design-document.md

---

## PROMPT 1 OF 4: HAIW Data Repository Generation

```
You are building HAIW (Healthcare Analytics Intelligence Workbench) — a standalone React + TypeScript application parallel to BAIW (banking) and TAIW (trade). HAIW maps HL7 FHIR R5 resources to a Healthcare Capability Framework (HCF) with Pakistan healthcare context.

This prompt generates ALL data files. No UI yet — data only.

## TASK
Create a Python script `scripts/generate_haiw_data.py` that generates JSON files in `src/data/haiw/`. Run the script after creation.

## DATA MODEL: HL7 FHIR R5 (157 resources)

FHIR R5 organizes 157 resources into these categories. Generate EVERY resource with accurate names, descriptions, and element counts:

### Category 1: Foundation (14 resources)
CapabilityStatement, StructureDefinition, ImplementationGuide, SearchParameter, OperationDefinition, CompartmentDefinition, MessageDefinition, GraphDefinition, StructureMap, ConceptMap, NamingSystem, TerminologyCapabilities, CodeSystem, ValueSet

### Category 2: Base — Individuals (6 resources)
Patient, Practitioner, PractitionerRole, RelatedPerson, Person, Group

### Category 3: Base — Entities (6 resources)
Organization, HealthcareService, Endpoint, Location, Device, DeviceDefinition

### Category 4: Base — Workflow (13 resources)
Task, Appointment, AppointmentResponse, Schedule, Slot, SupplyRequest, SupplyDelivery, DeviceRequest, DeviceDispense, DeviceUsage, DeviceAssociation, Transport, VisionPrescription

### Category 5: Clinical — Summary (12 resources)
AllergyIntolerance, Condition, Procedure, FamilyMemberHistory, ClinicalImpression, DetectedIssue, RiskAssessment, AdverseEvent, Flag, BodyStructure, Consent, NutritionIntake

### Category 6: Clinical — Diagnostics (9 resources)
Observation, DiagnosticReport, ImagingStudy, ImagingSelection, MolecularSequence, GenomicStudy, Specimen, BodyStructure, ObservationDefinition

### Category 7: Clinical — Medications (9 resources)
Medication, MedicationRequest, MedicationDispense, MedicationAdministration, MedicationStatement, MedicationKnowledge, FormularyItem, Immunization, ImmunizationRecommendation

### Category 8: Clinical — Care Provision (11 resources)
CarePlan, CareTeam, Goal, ServiceRequest, NutritionOrder, RequestOrchestration, EpisodeOfCare, Encounter, EncounterHistory, Communication, CommunicationRequest

### Category 9: Clinical — Request & Response (5 resources)
QuestionnaireResponse, DocumentReference, Composition, List, MeasureReport

### Category 10: Financial (13 resources)
Coverage, CoverageEligibilityRequest, CoverageEligibilityResponse, EnrollmentRequest, EnrollmentResponse, Claim, ClaimResponse, ExplanationOfBenefit, PaymentNotice, PaymentReconciliation, Invoice, InsurancePlan, Account

### Category 11: Public Health & Research (10 resources)
ResearchStudy, ResearchSubject, Evidence, EvidenceReport, EvidenceVariable, Measure, Library, ActivityDefinition, PlanDefinition, Citation

### Category 12: Infrastructure & Exchange (remaining ~49 resources)
AuditEvent, Provenance, Subscription, SubscriptionTopic, SubscriptionStatus, Binary, Bundle, MessageHeader, OperationOutcome, Parameters, Basic, ChargeItem, ChargeItemDefinition, Contract, ExampleScenario, TestScript, TestPlan, TestReport, ActorDefinition, Requirements, plus remaining conformance/terminology resources

## OUTPUT FILES

### 1. fhirResources.json — ALL 157 FHIR R5 resources
Each resource:
```json
{
  "id": "Patient",
  "name": "Patient",
  "category": "Base — Individuals",
  "categoryId": 2,
  "description": "Demographics and other administrative information about an individual receiving care or other health-related services.",
  "purpose": "Track patient identity, demographics, contacts, and administrative details across the care continuum.",
  "elements": [
    { "name": "identifier", "type": "Identifier[]", "description": "An identifier for this patient", "cardinality": "0..*", "mustSupport": true },
    { "name": "active", "type": "boolean", "description": "Whether this patient's record is in active use", "cardinality": "0..1", "mustSupport": false },
    { "name": "name", "type": "HumanName[]", "description": "A name associated with the patient", "cardinality": "0..*", "mustSupport": true },
    { "name": "telecom", "type": "ContactPoint[]", "description": "Contact detail for the individual", "cardinality": "0..*", "mustSupport": false },
    { "name": "gender", "type": "code", "description": "male | female | other | unknown", "cardinality": "0..1", "mustSupport": true },
    { "name": "birthDate", "type": "date", "description": "The date of birth for the individual", "cardinality": "0..1", "mustSupport": true },
    { "name": "deceased[x]", "type": "boolean|dateTime", "description": "Indicates if the individual is deceased", "cardinality": "0..1", "mustSupport": false },
    { "name": "address", "type": "Address[]", "description": "An address for the individual", "cardinality": "0..*", "mustSupport": true },
    { "name": "maritalStatus", "type": "CodeableConcept", "description": "Marital (civil) status of a patient", "cardinality": "0..1", "mustSupport": false },
    { "name": "contact", "type": "BackboneElement[]", "description": "Contact party for the patient", "cardinality": "0..*", "mustSupport": false },
    { "name": "communication", "type": "BackboneElement[]", "description": "Language preference", "cardinality": "0..*", "mustSupport": false },
    { "name": "generalPractitioner", "type": "Reference[]", "description": "Patient's nominated primary care provider", "cardinality": "0..*", "mustSupport": false },
    { "name": "managingOrganization", "type": "Reference", "description": "Organization that is custodian of the record", "cardinality": "0..1", "mustSupport": false },
    { "name": "link", "type": "BackboneElement[]", "description": "Link to another patient resource", "cardinality": "0..*", "mustSupport": false }
  ],
  "elementCount": 14,
  "references": ["Organization", "Practitioner", "PractitionerRole", "RelatedPerson"],
  "referencedBy": ["Encounter", "Observation", "Condition", "Procedure", "MedicationRequest", "Claim", "Coverage", "CarePlan", "Immunization", "DiagnosticReport"],
  "maturityLevel": 5,
  "pakistanRelevance": "high",
  "pakistanNotes": "NADRA CNIC as primary identifier. Sehat Sahulat card linkage via Coverage resource. Pakistan lacks a national patient master index — FHIR Patient resource could serve as foundation.",
  "hcdmSubjectArea": "Party"
}
```

Generate ALL 157 resources with:
- Accurate FHIR R5 element names, types, cardinalities
- 8-15 key elements per resource (not all 30+ elements, just the clinically important ones)
- Accurate references and referencedBy arrays (which resources point to which)
- hcdmSubjectArea mapping (which HCDM subject area each resource maps to)
- Pakistan relevance notes where applicable
- Maturity level (1-5 per FHIR spec: 1=Draft, 3=Trial Use, 5=Normative)

### 2. resourceCategories.json — 12 FHIR R5 categories
```json
[
  { "id": 1, "name": "Foundation", "description": "Basic definitional infrastructure", "resourceCount": 14, "color": "slate", "icon": "Layers" },
  { "id": 2, "name": "Base — Individuals", "description": "People and groups involved in healthcare", "resourceCount": 6, "color": "blue", "icon": "Users" },
  // ... all 12 categories
]
```

### 3. hcdmSubjectAreas.json — 12 Teradata HCDM subject areas mapped to FHIR
```json
[
  {
    "id": "SA-01",
    "name": "Party",
    "description": "Individuals and organizations participating in healthcare — patients, providers, payers, employers",
    "estimatedEntities": 350,
    "color": "slate",
    "fhirResources": ["Patient", "Practitioner", "PractitionerRole", "RelatedPerson", "Person", "Group", "Organization"],
    "keyAnalytics": ["Patient 360°", "Provider performance", "Organization hierarchy", "Patient demographics"]
  },
  {
    "id": "SA-02", "name": "Event",
    "description": "Healthcare interactions and occurrences — encounters, appointments, referrals, communications",
    "estimatedEntities": 280,
    "color": "violet",
    "fhirResources": ["Encounter", "EpisodeOfCare", "Appointment", "AppointmentResponse", "Communication", "CommunicationRequest"],
    "keyAnalytics": ["Encounter volume trends", "ED throughput", "Appointment no-show rates", "Care coordination metrics"]
  },
  {
    "id": "SA-03", "name": "Clinical",
    "description": "Patient clinical data — conditions, procedures, observations, care plans, allergies",
    "estimatedEntities": 320,
    "color": "rose",
    "fhirResources": ["Condition", "Procedure", "Observation", "DiagnosticReport", "CarePlan", "CareTeam", "Goal", "AllergyIntolerance", "ClinicalImpression", "FamilyMemberHistory"],
    "keyAnalytics": ["Disease burden analysis", "Procedure utilization", "Clinical pathway adherence", "Outcome measurement"]
  },
  {
    "id": "SA-04", "name": "Claim & Billing",
    "description": "Healthcare financial claims — claim submission, adjudication, payment, explanation of benefits",
    "estimatedEntities": 200,
    "color": "amber",
    "fhirResources": ["Claim", "ClaimResponse", "ExplanationOfBenefit", "Invoice", "Account", "ChargeItem"],
    "keyAnalytics": ["Claims denial analytics", "Revenue cycle management", "Coding accuracy", "Payer performance"]
  },
  {
    "id": "SA-05", "name": "Financial Management",
    "description": "Healthcare financial operations — payment processing, accounts, cost tracking",
    "estimatedEntities": 180,
    "color": "yellow",
    "fhirResources": ["PaymentNotice", "PaymentReconciliation", "Account", "ChargeItem", "ChargeItemDefinition", "Contract"],
    "keyAnalytics": ["Revenue forecasting", "Cost per patient", "Department cost allocation", "Budget variance"]
  },
  {
    "id": "SA-06", "name": "Pharmacy & Medication",
    "description": "Medication management — prescriptions, dispensing, administration, formulary, immunizations",
    "estimatedEntities": 150,
    "color": "cyan",
    "fhirResources": ["Medication", "MedicationRequest", "MedicationDispense", "MedicationAdministration", "MedicationStatement", "MedicationKnowledge", "FormularyItem", "Immunization", "ImmunizationRecommendation"],
    "keyAnalytics": ["Drug utilization review", "Formulary compliance", "Antimicrobial stewardship", "Vaccination coverage", "Drug interaction monitoring"]
  },
  {
    "id": "SA-07", "name": "Coverage & Enrollment",
    "description": "Insurance coverage — enrollment, eligibility, benefit plans, insurance products",
    "estimatedEntities": 120,
    "color": "indigo",
    "fhirResources": ["Coverage", "CoverageEligibilityRequest", "CoverageEligibilityResponse", "EnrollmentRequest", "EnrollmentResponse", "InsurancePlan"],
    "keyAnalytics": ["Sehat Sahulat utilization", "Coverage gap analysis", "Enrollment trends", "Benefit utilization"]
  },
  {
    "id": "SA-08", "name": "Provider & Facility",
    "description": "Healthcare service delivery — practitioners, locations, healthcare services, endpoints",
    "estimatedEntities": 180,
    "color": "emerald",
    "fhirResources": ["Practitioner", "PractitionerRole", "HealthcareService", "Location", "Endpoint", "Organization"],
    "keyAnalytics": ["Provider productivity", "Facility utilization", "Service line performance", "Referral network"]
  },
  {
    "id": "SA-09", "name": "Public Health & Programs",
    "description": "Population health — disease surveillance, immunization programs, research, evidence",
    "estimatedEntities": 110,
    "color": "teal",
    "fhirResources": ["ResearchStudy", "ResearchSubject", "Evidence", "EvidenceReport", "Measure", "MeasureReport", "Library", "PlanDefinition", "ActivityDefinition"],
    "keyAnalytics": ["Disease surveillance", "Outbreak detection", "Vaccination campaign tracking", "Population health indicators"]
  },
  {
    "id": "SA-10", "name": "Quality & Safety",
    "description": "Healthcare quality measurement — adverse events, risk assessment, quality indicators",
    "estimatedEntities": 140,
    "color": "orange",
    "fhirResources": ["AdverseEvent", "DetectedIssue", "RiskAssessment", "Flag", "MeasureReport"],
    "keyAnalytics": ["Quality scorecards", "Patient safety incidents", "Hospital-acquired infection tracking", "Readmission prediction"]
  },
  {
    "id": "SA-11", "name": "Diagnostics & Imaging",
    "description": "Diagnostic services — lab results, imaging studies, genomics, specimens",
    "estimatedEntities": 130,
    "color": "pink",
    "fhirResources": ["Observation", "DiagnosticReport", "ImagingStudy", "ImagingSelection", "Specimen", "MolecularSequence", "GenomicStudy"],
    "keyAnalytics": ["Lab result trending", "Imaging utilization", "Critical value alerting", "Test turnaround time"]
  },
  {
    "id": "SA-12", "name": "Infrastructure & Interoperability",
    "description": "Technical infrastructure — audit, provenance, subscriptions, conformance, messaging",
    "estimatedEntities": 90,
    "color": "gray",
    "fhirResources": ["AuditEvent", "Provenance", "Subscription", "Bundle", "MessageHeader", "OperationOutcome", "Binary"],
    "keyAnalytics": ["FHIR API utilization", "Data exchange volume", "System interoperability score", "Audit compliance"]
  }
]
```

### 4. capabilities.json — 108 HCF capabilities
Healthcare Capability Framework — 6 themes, 14 groups, 108 sub-capabilities.
Each capability:
```json
{
  "id": "HCF-001",
  "name": "Patient Master Data Integration & Deduplication",
  "theme": "Patient Intelligence & Experience",
  "themeId": 1,
  "themeColor": "emerald",
  "group": "Patient 360° Analytics",
  "groupId": "1.1",
  "description": "Integrate patient demographic data from multiple sources (HIS, HMIS, lab systems, pharmacy) into a single master patient index, with deduplication logic using NADRA CNIC as primary key.",
  "fhirResources": ["Patient", "Person", "RelatedPerson", "Organization"],
  "hcdmSubjectAreas": ["Party"],
  "maturityLevelRequired": 3,
  "pakistanEnrichment": {
    "institution": "NADRA",
    "system": "CNIC-based Patient MPI",
    "challenge": "No national patient identifier exists. CNIC covers adults but not children. Multiple systems (HIS, HMIS, Sehat Sahulat) use different patient IDs.",
    "opportunity": "Leverage CNIC + biometric for adult deduplication. Build child-mother linkage via MNCH registration."
  },
  "relatedCapabilities": ["HCF-002", "HCF-007", "HCF-097"],
  "businessQuestions": [
    "How many unique patients does our facility serve?",
    "What is our duplicate patient record rate?",
    "Can we link a patient's records across all departments?"
  ]
}
```

GENERATE ALL 108 CAPABILITIES across these 6 themes and 14 groups:

**Theme 1: Patient Intelligence & Experience (emerald, 20 caps)**
- 1.1 Patient 360° Analytics (8): Master data integration, demographic profiling, journey mapping, risk stratification, SDOH integration, engagement scoring, longitudinal record, cohort identification
- 1.2 Patient Access & Experience (6): Wait time analytics, satisfaction/NPS, telemedicine utilization, portal adoption, referral leakage, communication preferences
- 1.3 Patient Safety & Risk (6): Adverse event detection, medication errors, HAI tracking, fall risk, readmission prediction, alert fatigue monitoring

**Theme 2: Clinical Analytics & Quality (red, 22 caps)**
- 2.1 Clinical Decision Support (8): Evidence-based pathways, diagnosis validation, lab trending, imaging appropriateness, documentation quality, comorbidity analysis, antimicrobial stewardship, chronic disease management
- 2.2 Quality Measurement & Reporting (8): Quality indicators, outcome benchmarking, risk-adjusted mortality, SSI tracking, guideline compliance, peer variation, accreditation readiness (JCI/PHCIP), QI initiative tracking
- 2.3 Care Coordination (6): Care team performance, discharge planning, referral optimization, MDT collaboration, episode of care analytics, care gap identification

**Theme 3: Financial Analytics & Revenue (blue, 18 caps)**
- 3.1 Revenue Cycle Analytics (8): Claims denial analytics, revenue leakage, coding optimization (ICD-10/CPT), prior auth, AR aging, payer contracts, OOP estimation, revenue forecasting
- 3.2 Cost Management (6): Cost per patient/DRG, department cost allocation, supply chain optimization, labor productivity, CAPEX ROI, variance analysis
- 3.3 Insurance & Payer Analytics (4): Payer mix, claim processing efficiency, benefit utilization, Sehat Sahulat analytics

**Theme 4: Operational Analytics (violet, 20 caps)**
- 4.1 Capacity & Resource Management (8): Bed occupancy, OR utilization, staff scheduling, equipment utilization, ED throughput, ICU capacity, clinic flow, ambulance analytics
- 4.2 Supply Chain & Pharmacy Operations (6): Drug inventory, formulary management, DUR, medical supply tracking, vendor performance, cold chain compliance
- 4.3 Facility Management (6): Energy consumption, waste management, biomedical equipment, facility compliance, space utilization, environmental monitoring

**Theme 5: Population Health & Public Health (teal, 16 caps)**
- 5.1 Population Health Management (8): Disease burden, risk stratification, chronic disease registry, preventive care gaps, vaccination coverage, maternal & child health, communicable disease surveillance, NCD trends
- 5.2 Public Health Intelligence (8): Outbreak detection, syndromic surveillance, environmental health, nutrition tracking, water/sanitation impact, geographic health disparity, epidemic preparedness, One Health analytics

**Theme 6: Digital Health & Data Governance (indigo, 12 caps)**
- 6.1 Health Information Systems (6): HMIS data quality, FHIR interoperability readiness, EHR adoption, health data exchange, master data management, HIE analytics
- 6.2 Data Governance & Compliance (6): Data privacy/consent, regulatory compliance (DRAP/PMDC/PHCIP), clinical data standardization (ICD-10/LOINC/SNOMED), data quality scoring, AI model governance, digital health maturity tracking

Each capability MUST have:
- fhirResources[] (which FHIR resources it uses — cross-reference with fhirResources.json)
- hcdmSubjectAreas[] (which HCDM subject areas it touches)
- pakistanEnrichment (institution, system, challenge, opportunity)
- businessQuestions[] (3 questions a hospital CEO would ask)
- relatedCapabilities[] (cross-theme links)

### 5. hacrQuestions.json — 720+ maturity questions across 8 categories
Each question:
```json
{
  "id": "HACR-SV-01",
  "category": "Strategy & Leadership",
  "categoryId": 1,
  "subcategory": "Digital Health Vision",
  "question": "Does your organization have a formal digital health strategy approved by the Board/leadership?",
  "levelDescriptions": {
    "1": "No digital health strategy exists. Technology decisions are ad-hoc.",
    "2": "Informal IT plans exist but no documented digital health strategy.",
    "3": "Written digital health strategy exists but not fully adopted across departments.",
    "4": "Board-approved strategy with KPIs, actively tracked quarterly, aligned with UHC goals.",
    "5": "Dynamic strategy integrated with organizational mission, continuously updated with real-time analytics and AI-driven insights."
  },
  "weight": 1.0,
  "capabilityLinks": ["HCF-097", "HCF-108"],
  "pakistanContext": "Pakistan's National Health Vision 2016-2025 outlines digital health objectives. WHO Digital Health Assessment toolkit provides framework."
}
```

Generate at least 90 questions per category (8 categories × 90 = 720 minimum):

**Category 1: Strategy & Leadership (~90 questions)**
Digital health vision, analytics strategy commitment, leadership buy-in, UHC alignment, budget allocation for analytics, change management, innovation culture, partnership strategy (WHO, World Bank, donor alignment)

**Category 2: Workforce & Skills (~90 questions)**
Health informatics capacity, data scientists, clinical informaticists, biostatisticians, health economists, training programs, medical records staff capacity, IT-clinical collaboration, retention, continuous professional development

**Category 3: Data Governance & Standards (~100 questions)**
FHIR adoption, ICD-10 coding compliance, LOINC for lab results, SNOMED CT, master patient index, data sharing agreements, data ownership, data dictionary, metadata management, consent management, de-identification

**Category 4: Infrastructure & Systems (~85 questions)**
HIS/EMR/EHR deployment, HMIS (DHIS2), lab information systems, radiology PACS, pharmacy systems, telemedicine infrastructure, network connectivity (especially rural), cloud readiness, disaster recovery, cybersecurity, mobile health infrastructure

**Category 5: Analytics & Intelligence (~90 questions)**
BI tools deployed, reporting automation, predictive analytics capability, clinical decision support, AI/ML models in production, NLP for clinical notes, population health analytics platforms, real-time dashboards, self-service analytics

**Category 6: Integration & Interoperability (~80 questions)**
FHIR API endpoints, HL7v2 interfaces, health information exchange participation, cross-facility data sharing, lab-pharmacy-HIS integration, Sehat Sahulat integration, NADRA integration, referral system integration, e-prescription systems

**Category 7: Patient & Community Engagement (~80 questions)**
Patient portals, mHealth apps, health literacy programs, community health worker digital tools, patient feedback systems, appointment booking systems, telemedicine patient experience, health education platforms, consent management UX

**Category 8: Outcomes & Impact (~115 questions)**
Clinical outcome measurement, patient experience scores, operational KPIs, financial performance metrics, population health indicators, disease surveillance effectiveness, research output, quality accreditation status, cost-effectiveness analysis, health equity measurement

### 6. starSchema.json — FACT_PATIENT_ENCOUNTER + 12 dimensions
Complete star schema definition. See HAIW design document for full specification.
Include: fact table measures (value, clinical, operational, quality, Pakistan-specific), 12 dimension tables, 5 aggregate tables, 6 analytical views.

### 7. gapExtensions.json — 5 healthcare gap extension modules, 25 tables
- Module 1: Population Health Analytics (5 tables: cohort, measure, intervention, SDOH, outcome)
- Module 2: Claims Intelligence (5 tables: submission, denial, fraud, benchmark, Sehat Sahulat)
- Module 3: Quality & Outcomes (5 tables: indicator, score, patient outcome, adverse event, accreditation)
- Module 4: Pharmacy Analytics (5 tables: drug utilization, formulary compliance, antimicrobial stewardship, interactions, supply chain)
- Module 5: Maternal & Child Health (5 tables: MNCH registration, delivery, immunization, growth, LHW visits)

Each table: name, columns with types, purpose, Pakistan context.

### 8. enrichment.json — Pakistan context per capability (all 108)
Each capability ID mapped to: institution, regulatory body, relevant program, challenge, opportunity, key statistics.

### 9. pakistanContext.json — Pakistan healthcare reference data
```json
{
  "institutions": [...],  // NHSR&C, DRAP, PMC, Provincial Health Depts, etc.
  "statistics": {
    "population": "240 million",
    "healthExpenditure": "2.95% GDP",
    "outOfPocket": "78%",
    "lifeExpectancy": 67.94,
    "infantMortality": 69.3,
    "maternalMortality": 186,
    "hospitals": 1201,
    "bhus": 5518,
    "rhcs": 683,
    "hospitalBeds": 123394,
    "doctors": 260000,
    "ladyHealthWorkers": 100000,
    "sehatSahulatCoverage": "164 million",
    "sehatAnnualLimit": "PKR 1 million/family",
    "psychiatrists": 500,
    "uhcIndex": 45,
    "haqIndex": 37.6
  },
  "facilityHierarchy": [...],  // Teaching → DHQ → THQ → RHC → BHU → LHW
  "priorityPrograms": [...],   // EPI, MNCH, TB-DOTS, Malaria, Polio, HIV, Hepatitis, Nutrition, LHW, NCD
  "codingStandards": [...],    // ICD-10, LOINC, SNOMED CT adoption status
  "challenges": [...]          // HMIS data falsification, ghost facilities, coding gaps, brain drain, etc.
}
```

### 10. dependencies.json — Capability-to-FHIR resource dependencies
108 entries mapping each HCF capability to required FHIR resources with dependency strength (critical, important, optional).

### 11. index.json — Metadata
```json
{
  "module": "HAIW",
  "fullName": "Healthcare Analytics Intelligence Workbench",
  "version": "1.0.0",
  "dataModel": "HL7 FHIR R5",
  "dataModelVersion": "5.0.0",
  "analyticalOverlay": "Teradata HCDM",
  "capabilityFramework": "HCF (Healthcare Capability Framework)",
  "maturityAssessment": "HACR (Healthcare Analytics Capability Review)",
  "resourceCount": 157,
  "hcdmSubjectAreaCount": 12,
  "capabilityCount": 108,
  "maturityQuestionCount": 720,
  "starSchemaTableCount": 24,
  "gapExtensionTableCount": 25,
  "countryContext": "Pakistan",
  "themeColor": "emerald",
  "generatedAt": "ISO datetime"
}
```

## CRITICAL RULES
- Generate ALL 157 FHIR R5 resources with accurate names and descriptions
- Generate ALL 108 HCF capabilities with fhirResources[] and pakistanEnrichment
- Generate ALL 720+ HACR questions with level descriptions
- Every capability must link to specific FHIR resources (not generic "various")
- Every FHIR resource must map to an HCDM subject area
- Pakistan context must be specific (name institutions, programs, statistics)
- Use accurate HL7 FHIR terminology (not made-up element names)
- Run the script and verify all 11 JSON files are created with correct counts

## GIT
git checkout -b feature/haiw-data-repo
git add -A
git commit -m "feat(haiw): generate complete data repository — 157 FHIR resources, 108 HCF capabilities, 720+ HACR questions

- 11 JSON files in src/data/haiw/
- 157 HL7 FHIR R5 resources across 12 categories with elements, references, Pakistan notes
- 12 HCDM subject areas mapped to FHIR resources
- 108 HCF capabilities (6 themes, 14 groups) with FHIR+HCDM mappings and Pakistan enrichment
- 720+ HACR maturity questions (8 categories, 5-level descriptions)
- Star schema: FACT_PATIENT_ENCOUNTER + 12 dimensions + 5 aggregates + 6 views
- 5 gap extensions (25 tables): Population Health, Claims, Quality, Pharmacy, MNCH
- Pakistan healthcare context: institutions, statistics, facility hierarchy, programs, challenges"
git push -u origin feature/haiw-data-repo
git checkout master
git merge feature/haiw-data-repo
git push origin master
```

---

## PROMPT 2 OF 4: Build HAIW Application Module (8 Pages)

```
You are building the HAIW application module — 8 interactive pages for the Healthcare Analytics Intelligence Workbench. Data files already exist in src/data/haiw/.

## EXISTING CONTEXT
- BAIW exists in src/components/ (purple/blue theme)
- TAIW exists in src/taiw/ (teal/cyan theme)
- HAIW data files in src/data/haiw/ (from Prompt 1)
- Tailwind CSS, lucide-react, recharts available

## TASK

### Create src/haiw/ folder with complete module:

```
src/haiw/
├── components/
│   ├── HaiwDashboard.tsx          # /haiw
│   ├── FHIRResourceExplorer.tsx   # /haiw/model
│   ├── HCFCapabilityNavigator.tsx # /haiw/capabilities
│   ├── HealthDependencyGraph.tsx  # /haiw/graph
│   ├── HealthMaturityAssessment.tsx # /haiw/maturity
│   ├── HealthAnalyticsEngine.tsx  # /haiw/analytics
│   ├── HealthRoadmapBuilder.tsx   # /haiw/roadmap
│   └── PakistanHealthReference.tsx # /haiw/pakistan
├── HaiwLayout.tsx                 # Shell with nav
└── index.tsx                      # Exports
```

### Theme: Emerald/Green gradient (from-emerald-600 to-green-600)
- Background: slate-900 (same dark theme as BAIW/TAIW)
- Accent: emerald-500
- Icons: lucide-react (Heart, Stethoscope, Activity, Building2, Shield, Pill, Baby, Brain, etc.)

### HaiwLayout.tsx
- Top nav bar with emerald/green gradient
- "HAIW" logo with "Healthcare Analytics Intelligence Workbench" subtitle
- 8 navigation links with icons:
  1. Dashboard (LayoutDashboard)
  2. FHIR Model (Database)
  3. Capabilities (Target)
  4. Dependencies (GitBranch)
  5. Maturity (BarChart3)
  6. Analytics Engine (Activity)
  7. Roadmap (Map)
  8. Pakistan Health (Heart)
- Module switcher dropdown: BAIW ↔ TAIW ↔ HAIW using react-router

### Page 1: HaiwDashboard.tsx (/haiw)
Hero section (emerald gradient):
- "Healthcare Analytics Intelligence Workbench"
- "HL7 FHIR R5 × Teradata HCDM × Pakistan Healthcare Context"
- 6 hero stat cards: 157 FHIR Resources | 12 HCDM Subject Areas | 108 HCF Capabilities | 720+ HACR Questions | 24 Star Schema Tables | 25 Gap Extension Tables

Content grid:
- **Patient Encounter Chart** (recharts): Monthly encounters by type (Inpatient, Outpatient, Emergency, Telemedicine, Home Visit) — use realistic Pakistan health facility data patterns
- **FHIR Category Donut** (recharts): 12 categories with resource counts, clickable segments → /haiw/model
- **HCF Capability Bar** (recharts): 6 themes as horizontal bars with sub-capability counts
- **Pakistan Health Metrics Panel**: Key stats from pakistanContext.json (life expectancy, IMR, beds/1000, doctor ratio, UHC index) with trend indicators
- **Quick Nav Grid**: 7 cards (one per other page) with live data counts, clickable
- **Maturity Preview Radar**: 8-axis radar showing sample HACR scores

### Page 2: FHIRResourceExplorer.tsx (/haiw/model)
3-level hierarchy browser:
- **Level 1**: 12 FHIR categories (collapsible panels with category color)
- **Level 2**: Resources within each category (list with element count badges)
- **Level 3**: Resource detail panel showing:
  - Name, description, purpose
  - Elements table (name, type, cardinality, description, mustSupport flag)
  - References: "Points to" (outgoing references as chips)
  - "Referenced by" (incoming references as chips) — clickable to navigate
  - HCDM Subject Area badge (clickable → shows all resources in that SA)
  - Pakistan Relevance notes
  - "Used by Capabilities" section: list of HCF capabilities that use this resource (clickable → /haiw/capabilities)
  - Maturity level badge (1-5)

Search bar at top: search across all 157 resources by name, description, or element name.
Filter chips: by category, by HCDM subject area, by maturity level, by Pakistan relevance.

### Page 3: HCFCapabilityNavigator.tsx (/haiw/capabilities)
Collapsible tree: 6 Themes → 14 Groups → 108 Capabilities
- Theme headers with theme color and capability count
- Group headers with group ID (1.1, 1.2, etc.)
- Capability cards showing: name, description (truncated), FHIR resource count badge, business question count

Capability detail panel (right side or expanded):
- Full description
- **FHIR Resources Required** — chips linking to /haiw/model
- **HCDM Subject Areas** — chips with subject area colors
- **Pakistan Enrichment** — institution, system, challenge, opportunity
- **Business Questions** — 3 questions a hospital CEO would ask
- **Related Capabilities** — cross-theme links (clickable)
- **Maturity Level Required** — badge
- **HACR Questions** — count of maturity questions linked to this capability

### Page 4: HealthDependencyGraph.tsx (/haiw/graph)
Two visualization modes (toggle):

**Mode 1: Force-Directed Graph**
- HCF capability nodes (colored by theme) ↔ FHIR resource nodes (colored by category)
- Edge lines showing dependencies (thickness = dependency strength)
- Click capability → highlight its FHIR resources
- Click FHIR resource → highlight capabilities that use it
- Zoom, pan, drag nodes

**Mode 2: Sankey Diagram**
- Flow: Themes → Groups → FHIR Categories → Resources
- Width proportional to capability count
- Hover shows the mapping details

### Page 5: HealthMaturityAssessment.tsx (/haiw/maturity)
HACR wizard: 8 categories, each with questions.
- Category stepper at top showing progress
- Per question: text, current score slider (1-5), target score slider (1-5), level descriptions on hover
- Radar chart (live updates as user scores)
- Gap heat map: categories × levels showing biggest gaps
- Save to localStorage (haiw_maturity_*)
- Report generation panel (from BAIW pattern — will be enhanced in Prompt 4)

### Page 6: HealthAnalyticsEngine.tsx (/haiw/analytics)
- **Star Schema ERD**: Interactive diagram showing FACT_PATIENT_ENCOUNTER + 12 dimensions with clickable tables
- **Patient Encounter Waterfall**: Charges → Insurance → Copay → Write-off → Net Revenue
- **Dimension Explorer**: 12 cards (one per dimension) showing key attributes, Pakistan context
- **Gap Extensions**: 5 module cards expandable to show 25 tables with columns
- **Analytical Views**: 6 pre-built views with SQL-like definitions

### Page 7: HealthRoadmapBuilder.tsx (/haiw/roadmap)
- **Capability Picker**: Multi-select from 108 HCF capabilities
- **Templates**: Quick Wins, Patient Safety First, Revenue Cycle, Population Health, UHC Readiness, Full HCF
- **3-Phase Gantt**: Foundation → Integration → Intelligence with capabilities positioned
- **PKR Investment Calculator**: Sliders for team size, infrastructure, timeline → total cost and ROI
- **Shared Data Foundation**: FHIR resources shared across selected capabilities

### Page 8: PakistanHealthReference.tsx (/haiw/pakistan)
- **Institutional Framework**: NHSR&C → Provincial Health Depts → DRAP → PMC → NIH hierarchy
- **Facility Hierarchy**: Visual tree: Teaching Hospital → DHQ → THQ → RHC → BHU → LHW
- **Sehat Sahulat Section**: Coverage by province, claim statistics, annual limits, hospital empanelment
- **Priority Programs**: 10 program cards (EPI, MNCH, TB, Malaria, Polio, HIV, Hepatitis, Nutrition, LHW, NCD) with key indicators
- **Health Statistics**: Sortable table of key metrics
- **Coding Standards**: ICD-10, LOINC, SNOMED CT adoption status in Pakistan

### Routes in App.tsx
Add HAIW routes:
```tsx
<Route path="/haiw/*" element={<HaiwLayout />}>
  <Route index element={<HaiwDashboard />} />
  <Route path="model" element={<FHIRResourceExplorer />} />
  <Route path="capabilities" element={<HCFCapabilityNavigator />} />
  <Route path="graph" element={<HealthDependencyGraph />} />
  <Route path="maturity" element={<HealthMaturityAssessment />} />
  <Route path="analytics" element={<HealthAnalyticsEngine />} />
  <Route path="roadmap" element={<HealthRoadmapBuilder />} />
  <Route path="pakistan" element={<PakistanHealthReference />} />
</Route>
```

### Suite Landing Page
Add HAIW as third card on suite landing:
- Title: "Healthcare Analytics Intelligence Workbench"
- Theme: emerald/green gradient
- Stats: "157 FHIR Resources • 108 Capabilities • 720+ Questions"
- Icon: Heart from lucide-react
- Link: /haiw

## CRITICAL RULES
- HAIW is a SEPARATE module (like TAIW), NOT inside BAIW
- Zero modifications to BAIW (src/components/*) except adding HAIW card to suite landing and route to App.tsx
- Zero modifications to TAIW (src/taiw/*)
- All data imported from src/data/haiw/
- Emerald/green theme throughout (NOT purple/blue or teal/cyan)
- localStorage keys prefixed with haiw_ (haiw_maturity_*, haiw_roadmap_*)
- All FHIR resource chips must navigate to /haiw/model
- All capability chips must navigate to /haiw/capabilities
- Module switcher must show all 3 modules (BAIW, TAIW, HAIW)
- All Pakistan context must be healthcare-specific (not banking or trade)

## GIT
git checkout -b feature/haiw-app-module
git add -A
git commit -m "feat(haiw): build complete Healthcare Analytics Intelligence Workbench — 8 pages

- HaiwLayout with emerald/green theme and 8 nav links
- Dashboard: FHIR donut, HCF bar chart, Pakistan health metrics, maturity radar
- FHIR Resource Explorer: 157 resources across 12 categories with element details
- HCF Capability Navigator: 108 capabilities with FHIR+HCDM mappings
- Dependency Graph: force-directed + Sankey (capabilities ↔ resources)
- Maturity Assessment: HACR wizard, 8 categories, radar chart, gap heat map
- Analytics Engine: star schema ERD, dimension explorer, 5 gap extensions
- Roadmap Builder: capability picker, templates, Gantt, PKR calculator
- Pakistan Health Reference: institutions, facility hierarchy, Sehat Sahulat, programs
- Suite landing updated with HAIW card, module switcher shows 3 modules
- All routes at /haiw/*"
git push -u origin feature/haiw-app-module
git checkout master
git merge feature/haiw-app-module
git push origin master
```

---

## PROMPT 3 OF 4: Phase 2 Depth + Healthcare Use Cases

```
You are enhancing the HAIW module with Phase 2 depth features and healthcare use cases mapped to HCF capabilities and FHIR resources (same pattern as COE is to BAIW).

## EXISTING CONTEXT
- HAIW built with 8 pages in src/haiw/
- Data in src/data/haiw/
- 157 FHIR resources, 108 capabilities, 720+ questions all loaded

## TASK

### Part A: 25 Phase 2 Enhancements (3-4 per page)

**Dashboard (3):**
1. Add animated patient encounter sparklines (30-day trends per encounter type)
2. Add Pakistan health facility map (SVG map of Pakistan with facility counts by province)
3. Add live FHIR resource count by HCDM subject area donut (interactive, clickable)

**FHIR Resource Explorer (4):**
4. Add resource-to-resource reference graph (mini force-directed showing selected resource's connections)
5. Add element usage heatmap (which elements are most used across capabilities)
6. Add FHIR maturity badge filter (show only Normative, Trial Use, or Draft resources)
7. Add "Compare Resources" mode (side-by-side two resources)

**HCF Capabilities (3):**
8. Add critical capability star markers (top 20 most impactful capabilities marked with star)
9. Add maturity level required badges (color coded: Level 1=green easy, Level 5=red advanced)
10. Add "Capabilities by FHIR Resource" reverse view (select a resource → see which capabilities need it)

**Dependency Graph (3):**
11. Add Sankey view mode toggle (in addition to force-directed)
12. Add HCDM subject area cluster highlighting (group nodes by subject area)
13. Add click-to-navigate: clicking a node opens it in Explorer or Navigator

**Maturity Assessment (3):**
14. Add level descriptions panel (expandable per question showing all 5 levels side-by-side)
15. Add gap heat map (8 categories × 5 levels, color intensity = gap size)
16. Add category stepper with progress percentage per category

**Analytics Engine (4):**
17. Add patient encounter cost waterfall chart (Charges → Insurance → Copay → Write-off)
18. Add dimension explorer cards (12 cards, each showing top 5 attributes with Pakistan context)
19. Add gap extension deep dive (click a module → see all 5 tables with column definitions)
20. Add SQL-like view definitions (expandable cards showing what each analytical view computes)

**Roadmap Builder (3):**
21. Add PKR investment calculator with team size, infrastructure, timeline sliders
22. Add shared data foundation table (FHIR resources shared across selected capabilities)
23. Add phase auto-suggestions (based on capability maturity requirements)

**Pakistan Health Reference (2):**
24. Add Sehat Sahulat deep dive panel (coverage by province, claim categories, hospital tiers)
25. Add priority program cards with expandable indicator tables (EPI coverage %, MNCH ANC %, TB detection rate, etc.)

### Part B: Cross-Module Navigation (12+ links)
Add contextual links between HAIW pages:
- FHIR Resource detail → "Used by X capabilities" → click → /haiw/capabilities
- Capability detail → "Requires X FHIR resources" → click → /haiw/model
- Maturity question → "Related to capability X" → click → /haiw/capabilities
- Dashboard FHIR donut segments → click → /haiw/model filtered by category
- Dashboard capability bars → click → /haiw/capabilities filtered by theme
- Analytics dimension cards → click → /haiw/model filtered by relevant FHIR resources
- Roadmap selected capabilities → click → /haiw/capabilities detail
- Pakistan program cards → click → /haiw/capabilities filtered by related capabilities

### Part C: Healthcare Use Cases Page (Page 9)
Create src/haiw/components/HealthcareUseCases.tsx — Route: /haiw/use-cases
Add as 9th nav item in HaiwLayout (same pattern as COE in BAIW).

This page shows 8 real-world healthcare analytics use cases mapped to HCF capabilities and FHIR resources:

**UC-H1: Disease Surveillance & Outbreak Detection**
- Capabilities: HCF-087, HCF-089, HCF-090, HCF-091
- FHIR: Condition, Observation, Location, Encounter, MeasureReport
- Pakistan: NIH disease reporting, polio surveillance, dengue tracking
- Impact: Early outbreak detection saves 48-72 hours response time

**UC-H2: Maternal & Child Health Analytics**
- Capabilities: HCF-086, related MNCH capabilities
- FHIR: Patient, Encounter, Observation, Immunization, Procedure
- Pakistan: MNCH program, LHW visits, EPI coverage tracking
- Impact: Reduce MMR by identifying high-risk pregnancies, track immunization dropout

**UC-H3: Sehat Sahulat Claims Intelligence**
- Capabilities: HCF-057-060 (insurance analytics)
- FHIR: Coverage, Claim, ClaimResponse, ExplanationOfBenefit, Patient
- Pakistan: SSP fraud detection, hospital empanelment analytics, benefit utilization
- Impact: Detect PKR 5-10B in fraudulent/waste claims annually

**UC-H4: Hospital Performance Scorecard**
- Capabilities: HCF-029-036 (quality measurement)
- FHIR: MeasureReport, Encounter, Observation, Procedure, AdverseEvent
- Pakistan: DHQ/THQ performance benchmarking, PHCIP accreditation readiness
- Impact: Identify bottom-decile facilities for targeted intervention

**UC-H5: Drug Utilization & Antimicrobial Stewardship**
- Capabilities: HCF-069-074 (pharmacy operations)
- FHIR: MedicationRequest, MedicationDispense, MedicationAdministration, Observation
- Pakistan: DRAP compliance, essential medicine stockout, AMR crisis
- Impact: Reduce inappropriate antibiotic use by 30-40%

**UC-H6: Patient Flow & ED Optimization**
- Capabilities: HCF-061-068 (capacity management)
- FHIR: Encounter, Location, Practitioner, ServiceRequest, Appointment
- Pakistan: Teaching hospital ED overcrowding, bed management
- Impact: Reduce ED wait times by 40%, improve bed turnover by 25%

**UC-H7: Population Health Equity Mapping**
- Capabilities: HCF-081-088 (population health)
- FHIR: Patient, Observation, Condition, Location, MeasureReport
- Pakistan: District-level health disparity analysis, urban vs. rural gaps
- Impact: Target health spending to 50 most underserved districts

**UC-H8: Digital Health Maturity Assessment**
- Capabilities: HCF-097-108 (digital health governance)
- FHIR: CapabilityStatement, ImplementationGuide, AuditEvent, OperationDefinition
- Pakistan: HMIS data quality, FHIR readiness, HIE preparation
- Impact: Roadmap to Level 4 digital maturity in 3-5 years

Each UC card: name, objective, capabilities (clickable → /haiw/capabilities), FHIR resources (clickable → /haiw/model), Pakistan context, impact metric.

Add "Healthcare Use Cases" to navigation and dashboard.

## CRITICAL RULES
- 25 enhancements must be functional (not just visual)
- Cross-module links must navigate correctly
- Use cases must link to REAL capability IDs and FHIR resource names from the data
- Pakistan context in every use case must be specific (institution names, program names, statistics)
- Zero modifications to BAIW or TAIW

## GIT
git checkout -b feature/haiw-phase2
git add -A
git commit -m "feat(haiw): Phase 2 depth — 25 enhancements + 8 healthcare use cases

- 25 enhancements across 8 pages (sparklines, heatmaps, calculators, deep dives)
- 12+ cross-module navigation links
- 8 healthcare use cases mapped to HCF capabilities and FHIR resources:
  Disease surveillance, MNCH, Sehat Sahulat claims, hospital scorecard,
  drug utilization, ED optimization, population health equity, digital maturity
- Added /haiw/use-cases as Page 9
- Zero BAIW/TAIW modifications"
git push -u origin feature/haiw-phase2
git checkout master
git merge feature/haiw-phase2
git push origin master
```

---

## PROMPT 4 OF 4: Reports + Quick Assessment + Audit + v4.0.0

```
You are finalizing HAIW with report generation, quick assessment, audit fixes, and version tagging.

## EXISTING CONTEXT
- HAIW complete with 9 pages in src/haiw/
- BAIW has report generator and quick assessment (from v3.0.0 prompts)
- TAIW has report generator and quick assessment
- All data in src/data/haiw/

## TASK

### Part A: HAIW Report Generator

Create src/haiw/utils/healthReportGenerator.ts following BAIW's pattern but healthcare-specific:

**generateHealthMaturityPDF (18 pages):**
- Page 1: Cover — "[Organization] Healthcare Analytics Maturity Assessment"
- Page 2: Executive Summary — overall HACR score, 3 findings, 3 recommendations
- Page 3: Maturity Radar — 8 HACR categories, current vs target vs Pakistan avg
- Page 4: Category Scorecard — 8 rows sorted by gap
- Pages 5-12: Category Deep Dives (healthcare-specific recommendations)
- Page 13: Capability Gap Matrix (top 20 HCF gaps)
- Page 14: **FHIR Readiness Assessment** (UNIQUE to HAIW):
  | FHIR Category | Resources Needed | Currently Implemented | Gap | Priority |
  "Pakistan FHIR adoption status: Early stage. No national FHIR implementation guide published."
- Page 15: Roadmap Summary (3 phases with PKR estimates)
- Page 16: Benchmark Comparison:
  Your org vs Pakistan health avg vs Regional leaders (Thailand, Sri Lanka, Turkey) vs WHO targets
- Page 17: Next Steps + UHC alignment
- Page 18: Methodology (HCF, HACR, FHIR, HCDM)

**generateHealthGapCSV:** 108 rows (HCF capabilities)
**generateHealthRoadmapMarkdown:** 12 "slides" for PPTX conversion

Create src/haiw/components/HealthReportGenerator.tsx — same 3-download panel as BAIW/TAIW.

### Part B: HAIW Quick Assessment

Create src/data/haiw/quickAssessment.json — 24 healthcare questions (3 per HACR category):

Example questions (CTO/Medical Director answerable):
- Strategy: "Does your organization have a Board-approved digital health strategy?"
- Workforce: "Do you have dedicated health informatics professionals?"
- Data Governance: "Is ICD-10 coding used for all diagnoses?"
- Infrastructure: "Do you have an electronic medical record system?"
- Analytics: "Are clinical dashboards available to department heads?"
- Integration: "Can lab results flow automatically into the EMR?"
- Patient Engagement: "Do patients have digital access to their records?"
- Outcomes: "Can you measure 30-day readmission rates by department?"

Add mode selector (Quick/Standard/Deep) to /haiw/maturity.
Quick PDF: 3 pages (radar + strengths/gaps + next steps with Godaitec CTA).

### Part C: HAIW Benchmarks

Create src/data/haiw/benchmarks.json:
```json
{
  "pakistanHealthAverage": {
    "strategyLeadership": 1.6,
    "workforceSkills": 1.3,
    "dataGovernance": 1.2,
    "infrastructure": 1.8,
    "analyticsIntelligence": 1.1,
    "integration": 1.4,
    "patientEngagement": 1.0,
    "outcomesImpact": 0.9,
    "overall": 1.29
  },
  "regionalLeaders": {
    "strategyLeadership": 3.2,
    "workforceSkills": 2.9,
    "dataGovernance": 2.7,
    "infrastructure": 3.5,
    "analyticsIntelligence": 3.0,
    "integration": 3.2,
    "patientEngagement": 2.5,
    "outcomesImpact": 2.8,
    "overall": 2.98,
    "examples": "Thailand, Turkey, Sri Lanka, Jordan"
  },
  "globalBest": {
    "strategyLeadership": 4.5,
    "workforceSkills": 4.3,
    "dataGovernance": 4.2,
    "infrastructure": 4.6,
    "analyticsIntelligence": 4.4,
    "integration": 4.5,
    "patientEngagement": 4.0,
    "outcomesImpact": 4.1,
    "overall": 4.33,
    "examples": "Kaiser Permanente, NHS England, Singapore Health, Mayo Clinic"
  }
}
```

### Part D: Audit & Polish

1. **Cmd+K Palette**: Create HaiwCommandPalette.tsx — search across FHIR resources, capabilities, HACR questions, Pakistan context. Active only on /haiw/* routes.

2. **localStorage isolation**: Verify all keys use haiw_ prefix

3. **Export buttons**: Add to all HAIW pages:
   - FHIR Explorer: "Export Resources" → JSON
   - Capabilities: "Export Capabilities" → JSON
   - Maturity: Report generator (from Part A)
   - Analytics: "Export Star Schema" → JSON
   - Roadmap: "Export Roadmap" → JSON

4. **Module switcher**: Verify all 3 modules (BAIW, TAIW, HAIW) appear in switcher across all layouts

5. **Suite landing**: Verify HAIW card shows correctly with emerald theme, correct stats

6. **Mobile responsiveness**: All 9 HAIW pages work at 768px+

7. **Audit checklist** — verify ALL of these:
   - [ ] All 9 HAIW routes load without blank pages
   - [ ] 157 FHIR resources display in explorer
   - [ ] 108 capabilities display in navigator
   - [ ] Dependency graph renders (both force-directed and Sankey)
   - [ ] Maturity sliders save to localStorage
   - [ ] Star schema ERD is interactive
   - [ ] 8 healthcare use cases link to real capabilities and resources
   - [ ] Pakistan reference page shows all institutions and programs
   - [ ] Quick assessment generates 3-page PDF
   - [ ] Full report generates 18-page PDF
   - [ ] Module switcher works from all 3 modules
   - [ ] No TypeScript errors
   - [ ] All lucide-react icons imported
   - [ ] Emerald/green theme consistent across all pages

## GIT — Final commit + v4.0.0 tag

git checkout -b feature/haiw-reports-polish
git add -A
git commit -m "feat(haiw): reports + quick assessment + audit — HAIW complete

- Health maturity PDF (18 pages with FHIR readiness assessment)
- Quick assessment (24 questions, 10 min, 3-page lead-gen PDF)
- Healthcare benchmarks (Pakistan avg, regional leaders, global best)
- Cmd+K palette for HAIW, export buttons, localStorage isolation
- Mobile responsive, audit verified, module switcher polished"
git push -u origin feature/haiw-reports-polish
git checkout master
git merge feature/haiw-reports-polish

# Tag v4.0.0
git tag -a v4.0.0 -m "v4.0.0 — Analytics Intelligence Suite with Healthcare Module

BAIW (Banking):
  - 9 pages (8 original + Cash Optimization Engine)
  - FSDM v13: 3,917 entities, 16 domains
  - BVF: 112 capabilities, BACR: 793 questions
  - COE: 10 cash use cases mapped to BVF + FSDM
  - Report generator + quick assessment

TAIW (Trade):
  - 8 pages with WCO DM v4.2
  - TCF: 96 capabilities, TACR: 640+ questions
  - Report generator + quick assessment

HAIW (Healthcare) — NEW:
  - 9 pages (8 core + healthcare use cases)
  - HL7 FHIR R5: 157 resources, 12 categories
  - HCDM: 12 subject areas mapped to FHIR
  - HCF: 108 capabilities, HACR: 720+ questions
  - Star schema: FACT_PATIENT_ENCOUNTER + 12 dimensions
  - 5 gap extensions: Population Health, Claims, Quality, Pharmacy, MNCH
  - 8 healthcare use cases mapped to capabilities + FHIR resources
  - Pakistan context: Sehat Sahulat, NADRA, HMIS, 10 priority programs
  - Report generator + quick assessment + benchmarks

Suite Totals:
  - 27 interactive pages
  - 316 capabilities (112 + 96 + 108)
  - 2,153+ maturity questions
  - 3 report generators (PDF + CSV + Markdown)
  - 3 quick assessments (24 questions each)
  - 3 benchmark datasets"

git push origin v4.0.0
git push origin master
```

---

## Execution Checklist

```
□ Prompt 1: Data Repository     → 11 JSON files, 157 resources, 108 capabilities, 720+ questions
□ Prompt 2: 8-Page App Module   → Dashboard, Explorer, Navigator, Graph, Maturity, Analytics, Roadmap, Pakistan
□ Prompt 3: Phase 2 + Use Cases → 25 enhancements, 12 cross-links, 8 healthcare use cases (Page 9)
□ Prompt 4: Reports + Polish    → PDF generator, quick assessment, benchmarks, Cmd+K, audit → v4.0.0

Post-build verification:
□ http://localhost:5173/haiw         → Dashboard with 6 hero stats
□ http://localhost:5173/haiw/model   → 157 FHIR resources browsable
□ http://localhost:5173/haiw/capabilities → 108 capabilities with FHIR links
□ http://localhost:5173/haiw/maturity    → Quick/Standard/Deep modes
□ Suite landing shows 3 modules (BAIW + TAIW + HAIW)
□ git tag shows v4.0.0
```
