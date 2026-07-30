# TAIW — Trade Analytics Intelligence Workbench

## Complete Design Document & Implementation Blueprint

**Parallel to BAIW (Banking Analytics Intelligence Workbench) — but for International Trade & Customs**

---

## 1. THE CONCEPT

### What BAIW Did for Banking → TAIW Does for Trade

| BAIW (Banking) | TAIW (Trade) |
|----------------|--------------|
| Teradata FSDM v13 (3,917 entities) | WCO Data Model v4.2 (727 data elements, ~130 classes) |
| BVF Capability Framework (112 sub-capabilities) | **TCF** — Trade Capability Framework (96 sub-capabilities) *[NEW — we create this]* |
| BACR Maturity Assessment (793 questions) | **TACR** — Trade Analytics Capability Review (640+ questions) *[NEW]* |
| Profitability Star Schema | Trade Analytics Star Schema (FACT_TRADE_TRANSACTION) *[NEW]* |
| Pakistan Banking Context (SBP, KIBOR, CASA) | Pakistan Trade Context (FBR, WeBOC, PSW, CPEC, HS Tariff) |
| Gap Extensions (ABC, CLV, etc.) | Trade Extensions (AEO, Origin, Valuation, Risk Scoring, E-Commerce) |
| 16 BVF Enrichment Prompts | 14 TCF Enrichment Prompts |

### Primary Users
- **Customs Directors & Collectors** — FBR Customs wing leadership
- **Trade Policy Officials** — Ministry of Commerce, TDAP
- **PSW/WeBOC System Architects** — Pakistan Single Window technical teams
- **Customs Consultants** — WCO implementation advisors, Big4 trade practices
- **Port/Terminal Operators** — KPT, PQIA, dry port managers
- **Freight Forwarders & Customs Agents** — Licensed clearing agents
- **AEO Compliance Officers** — Companies seeking/maintaining AEO status

### The Problem
Pakistan's trade ecosystem is fragmented:
- **WeBOC** (customs clearance) is disconnected from **PSW** (single window) data architecture
- **$6.5B data discrepancy** discovered in FY2024-25 between PBS and WeBOC trade data
- 16+ GD (Goods Declaration) types, only 7 were being captured in statistics
- No unified data model mapping WCO DM to Pakistan's national implementation
- AEO program launched but <50 certified operators (vs. 1000s in EU/China)
- CPEC Phase 2 requires modern customs infrastructure with no data strategy
- Trade facilitation index: Pakistan ranks 108/190 (Ease of Doing Business)

### The Solution
TAIW is a single interactive platform that maps the **WCO Data Model** to **Pakistan's trade processes**, defines a **Trade Capability Framework** for analytics maturity, and provides **actionable roadmaps** for modernization.

**Use Case:** A consultant sits with FBR Customs leadership, opens TAIW, and can instantly:
1. Show what WCO data elements are needed for capability X (e.g., risk-based selectivity)
2. Assess current trade analytics maturity across 96 capabilities
3. Map WeBOC/PSW data to WCO Data Model information packages
4. Design phased roadmap with estimated investment for customs modernization
5. Explore trade analytics star schema for revenue, risk, and facilitation
6. Reference Pakistan-specific FBR/CPEC/HS/FTA context

---

## 2. WCO DATA MODEL — THE FOUNDATION

### Overview

The WCO Data Model (DM) v4.2 is the global standard for cross-border regulatory data exchange. Unlike FSDM (which is a relational data model), the WCO DM is a **message-oriented data model** organized around information exchanges.

### WCO DM Structure

```
WCO Data Model v4.2
├── Overall Information Structure (OIS)
│   ├── 727 Data Elements
│   ├── ~130 Classes (data groupings)
│   └── ~380 Code Lists
├── Information Packages
│   ├── Base Information Packages (BIP)
│   │   ├── Declaration BIP
│   │   ├── Response BIP
│   │   └── Cross-Border Movement BIP
│   ├── Derived Information Packages (DIP) — ~20 DIPs
│   │   ├── Goods Declaration (Import/Export/Transit)
│   │   ├── Cargo Declaration (Manifest)
│   │   ├── Conveyance Report (Vessel/Aircraft/Vehicle)
│   │   ├── Advanced Electronic Information (AEI/SAFE)
│   │   ├── License/Permit/Certificate
│   │   ├── Phytosanitary Certificate
│   │   ├── Veterinary Certificate
│   │   ├── Certificate of Origin (NEW v4.2)
│   │   ├── Customs Bond (NEW v4.2)
│   │   ├── Booking Reservation Information (BRI, v4.1)
│   │   ├── Postal/E-Commerce Items
│   │   ├── Transit Declaration
│   │   ├── Temporary Admission
│   │   ├── ATA Carnet
│   │   ├── Passenger Declaration
│   │   └── Government Cross-Border Regulatory (GOVCBR)
│   └── My Information Packages (MIP) — National implementations
│       └── Pakistan MIP (to be designed via TAIW)
├── UML Class Diagrams
├── XML Schemas & Message Implementation Guidelines (MIG)
├── Code Lists (UN/ECE, WCO, ISO)
└── Conformity Framework (4 levels)
```

### WCO DM Core Classes (~130 classes organized in 14 domains)

