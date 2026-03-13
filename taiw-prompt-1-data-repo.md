# TAIW — Prompt 1: Generate Data Repository

## Context

BAIW (Banking Analytics Intelligence Workbench) app is running at localhost:5173 with 8 modules for banking analytics. We are adding **TAIW** (Trade Analytics Intelligence Workbench) as a **separate section** within the same app.

This prompt creates the TAIW data repository — all structured JSON files that the app modules will consume. These go in a **separate data folder** from BAIW's banking data.

---

## Task

Create a Python script `scripts/generate_taiw_data.py` that generates all TAIW JSON data files into `src/data/taiw/`. This is the equivalent of BAIW's `generate_sample_data.py` but for trade/customs domain.

Run the script after creating it. All output files should be ready for the React app to import.

---

## Output Directory Structure

```
src/data/taiw/
├── dataElements.json          # 727 WCO Data Model elements
├── classes.json               # ~130 WCO DM classes
├── domains.json               # 14 WCO DM domains
├── relationships.json         # Class-to-class relationships
├── informationPackages.json   # 20 DIPs + 3 BIPs
├── codeLists.json             # Key code lists (~50 most important)
├── capabilities.json          # 96 TCF sub-capabilities
├── dataRequirements.json      # ~120 trade data requirements
├── mappings.json              # ~400 TCF→WCO DM mappings
├── dependencies.json          # ~3,000 capability→element dependencies
├── reuseScores.json           # ~200 elements ranked P1-P4
├── tacrQuestions.json         # 640+ maturity questions across 8 categories
├── starSchema.json            # FACT_TRADE_TRANSACTION + 10 dims + aggs + views
├── gapExtensions.json         # 5 modules, 25 tables
├── enrichment.json            # Pakistan trade context per capability (top 12 detailed)
├── pakistanContext.json       # Pakistan trade reference data
└── index.json                 # Metadata and stats
```

---

## File Specifications

### 1. `dataElements.json` — 727 WCO Data Model Elements

Generate exactly 727 data elements. These must use **real WCO DM element names and IDs** from the official WCO Data Model. Group them by domain.

```json
[
  {
    "id": "001",
    "name": "Identification of declaration",
    "definition": "An identifier of a customs declaration as assigned by the customs authority",
    "class": "Declaration",
    "domain": "Declaration",
    "dataType": "an..35",
    "codeList": null,
    "informationPackages": ["GoodsDeclaration", "CargoDeclaration", "Transit"],
    "format": "an..35",
    "unEdifactTag": "1004"
  },
  ...
]
```

**Generate elements for each domain with these approximate counts:**

| Domain | Elements | Key Element Names (use exact WCO DM names) |
|--------|----------|---------------------------------------------|
| Declaration | ~85 | Identification of declaration, Type of declaration, Message function code, Date of declaration, Customs office of declaration, Previous document reference, Trader reference (UCR), Amendment reason, Total packages, Total gross mass, Invoice amount, Currency code |
| Consignment | ~65 | Consignment identification, Carrier assigned identifier, Freight charge amount, Associated transport document, Container indicator, Consolidation indicator, Total consignment value, Sequence number, Reference number of consignment |
| Goods | ~70 | Goods description, Commodity code (HS), Statistical value, Net mass, Gross mass, Supplementary quantity, Tariff quantity, Package type, Number of packages, Marks and numbers, Country of origin, Preferential origin, Dangerous goods class, UN dangerous goods number |
| Transport | ~55 | Transport means identification (vessel IMO, aircraft reg, vehicle plate), Transport means nationality, Mode of transport at border, Inland mode of transport, Container identification, Seal number, Container size/type code, Equipment identification number, Voyage/flight number |
| Party | ~50 | Party name, Party identifier, Party function code, Address (street, city, postcode, country), Communication number, Contact person, TIN/NTN number, DUNS number, AEO authorization number |
| Location | ~40 | Location identifier (UN/LOCODE), Location function code, Country code, Country sub-entity, Loading location, Unloading location, Place of delivery, Port of discharge, First port of entry |
| Financial | ~45 | Customs value, Value declared for customs, Duty/tax/fee type, Duty/tax/fee amount, Duty/tax/fee rate, Payment method code, Guarantee type, Guarantee reference, Guarantee amount, Exchange rate, Currency code, Total taxes paid amount |
| Document | ~35 | Additional document type, Document reference number, Document date, Document status, Document issuing authority, Line item number on document, Attached document binary |
| Classification | ~30 | Commodity classification code (HS6), Commodity classification type (HS/ECCN/CUS), National tariff line, Additional tariff code, Preference code, Quota order number, Anti-dumping duty indicator |
| Risk & Control | ~25 | Examination type, Examination result, Seal number, Seal condition, Government procedure code, Risk assessment indicator, Selectivity channel, Examination location |
| Origin | ~30 | Country of origin code, Preferential treatment code, Origin criterion code, Certificate of origin number, Certificate of origin date, Origin declaration reference, Regional value content percentage, Change in tariff classification indicator |
| Warehouse | ~25 | Warehouse identifier, Warehouse type code, Bonded warehouse type, Storage period, Warehouse entry number, Free zone identifier, Temporary storage declaration |
| E-Commerce | ~20 | De minimis value, E-commerce indicator, Platform identifier, Buyer/seller online marketplace ID, Return goods indicator, Simplified declaration indicator, Unique shipment reference |
| Response | ~25 | Decision code, Response date, Release notification, Query code, Error code, Penalty code, Amendment accepted indicator, Refund reference |

