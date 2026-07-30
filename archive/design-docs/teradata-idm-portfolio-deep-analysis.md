# Teradata Industry Data Models & Analytical Schemas — Deep Analysis

## Executive Summary

Teradata offers **11 Industry Data Models (iDMs)** — each a 3NF logical data model delivered as an ERwin file — covering the major commercial sectors. In 2010, Teradata unified these under a **Unified LDM Framework** with shared modular building blocks (Party, Event, Financial Management, Geography) that are extended per industry. Each iDM has a corresponding **Industry Analytic Schema (iAS)** — a dimensional star/snowflake layer for BI consumption. This two-layer architecture (integration layer + analytics layer) is the core product strategy.

---

## Complete Portfolio: 11 Industry Data Models

### 1. Financial Services Data Model (FSDM / FS-LDM)

| Attribute | Detail |
|-----------|--------|
| **Current Version** | v13 (latest confirmed) |
| **Entity Count** | ~3,917 entities |
| **Attribute Count** | ~22,000+ attributes |
| **Subject Areas** | 16 domains |
| **Analytical Schema** | Financial Services Analytic Schemas (FSAS) |
| **Sub-Industries** | Retail banking, commercial banking, insurance, capital markets, credit card, brokerage, wealth management |
| **Normalization** | Third Normal Form (3NF) |
| **Delivery Format** | ERwin Data Modeler file + Reference Guide (2 books) |

**Subject Areas (16):** Party, Agreement, Product, Transaction, Event, Financial Management, Campaign, Channel, Geography, Risk, Compliance, Payment, Loan, Investment, Insurance, Card

**Key Architecture Decisions:**
- Central entity: PARTY (customers, employees, organizations) linked to AGREEMENT (accounts, contracts, policies)
- Uses meta-modeling (code/value pairs) for dynamic business attributes like KPIs and product features — allows new products without model changes
- Cross-functional with single customer view across all product lines

**FSAS (Analytic Layer):** Predefined dimensional schemas supporting risk management, customer management, and financial management analytics. Includes star schemas for customer profitability, product P&L, risk exposure, and regulatory reporting.

**Market Position:** The most mature and widely deployed iDM. Used by banks across Central/Eastern Europe, Middle East, Asia Pacific, and Americas. The FS-LDM is also the most documented publicly — training courses, white papers, and implementation guides are widely available.

**BAIW Built On This:** Our Banking Analytics Intelligence Workbench uses the FSDM v13 as its foundation.

---

### 2. Healthcare Data Model (HCDM / HC-LDM)

| Attribute | Detail |
|-----------|--------|
| **Entity Count** | ~2,400 entities (grew from ~1,800 in early versions) |
| **Attribute Count** | ~8,000+ attributes (early); likely 12,000+ current |
| **Subject Areas** | 10+ broad subject areas |
| **CDM Concepts** | ~150 key concepts |
| **Analytical Schema** | Healthcare Analytic Schemas (HCAS) |
| **Sub-Industries** | Payer, Provider, Pharmacy Benefit Management |

**Subject Areas:** Claim, Campaign, Clinical, Event, Party, Financial Management, Geography, Membership/Enrollment, Provider, Pharmacy, Quality/Outcomes

**Key Capabilities:**
- Episodes of care tracking, diagnosis document control, lab tests/results
- Health savings accounts, membership enrollment, benefit plans
- Provider and physician information, patient attribution, capitation payments
- Total cost of care visibility: provider, payer, government, pharmacy pricing
- Population health management and wellness/chronic management
- Clinical encounter tracking with HL7 integration capability

**Architecture Notes:** The HC-LDM was one of the first to receive the "Clinical" subject area integration (Release 2.01, July 2007). Contains ~150 CDM-level concepts. Uses the same Event abstraction as other iDMs — an Incident Event covers flu epidemics, accidents, etc., linking to Professional and Pharmacy claims.

**Market:** Major deployments at large US health systems (Texas Health Resources, etc.), health insurers, and pharmacy benefit managers. Aligns with OMOP CDM and HL7 RIM standards conceptually but is far more comprehensive.

---

### 3. Communications Data Model (CDM / CLDM)