| # | Domain | Key Classes | Data Elements | Description |
|---|--------|------------|---------------|-------------|
| 1 | **Declaration** | Declaration, DeclarationGovernment, CustomsDeclarationDocument | ~85 | The core document: Goods Declaration (GD), covering import/export/transit |
| 2 | **Consignment** | Consignment, ConsignmentItem, TransportContractDocument | ~65 | Shipment information, grouping of goods under one transport contract |
| 3 | **Goods** | Commodity, GoodsItem, GoodsMeasure, Packaging, DangerousGoods | ~70 | Description, classification, valuation, and measurement of traded goods |
| 4 | **Transport** | TransportMeans, TransportEquipment, TransitTransportMeans, Itinerary | ~55 | Conveyance details — vessel, aircraft, vehicle, container |
| 5 | **Party** | Party, Agent, Buyer, Seller, Consignor, Consignee, Declarant, Carrier, Broker | ~50 | All actors in the trade transaction |
| 6 | **Location** | Location, Address, LoadingLocation, UnloadingLocation, BorderTransportMeans | ~40 | Geographic points: ports, warehouses, border crossings, free zones |
| 7 | **Financial** | CustomsValuation, DutyTaxFee, ObligationGuarantee, Payment, ExchangeRate | ~45 | Duties, taxes, valuation, payment methods, bonds/guarantees |
| 8 | **Document** | AdditionalDocument, PreviousDocument, Certificate, License, Permit | ~35 | Supporting documents: invoices, packing lists, certificates, licenses |
| 9 | **Classification** | Classification, TariffQuantity, AdditionalInformation, Restriction | ~30 | HS code, origin, quota, preferences, SRO concessions |
| 10 | **Risk & Control** | RiskAssessment, ExaminationResult, Seal, GovernmentProcedure | ~25 | Risk profiling, selectivity, examination, release decisions |
| 11 | **Origin** | CountryOfOrigin, PreferentialTreatment, RulesOfOrigin, OriginCriteria | ~30 | Certificate of Origin, FTA preference claims, origin determination |
| 12 | **Warehouse** | Warehouse, CustomsBondedArea, FreeZone, TemporaryStorage | ~25 | Bonded warehouses, free zones, temporary storage |
| 13 | **E-Commerce** | ECommerceItem, DeMinimis, SimplifiedDeclaration, ReturnGoods | ~20 | Low-value shipments, postal items, cross-border e-commerce |
| 14 | **Response** | Response, DecisionCode, ReleaseNotification, Amendment | ~25 | Customs response messages: release, hold, reject, query |

**Total: ~14 domains, ~130 classes, 727 data elements, ~380 code lists**

---

## 3. TRADE CAPABILITY FRAMEWORK (TCF) — THE BVF EQUIVALENT

### Design Rationale

Just as BAIW used the Teradata BVF (Business Value Framework) to define 112 banking analytics capabilities, TAIW needs an equivalent framework for trade/customs analytics. No such standard framework exists publicly, so **we create one** — the **Trade Capability Framework (TCF)**.