**IMPORTANT:** Use realistic WCO DM-style names. Elements should sound like actual trade/customs data fields, not generic placeholders. Reference the WCO DM eHandbook naming conventions: "Name of [concept]", "[Concept]. [Qualifier]. [Representation term]" pattern.

### 2. `classes.json` — ~130 WCO DM Classes

```json
[
  {
    "id": "CLS_001",
    "name": "Declaration",
    "domain": "Declaration",
    "description": "A formal request made to customs by an authorized person to place goods under a given customs procedure",
    "elementCount": 25,
    "parentClass": null,
    "childClasses": ["DeclarationGovernment", "GoodsShipment"],
    "stereotype": "ABIE"
  },
  ...
]
```

**Generate these key classes (with realistic descriptions):**

```
Declaration Domain:     Declaration, DeclarationGovernment, DeclarationGoodShipment, CustomsDeclarationDocument, Amendment, Cancellation
Consignment Domain:     Consignment, ConsignmentItem, TransportContractDocument, AssociatedTransportDocument, ConsolidatedConsignment
Goods Domain:           Commodity, GoodsItem, GoodsMeasure, Packaging, DangerousGoods, Classification, TariffQuantity, AdditionalInformation, PreviousDocument
Transport Domain:       TransportMeans, BorderTransportMeans, TransitTransportMeans, ArrivalTransportMeans, DepartureTransportMeans, TransportEquipment, Seal, Itinerary, TransportEvent
Party Domain:           Party, Agent, Buyer, Seller, Consignor, Consignee, Declarant, Carrier, CustomsBroker, Importer, Exporter, Manufacturer, Notify, FreightForwarder, WarehouseKeeper
Location Domain:        Location, Address, LoadingLocation, UnloadingLocation, CustomsOffice, EntryPort, ExitPort, DestinationCountry, DispatchCountry
Financial Domain:       CustomsValuation, DutyTaxFee, ObligationGuarantee, Payment, AccountingEntry, ExchangeRate, BankAccount, TradeFinanceDocument
Document Domain:        AdditionalDocument, Certificate, License, Permit, Invoice, PackingList, BillOfLading, AirWaybill, InsuranceDocument
Classification Domain:  HarmonizedSystem, NationalTariffLine, PreferenceCode, QuotaAllocation, Restriction
Risk Domain:            RiskAssessment, ExaminationNotice, ExaminationResult, GovernmentProcedure, Selectivity
Origin Domain:          CertificateOfOrigin, PreferentialTreatment, RulesOfOrigin, OriginDeclaration, RegionalValueContent, CumulationRule
Warehouse Domain:       Warehouse, CustomsBondedArea, FreeZone, TemporaryStorage, InwardProcessing, OutwardProcessing
E-Commerce Domain:      ECommerceItem, DeMinimisDeclaration, SimplifiedDeclaration, ReturnGoods, PostalItem, CourierShipment
Response Domain:        Response, DecisionNotification, ReleaseNotification, QueryNotification, ErrorNotification, PenaltyAssessment
```

### 3. `domains.json` — 14 WCO DM Domains

```json
[
  {
    "name": "Declaration",
    "slug": "declaration",
    "count": 85,
    "classCount": 6,
    "description": "Core customs declaration documents — goods declaration, amendment, cancellation, government procedures",
    "color": "blue",
    "icon": "FileText"
  },
  ...
]
```

Generate all 14 with counts matching the elements:
```
Declaration (85, blue), Consignment (65, cyan), Goods (70, amber), Transport (55, emerald),
Party (50, violet), Location (40, teal), Financial (45, orange), Document (35, slate),
Classification (30, yellow), Risk & Control (25, red), Origin (30, lime),
Warehouse (25, indigo), E-Commerce (20, pink), Response (25, gray)
```

### 4. `relationships.json` — Class Relationships

```json
[
  {
    "parent": "Declaration",
    "child": "GoodsShipment",
    "type": "composition",
    "cardinality": "1:N",
    "parentDomain": "Declaration",
    "childDomain": "Consignment"
  },
  ...
]
```

Generate ~300 relationships between the ~130 classes. Key structural relationships:
- Declaration → GoodsShipment (1:N)
- GoodsShipment → GoodsItem (1:N)
- GoodsItem → Classification (1:N)
- GoodsItem → Packaging (1:N)
- Declaration → Party [multiple roles] (1:N)
- Declaration → TransportMeans (1:N)
- GoodsItem → DutyTaxFee (1:N)
- Declaration → AdditionalDocument (1:N)
- GoodsItem → CertificateOfOrigin (0:1)
- Declaration → ObligationGuarantee (0:N)
- Declaration → Response (1:N)

### 5. `informationPackages.json` — 23 Information Packages

```json
[
  {
    "id": "DIP_GD",
    "name": "Goods Declaration",
    "type": "DIP",
    "description": "Import/export goods declaration — the core customs document",
    "classes": ["Declaration", "GoodsShipment", "GoodsItem", "Party", "TransportMeans", "Classification", "DutyTaxFee", "AdditionalDocument"],
    "elementCount": 280,
    "pakRelevance": "PRIMARY — Maps to WeBOC GD (Home Consumption, Export, Warehousing)",
    "webocMapping": "Goods Declaration (GD) in WeBOC"
  },
  ...
]
```