| Attribute | Detail |
|-----------|--------|
| **Entity Count** | 1,500+ entities |
| **Subject Areas** | 9 broad subject areas |
| **Analytical Schema** | Communications Analytic Schemas (CAS) |
| **Sub-Industries** | Telecommunications, Cable, Satellite |

**Subject Areas (9):** Network, Network Activity, Event, Financial Management, Party, Master (location-centric: telephone number, site, address), Promotion, Offer, Finance

**Key Capabilities:**
- Customer churn analysis and prevention
- Revenue assurance and fraud detection
- Network asset management
- Product management (offerings, bundles, packages)
- Call center management (added Release 10.0)
- Retail sales transactions (added Release 10.0)
- Billing and rating analytics

**Architecture Notes:** The CLDM's Subject Area Model contains 9 key concepts. Single entities at the Subject Area level represent many detailed entities — e.g., the "Offer" concept alone unpacks into 100+ entities including Offering, Product, Incentive, etc. Demonstrates heavy abstraction (Event entity links service orders, billing adjustments, and power outages as subtypes).

**Notable:** One of the more publicly documented iDMs. The CLDM white paper by Steve Hoberman (Steve Hoberman & Associates) is widely referenced in data modeling education.

---

### 4. Retail Data Model (RDM / RLDM)

| Attribute | Detail |
|-----------|--------|
| **Entity Count** | Large (not publicly quantified, estimated 2,000-3,000) |
| **Subject Areas** | 30+ business process areas |
| **Analytical Schema** | Retail Analytic Schemas (RAS) |
| **Roadmap Tool** | Enterprise Data Warehouse Roadmap (EDWr) |
| **Sub-Industries** | General retail, grocery, fashion, pharmacy, food service |

**Subject Areas (30+):** Merchandising, Assortment/Category Management, Product Mix (PMIX), Item Pricing and Cost Detail, Inventory Management, RFID/Serialized Item Track and Trace, Shipment/Freight Billing/Claims, Transportation Logistics (Distribution), Invoice, Agreements, Procurement, Planogram, Promotion Management and Marketing, Point-of-Sale Transactions and Detail, Catalog Sales and Content Management, Customer Value/Shopping/Product Purchase Behavior, Quality Feedback, Loyalty and Gift Card Usage, Store Labor and Operations, Human Capital Management (HR), Privacy and Vendor Management, E-Tail Web Commerce and Interactions, Forecasting and Scoring, Financial Management, Retail Pharmacy, Table Dining Servicing, Kitchen and Wait Time Management, Service Tips Reporting Compliancy, Sales Tax and Fee Compliance, Call Center Productivity

**RAS (Analytic Layer):** Includes dimensional models and analytic datasets in a single integrated model. Drives analytics for merchandise assortment analytics, customer engagement analytics, and greenhouse gas emissions for business travel.

**Roadmap Tool (EDWr):** Teradata created the Retail Enterprise Data Warehouse Roadmap — a navigation tool that uses color-coding (Red = not enabled, Yellow = partially enabled, Green = fully enabled) to show which content areas are populated. Uses "Business Improvement Opportunities" (BIOs) as the equivalent of capabilities.

**Key Insight for BAIW/TAIW:** The RDM's BIO (Business Improvement Opportunity) assessment is conceptually similar to our BVF/TCF capability frameworks. Teradata uses BIOs to map business questions to required data model areas.

---

### 5. Manufacturing Data Model (MFGDM / MLDM)

| Attribute | Detail |
|-----------|--------|
| **Version** | 4.0 (confirmed) |
| **Entity Count** | 600+ individual data pieces with 2,100+ relationships |
| **Subject Areas** | 80+ (grew from ~130 "broad" subject areas at conceptual level) |
| **Analytical Schema** | Manufacturing Analytic Schemas (MAS) |
| **Sub-Industries** | Automotive, Consumer Products, High-Tech |

**Key Capabilities:**
- Supply chain analysis (supplier to customer)
- Manufacturing operations and plant performance
- Inventory management and optimization
- Financial management integration
- Customer relationship management
- Quality management and defect tracking
- Bill of materials and product lifecycle