The TCF is structured as: **Theme → Capability Group → Sub-Capability** (mirroring BVF's 3-level hierarchy).

### TCF Structure: 6 Themes → 14 Capability Groups → 96 Sub-Capabilities

---

#### THEME 1: Revenue & Duty Management (Color: amber-500)

**1.1 Customs Valuation Analytics (8 sub-capabilities)**
- Declared Value Verification — Compare declared values against reference prices
- Transfer Pricing Detection — Identify under/over-invoicing in related-party transactions
- Transaction Value Database — Build and maintain reference price database by HS code/origin
- Valuation Method Selection — Automate WTO valuation method hierarchy (1-6)
- Exchange Rate Impact Analysis — Track FX impact on duty collections
- Retrospective Valuation Audit — Post-clearance value verification
- Advance Ruling Compliance — Monitor advance ruling utilization and compliance
- Value Trend Analytics — Time-series analysis of declared values by commodity

**1.2 Tariff & Classification Management (6 sub-capabilities)**
- HS Code Classification Engine — Automated/assisted HS classification from descriptions
- Tariff Schedule Management — Track Pakistan Customs Tariff (97 chapters, 7,000+ tariff lines)
- SRO Concession Tracking — Monitor 500+ active SROs and their utilization
- FTA Preference Management — Track CPFTA-II, SAFTA, D-8, ECO preferences
- Duty Drawback Analytics — Analyze drawback claims, utilization rates, fraud detection
- Regulatory Duty Impact — Model impact of regulatory/additional customs duty changes

**1.3 Revenue Collection & Forecasting (6 sub-capabilities)**
- Revenue Dashboarding — Real-time customs duty + sales tax + WHT collection monitoring
- Revenue Forecasting — Predict monthly/quarterly revenue by port, commodity, origin
- Leakage Detection — Identify revenue gaps from misclassification, undervaluation, exemption abuse
- Refund & Drawback Management — Track refund claims, processing times, fraud patterns
- Duty Differential Analysis — Compare applied vs. statutory rates across clearances
- Budget vs. Actual Tracking — FBR target vs. actual collection by customs station

---

#### THEME 2: Risk Management & Compliance (Color: red-500)

**2.1 Risk-Based Selectivity (8 sub-capabilities)**
- Risk Profiling Engine — Score consignments/traders using multi-factor risk models
- Selectivity Channel Assignment — Green/Yellow/Red channel assignment based on risk score
- Trader Risk Scoring — Compliance history-based risk score per NTN/CNIC
- Commodity Risk Matrix — Risk scores by HS chapter × origin country
- Intelligence-Led Targeting — Incorporate NTC intelligence feeds into selectivity
- Post-Clearance Audit Selection — Risk-based selection of clearances for PCA
- Machine Learning Risk Models — Predictive models for smuggling, undervaluation, misclassification
- Risk Rule Management — CRUD for risk rules with A/B testing capability

**2.2 Anti-Smuggling & Enforcement (6 sub-capabilities)**
- Smuggling Pattern Detection — Identify routing anomalies, duty shopping, transshipment abuse
- Afghan Transit Trade Monitoring — ATTA compliance, diversion detection
- Trade-Based Money Laundering (TBML) — Detect invoice manipulation for capital flight
- Controlled Delivery Tracking — Track enforcement operations and outcomes
- Border Intelligence Analytics — Analyze seizure data, informant tips, patterns
- Sanctions & Embargo Screening — Screen parties against UN/OFAC/FBR sanctions lists

**2.3 Compliance & Audit (6 sub-capabilities)**
- Post-Clearance Audit Analytics — PCA case selection, execution tracking, recovery rates
- Self-Assessment Verification — Validate WeBOC self-assessed duties against tariff rules
- AEO Compliance Monitoring — Continuous monitoring of AEO-certified operators
- Trader Compliance Scorecard — Aggregate compliance metrics per trader
- Document Fraud Detection — Detect forged/altered certificates, invoices, B/Ls
- Regulatory Compliance Reporting — Track compliance with WTO TFA commitments

---

#### THEME 3: Trade Facilitation & Operations (Color: blue-500)

**3.1 Clearance Process Optimization (8 sub-capabilities)**
- Clearance Time Analytics — Measure dwell time: arrival → assessment → examination → release
- Bottleneck Identification — Identify slowest steps in clearance process by port/commodity
- Green Channel Optimization — Maximize green channel share while maintaining compliance
- Pre-Arrival Processing — Track pre-arrival declaration submission rates and clearance speed
- Single Window Integration — Monitor PSW integration status across 70+ OGAs
- 24/7 Clearance Analytics — Track after-hours clearance patterns and demand
- Queue Management — Real-time assessment/examination queue monitoring
- Service Level Agreement Tracking — Time-bound release commitments (WTO TFA Art. 7)

**3.2 Port & Terminal Operations (6 sub-capabilities)**
- Port Throughput Analytics — Container/cargo volumes by port (Karachi, Bin Qasim, Gwadar, Wagah, Torkham)
- Container Dwell Time — Measure port dwell from vessel arrival to gate-out
- Terminal Performance Benchmarking — Compare terminals (KICT, PICT, QICT, SAPT)
- Warehouse & Bonded Area Utilization — Track inventory levels, aging, capacity
- Free Zone Performance — SEZ/FIEDMC/EPZ operational metrics
- Dry Port Operations — Lahore, Faisalabad, Peshawar dry port analytics

**3.3 Transit & Transshipment (4 sub-capabilities)**
- Afghan Transit Trade (ATT) Analytics — Volume, commodity, compliance tracking
- CPEC Route Analytics — Gwadar-Kashgar corridor cargo flows and dwell times
- Transshipment Hub Performance — Measure Pakistan's transshipment competitiveness
- TIR Convention Compliance — International transit guarantee monitoring

---

#### THEME 4: Trade Intelligence & Analytics (Color: violet-500)

**4.1 Trade Statistics & Reporting (8 sub-capabilities)**
- Trade Balance Dashboard — Real-time import/export balance by commodity/country
- Commodity Flow Analysis — Analyze trade flows by HS chapter, origin, destination
- Trading Partner Analytics — Bilateral trade analysis (China, UAE, Saudi, USA, EU, Afghanistan)
- Export Diversification Metrics — Track export concentration/diversification over time
- Import Dependency Analysis — Identify critical import dependencies (petroleum, machinery, food)
- Trade Data Reconciliation — PBS vs. WeBOC vs. ITC mirror statistics reconciliation
- Customs Revenue per Unit — Revenue intensity analysis by commodity
- Seasonal Trade Patterns — Identify cyclical patterns (Ramadan, cotton season, fertilizer imports)

**4.2 Supply Chain Visibility (6 sub-capabilities)**
- End-to-End Shipment Tracking — Origin to destination visibility using B/L, AWB, GD linkage
- Carrier Performance Analytics — Shipping line/airline on-time performance, transit times
- Route Optimization Analytics — Analyze trade routes and transit times
- Container Tracking Integration — IoT/GPS container tracking data integration
- Vendor/Supplier Risk Mapping — Map supply chain dependencies and risks
- Lead Time Analytics — Order-to-delivery time analysis by origin/mode

**4.3 Predictive Trade Analytics (4 sub-capabilities)**
- Trade Volume Forecasting — Predict import/export volumes by commodity
- Price Prediction Models — Forecast commodity prices (oil, cotton, wheat, steel)
- Demand-Supply Gap Analysis — Predict shortages/surpluses for essential commodities
- Early Warning System — Detect trade anomalies and emerging risks

---

#### THEME 5: Trader & Stakeholder Management (Color: emerald-500)

**5.1 Trader Intelligence (6 sub-capabilities)**
- Trader 360° Profile — Single view of importer/exporter: NTN, trade history, compliance, risk
- New Trader Onboarding Analytics — WeBOC registration patterns, first-time trader risk
- Trader Segmentation — Classify traders by volume, compliance, sector, risk tier
- Dormant/Inactive Trader Detection — Identify shell companies, one-time importers
- Related Party Network Analysis — Map corporate groups, beneficial ownership, agent networks
- Trader Communication & Outreach — Track trader engagement, helpdesk, grievances

**5.2 Authorized Economic Operator (AEO) (6 sub-capabilities)**
- AEO Application Pipeline — Track applications: submission → review → verification → certification
- AEO Benefit Measurement — Quantify facilitation benefits (clearance time, inspection rate reduction)
- AEO Compliance Monitoring — Continuous monitoring dashboard for certified AEOs
- AEO Mutual Recognition — Track MRA status with trading partners
- AEO Tier Analytics — Gold/Platinum/Silver tier performance comparison
- AEO Program ROI — Program-level impact on trade facilitation and compliance

---

#### THEME 6: Digital Customs & Modernization (Color: indigo-500)

**6.1 WeBOC & PSW Analytics (6 sub-capabilities)**
- WeBOC System Performance — Uptime, response times, user concurrency, error rates
- GD Processing Analytics — Goods Declaration submission, assessment, clearance patterns
- PSW Integration Dashboard — Track OGA (Other Government Agency) integration status
- Electronic Payment Analytics — Duty payment methods, processing times, reconciliation
- Mobile/API Channel Adoption — Track digital channel usage vs. manual
- System Modernization Roadmap — Plan WeBOC 2.0/3.0 feature releases

**6.2 Data Quality & Governance (6 sub-capabilities)**
- WCO DM Conformity Assessment — Map WeBOC data to WCO DM (4-level conformity)
- Data Quality Scorecarding — Completeness, accuracy, timeliness metrics by data element
- Master Data Management — Harmonize trader, tariff, location master data
- Data Lineage & Audit Trail — Track data from GD submission to statistical output
- Code List Harmonization — Align Pakistan codes with WCO/UN/ISO standards
- Data Sharing Framework — B2G, G2G, G2B data exchange governance

---

### TCF Summary

| Theme | Groups | Sub-Capabilities | Color |
|-------|--------|-------------------|-------|
| Revenue & Duty Management | 3 | 20 | amber |
| Risk Management & Compliance | 3 | 20 | red |
| Trade Facilitation & Operations | 3 | 18 | blue |
| Trade Intelligence & Analytics | 3 | 18 | violet |
| Trader & Stakeholder Management | 2 | 12 | emerald |
| Digital Customs & Modernization | 2 | 12 | indigo |
| **TOTAL** | **14** | **96** | |

---

## 4. TRADE ANALYTICS CAPABILITY REVIEW (TACR) — MATURITY ASSESSMENT

### 8 Assessment Categories (640+ questions)

| # | Category | Focus Areas | Questions |
|---|----------|------------|-----------|
| 1 | **Strategy & Vision** | Trade modernization strategy, digital customs vision, WTO TFA commitment | ~70 |
| 2 | **Organization & Skills** | Customs workforce analytics capability, data science capacity, training | ~80 |
| 3 | **Data Governance** | WCO DM alignment, master data, data quality, data sharing | ~90 |
| 4 | **Information & Integration** | WeBOC/PSW integration, OGA connectivity, data warehouse | ~85 |
| 5 | **Analytics & Technology** | BI tools, risk models, ML capability, automation | ~80 |
| 6 | **Infrastructure & Systems** | Hardware, cloud, networking, DR, security | ~75 |
| 7 | **Processes & Automation** | Clearance automation, risk automation, reporting automation | ~85 |
| 8 | **Outcomes & Impact** | Revenue impact, facilitation improvement, compliance rates, trader satisfaction | ~75 |

**Maturity Levels:**
```
1 — Manual:       Paper-based, ad-hoc, no systematic analytics
2 — Digitizing:   Basic electronic processing, simple reports, spreadsheet analysis
3 — Integrated:   Connected systems, standard dashboards, rules-based risk management
4 — Intelligent:  Predictive analytics, ML models, real-time monitoring, data-driven decisions
5 — Autonomous:   AI-driven customs, automatic release, continuous learning, global best practice
```

---

## 5. TRADE ANALYTICS STAR SCHEMA

### FACT_TRADE_TRANSACTION — Central Fact Table

```sql
CREATE TABLE FACT_TRADE_TRANSACTION (
    -- Keys
    transaction_key           BIGINT PRIMARY KEY,
    gd_number                 VARCHAR(20),        -- WeBOC GD number
    gd_type_key               INT,                -- FK → DIM_GD_TYPE
    date_key                  INT,                -- FK → DIM_DATE
    trader_key                INT,                -- FK → DIM_TRADER
    commodity_key             INT,                -- FK → DIM_COMMODITY
    origin_country_key        INT,                -- FK → DIM_COUNTRY (origin)
    destination_country_key   INT,                -- FK → DIM_COUNTRY (destination)
    port_key                  INT,                -- FK → DIM_PORT
    customs_station_key       INT,                -- FK → DIM_CUSTOMS_STATION
    transport_mode_key        INT,                -- FK → DIM_TRANSPORT_MODE
    agent_key                 INT,                -- FK → DIM_AGENT
    
    -- Trade Direction
    trade_direction           CHAR(1),            -- I=Import, E=Export, T=Transit
    
    -- Value Measures
    declared_value_pkr        DECIMAL(18,2),
    declared_value_usd        DECIMAL(18,2),
    assessed_value_pkr        DECIMAL(18,2),
    customs_value_pkr         DECIMAL(18,2),      -- WTO valuation method
    insurance_freight_pkr     DECIMAL(18,2),
    exchange_rate             DECIMAL(12,6),
    
    -- Duty & Tax Measures
    customs_duty_pkr          DECIMAL(18,2),
    regulatory_duty_pkr       DECIMAL(18,2),
    additional_customs_duty_pkr DECIMAL(18,2),
    sales_tax_pkr             DECIMAL(18,2),
    advance_income_tax_pkr    DECIMAL(18,2),      -- WHT u/s 148
    federal_excise_duty_pkr   DECIMAL(18,2),
    total_duty_taxes_pkr      DECIMAL(18,2),
    sro_concession_pkr        DECIMAL(18,2),      -- Duty saved via SRO
    fta_preference_pkr        DECIMAL(18,2),      -- Duty saved via FTA
    effective_duty_rate        DECIMAL(8,4),
    statutory_duty_rate        DECIMAL(8,4),
    
    -- Quantity Measures
    quantity                  DECIMAL(18,3),
    quantity_unit             VARCHAR(10),
    gross_weight_kg           DECIMAL(18,3),
    net_weight_kg             DECIMAL(18,3),
    number_of_packages        INT,
    number_of_containers      INT,
    
    -- Risk & Compliance
    risk_score                DECIMAL(8,2),
    selectivity_channel       CHAR(1),            -- G=Green, Y=Yellow, R=Red
    examination_result        VARCHAR(20),         -- PASS, DISCREPANCY, SEIZURE
    pca_selected              BOOLEAN,
    aeo_status                VARCHAR(10),         -- NONE, SILVER, GOLD, PLATINUM
    
    -- Timing Measures (minutes)
    arrival_to_gd_minutes     INT,
    gd_to_assessment_minutes  INT,
    assessment_to_exam_minutes INT,
    exam_to_release_minutes   INT,
    total_clearance_minutes   INT,
    dwell_time_hours          DECIMAL(8,2),
    
    -- Pakistan-Specific
    weboc_gd_type             VARCHAR(30),         -- IGM, EGM, TP, WH, ATTA, EFS, etc.
    psw_integration_flag      BOOLEAN,
    ntn_number                VARCHAR(20),
    cpec_route_flag           BOOLEAN,
    fifth_schedule_flag       BOOLEAN,             -- Fifth Schedule exemption
    sro_number                VARCHAR(20),
    fta_code                  VARCHAR(10),         -- CPFTA, SAFTA, D8, ECO
    gsp_plus_flag             BOOLEAN,
    
    -- Audit
    created_date              TIMESTAMP,
    last_updated              TIMESTAMP
);
```

### Dimension Tables (10 dimensions)

```
DIM_DATE              — Calendar dimension (fiscal year July-June, Hijri calendar, Ramadan flag)
DIM_TRADER            — Importer/Exporter (NTN, CNIC, name, sector, city, AEO tier, risk score)
DIM_COMMODITY         — HS code hierarchy (Chapter → Heading → Subheading → Tariff Line → SRO)
DIM_COUNTRY           — Trading partner (ISO code, region, FTA status, sanctions flag)
DIM_PORT              — Port/border (Karachi Port, Bin Qasim, Gwadar, Wagah, Torkham, Chaman, airports)
DIM_CUSTOMS_STATION   — MCC/Collectorate (MCC Appraisement East/West, MCC Port Qasim, etc.)
DIM_TRANSPORT_MODE    — Sea, Air, Road, Rail, Pipeline, Postal, Courier
DIM_AGENT             — Customs agent/broker (license number, clearances, compliance score)
DIM_GD_TYPE           — GD type (Home Consumption, Warehousing, Transit, Re-export, Temporary, EFS, etc.)
DIM_SRO               — SRO/Concession (SRO number, year, condition, expiry, utilization %)
```

### Aggregate Tables

```
AGG_MONTHLY_TRADE       — Monthly trade summary by commodity × country × port × direction
AGG_TRADER_PERFORMANCE  — Trader-level: total value, duties, clearance time, risk score, compliance rate
AGG_PORT_PERFORMANCE    — Port-level: throughput, dwell time, inspection rate, revenue per container
AGG_COMMODITY_TREND     — Commodity-level: price trends, volume trends, origin shifts
```

### Analytical Views

```
VW_TRADE_BALANCE        — Import-Export balance by country/commodity/period
VW_REVENUE_LEAKAGE      — Statutory vs. applied duty gap by commodity
VW_CLEARANCE_SLA        — Clearance time vs. WTO TFA targets
VW_RISK_EFFECTIVENESS   — Risk rule hit rates, false positives, seizure correlation
VW_FTA_UTILIZATION      — FTA preference utilization rates by agreement
VW_CPEC_TRADE           — CPEC corridor-specific trade flows
```

---

## 6. TRADE GAP EXTENSIONS (5 modules, ~25 tables)

### Extension 1: AEO Analytics (5 tables)
```
AEO_APPLICATION          — Application tracking (applicant, tier, status, dates)
AEO_COMPLIANCE_EVENT     — Compliance monitoring events (audits, violations, scores)
AEO_BENEFIT_MEASUREMENT  — Quantified benefits (clearance time reduction, inspection waiver %)
AEO_MUTUAL_RECOGNITION   — MRA status by partner country
AEO_TIER_TRANSITION      — Tier change history (Silver→Gold→Platinum)
```

### Extension 2: Rules of Origin & FTA (5 tables)
```
FTA_AGREEMENT            — FTA master (CPFTA-II, SAFTA, D-8, ECO, GSP+, APTA)
FTA_TARIFF_CONCESSION    — Concession rates by HS code per FTA
FTA_ORIGIN_CERTIFICATE   — Certificate of Origin tracking (issued, claimed, rejected)
FTA_UTILIZATION          — Utilization rates: eligible trade vs. preference claimed
FTA_RULE_OF_ORIGIN       — Product-specific rules (CTC, RVC, wholly obtained)
```

### Extension 3: Customs Valuation Intelligence (5 tables)
```
REFERENCE_PRICE_DB       — Reference prices by HS code × origin (median, P25, P75, min, max)
VALUATION_ALERT          — Price deviation alerts (declared < P10 or > P90)
TRANSFER_PRICING_FLAG    — Related-party transaction flags
VALUATION_METHOD_LOG     — WTO valuation method applied per clearance (1-6)
PRICE_TREND              — Time-series price data for key commodities
```

### Extension 4: Risk Scoring Engine (5 tables)
```
RISK_RULE                — Risk rules (field, operator, value, score, active flag)
RISK_SCORE_LOG           — Per-GD risk score calculation log
RISK_MODEL_PERFORMANCE   — Model accuracy: precision, recall, seizure rate by channel
INTELLIGENCE_FEED        — NTC intelligence feeds, tips, watchlists
RISK_RULE_AB_TEST        — A/B test results for rule variants
```

### Extension 5: E-Commerce & De Minimis (5 tables)
```
ECOMMERCE_SHIPMENT       — Cross-border e-commerce parcels (platform, value, category)
DE_MINIMIS_THRESHOLD     — De minimis rules by category
POSTAL_ITEM              — UPU postal item tracking
COURIER_PERFORMANCE      — Express courier clearance metrics (DHL, FedEx, TCS, Leopards)
PLATFORM_ANALYTICS       — Marketplace analytics (AliExpress, Amazon, Daraz origins)
```

---

## 7. PAKISTAN TRADE CONTEXT

### 7.1 Institutional Framework

| Entity | Role | System |
|--------|------|--------|
| **FBR Customs** | Revenue collection, clearance, enforcement | WeBOC |
| **Pakistan Single Window (PSW)** | Single window for 70+ OGAs | PSW Portal |
| **Ministry of Commerce** | Trade policy, FTAs, export promotion | TDAP |
| **Pakistan Bureau of Statistics** | Trade statistics | PBS |
| **State Bank of Pakistan** | FX control, trade finance regulation | SBP |
| **National Targeting Centre (NTC)** | Intelligence-led customs targeting | CTS, GTAS |
| **PRAL** | FBR IT systems, WeBOC development | WeBOC backend |
| **Drug Regulatory Authority** | Pharma import control | DRAP |
| **Pakistan Standards (PSQCA)** | Standards conformity | Conformity cert |
| **Plant Protection Dept** | Phytosanitary certificates | PPD |
| **Animal Quarantine** | Veterinary certificates | AQD |

### 7.2 Trade Statistics (FY2024-25)

```
Total Exports:           $32.11 billion (4.67% growth)
Total Imports:           $58.38 billion
Trade Deficit:           $26.27 billion
Top Export:              Textiles (~54% share)
Top Import:              Petroleum (~20% share)
Top Partner (Export):    USA ($5.8B), EU ($8.2B), China ($2.4B), UAE ($1.5B)
Top Partner (Import):   China ($19.6B), UAE ($7.5B), Saudi ($4.2B), Indonesia ($2.8B)
Customs Revenue:         PKR ~1,100B (FY25 target)
GDs Processed:           ~4M+ annually via WeBOC
Active Traders:          ~50,000+ registered in WeBOC
Customs Stations:        12 MCCs + 6 Directorates General
Ports:                   3 seaports, 9 airports, 7 land borders, 6 dry ports
```

### 7.3 Key Pakistan Customs Data Points

**Goods Declaration Types (16 in WeBOC):**
```
1. Home Consumption (Import)      9. Export Facilitation Scheme (EFS)
2. Warehousing                    10. Temporary Import
3. Export                         11. Re-Import
4. Transit (ATTA)                 12. Re-Export  
5. Transshipment                  13. Ship Stores
6. In-Bond Transfer               14. Batch Data
7. Ex-Bond                        15. Safe Transportation
8. Temporary Admission            16. Personal Baggage
```

**Customs Duty Structure:**
```
Customs Duty:                 0-20% (11 slabs)
Additional Customs Duty:      2-7%
Regulatory Duty (RD):         0-90% (on ~500 items)
Sales Tax (at import):        18% (standard) / 25% (luxury)
Advance Income Tax (WHT):     1% (commercial) / 2% (industrial) / 5.5% (non-filer)
Federal Excise Duty:          varies (tobacco, beverages, cement, vehicles)
```

**Trade Agreements:**
```
CPFTA-II:    China-Pakistan FTA Phase 2 (Jan 2020, 313 lines at 0%, 1,760 lines concession)
SAFTA:       South Asian Free Trade Area (India suspended)
D-8 PTA:     Developing 8 Preferential Trade (2024 — Bangladesh, Egypt, Indonesia, etc.)
ECO TPA:     Economic Cooperation Organization (Turkey, Iran, Central Asia)
GSP+:        EU GSP+ (duty-free access for 66% of tariff lines, conditional on 27 conventions)
APTA:        Asia-Pacific Trade Agreement
Malaysia:    PK-Malaysia FTA (in negotiation)
Türkiye:     PK-Türkiye FTA (in negotiation)
```

**CPEC Phase 2 — Customs Implications:**
```
Gwadar Port:         Free zone, tax holidays, duty-free imports for 20 years
Special Economic Zones: 9 approved SEZs (Rashakai, Allama Iqbal, Dhabeji, etc.)
ML-1 Railway:        Karachi-Peshawar upgrade → cargo volume shift from road to rail
Border Infrastructure: Sost (Karakoram Highway), Gwadar, new dry ports
Digital Connectivity:  Cross-border data exchange with China Customs (GACC)
```

### 7.4 Key Challenges

1. **$6.5B Data Gap** — WeBOC query captured only 7 of 16 GD types for PBS statistics
2. **Under-Invoicing** — Estimated 15-25% of imports under-valued, especially from China
3. **SRO Complexity** — 500+ active SROs creating duty distortions and rent-seeking
4. **Manual Processes** — 30-40% of clearance steps still require physical presence
5. **OGA Integration** — Only ~40 of 70+ OGAs integrated with PSW
6. **AEO Adoption** — <50 certified AEOs vs. program potential of 5,000+
7. **Afghan Transit Diversion** — ATTA goods leaking into local market
8. **Risk Model Accuracy** — High false positive rate in selectivity (>40%)
9. **Data Quality** — Inconsistent HS classification, missing fields, duplicate traders
10. **No WCO DM Conformity** — Pakistan has not published a MIP (My Information Package)

---

## 8. APPLICATION MODULES (8 Tabs)

### MODULE 1: Dashboard (/)
- Hero stats: 727 data elements | 96 capabilities | 640+ questions | 14 WCO domains
- Trade balance chart (imports vs. exports, trailing 12 months)
- Donut: WCO data elements by domain
- Bar: Capabilities by theme
- Pakistan Trade Metrics card ($32B exports, $58B imports, PKR 1,100B revenue, 4M+ GDs)
- Quick nav grid (8 modules)
- Maturity radar (if assessment started)

### MODULE 2: WCO Data Model Explorer (/model)
- LEFT: Domain tree (14 domains → ~130 classes → 727 data elements)
- CENTER: Class/element detail (name, definition, data type, code list, information packages using it)
- RIGHT: "Used By Capabilities" panel (TCF capabilities depending on this data element)
- Search: Fuzzy search across all data elements
- Filter: By domain, by information package (DIP), by code list

### MODULE 3: TCF Capability Navigator (/capabilities)
- LEFT: TCF hierarchy tree (6 themes → 14 groups → 96 sub-capabilities)
- CENTER: Capability detail (data requirements, WCO DM elements needed, Pakistan context)
- RIGHT: Related capabilities (shared data dependencies)
- Pakistan enrichment section (objectives, data sources, outcomes, challenges)

### MODULE 4: Dependency Graph (/graph)
- Force-directed: TCF groups ↔ WCO DM domains
- Sankey: Themes → Groups → WCO Domains → Key Data Elements
- Click-to-navigate to Module 2 or 3

### MODULE 5: Maturity Assessment (/maturity)
- TACR wizard: 8 categories, ~640 questions
- Current vs. Desired sliders (1-5)
- Results: Radar, gap table, heat map
- Export: PDF, JSON

### MODULE 6: Trade Analytics Engine (/analytics)
- Tab 1: Star Schema ERD (FACT_TRADE_TRANSACTION + 10 dimensions)
- Tab 2: Revenue Waterfall (Declared Value → Customs Duty → RD → ST → WHT → FED → Total)
- Tab 3: Dimensions Explorer (10 dim cards, Pakistan-specific fields highlighted)
- Tab 4: Gap Extensions (5 modules: AEO, Origin, Valuation, Risk, E-Commerce)

### MODULE 7: Roadmap Builder (/roadmap)
- Capability picker (multi-select from 96)
- Templates: "Quick Wins", "Revenue Protection", "Trade Facilitation", "WCO DM Conformity", "Full TCF"
- 3-phase Gantt timeline
- Investment calculator (PKR sliders)
- Shared data foundation

### MODULE 8: Pakistan Trade Reference (/pakistan)
- FBR Customs structure (MCCs, DGs, NTC)
- Trade agreements table (CPFTA-II, SAFTA, D-8, ECO, GSP+)
- Duty structure table (CD, RD, ACD, ST, WHT, FED)
- CPEC section (SEZs, Gwadar, ML-1)
- Port infrastructure (seaports, airports, land borders, dry ports)
- WeBOC GD types (16 types explained)

---

## 9. ENRICHMENT PROMPTS (14 prompts, ~8,000 lines)

Parallel to BAIW's 16 BVF enrichment prompts:

| # | Prompt | TCF Coverage | Key Pakistan Context |
|---|--------|-------------|---------------------|
| 1 | Revenue & Valuation Introduction | Overview of revenue analytics | FBR targets, duty structure |
| 2 | Customs Valuation Analytics | 1.1 (8 caps) | Under-invoicing, reference prices, transfer pricing |
| 3 | Tariff & Classification | 1.2 (6 caps) | HS tariff, SROs, duty drawback |
| 4 | Revenue Forecasting | 1.3 (6 caps) | FBR revenue targets, leakage detection |
| 5 | Risk-Based Selectivity | 2.1 (8 caps) | NTC, selectivity channels, WeBOC risk |
| 6 | Anti-Smuggling & TBML | 2.2 (6 caps) | ATTA diversion, TBML via China trade |
| 7 | Compliance & Audit | 2.3 (6 caps) | PCA, AEO compliance, WTO TFA |
| 8 | Clearance Optimization | 3.1 (8 caps) | WeBOC clearance times, PSW integration |
| 9 | Port & Terminal Operations | 3.2 + 3.3 (10 caps) | KPT, Bin Qasim, Gwadar, CPEC |
| 10 | Trade Statistics & Intelligence | 4.1 (8 caps) | PBS data gap, ITC reconciliation |
| 11 | Supply Chain & Predictive | 4.2 + 4.3 (10 caps) | CPEC visibility, commodity forecasting |
| 12 | Trader Intelligence | 5.1 (6 caps) | NTN-based profiling, related-party networks |
| 13 | AEO Program | 5.2 (6 caps) | FBR AEO rules, Gold/Silver/Platinum |
| 14 | Digital Customs & WCO Conformity | 6.1 + 6.2 (12 caps) | WeBOC modernization, WCO DM MIP |

---

## 10. FEASIBILITY ASSESSMENT

### Can We Build This?

| Aspect | BAIW (Banking) | TAIW (Trade) | Feasibility |
|--------|---------------|--------------|-------------|
| Data Model Source | ERwin file (80MB) + XSD (9MB) | WCO DM eHandbook + PDF specs | ✅ Public — WCO publishes data element spreadsheets |
| Capability Framework | BVF (Teradata proprietary, we had mappings) | TCF (we CREATE this — defined above) | ✅ We defined 96 capabilities above |
| Maturity Assessment | BACR (client's XLSM, 793 questions) | TACR (we CREATE this) | ✅ We design questions per category |
| Star Schema | Profitability (from repo) | Trade Transaction (we CREATE this) | ✅ Defined above, 1 fact + 10 dims |
| Pakistan Context | Banking (SBP, KIBOR, CASA) | Trade (FBR, WeBOC, CPEC, HS) | ✅ Rich public data available |
| Gap Extensions | 5 modules (ABC, CLV, Budget, BPM, Ops) | 5 modules (AEO, Origin, Valuation, Risk, E-Commerce) | ✅ Defined above |
| Enrichment | 16 prompts from repo | 14 prompts (we WRITE these) | ✅ Pakistan trade context well-documented |
| Real Data | ERwin CSV outputs from repo | WCO DM spreadsheet + WeBOC GD structure | ✅ WCO publishes element lists |

### Key Difference from BAIW

BAIW had a pre-existing repo (`nmnbkhr/erwin`) with parsed data. TAIW needs us to **create the equivalent repo from scratch**:

```
Phase 0: Research & Extract WCO DM data (from WCO publications)
Phase 1: Parse WCO DM into structured JSON (equivalent to erwin_parser_output)
Phase 2: Build TCF framework in CSV/JSON (equivalent to bvf_capability_summary)
Phase 3: Create TCF→WCO DM mappings (equivalent to bvf_to_fsdm_entity_mapping)
Phase 4: Write TACR maturity questions (equivalent to BACR Excel)
Phase 5: Design star schema + gap extensions (equivalent to profitability_star_schema)
Phase 6: Write 14 enrichment prompts (equivalent to 16 BVF prompts)
Phase 7: Build TAIW React app (reuse BAIW architecture)
```

### Estimated Effort

| Phase | BAIW Time | TAIW Estimate | Notes |
|-------|-----------|---------------|-------|
| Data extraction | Had repo | 2-3 days | Parse WCO DM PDFs/spreadsheets |
| Framework design | Had BVF | 1-2 days | TCF defined above, needs CSV formalization |
| Mappings | Had pipeline | 2-3 days | Map 96 capabilities → 727 data elements |
| Maturity questions | Had BACR | 2-3 days | Write 640+ questions across 8 categories |
| Star schema | Had SQL | 1 day | Defined above, formalize DDL |
| Enrichment prompts | Had 16 prompts | 3-5 days | Write 14 prompts (~8,000 lines) |
| React app | 3-5 sessions | 2-3 sessions | **Reuse 80% of BAIW architecture** |
| **Total** | **~2 weeks** | **~2-3 weeks** | Faster if we parallelize |

---

## 11. IMPLEMENTATION PLAN

### Step 1: Create the Data Repository (equivalent to nmnbkhr/erwin)

```
taiw-data/
├── wco_dm_output/
│   ├── wco_data_elements.csv          # 727 data elements
│   ├── wco_classes.csv                # ~130 classes
│   ├── wco_class_hierarchy.json       # Class relationships
│   ├── wco_domains.json               # 14 domains
│   ├── wco_code_lists.csv             # ~380 code lists
│   ├── wco_information_packages.json  # DIPs and BIPs
│   └── wco_conformity_levels.json     # 4 conformity levels
├── tcf_output/
│   ├── tcf_capability_summary.csv     # 96 sub-capabilities
│   ├── tcf_data_requirements.csv      # ~120 data requirements
│   ├── tcf_to_wco_mapping.csv         # ~400 capability→element mappings
│   ├── capability_wco_dependencies.csv # ~3,000 dependencies
│   ├── wco_element_reuse_scores.csv   # ~200 elements ranked P1-P4
│   ├── tcf_reuse_matrix.csv           # 96×96 similarity
│   └── pakistan_trade_context.md       # Pakistan enrichment
├── tacr/
│   └── TACR_INTERVIEW_MASTER.xlsx     # 640+ maturity questions
├── star_schema/
│   ├── trade_star_schema.sql          # FACT + 10 DIMs + AGGs
│   └── trade_gap_extensions.sql       # 5 modules, 25 tables
└── enrichment/
    ├── 01_revenue_introduction.md
    ├── 02_customs_valuation.md
    ├── ...
    └── 14_digital_customs_wco_conformity.md
```

### Step 2: Build TAIW App (Reuse BAIW Architecture)

The BAIW React app architecture is **directly reusable**:

| BAIW Component | TAIW Equivalent | Change Required |
|---------------|-----------------|-----------------|
| `src/data/entities.json` | `src/data/dataElements.json` | Rename + new schema |
| `src/data/capabilities.json` | `src/data/capabilities.json` | Same structure, new content |
| `src/data/domains.json` | `src/data/domains.json` | 16→14 domains, new names |
| `src/data/bacrQuestions.json` | `src/data/tacrQuestions.json` | Same structure, new questions |
| `src/data/starSchema.json` | `src/data/starSchema.json` | Trade schema instead of profitability |
| `ModelExplorer.tsx` | `WCOModelExplorer.tsx` | Entity→DataElement, Domain→WCO Domain |
| `CapabilityNavigator.tsx` | `CapabilityNavigator.tsx` | BVF tree→TCF tree, same layout |
| `ProfitabilityEngine.tsx` | `TradeAnalyticsEngine.tsx` | P&L→Revenue Waterfall, same structure |
| `PakistanReference.tsx` | `PakistanTradeReference.tsx` | Banking→Trade context |

**~80% of BAIW code is reusable** — the component architecture, routing, search, export, localStorage, Cmd+K palette, skeleton loading — all transfer directly.

### Step 3: Prompt Sequence for Claude Code

```
Prompt 1: Build TAIW app (reuse BAIW patterns, new data)
Prompt 2: Fix audit gaps (same pattern as BAIW)
Prompt 3: Phase 2 depth enhancements
Prompt 4: Real data swap (when WCO DM data extracted)
Prompt 5: Deploy
```

---

## 12. BUSINESS VALUE

### For FBR / Pakistan Customs
- Unified view of trade data model, analytics capabilities, and modernization roadmap
- Close the $6.5B data gap with proper WCO DM conformity
- Design Pakistan's first MIP (My Information Package) for WCO DM
- Quantify AEO program expansion potential
- CPEC Phase 2 customs infrastructure planning tool

### For Consulting Practice
- Reusable across customs engagements (Pakistan, Bangladesh, Sri Lanka, Middle East)
- Impressive client-facing tool vs. static PowerPoints
- Captures institutional knowledge (Pakistan trade context baked in)
- Can evolve into SaaS for customs consulting

### For International Organizations
- World Bank trade facilitation assessments
- WCO technical assistance missions
- USAID/DFID customs modernization programs
- IMF trade data reconciliation support

---

## 13. VERDICT

**YES — we can absolutely create this.** The parallel is clean:

```
BAIW:  FSDM (3,917) + BVF (112) + BACR (793) + Star Schema + Pakistan Banking
TAIW:  WCO DM (727)  + TCF (96)  + TACR (640) + Star Schema + Pakistan Trade
```

The main difference: BAIW had a pre-built data repo. TAIW needs us to **create the data repo first** (Phases 0-6 above), then the app build (Phase 7) is faster because we reuse BAIW's architecture.

**Recommended approach:** Create the data repo as a series of Claude Code prompts, then build the app.