Generate these 23 IPs:
```
BIPs (3):  Declaration BIP, Response BIP, Cross-Border Movement BIP
DIPs (20): Goods Declaration (Import/Export), Cargo Declaration (Manifest), Conveyance Report,
           Advanced Electronic Information (AEI/SAFE), Transit Declaration,
           License/Permit/Certificate, Phytosanitary Certificate, Veterinary Certificate,
           Certificate of Origin (v4.2), Customs Bond (v4.2), Booking Reservation Info (v4.1),
           Postal/E-Commerce Items, Temporary Admission, ATA Carnet,
           Passenger Declaration, GOVCBR (Gov Cross-Border Regulatory),
           Warehouse Declaration, Free Zone Declaration, Re-Export Declaration,
           Drawback Claim
```

### 6. `codeLists.json` — 50 Key Code Lists

```json
[
  {
    "id": "CL_001",
    "name": "Declaration type code",
    "source": "WCO",
    "values": [
      {"code": "IM", "description": "Import declaration"},
      {"code": "EX", "description": "Export declaration"},
      {"code": "TR", "description": "Transit declaration"},
      {"code": "CO", "description": "Combined declaration"},
      {"code": "RE", "description": "Re-export declaration"}
    ],
    "pakMapping": "WeBOC GD Type field"
  },
  ...
]
```

Generate 50 key code lists including:
```
Declaration type, Message function, Country (ISO 3166), Currency (ISO 4217),
Transport mode (UN/ECE Rec 19), Package type (UN/ECE Rec 21), Container size/type (ISO 6346),
HS classification type, Customs procedure code (CPC), Preference code,
Party function code, Location function code, Document type code,
Duty/tax type, Payment method, Guarantee type, Examination type/result,
Seal type, Risk level, AEO status, Valuation method (WTO 1-6),
Incoterms (2020), UN/LOCODE (Pakistan ports), HS Chapter (01-97)
```

### 7. `capabilities.json` — 96 TCF Sub-Capabilities

```json
[
  {
    "id": "valuation_verification",
    "theme": "Revenue & Duty Management",
    "group": "Customs Valuation Analytics",
    "sub": "Declared Value Verification",
    "dataReqCount": 8,
    "themeColor": "amber",
    "themeIndex": 1,
    "groupIndex": 1,
    "priority": "CRITICAL"
  },
  ...
]
```

Generate all 96 capabilities as defined in the TAIW design document:

**Theme 1: Revenue & Duty Management (amber) — 20 capabilities**
```
1.1 Customs Valuation Analytics (8): Declared Value Verification, Transfer Pricing Detection, Transaction Value Database, Valuation Method Selection, Exchange Rate Impact Analysis, Retrospective Valuation Audit, Advance Ruling Compliance, Value Trend Analytics
1.2 Tariff & Classification Management (6): HS Code Classification Engine, Tariff Schedule Management, SRO Concession Tracking, FTA Preference Management, Duty Drawback Analytics, Regulatory Duty Impact
1.3 Revenue Collection & Forecasting (6): Revenue Dashboarding, Revenue Forecasting, Leakage Detection, Refund & Drawback Management, Duty Differential Analysis, Budget vs Actual Tracking
```

**Theme 2: Risk Management & Compliance (red) — 20 capabilities**
```
2.1 Risk-Based Selectivity (8): Risk Profiling Engine, Selectivity Channel Assignment, Trader Risk Scoring, Commodity Risk Matrix, Intelligence-Led Targeting, Post-Clearance Audit Selection, ML Risk Models, Risk Rule Management
2.2 Anti-Smuggling & Enforcement (6): Smuggling Pattern Detection, Afghan Transit Trade Monitoring, Trade-Based Money Laundering, Controlled Delivery Tracking, Border Intelligence Analytics, Sanctions & Embargo Screening
2.3 Compliance & Audit (6): Post-Clearance Audit Analytics, Self-Assessment Verification, AEO Compliance Monitoring, Trader Compliance Scorecard, Document Fraud Detection, Regulatory Compliance Reporting
```

**Theme 3: Trade Facilitation & Operations (blue) — 18 capabilities**
```
3.1 Clearance Process Optimization (8): Clearance Time Analytics, Bottleneck Identification, Green Channel Optimization, Pre-Arrival Processing, Single Window Integration, 24/7 Clearance Analytics, Queue Management, SLA Tracking
3.2 Port & Terminal Operations (6): Port Throughput Analytics, Container Dwell Time, Terminal Performance Benchmarking, Warehouse & Bonded Area Utilization, Free Zone Performance, Dry Port Operations
3.3 Transit & Transshipment (4): Afghan Transit Trade Analytics, CPEC Route Analytics, Transshipment Hub Performance, TIR Convention Compliance
```

**Theme 4: Trade Intelligence & Analytics (violet) — 18 capabilities**
```
4.1 Trade Statistics & Reporting (8): Trade Balance Dashboard, Commodity Flow Analysis, Trading Partner Analytics, Export Diversification Metrics, Import Dependency Analysis, Trade Data Reconciliation, Revenue Per Unit, Seasonal Trade Patterns
4.2 Supply Chain Visibility (6): End-to-End Shipment Tracking, Carrier Performance Analytics, Route Optimization, Container Tracking Integration, Vendor/Supplier Risk Mapping, Lead Time Analytics
4.3 Predictive Trade Analytics (4): Trade Volume Forecasting, Price Prediction Models, Demand-Supply Gap Analysis, Early Warning System
```