**Architecture Notes:** The MLDM 4.0 was described as including "more than 80 subject areas, more than 600 individual pieces of data from across the enterprise and more than 2,100 relationships." This was specifically expanded for automotive, consumer products, and high-tech verticals. The model combines manufacturer internal systems data with supplier data for cross-enterprise analytics.

---

### 6. Transportation & Logistics Data Model (TLDM / T&L-LDM)

| Attribute | Detail |
|-----------|--------|
| **Entity Count** | Not publicly quantified (estimated 1,500-2,500) |
| **Analytical Schema** | Transportation & Logistics Analytic Schemas (TLAS) |
| **Sub-Industries** | Airlines, Freight/Cargo, Rail, Maritime, Logistics providers |

**Key Capabilities:**
- MRO (Maintenance, Repair, Overhaul) support
- Purchasing and contracting
- Inventory levels and allocations
- Component maintenance scheduling/prioritization
- Reliability management
- Line and engine maintenance
- Aircraft overhaul
- Route optimization and fleet management
- Cargo tracking and shipment visibility

**Architecture Notes:** Strong MRO focus for airlines. Supports the full logistics lifecycle from booking through delivery. Integrated with financial management for cost allocation across routes, fleets, and facilities.

---

### 7. Travel & Hospitality Data Model (THDM / T&H-LDM)

| Attribute | Detail |
|-----------|--------|
| **CDM Concepts** | 50+ key concepts |
| **Entity Count** | Not publicly quantified (estimated 1,000-2,000) |
| **Analytical Schema** | Travel & Hospitality Analytic Schemas (THAS) |
| **Sub-Industries** | Hotels, Airlines, Car Rental, Cruise, Resort, Casino/Gaming |

**Key Capabilities:**
- Guest/passenger 360 profile
- Revenue management and yield optimization
- Loyalty program analytics
- Booking and reservation management
- Property and fleet management
- Food and beverage operations
- Casino/gaming analytics
- Event and conference management

**Architecture Notes:** The T&H-LDM's conceptual data model contains more than 50 key concepts. Designed for companies operating across multiple hospitality segments (e.g., a company running both hotels and casinos). Shares Party, Event, and Financial Management building blocks with other iDMs.

---

### 8. Media & Entertainment Data Model (MEDM / M&E-LDM)

| Attribute | Detail |
|-----------|--------|
| **Entity Count** | Not publicly quantified (estimated 1,000-1,500) |
| **Analytical Schema** | Media & Entertainment Analytic Schemas (MEAS) |
| **Sub-Industries** | Broadcast, Publishing, Film/TV, Digital Media, Gaming |

**Key Capabilities:**
- Content management and rights tracking
- Audience measurement and engagement analytics
- Advertising revenue optimization
- Subscription and viewership analysis
- Content distribution channel management
- Royalty and rights payment tracking

---

### 9. Utilities Data Model (UDM / ULDM)

| Attribute | Detail |
|-----------|--------|
| **Introduced** | February 2010 |
| **Entity Count** | Not publicly quantified |
| **Analytical Schema** | Utilities Analytic Schemas (UAS) |
| **Sub-Industries** | Electric, Gas, Water, Multi-utility |

**Subject Areas:** Grid Infrastructure (meter, meter reading, meter management, service points, equipment, meter reading route, site/premises), Customer Management, Billing and Revenue, Energy Trading, Regulatory Compliance, Outage Management, Work Management, Asset Management, Smart Grid/AMI Data

**Key Capabilities:**
- Smart meter data management (AMI infrastructure)
- Revenue protection and theft detection
- Non-recording/unread meter identification
- Outage analysis and restoration optimization
- Demand response and load management
- Regulatory reporting and compliance

**Notable Implementation:** One large North American energy provider identified more than $10 million in recoverable revenue from non-recording and unread meters using the ULDM. Teradata estimates the model saves 6-9 months of logical and physical model development time.

---

### 10. Life Science Data Model (LSDM / LS-LDM)

| Attribute | Detail |
|-----------|--------|
| **Entity Count** | Not publicly quantified |
| **Analytical Schema** | Life Science Analytic Schemas (LSAS) |
| **Sub-Industries** | Pharmaceutical, Biotechnology, Medical Devices |