**Theme 5: Trader & Stakeholder Management (emerald) — 12 capabilities**
```
5.1 Trader Intelligence (6): Trader 360 Profile, New Trader Onboarding Analytics, Trader Segmentation, Dormant/Inactive Trader Detection, Related Party Network Analysis, Trader Communication & Outreach
5.2 AEO Program (6): AEO Application Pipeline, AEO Benefit Measurement, AEO Compliance Monitoring, AEO Mutual Recognition, AEO Tier Analytics, AEO Program ROI
```

**Theme 6: Digital Customs & Modernization (indigo) — 12 capabilities**
```
6.1 WeBOC & PSW Analytics (6): WeBOC System Performance, GD Processing Analytics, PSW Integration Dashboard, Electronic Payment Analytics, Mobile/API Channel Adoption, System Modernization Roadmap
6.2 Data Quality & Governance (6): WCO DM Conformity Assessment, Data Quality Scorecarding, Master Data Management, Data Lineage & Audit Trail, Code List Harmonization, Data Sharing Framework
```

### 8. `dataRequirements.json` — ~120 Trade Data Requirements

```json
[
  {
    "id": "req_trader_identity",
    "name": "Trader Identity & Registration",
    "wcoDomain": "Party",
    "capabilitiesUsing": 15,
    "capabilities": ["trader_360_profile", "trader_segmentation", "risk_profiling_engine", ...],
    "description": "Complete trader identification including NTN, CNIC, AEO status, WeBOC registration"
  },
  ...
]
```

Generate ~120 data requirements grouped by WCO domain. Examples:
```
Party: Trader Identity, Party Roles, Agent Details, AEO Authorization, Beneficial Ownership
Declaration: GD Header Data, GD Line Items, Previous Documents, Amendment History, Cancellation Data
Goods: HS Classification, Goods Description, Quantity & Weight, Packaging Details, Dangerous Goods, Dual-Use Goods
Financial: Customs Valuation, Duty Assessment, Tax Calculation, Payment Data, Guarantee/Bond, Exchange Rates
Transport: Vessel/Flight Details, Container Tracking, Seal Data, Route/Itinerary, Multi-Modal Transport
Origin: Certificate of Origin, Preferential Treatment, Rules of Origin Compliance, Cumulation
Risk: Risk Scores, Selectivity Results, Examination Outcomes, Intelligence Feeds, Seizure Data
Location: Port/Terminal Data, Warehouse Inventory, Free Zone Activity, Dry Port Operations
Statistics: Trade Volumes, Revenue Figures, Clearance Times, Compliance Rates
```

### 9. `mappings.json` — ~400 TCF→WCO DM Element Mappings

```json
[
  {
    "capability": "declared_value_verification",
    "element": "Value declared for customs",
    "domain": "Financial",
    "confidence": "HIGH",
    "notes": "Core element for value verification — compare against reference price DB"
  },
  ...
]
```

Generate ~400 mappings linking capabilities to the WCO DM elements they require. Each capability should map to 3-8 elements on average. Ensure high-reuse elements (HS code, trader ID, declared value, country of origin) appear in many mappings.

### 10. `dependencies.json` — Capability→Element Dependencies (grouped)

```json
{
  "declared_value_verification": {
    "elements": ["Value declared for customs", "Customs value", "Invoice amount", "Exchange rate", "Currency code", "Country of origin code", "Commodity code (HS)", "Party identifier"],
    "domains": ["Financial", "Goods", "Classification", "Party"],
    "dataRequirements": ["Customs Valuation", "HS Classification", "Trader Identity"],
    "elementCount": 8,
    "domainCount": 4
  },
  ...
}
```

Generate for all 96 capabilities.

### 11. `reuseScores.json` — Element Reuse Ranking

```json
[
  {"element": "Commodity code (HS)", "domain": "Classification", "score": 92, "tier": "P1", "capabilitiesSupported": 72},
  {"element": "Party identifier", "domain": "Party", "score": 88, "tier": "P1", "capabilitiesSupported": 65},
  {"element": "Country of origin code", "domain": "Origin", "score": 85, "tier": "P1", "capabilitiesSupported": 58},
  ...
]
```

Generate ~200 elements with scores. Top P1 elements (~40) should be:
```
Commodity code (HS), Party identifier, Country of origin, Declared value, Customs value,
Declaration type, Port code, Transport mode, GD number, Date of declaration,
Gross mass, Net mass, Currency code, Duty amount, Selectivity channel,
AEO status, Container ID, Seal number, Examination result, Exchange rate,
Previous document reference, HS chapter, Tariff line, SRO number, FTA preference code,
Invoice amount, Number of packages, Trader reference (UCR), Risk score,
Customs office code, Guarantee type, Payment method, Agent identifier,
Vessel/flight number, Country of destination, Incoterms code,
Warehouse identifier, Free zone code, E-commerce indicator, De minimis value
```

### 12. `tacrQuestions.json` — 640+ Maturity Assessment Questions

```json
{
  "categories": [
    {
      "name": "Strategy & Vision",
      "sections": [
        {
          "name": "Trade Modernization Strategy",
          "questions": [
            {
              "id": "str_mod_001",
              "text": "To what extent does the customs administration have a documented trade modernization strategy aligned with WTO Trade Facilitation Agreement commitments?",
              "levels": {
                "1": "No documented strategy exists. Modernization efforts are ad-hoc and reactive.",
                "2": "Basic strategy document exists but is not widely communicated or implemented.",
                "3": "Comprehensive strategy documented, communicated, and actively tracked with KPIs.",
                "4": "Strategy drives resource allocation, technology investment, and process redesign.",
                "5": "Strategy is continuously updated, benchmarked against global best practices, and embedded in institutional culture."
              }
            },
            ...
          ]
        },
        ...
      ],
      "questionCount": 70
    },
    ...
  ],
  "totalQuestions": 640
}
```

**Generate questions per category:**

| Category | Sections | Questions | Key Topics |
|----------|----------|-----------|------------|
| Strategy & Vision (70) | Modernization Strategy, WTO TFA Commitment, Digital Vision, Stakeholder Alignment | 4 sections × ~18 Qs | National customs strategy, NSTP alignment, WTO Category A/B/C |
| Organization & Skills (80) | Workforce Analytics, Data Science Capacity, Training, Change Management | 4 sections × ~20 Qs | Customs officer skills, data literacy, analyst hiring |
| Data Governance (90) | WCO DM Alignment, Master Data, Data Quality, Data Sharing, Privacy | 5 sections × ~18 Qs | WCO conformity, code harmonization, data ownership |
| Information & Integration (85) | WeBOC Integration, PSW Connectivity, OGA Integration, Data Warehouse | 4 sections × ~21 Qs | System integration maturity, API adoption, single window |
| Analytics & Technology (80) | BI & Reporting, Risk Models, ML/AI, Automation, Real-time Analytics | 5 sections × ~16 Qs | Dashboards, predictive models, NLP for classification |
| Infrastructure (75) | Hardware, Cloud, Network, DR/BC, Security | 5 sections × ~15 Qs | Data center, cloud readiness, cybersecurity |
| Processes & Automation (85) | Clearance Automation, Risk Automation, Revenue Automation, Reporting | 4 sections × ~21 Qs | STP rate, green channel %, PCA automation |
| Outcomes & Impact (75) | Revenue Impact, Facilitation KPIs, Compliance Rates, Trader Satisfaction | 4 sections × ~19 Qs | Clearance time, inspection rate, revenue per GD |

Each question must have realistic text about customs/trade operations and all 5 maturity level descriptions.

### 13. `starSchema.json` — Trade Analytics Star Schema

```json
{
  "tables": [
    {
      "name": "FACT_TRADE_TRANSACTION",
      "type": "fact",
      "columns": [
        {"name": "transaction_key", "datatype": "BIGINT", "isPK": true, "isFK": false, "description": "Surrogate key"},
        {"name": "gd_number", "datatype": "VARCHAR(20)", "isPK": false, "isFK": false, "description": "WeBOC Goods Declaration number", "pakSpecific": true},
        {"name": "trader_key", "datatype": "INT", "isPK": false, "isFK": true, "fkTarget": "DIM_TRADER", "description": "FK to trader dimension"},
        {"name": "declared_value_pkr", "datatype": "DECIMAL(18,2)", "isPK": false, "isFK": false, "description": "CIF value in Pakistani Rupees", "pakSpecific": true},
        {"name": "customs_duty_pkr", "datatype": "DECIMAL(18,2)", "isPK": false, "isFK": false, "description": "Customs duty assessed", "pakSpecific": true},
        {"name": "regulatory_duty_pkr", "datatype": "DECIMAL(18,2)", "isPK": false, "isFK": false, "description": "Regulatory duty (Pakistan-specific levy)", "pakSpecific": true},
        {"name": "selectivity_channel", "datatype": "CHAR(1)", "isPK": false, "isFK": false, "description": "G=Green, Y=Yellow, R=Red risk channel"},
        {"name": "cpec_route_flag", "datatype": "BOOLEAN", "isPK": false, "isFK": false, "description": "CPEC corridor shipment indicator", "pakSpecific": true},
        ...
      ],
      "description": "Central fact table for all import/export/transit transactions"
    },
    ...
  ],
  "views": [
    {"name": "VW_TRADE_BALANCE", "description": "Import-Export balance by country/commodity/period", "sourceTables": ["FACT_TRADE_TRANSACTION", "DIM_COMMODITY", "DIM_COUNTRY", "DIM_DATE"]},
    {"name": "VW_REVENUE_LEAKAGE", "description": "Statutory vs. applied duty gap analysis", "sourceTables": ["FACT_TRADE_TRANSACTION", "DIM_COMMODITY", "DIM_SRO"]},
    {"name": "VW_CLEARANCE_SLA", "description": "Clearance time vs. WTO TFA targets", "sourceTables": ["FACT_TRADE_TRANSACTION", "DIM_PORT", "DIM_CUSTOMS_STATION"]},
    {"name": "VW_RISK_EFFECTIVENESS", "description": "Risk rule hit rates and seizure correlation", "sourceTables": ["FACT_TRADE_TRANSACTION", "DIM_COMMODITY", "DIM_COUNTRY"]},
    {"name": "VW_FTA_UTILIZATION", "description": "FTA preference utilization rates", "sourceTables": ["FACT_TRADE_TRANSACTION", "DIM_COMMODITY", "DIM_COUNTRY", "DIM_SRO"]},
    {"name": "VW_CPEC_TRADE", "description": "CPEC corridor trade flows", "sourceTables": ["FACT_TRADE_TRANSACTION", "DIM_PORT", "DIM_COUNTRY"]}
  ]
}
```

Include all tables from the design: 1 FACT + 10 DIMs (DIM_DATE, DIM_TRADER, DIM_COMMODITY, DIM_COUNTRY, DIM_PORT, DIM_CUSTOMS_STATION, DIM_TRANSPORT_MODE, DIM_AGENT, DIM_GD_TYPE, DIM_SRO) + 4 AGGs + 6 VIEWs. Mark Pakistan-specific columns with `"pakSpecific": true`.