**Key Capabilities:**
- Clinical trial data management
- Drug discovery pipeline tracking
- Regulatory submission management (FDA, EMA)
- Sales force effectiveness
- Physician/HCP engagement tracking
- Patient outcome analytics
- Adverse event reporting
- Supply chain for controlled substances

---

### 11. Medicaid Data Model

| Attribute | Detail |
|-----------|--------|
| **Entity Count** | Not publicly quantified |
| **Sub-Industries** | State Medicaid programs, Government healthcare |

**Key Capabilities:**
- Medicaid claims processing and fraud detection
- Eligibility and enrollment management
- Provider network management
- Quality metrics and outcome reporting
- Federal reporting compliance (CMS requirements)
- Managed care organization (MCO) analytics

**Architecture Notes:** This is the most US-specific iDM, designed for state government Medicaid agencies. Shares the HC-LDM's clinical and claims structures but adds government-specific regulatory and compliance entities.

---

## The Two-Layer Architecture: iDM + iAS

Every industry gets TWO products that work together:

```
                    ┌─────────────────────────────┐
                    │    Industry Analytic Schema   │
                    │         (iAS / FSAS / RAS)    │
  ANALYTICS LAYER   │  Star/Snowflake dimensional   │
  (Consumption)     │  Facts, Dimensions, Metrics   │
                    │  Business questions answered   │
                    └──────────────┬──────────────┘
                                   │ Feeds from
                    ┌──────────────┴──────────────┐
                    │    Industry Data Model        │
  INTEGRATION LAYER │         (iDM / FSDM / RDM)   │
  (Foundation)      │  3NF logical, entity-rich     │
                    │  Business rules, relationships │
                    │  Source system integration     │
                    └─────────────────────────────┘
```

| Layer | Product | Format | Purpose |
|-------|---------|--------|---------|
| **Integration** | iDM (e.g., FSDM, RDM, HCDM) | 3NF logical model in ERwin | Single version of truth, source system integration, business rules |
| **Analytics** | iAS (e.g., FSAS, RAS, HCAS) | Star/snowflake schemas | Business questions, KPIs, dashboards, slice-and-dice analysis |

The iAS products are described as a "business-driven, industry-focused set of analytical schemas designed to support and accelerate development of your analytic environment." They include dimensional data models, analytic datasets, and pre-built fact/dimension structures.

---

## Unified LDM Framework (2010)

In October 2010, Teradata announced the **Unified Logical Data Model Framework** — a cross-industry architecture that decomposes all 11 iDMs into shared building blocks:

**Shared Building Blocks (common across ALL iDMs):**
- Party (customers, employees, organizations)
- Event (generic interaction tracking)
- Financial Management (accounting, ledgers)
- Geography (location, address, territory)
- Campaign (marketing, outreach)
- Channel (interaction channels)

**Industry-Specific Extensions:** Each iDM extends these shared blocks with domain-specific entities. For example:
- FSDM adds: Agreement, Loan, Insurance Policy, Investment
- HCDM adds: Claim, Clinical Encounter, Membership, Provider
- CLDM adds: Network, Network Activity, Offer, Promotion
- RDM adds: Merchandising, Point-of-Sale, Inventory, Planogram

**Benefits of Unification:**
- More frequent model releases (per building block, not per entire model)
- Less customization needed
- Cross-industry support (e.g., a bank that also does insurance can combine FS-LDM and HC-LDM building blocks)
- Value network modeling beyond single-enterprise view

---

## Comparative Analysis

### Scale Comparison

| Model | Entities | Attributes | Subject Areas | CDM Concepts | Maturity |
|-------|----------|------------|---------------|--------------|----------|
| **FSDM** | ~3,917 | ~22,000+ | 16 | N/A | Highest (25+ years) |
| **HCDM** | ~2,400 | ~12,000+ | 10+ | ~150 | Very High |
| **CLDM** | 1,500+ | N/A | 9 | 9 (SAM) | Very High |
| **RDM** | ~2,000-3,000 (est.) | N/A | 30+ | N/A | Very High |
| **MFGDM** | 600+ data pieces | 2,100+ relationships | 80+ | N/A | High |
| **TLDM** | ~1,500-2,500 (est.) | N/A | N/A | N/A | High |
| **THDM** | ~1,000-2,000 (est.) | N/A | N/A | 50+ | Moderate |
| **MEDM** | ~1,000-1,500 (est.) | N/A | N/A | N/A | Moderate |
| **UDM** | N/A | N/A | 10+ | N/A | Moderate (2010+) |
| **LSDM** | N/A | N/A | N/A | N/A | Lower |
| **Medicaid** | N/A | N/A | N/A | N/A | Niche |