### 14. `gapExtensions.json` — 5 Trade Extension Modules

```json
{
  "modules": [
    {
      "name": "AEO Analytics",
      "id": "aeo",
      "tables": [
        {
          "name": "AEO_APPLICATION",
          "columns": [
            {"name": "application_id", "datatype": "INT", "description": "Application tracking ID"},
            {"name": "ntn_number", "datatype": "VARCHAR(20)", "description": "Trader NTN", "pakSpecific": true},
            {"name": "tier_applied", "datatype": "VARCHAR(10)", "description": "Gold/Silver/Platinum"},
            {"name": "status", "datatype": "VARCHAR(20)", "description": "Submitted/Under Review/Approved/Rejected"},
            ...
          ],
          "description": "Track AEO applications through the approval pipeline"
        },
        ...
      ],
      "tableCount": 5,
      "connectsToStarSchema": ["FACT.aeo_status", "DIM_TRADER.aeo_tier"],
      "requiredCapabilities": ["aeo_application_pipeline", "aeo_benefit_measurement", "aeo_compliance_monitoring"]
    },
    ...
  ]
}
```

Generate 5 modules (AEO Analytics, Rules of Origin & FTA, Valuation Intelligence, Risk Scoring Engine, E-Commerce & De Minimis) with 5 tables each = 25 tables total.

### 15. `enrichment.json` — Pakistan Trade Context per Capability

```json
{
  "capabilities": {
    "declared_value_verification": {
      "pakistanObjectives": [
        "Detect under-invoicing — estimated 15-25% of imports undervalued, especially from China ($19.6B imports)",
        "Build reference price database by HS 8-digit × origin country from WeBOC historical data",
        "Automate WTO valuation method hierarchy (Transaction Value → Identical → Similar → Deductive → Computed → Fallback)",
        "Support FBR Directorate General of Valuation in setting minimum values"
      ],
      "pakistanDataSources": [
        "WeBOC GD declared values (4M+ GDs annually)",
        "FBR Valuation Database (DG Valuation reference prices)",
        "International Trade Centre (ITC) mirror statistics for comparison",
        "SBP exchange rates (PKR/USD daily)",
        "ECIB credit bureau for trader financial assessment"
      ],
      "expectedOutcomes": [
        "Flag 10-15% of import GDs for value discrepancy review",
        "Reduce false positive rate from current 40%+ to <20%",
        "Increase duty recovery from valuation audits by PKR 20-40B annually",
        "Automate 70% of value verification currently done manually"
      ],
      "keyChallenges": [
        "China trade data discrepancy of $4.5B annually (mirror statistics gap)",
        "Transfer pricing in related-party imports (major MNCs, CPEC projects)",
        "Multiple exchange rates creating arbitrage opportunities",
        "Resistance from clearing agents who profit from undervaluation"
      ],
      "wcoElements": ["Value declared for customs", "Customs value", "Invoice amount", "Exchange rate", "Country of origin code"],
      "implementationPhase": 1,
      "investmentRange": "PKR 40-80M",
      "priority": "CRITICAL"
    },
    ...
  },
  "metadata": {
    "capabilitiesEnriched": 12,
    "totalCapabilities": 96,
    "note": "12 capabilities have detailed Pakistan context. Remaining 84 have placeholder enrichment."
  }
}
```

Create detailed enrichment for these 12 CRITICAL capabilities:
```
1. Declared Value Verification (1.1)
2. HS Code Classification Engine (1.2)
3. Revenue Dashboarding (1.3)
4. Risk Profiling Engine (2.1)
5. Afghan Transit Trade Monitoring (2.2)
6. Clearance Time Analytics (3.1)
7. Port Throughput Analytics (3.2)
8. Trade Balance Dashboard (4.1)
9. Trader 360 Profile (5.1)
10. AEO Application Pipeline (5.2)
11. WCO DM Conformity Assessment (6.2)
12. Trade Data Reconciliation (4.1)
```

For the remaining 84, generate placeholder enrichment with 1-2 generic sentences per field.

### 16. `pakistanContext.json` — Pakistan Trade Reference

```json
{
  "institutions": {
    "fbr": {"name": "Federal Board of Revenue", "role": "Revenue collection, customs enforcement", "system": "WeBOC", "chairman": "..."},
    "psw": {"name": "Pakistan Single Window", "role": "Single window for 70+ OGAs", "url": "psw.gov.pk"},
    "moc": {"name": "Ministry of Commerce", "role": "Trade policy, FTAs, export promotion"},
    "pbs": {"name": "Pakistan Bureau of Statistics", "role": "Trade statistics"},
    "sbp": {"name": "State Bank of Pakistan", "role": "FX control, trade finance"},
    "ntc": {"name": "National Targeting Centre", "role": "Intelligence-led targeting"},
    "pral": {"name": "PRAL", "role": "FBR IT systems, WeBOC development"},
    "tdap": {"name": "Trade Development Authority of Pakistan", "role": "Export promotion"}
  },
  "tradeStats": {
    "totalExports": "$32.11B (FY25)",
    "totalImports": "$58.38B (FY25)",
    "tradeDeficit": "$26.27B",
    "topExportSectors": [
      {"sector": "Textiles", "value": "$17.3B", "share": "53.9%"},
      {"sector": "Food", "value": "$6.2B", "share": "19.3%"},
      {"sector": "Chemicals", "value": "$1.4B", "share": "4.4%"},
      {"sector": "Leather", "value": "$0.9B", "share": "2.8%"}
    ],
    "topImportSectors": [
      {"sector": "Petroleum", "value": "$11.7B", "share": "20%"},
      {"sector": "Machinery", "value": "$8.5B", "share": "14.6%"},
      {"sector": "Chemicals", "value": "$7.2B", "share": "12.3%"},
      {"sector": "Agriculture & Food", "value": "$6.8B", "share": "11.6%"}
    ],
    "topPartners": {
      "exports": ["USA $5.8B", "EU $8.2B", "China $2.4B", "UAE $1.5B", "UK $2.1B"],
      "imports": ["China $19.6B", "UAE $7.5B", "Saudi Arabia $4.2B", "Indonesia $2.8B", "USA $2.5B"]
    },
    "customsRevenue": "PKR ~1,100B (FY25 target)",
    "gdsProcessed": "4M+ annually",
    "activeTraders": "50,000+ registered in WeBOC",
    "ports": "3 seaports, 9 airports, 7 land borders, 6 dry ports"
  },
  "gdTypes": [
    {"code": "HC", "name": "Home Consumption (Import)", "description": "Standard import clearance for domestic use"},
    {"code": "WH", "name": "Warehousing", "description": "Import into bonded warehouse"},
    {"code": "EX", "name": "Export", "description": "Standard export declaration"},
    {"code": "TR", "name": "Transit (ATTA)", "description": "Afghan Transit Trade Agreement goods"},
    {"code": "TS", "name": "Transshipment", "description": "Goods transshipped through Pakistan ports"},
    {"code": "IB", "name": "In-Bond Transfer", "description": "Transfer between bonded facilities"},
    {"code": "EB", "name": "Ex-Bond", "description": "Release from bonded warehouse"},
    {"code": "TA", "name": "Temporary Admission", "description": "Temporary import for exhibition, testing, etc."},
    {"code": "EFS", "name": "Export Facilitation Scheme", "description": "Duty-free import for export manufacturing"},
    {"code": "TI", "name": "Temporary Import", "description": "Import with re-export obligation"},
    {"code": "RI", "name": "Re-Import", "description": "Return of previously exported goods"},
    {"code": "RE", "name": "Re-Export", "description": "Export of previously imported goods"},
    {"code": "SS", "name": "Ship Stores", "description": "Supplies for vessels/aircraft"},
    {"code": "BD", "name": "Batch Data", "description": "Bulk data processing"},
    {"code": "ST", "name": "Safe Transportation", "description": "Controlled movement under customs seal"},
    {"code": "PB", "name": "Personal Baggage", "description": "Passenger baggage clearance"}
  ],
  "dutyStructure": [
    {"name": "Customs Duty (CD)", "rates": "0-20% (11 slabs)", "authority": "First Schedule, Customs Act 1969"},
    {"name": "Additional Customs Duty (ACD)", "rates": "2-7%", "authority": "S.25A, Customs Act"},
    {"name": "Regulatory Duty (RD)", "rates": "0-90% (~500 items)", "authority": "SRO notification"},
    {"name": "Sales Tax (ST)", "rates": "18% standard / 25% luxury", "authority": "Sales Tax Act 1990"},
    {"name": "Advance Income Tax (WHT)", "rates": "1-5.5% (filer/non-filer)", "authority": "S.148, Income Tax Ordinance"},
    {"name": "Federal Excise Duty (FED)", "rates": "Varies", "authority": "Federal Excise Act 2005"}
  ],
  "tradeAgreements": [
    {"code": "CPFTA-II", "name": "China-Pakistan FTA Phase 2", "since": "Jan 2020", "coverage": "313 lines at 0%, 1,760 lines concession", "partner": "China"},
    {"code": "SAFTA", "name": "South Asian Free Trade Area", "since": "2006", "coverage": "Tariff liberalization (India suspended)", "partner": "SAARC"},
    {"code": "D-8 PTA", "name": "D-8 Preferential Trade", "since": "2024", "coverage": "Duty reductions for D-8 members", "partner": "Bangladesh, Egypt, Indonesia, Iran, Malaysia, Nigeria, Türkiye"},
    {"code": "ECO TPA", "name": "ECO Trade Preferential Agreement", "since": "2009", "coverage": "Limited concessions", "partner": "Turkey, Iran, Central Asia"},
    {"code": "GSP+", "name": "EU GSP Plus", "since": "2014", "coverage": "Duty-free for 66% of tariff lines", "partner": "EU", "conditions": "27 international conventions"},
    {"code": "APTA", "name": "Asia-Pacific Trade Agreement", "since": "2007", "coverage": "Limited concessions", "partner": "China, India, Bangladesh, Laos, South Korea, Sri Lanka"},
    {"code": "PK-MY FTA", "name": "Pakistan-Malaysia FTA", "since": "In negotiation", "coverage": "TBD", "partner": "Malaysia"},
    {"code": "PK-TR FTA", "name": "Pakistan-Türkiye FTA", "since": "In negotiation", "coverage": "TBD", "partner": "Türkiye"}
  ],
  "cpec": {
    "gwadar": {"status": "Operational (limited)", "features": "Free zone, 20-year tax holiday, duty-free imports", "capacity": "Target 400M tons/year"},
    "sezs": ["Rashakai (KP)", "Allama Iqbal (Punjab)", "Dhabeji (Sindh)", "Bostan (Balochistan)", "M-3 Industrial (Faisalabad)", "ICT Model (Islamabad)", "China SEZ Mirpur (AJK)", "Mohmand Marble City", "Moqpondass (Gilgit-Baltistan)"],
    "ml1Railway": "Karachi-Peshawar upgrade — 1,872 km, $6.8B, will shift cargo from road to rail",
    "digitalConnectivity": "Cross-border data exchange with China GACC (General Administration of Customs of China)"
  },
  "ports": [
    {"name": "Karachi Port (KPT)", "type": "Seaport", "terminals": ["KICT", "PICT", "SAPT"], "share": "~60% of sea trade"},
    {"name": "Port Qasim (PQIA)", "type": "Seaport", "terminals": ["QICT", "PIBT", "FOTCO"], "share": "~35% of sea trade"},
    {"name": "Gwadar Port", "type": "Seaport (CPEC)", "terminals": ["GPA"], "share": "<1%"},
    {"name": "Jinnah International Airport (KHI)", "type": "Airport", "share": "Major air cargo hub"},
    {"name": "Allama Iqbal Airport (LHE)", "type": "Airport", "share": "North region air cargo"},
    {"name": "Islamabad Airport (ISB)", "type": "Airport", "share": "Capital region"},
    {"name": "Wagah/Attari", "type": "Land border", "partner": "India (limited/suspended)"},
    {"name": "Torkham", "type": "Land border", "partner": "Afghanistan (major ATTA point)"},
    {"name": "Chaman", "type": "Land border", "partner": "Afghanistan"},
    {"name": "Sost", "type": "Land border", "partner": "China (Karakoram Highway/CPEC)"},
    {"name": "Lahore Dry Port", "type": "Dry port", "operator": "NLC"},
    {"name": "Faisalabad Dry Port", "type": "Dry port", "operator": "NLC"},
    {"name": "Peshawar Dry Port", "type": "Dry port", "operator": "NLC"}
  ],
  "keyChallenges": [
    {"challenge": "$6.5B Data Gap", "description": "WeBOC query captured only 7 of 16 GD types for PBS statistics (discovered 2025)", "impact": "CRITICAL"},
    {"challenge": "Under-Invoicing", "description": "15-25% of imports undervalued, especially China ($4.5B annual mirror stats gap)", "impact": "CRITICAL"},
    {"challenge": "SRO Complexity", "description": "500+ active SROs creating duty distortions and rent-seeking", "impact": "HIGH"},
    {"challenge": "Manual Processes", "description": "30-40% of clearance steps still require physical presence", "impact": "HIGH"},
    {"challenge": "OGA Integration", "description": "Only ~40 of 70+ Other Government Agencies integrated with PSW", "impact": "HIGH"},
    {"challenge": "AEO Adoption", "description": "<50 certified AEOs vs. program potential of 5,000+", "impact": "MEDIUM"},
    {"challenge": "Afghan Transit Diversion", "description": "ATTA goods leaking into local market, estimated PKR 100B+ revenue loss", "impact": "HIGH"},
    {"challenge": "Risk Model Accuracy", "description": "High false positive rate in selectivity (>40%)", "impact": "HIGH"},
    {"challenge": "Data Quality", "description": "Inconsistent HS classification, missing fields, duplicate trader records", "impact": "HIGH"},
    {"challenge": "No WCO DM Conformity", "description": "Pakistan has not published a MIP (My Information Package)", "impact": "MEDIUM"}
  ]
}
```