### Analytic Schema Pairing

| Industry Model | Analytic Schema | Available | Known Schema Focus Areas |
|----------------|-----------------|-----------|--------------------------|
| FSDM | FSAS | ✅ Yes | Customer profitability, risk, regulatory, product P&L |
| HCDM | HCAS | ✅ Yes | Population health, cost of care, quality metrics |
| CLDM | CAS | ✅ Yes | Churn, revenue assurance, network performance |
| RDM | RAS | ✅ Yes | Merchandise assortment, customer engagement, emissions |
| MFGDM | MAS | ✅ Yes | Supply chain, plant performance, quality |
| TLDM | TLAS | ✅ Yes | Fleet, MRO, route optimization |
| THDM | THAS | ✅ Yes | Revenue management, loyalty, guest 360 |
| MEDM | MEAS | ✅ Likely | Audience, content, advertising |
| UDM | UAS | ✅ Likely | Smart grid, revenue protection, demand |
| LSDM | LSAS | ⚠️ Unknown | Clinical trials, sales force, regulatory |
| Medicaid | N/A | ⚠️ Unknown | Claims, eligibility, compliance |

---

## Feasibility for Building "xAIW" Modules

Based on what we've built (BAIW for banking, TAIW for trade), here's how each iDM maps to a potential workbench module:

### Tier 1: Highly Feasible (Rich public information + clear capability frameworks)

| Model | Workbench Name | Data Source | Capability Framework | Pakistan Relevance |
|-------|----------------|-------------|---------------------|--------------------|
| **HCDM** | HAIW (Healthcare AIW) | HCDM entities + HL7/OMOP/FHIR mapping | Healthcare Capability Framework (HCF) | NADRA health records, NHSRC, Sehat Sahulat, provincial health systems |
| **CLDM** | CAIW (Communications AIW) | CLDM entities + TMForum SID mapping | Telecom Capability Framework (TCF) | PTA, PTCL, Jazz/Telenor/Zong, CMPAK, USF |
| **RDM** | RAIW (Retail AIW) | RDM entities + GS1/retail standards | Retail Capability Framework (RCF) | FBR POS integration, e-commerce regulation, grocery/FMCG chains |

### Tier 2: Feasible with Research (Less public data but strong industry standards)

| Model | Workbench Name | Challenge | Pakistan Relevance |
|-------|----------------|-----------|-------------------|
| **MFGDM** | MAIW (Manufacturing AIW) | Limited public entity details; need ISA-95/OPC-UA mapping | SIFC, CPEC SEZs, textile manufacturing, automotive assembly |
| **TLDM** | LAIW (Logistics AIW) | MRO-heavy (airline focus); need broader logistics scope | PIA, ASF, NLC, CPEC logistics, Gwadar |
| **UDM** | UAIW (Utilities AIW) | Smart grid focus; need Pakistan power sector context | NEPRA, K-Electric, WAPDA, DISCOs, gas distribution |

### Tier 3: Possible but Niche

| Model | Notes |
|-------|-------|
| **THDM** | Pakistan tourism is small; more relevant for UAE/Saudi consulting |
| **MEDM** | Pakistan media market is fragmented; PEMRA context limited |
| **LSDM** | Pharmaceutical sector growing but DRAP data limited |
| **Medicaid** | US-specific; not applicable to Pakistan |

---

## What Teradata Does NOT Have (Our Differentiators)

Teradata provides the **data models and analytical schemas** but does NOT include:

1. **Capability Framework (like BVF/TCF)** — Teradata uses "BIOs" (Business Improvement Opportunities) for retail, but doesn't have a formal 100+ capability taxonomy per industry with maturity levels. This is what we created as BVF (banking) and TCF (trade). The retail EDWr's BIO assessment is the closest equivalent.