### 17. `index.json` — Metadata

```json
{
  "app": "TAIW",
  "fullName": "Trade Analytics Intelligence Workbench",
  "version": "1.0.0",
  "dataModel": "WCO Data Model v4.2",
  "framework": "Trade Capability Framework (TCF) v1.0",
  "assessment": "Trade Analytics Capability Review (TACR) v1.0",
  "country": "Pakistan",
  "stats": {
    "dataElements": 727,
    "classes": 130,
    "domains": 14,
    "informationPackages": 23,
    "codeLists": 50,
    "capabilities": 96,
    "dataRequirements": 120,
    "mappings": 400,
    "dependencies": 3000,
    "reuseScores": 200,
    "tacrQuestions": 640,
    "starSchemaTables": 21,
    "gapTables": 25
  },
  "generated": "ISO timestamp",
  "generator": "scripts/generate_taiw_data.py"
}
```

---

## Script Requirements

```python
#!/usr/bin/env python3
"""
generate_taiw_data.py — Generate TAIW data repository

Usage: python scripts/generate_taiw_data.py
Output: src/data/taiw/*.json
"""
```

- Use Python stdlib only (json, os, random for realistic distribution)
- No external dependencies
- Generate ALL 17 files
- Print summary with counts
- Validate all cross-references (capability IDs in mappings match capabilities.json, etc.)

## Run After Creation

```bash
python scripts/generate_taiw_data.py
```

Expected output:
```
TAIW Data Generation Report
============================
dataElements.json:      727 elements ✅
classes.json:           130 classes ✅
domains.json:           14 domains ✅
relationships.json:     300 relationships ✅
informationPackages.json: 23 IPs ✅
codeLists.json:         50 code lists ✅
capabilities.json:      96 capabilities ✅
dataRequirements.json:  120 requirements ✅
mappings.json:          400 mappings ✅
dependencies.json:      96 capabilities (3000 dependencies) ✅
reuseScores.json:       200 elements ✅
tacrQuestions.json:      640 questions across 8 categories ✅
starSchema.json:        21 tables + 6 views ✅
gapExtensions.json:     25 tables across 5 modules ✅
enrichment.json:        12 detailed + 84 placeholder ✅
pakistanContext.json:   Comprehensive reference ✅
index.json:             Metadata ✅

Total: 17 files generated in src/data/taiw/
```