2. **Maturity Assessment (like BACR/TACR)** — No 600-800 question assessment instrument. Teradata's approach is consulting-led (professional services assess readiness), not tool-led. Our self-service BACR/TACR with 5-level descriptions per question is unique.

3. **Interactive Data Model Explorer** — Teradata delivers ERwin files (heavyweight desktop tool). Our web-based explorer with search, filter, capability linking, and dependency visualization is more accessible.

4. **Country-Specific Context** — Teradata models are generic/global. Our Pakistan enrichment (SBP, FBR, WeBOC, CPEC, etc.) adds localized value that Teradata doesn't provide.

5. **Gap Extension Modules** — Our custom analytical extensions (ABC Costing, AEO Analytics, etc.) bridge gaps between the integration model and real-world analytical needs not covered by the standard analytic schemas.

6. **Cross-Domain Dependency Visualization** — The force-directed graph and Sankey diagrams linking capabilities to data model elements are not part of any Teradata product.

---

## Strategic Implications for the Analytics Intelligence Suite

### Expansion Path

The current suite has 2 modules:
- **BAIW** → Based on Teradata FSDM (Banking)
- **TAIW** → Based on WCO Data Model (Trade/Customs — NOT a Teradata model)

Potential expansion to a **6-module suite** targeting Pakistan's top sectors:

```
Analytics Intelligence Suite
├── BAIW — Banking (FSDM v13)                 ✅ DONE
├── TAIW — Trade/Customs (WCO DM v4.2)        ✅ DONE
├── HAIW — Healthcare (HCDM + HL7/FHIR)       NEXT BEST
├── CAIW — Telecom (CLDM + TMForum)           HIGH VALUE
├── MAIW — Manufacturing (MFGDM + ISA-95)     CPEC ALIGNED
└── UAIW — Utilities (UDM + Smart Grid)       POWER SECTOR
```

Each new module follows the proven pattern:
1. Data Model (entities/elements/classes)
2. Capability Framework (60-120 capabilities)
3. Maturity Assessment (500-800 questions)
4. Star Schema (fact + dimensions)
5. Gap Extensions (4-5 modules)
6. Pakistan Context (sector-specific)
7. Enrichment Prompts (10-16 per module)

### Recommended Next Module: Healthcare (HAIW)

**Why Healthcare next:**
- HCDM is the second most documented Teradata iDM (~2,400 entities, 150 CDM concepts)
- Pakistan healthcare data modernization is a hot topic (Sehat Sahulat, NHSRC, HMIS)
- International standards are well-defined (HL7 FHIR, OMOP CDM, ICD-10)
- Pakistan's Digital Health Vision 2025 provides clear capability framework foundation
- World Bank and WHO are major funders of health data systems in Pakistan
- We can build the HCF (Healthcare Capability Framework) from WHO Digital Health Assessment toolkit + HCDM structure

---

## Key Findings Summary

1. **Teradata has 11 industry models** — not just FSDM. The portfolio is mature (25+ years of development, hundreds of customer implementations).

2. **Every iDM has an analytic schema counterpart** (iAS) — the two-layer architecture (3NF integration + star schema analytics) is their standard pattern, which validates our BAIW/TAIW approach.

3. **The Unified LDM Framework** shares building blocks across industries — Party, Event, Financial Management, Geography appear in every model. This means our workbench architecture should also share components (the module switcher pattern is correct).

4. **Entity counts vary dramatically** — from FSDM's ~3,917 down to MFGDM's 600+ data pieces. This affects how much content each workbench module can offer.

5. **Teradata models are proprietary and expensive** — delivered as licensed ERwin files. Our approach of building interactive web-based explorers from public standards (WCO DM, HL7, TMForum SID) sidesteps the licensing constraint while delivering similar or superior accessibility.

6. **The capability framework gap is our competitive advantage** — Teradata does NOT offer BVF/TCF-equivalent taxonomies. The retail BIO assessment is the closest thing, but it's not productized as a reusable framework. Our BACR/TACR maturity instruments are genuinely novel.

7. **Pakistan contextualization adds unique value** — No Teradata iDM has country-specific enrichment. Ours is the first to combine international data model standards with national regulatory/institutional context.
