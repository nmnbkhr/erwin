# Prompt 3: Banking BVF → FSDM Entity Mapper & Profitability Engine Integration

## Context

You are working with three artifacts from Teradata's Financial Services solutions:

1. **FSDM XSD Schema** (`/mnt/e/erwin/tds.xsd`) — 152,441 lines, 3,933 entities, 15,430 attributes, parsed by Prompt 2
2. **Banking Business Value Framework (BVF) Data Mappings** (`/mnt/e/erwin/Banking_Business_Value_Framework_Data_Mappings_1_2.xlsm`) — Teradata's IP mapping 112 banking capabilities to 113 data requirements across FSDM subject areas
3. **Prompt 2 Outputs** (`/mnt/e/erwin/fsdm_output/`) — Data dictionary, entity catalog, relationships, domain map, inheritance tree, profitability star schema, and calculation framework

The goal is to **bridge the Business Value Framework to the physical FSDM data model** and **enhance the Profitability Engine** with BVF-informed data lineage, coverage analysis, and implementation prioritization.

## Environment

```bash
conda activate erwin
pip install openpyxl lxml networkx
```

## Output Directory

All outputs go to: `/mnt/e/erwin/bvf_output/`

---

## Phase 1: Parse the BVF XLSM File

### 1.1 Extract Complete BVF Structure

Parse `Banking_Business_Value_Framework_Data_Mappings_1_2.xlsm` using `openpyxl` (read_only=True, data_only=True).

**Sheet: "Banking BVF Capability to Data"**
- Row 3 (cols 4+): FSDM Subject Areas header row
- Row 4 (cols 4+): Data Requirement names
- Rows 5-116: Capability rows
  - Col 0: BVF Area (only populated on first row of each area; forward-fill)
  - Col 1: BVF Sub-area (only populated on first row of each sub-area; forward-fill)
  - Col 3: Capability Name
  - Cols 4-116: Binary mapping (1 = this capability needs this data requirement)
  - Col 117: Total count of data requirements

**Three BVF Areas:**
1. **Marketing and Customer Experience** (Cols 4-42 in Reuse Matrix)
   - Customer Insight (10 capabilities)
   - Define & Deploy Business Rules (9 capabilities)
   - Delivery of Insight to Channels (10 capabilities)
   - Reporting & Continuous Improvement (10 capabilities)

2. **Risk Management & Regulation** (Cols 43-84)
   - Risk Insight (9 capabilities)
   - Modelling and Predictions (18 capabilities)
   - Execution & Delivery (9 capabilities)
   - Reporting & BI (6 capabilities)

3. **Finance & Performance Management** (Cols 85-115)
   - Financial Accounting (8 capabilities)
   - Financial Planning & Controlling (9 capabilities)
   - Treasury Mgmt & Insight (7 capabilities)
   - MIS & Reporting (7 capabilities)

**Sheet: "Banking BVF Data to Capability"**
- Row 4 (cols 4-115): All 112 capability names as column headers
- Rows 5+: Data requirement rows
  - Col 0: Data Requirement name
  - Col 1: FSDM Subject Area
  - Col 2: Subject Area Sort order
  - Col 3: Line Sort order
  - Cols 4-115: Binary mapping (1 = this data req is used by this capability, "OUTPUT" = capability produces this data)

**Sheet: "Banking BVF Data Reuse Matrix"**
- Rows 4+: Capability-to-capability reuse coefficients (0.0 to 1.0)
- Values represent proportion of shared data requirements between any two capabilities
- Diagonal = 1.0 (self-reference)

**Sheet: "Banking BVF Data Reuse Analysis"**
- Interactive analysis tool — extract the structure for parameterized queries

### 1.2 Data Structures to Build

```python
# Core structures
bvf_capabilities = [
    {
        "name": str,
        "bvf_area": str,  # "Marketing and Customer Experience" | "Risk Management & Regulation" | "Finance & Peformance Management"
        "sub_area": str,   # E.g. "Customer Insight", "Financial Planning & Controlling"
        "data_requirements": [str],   # List of data req names this capability needs
        "output_data": [str],         # Data reqs marked as "OUTPUT"
        "data_req_count": int
    }
]

bvf_data_requirements = [
    {
        "name": str,
        "fsdm_subject_area": str,     # E.g. "Party", "Agreement", "Event", "Product"
        "sort_order": int,
        "capability_count": int,       # How many capabilities use this
        "capabilities": [str],         # Which capabilities use this
        "output_of": [str]            # Capabilities that produce this as output
    }
]

# Reuse matrix: capability_name → {other_capability: reuse_coefficient}
bvf_reuse_matrix = {}
```

### 1.3 Output: `bvf_parsed_capabilities.json`

Full JSON dump of all 112 capabilities with their data requirement mappings.

### 1.4 Output: `bvf_parsed_data_requirements.json`

Full JSON dump of all 113 data requirements with capability mappings and FSDM subject areas.

### 1.5 Output: `bvf_reuse_matrix.json`

Full capability-to-capability reuse coefficient matrix.

---

## Phase 2: Map BVF Data Requirements → FSDM Entities

This is the critical bridge. Each BVF Data Requirement is a **business concept** that maps to one or more **physical FSDM entities** in the XSD.

### 2.1 Load Prompt 2 Outputs

Read the following from `/mnt/e/erwin/fsdm_output/`:
- `fsdm_entity_catalog.csv` — Entity names, domains, column counts, relationship counts
- `fsdm_data_dictionary.csv` — All attributes with types
- `fsdm_relationships.csv` — Parent-child relationships
- `fsdm_domain_map.json` — Entity-to-domain classification
- `fsdm_inheritance_tree.json` — Supertype/subtype hierarchies

### 2.2 Mapping Rules

Map each BVF Data Requirement to FSDM entities using these rules:

**Party Subject Area (18 data requirements):**

| BVF Data Requirement | Primary FSDM Entities | Notes |
|---|---|---|
| Single Customer View (Master Record) | PARTY, INDIVIDUAL, ORGANIZATION, HOUSEHOLD, PARTY_IDENTIFICATION, PARTY_RELATIONSHIP | Central hub — 289 relationships |
| KYC Data | PARTY_IDENTIFICATION, PARTY_DOCUMENT, PARTY_COMPLIANCE_STATUS, PARTY_RELATIONSHIP | Regulatory identity |
| Customer Demographics | INDIVIDUAL (age, gender, marital), ORGANIZATION (industry, size), GEOGRAPHICAL_AREA | Demographic attributes |
| Customer Attitudinal Data | PARTY_PREFERENCE, PARTY_SURVEY_RESPONSE, PARTY_SATISFACTION_MEASURE | Attitudinal/psychographic |
| Customer Segments | PARTY_SEGMENT, PARTY_SEGMENT_MEMBERSHIP, MARKET_SEGMENT | Classification |
| Customer Contact Preferences | PARTY_CONTACT_PREFERENCE, CONTACT_POINT, ELECTRONIC_ADDRESS, POSTAL_ADDRESS | Contact channels |
| Customer Marketing Preferences | PARTY_MARKETING_PREFERENCE, PARTY_CONSENT, MARKETING_PROGRAM_PARTICIPATION | Consent/opt-in |
| Customer Satisfaction Measurement | PARTY_SATISFACTION_MEASURE, SURVEY, SURVEY_RESPONSE | NPS/CSAT |
| Economic Forecast Data | ECONOMIC_INDEX, ECONOMIC_INDICATOR, MARKET_INDEX | Macro indicators |
| Legal Actions | LEGAL_ACTION, LEGAL_PROCEEDING, PARTY_LEGAL_ACTION_INVOLVEMENT | Litigation |
| External Prospect Data | PROSPECT, EXTERNAL_DATA_SOURCE, LEAD | Prospect lists |
| External Data - Social Media | SOCIAL_MEDIA_PROFILE, SOCIAL_MEDIA_INTERACTION, WEB_PAGE_VIEW | Social signals |
| External Data - Bureau data | CREDIT_BUREAU_REPORT, CREDIT_BUREAU_SCORE, EXTERNAL_CREDIT_ASSESSMENT | Bureau pulls |
| External Data - Credit Rating | CREDIT_RATING, EXTERNAL_CREDIT_ASSESSMENT, RATING_AGENCY | Agency ratings |
| External Economic Data | ECONOMIC_INDEX, PROPERTY_VALUATION, MARKET_INDEX | Property/salary data |
| Master & Ref Data - staff | INDIVIDUAL (staff subtype), ORGANIZATION_UNIT, EMPLOYEE | Internal HR |
| Sales Forecasts & KPIs | PERFORMANCE_MEASURE, TARGET, KEY_PERFORMANCE_INDICATOR | Sales targets |
| HR Performance Data | EMPLOYEE_PERFORMANCE, PERFORMANCE_REVIEW | Staff performance |

**Location Subject Area (2 data requirements):**

| BVF Data Requirement | Primary FSDM Entities |
|---|---|
| Customer Core Contact Details | CONTACT_POINT, POSTAL_ADDRESS, ELECTRONIC_ADDRESS, TELEPHONE_NUMBER |
| Master & Ref Data - geography | GEOGRAPHICAL_AREA, COUNTRY, REGION, CITY, POSTAL_CODE_AREA |

**Product Subject Area (7 data requirements):**

| BVF Data Requirement | Primary FSDM Entities |
|---|---|
| Master & Ref Data - product | PRODUCT, PRODUCT_TYPE, PRODUCT_FEATURE, PRODUCT_CATEGORY |
| Master & Ref Data - FTP rates | FUND_TRANSFER_PRICE, INTEREST_RATE, RATE_STRUCTURE | 
| Master & Ref Data - exchange rates | CURRENCY, EXCHANGE_RATE, CURRENCY_CONVERSION |
| Product Revenue, Cost & Margin | PRODUCT_PROFITABILITY, PRODUCT_COST, PRODUCT_REVENUE |
| Product NPV's | PRODUCT_VALUATION, NET_PRESENT_VALUE, CASHFLOW_PROJECTION |
| External Data - market rates | INTEREST_RATE, MARKET_INDEX, BENCHMARK_RATE |
| External Data - market prices | MARKET_PRICE, SECURITY_PRICE, COMMODITY_PRICE |

**Agreement Subject Area (18 data requirements):**

| BVF Data Requirement | Primary FSDM Entities |
|---|---|
| Account Holdings | AGREEMENT, FINANCIAL_AGREEMENT, INSURANCE_AGREEMENT, PARTY_AGREEMENT_ROLE |
| Account Detail | AGREEMENT, AGREEMENT_FEATURE, AGREEMENT_CONDITION |
| Account Status | AGREEMENT_STATUS, AGREEMENT_LIFECYCLE_EVENT |
| Terms & Conditions | AGREEMENT_TERM, AGREEMENT_CONDITION, INTEREST_RATE_STRUCTURE |
| Feature Usage | AGREEMENT_FEATURE_USAGE, FEATURE_UTILIZATION |
| Application Data | APPLICATION, AGREEMENT_APPLICATION, CREDIT_APPLICATION |
| Coverage (insurance) | COVERAGE, INSURANCE_COVERAGE, COVERAGE_AMOUNT |
| Account Balances | AGREEMENT_BALANCE, AGREEMENT_SUMMARY, LEDGER_BALANCE |
| Investment Value | INVESTMENT_POSITION, PORTFOLIO_VALUATION, ASSET_VALUATION |
| Trading Book Positions | TRADING_POSITION, MARKET_POSITION, TRADE_ORDER |
| Mark to Market | MARKET_VALUATION, FAIR_VALUE_ASSESSMENT |
| Cashflow Projections | CASHFLOW_PROJECTION, EXPECTED_CASHFLOW |
| Maturity & Repricing | AGREEMENT_MATURITY, REPRICING_SCHEDULE, MATURITY_PROFILE |
| Repayment Schedules | REPAYMENT_SCHEDULE, AMORTIZATION_SCHEDULE |
| Amortisation Schedules | AMORTIZATION_SCHEDULE, DEPRECIATION_SCHEDULE |
| Collateral | COLLATERAL_AGREEMENT, COLLATERAL_ASSET, SECURITY_AGREEMENT |
| Risk Exposures | AGREEMENT_RISK_METRIC, RISK_EXPOSURE, CREDIT_EXPOSURE |
| RWA & Capital | RISK_WEIGHTED_ASSET, CAPITAL_REQUIREMENT, REGULATORY_CAPITAL |
| Profitability Results | AGREEMENT_PROFITABILITY, CUSTOMER_PROFITABILITY |

**Event Subject Area (26 data requirements):**

| BVF Data Requirement | Primary FSDM Entities |
|---|---|
| Financial Transactions | MONETARY_TRANSACTION, FINANCIAL_TRANSACTION, PAYMENT |
| Fees & Commissions | FEE_TRANSACTION, COMMISSION, CHARGE |
| Interbank Payments | INTERBANK_PAYMENT, CLEARING_TRANSACTION, SETTLEMENT |
| Non-Financial Transactions | NON_MONETARY_TRANSACTION, SERVICE_EVENT |
| Service Usage | SERVICE_USAGE, CHANNEL_USAGE_EVENT |
| Complaint Data | COMPLAINT, COMPLAINT_EVENT, COMPLAINT_RESOLUTION |
| Offline Interactions (Branch/Call/Letters/SMS) | INTERACTION, BRANCH_INTERACTION, CALL_CENTER_INTERACTION, CORRESPONDENCE |
| Online Interactions (all channels) | WEB_SESSION, WEB_PAGE_VIEW, DIGITAL_INTERACTION, EMAIL_INTERACTION |
| Case History | CASE, FRAUD_CASE, AML_CASE, COMPLAINT_CASE |
| Claims | CLAIM, INSURANCE_CLAIM, CLAIM_EVENT |
| Defaults & Limit Breaches | DEFAULT_EVENT, LIMIT_BREACH, DELINQUENCY_EVENT |
| Closed Loop Outcomes | CAMPAIGN_RESPONSE, CHANNEL_RESPONSE, OUTCOME_EVENT |
| Corporate Actions | CORPORATE_ACTION, DIVIDEND_EVENT |
| Internal Process Activity | PROCESS_EVENT, WORKFLOW_EVENT |
| Master & Ref Data - merchant | MERCHANT, MERCHANT_CATEGORY, TRANSACTION_TYPE |

**Other Subject Areas:**

| BVF Data Requirement | FSDM Subject Area | Primary FSDM Entities |
|---|---|---|
| Physical Assets | Party Asset | PARTY_ASSET, REAL_ESTATE_ASSET, VEHICLE_ASSET |
| Physical Asset Valuations | Party Asset | ASSET_VALUATION, PROPERTY_VALUATION |
| Org Hierarchy | Internal Organisation | ORGANIZATION_UNIT, ORGANIZATION_STRUCTURE, REPORTING_LINE |
| Operational Metrics | Internal Organisation | OPERATIONAL_METRIC, SERVICE_LEVEL_MEASURE |
| Offer Catalogue | Campaign | OFFER, OFFER_COMPONENT, PROMOTION |
| Campaign Data | Campaign | CAMPAIGN, MARKETING_CAMPAIGN, CAMPAIGN_WAVE |
| Channel Data | Channel | CHANNEL_TYPE, CHANNEL_INSTANCE, SERVICE_CHANNEL |
| GL | Finance | GENERAL_LEDGER, GL_ACCOUNT, GL_TRANSACTION |
| ERP | Finance | ERP_TRANSACTION, EXPENSE, COST_CENTER |
| Budgets & Forecasts | Finance | BUDGET, FORECAST, PLAN |
| Model Metadata | Analytical Model | ANALYTICAL_MODEL, MODEL_VERSION, MODEL_METRIC |
| Risk Scenario Results | Analytical Model | STRESS_TEST, SCENARIO, STRESS_TEST_RESULT |
| Documents | Cross Subject | DOCUMENT, STRUCTURED_DOCUMENT, IMAGE_DOCUMENT |
| Watch Lists | Cross Subject | WATCH_LIST, WATCH_LIST_ENTRY, SANCTION_LIST |
| Compliance Approvals | Cross Subject | COMPLIANCE_APPROVAL, REGULATORY_APPROVAL |

### 2.3 Implementation

For each BVF Data Requirement:

1. **Exact match**: Search `fsdm_entity_catalog.csv` for entities whose names contain keywords from the data requirement
2. **Domain match**: Filter entities by the matching FSDM domain from `fsdm_domain_map.json`
3. **Relationship expansion**: For matched entities, include their directly related entities from `fsdm_relationships.csv`
4. **Inheritance expansion**: For matched entities, include their subtypes from `fsdm_inheritance_tree.json`
5. **Confidence scoring**: Rate each mapping as HIGH (exact name match), MEDIUM (domain + keyword match), or LOW (relationship-based inference)

### 2.4 Output: `bvf_to_fsdm_entity_map.csv`

```
BVF_Data_Requirement, FSDM_Subject_Area, FSDM_Entity, Match_Confidence, Match_Method, Entity_Column_Count, Entity_Relationship_Count
```

### 2.5 Output: `bvf_to_fsdm_entity_map.json`

Structured JSON with full mapping details including entity attributes and relationships.

---

## Phase 3: Capability Data Dependency Graph

### 3.1 Build Capability → Entity Graph

For each of the 112 BVF Capabilities:
1. Get its data requirements (from Phase 1)
2. Resolve each data requirement to FSDM entities (from Phase 2)
3. Build a complete **entity dependency set** for each capability

### 3.2 Profitability-Critical Capabilities

Flag these capabilities as **profitability-critical** (directly feed the Profitability Engine from Prompt 2):

**Finance & Performance Management:**
- Financial Accounting / Accounting Hub
- Functional Profit & Loss Statement (P&L)
- Activity Based Costing
- Profitability Modelling
- Profitability Analytics and Optimisation
- Performance Management and KPIs
- Pricing Analysis & Optimisation
- Funds Transfer Pricing
- Asset & Liability Management
- Capital Planning and Management

**Risk (profit-impacting):**
- Capital Management (Planning and Allocation)
- Capital Consumption
- Risk Weighted Assets and Regulatory Capital
- Credit Risk Based Pricing Model

**Marketing (revenue-driving):**
- Customer Value
- Customer Segmentation
- Future / Lifetime Value

### 3.3 Output: `capability_entity_dependencies.csv`

```
BVF_Area, Sub_Area, Capability, FSDM_Entity, Is_Profitability_Critical, Data_Requirement_Source
```

### 3.4 Output: `capability_entity_summary.csv`

```
Capability, BVF_Area, Total_FSDM_Entities, Total_Attributes, Profitability_Critical, Data_Reuse_Score_Avg
```

---

## Phase 4: Profitability Engine Enhancement

### 4.1 Map Star Schema to BVF Data Requirements

Using the star schema from Prompt 2 (`profitability_star_schema.sql`), map each fact/dimension table to:
- Which BVF Data Requirements feed it
- Which BVF Capabilities consume/produce it
- Data coverage gaps (BVF data reqs with no FSDM entity match)

### 4.2 Output: `profitability_bvf_lineage.csv`

```
Star_Schema_Table, Table_Type (FACT/DIM), Column_Name, Source_FSDM_Entity, Source_BVF_Data_Requirement, Source_BVF_Capabilities, Coverage_Status
```

Map the profitability star schema tables:

**FACT_CUSTOMER_PROFITABILITY measures:**
- Interest_Income_Amt ← MONETARY_TRANSACTION + AGREEMENT_SUMMARY ← "Financial Transactions" + "Account Balances" ← Financial Accounting, P&L, Profitability Modelling
- Fee_Income_Amt ← FEE_TRANSACTION ← "Account Fees, Commissions & Charges" ← Financial Accounting, P&L
- Fund_Transfer_Pricing_Amt ← FUND_TRANSFER_PRICE ← "Master & Ref Data - FTP rates" ← Funds Transfer Pricing
- Direct_Cost_Amt ← GL_TRANSACTION + CHANNEL_USAGE_EVENT ← "Finance Systems - General Ledger" + "Service Usage" ← Activity Based Costing
- Indirect_Cost_Amt ← COST_CENTER + ORGANIZATION_UNIT ← "Finance Systems - ERP" + "Org Hierarchy" ← Activity Based Costing, GL Analytics
- Provision_Cost_Amt ← AGREEMENT_RISK_METRIC ← "Provisions, Losses & Writeoffs" ← Credit Risk Expected Loss Model
- Risk_Weighted_Asset_Amt ← RISK_WEIGHTED_ASSET ← "Risk Weighted Assets & Capital Results" ← RWA and Regulatory Capital
- Net_Profit_Amt ← Calculated ← P&L, Profitability Modelling
- Return_On_Equity_Pct ← Calculated ← Capital Management, Profitability Analytics
- Cost_To_Income_Ratio_Pct ← Calculated ← Performance Management and KPIs

**DIM_CUSTOMER:**
- From PARTY/INDIVIDUAL/ORGANIZATION ← "Single Customer View" + "Customer Demographics" + "Customer Segments"
- Fed by: Customer Insight, Customer Segmentation, Single Customer View (Risk)

**DIM_PRODUCT:**
- From PRODUCT hierarchy ← "Master & Ref Data - product" + "Product Revenue, Cost & Margin"
- Fed by: Product analytics, Pricing Analysis

**DIM_BRANCH:**
- From ORGANIZATION_UNIT ← "Master & Ref Data - organisation hierarchy"
- Fed by: Performance Management, Operational Dashboard

**DIM_BUSINESS_SEGMENT:**
- From ORGANIZATION_BUSINESS_TYPE ← "Master & Ref Data - organisation hierarchy"
- Fed by: Performance Management, Profitability Analytics

**DIM_CHANNEL:**
- From CHANNEL_TYPE/CHANNEL_INSTANCE ← "Master & Ref Data - Channel"
- Fed by: Channel Support, Omni Channel integration

**DIM_TIME:**
- From TIME_PERIOD_TYPE ← Standard calendar dimension
- Used across all capabilities

**DIM_GEOGRAPHY:**
- From GEOGRAPHICAL_AREA ← "Master & Ref Data - geography / location"
- Fed by: Location-dependent analytics

### 4.3 Implementation Priority Matrix

Score each BVF Data Requirement for profitability engine implementation priority:

```python
priority_score = (
    profitability_capability_count * 3.0 +   # How many profit capabilities use this
    total_capability_count * 0.5 +            # Overall reuse across all capabilities
    avg_reuse_coefficient * 2.0 +             # Data sharing across capabilities
    star_schema_coverage * 4.0                # Direct mapping to star schema (0 or 1)
)
```

Where:
- `profitability_capability_count` = count of profitability-critical capabilities using this data req
- `total_capability_count` = total capabilities using this data req  
- `avg_reuse_coefficient` = average reuse matrix score for capabilities using this data req
- `star_schema_coverage` = 1 if this data req maps to a star schema table, 0 otherwise

### 4.4 Output: `bvf_implementation_priority.csv`

```
Rank, BVF_Data_Requirement, FSDM_Subject_Area, Priority_Score, Profitability_Cap_Count, Total_Cap_Count, Avg_Reuse_Coeff, Star_Schema_Coverage, FSDM_Entity_Count, Implementation_Tier
```

**Implementation Tiers:**
- **Tier 1 (Must Have)**: Top 20 data requirements — essential for profitability engine
- **Tier 2 (Should Have)**: Next 30 — enhance profitability + enable risk/marketing capabilities
- **Tier 3 (Nice to Have)**: Next 30 — full BVF coverage
- **Tier 4 (Future)**: Remaining — specialized capabilities

### 4.5 Output: `profitability_data_coverage.json`

```json
{
    "star_schema_tables": {
        "FACT_CUSTOMER_PROFITABILITY": {
            "columns": {
                "Interest_Income_Amt": {
                    "fsdm_entities": [...],
                    "bvf_data_requirements": [...],
                    "bvf_capabilities": [...],
                    "coverage_status": "FULL|PARTIAL|GAP",
                    "implementation_tier": 1
                }
            }
        }
    },
    "coverage_summary": {
        "total_measures": int,
        "fully_covered": int,
        "partially_covered": int,
        "gaps": int
    }
}
```

---

## Phase 5: Visualizations

### 5.1 Output: `bvf_capability_heatmap.html`

Interactive HTML heatmap (use D3.js or plain JS + CSS Grid):
- X-axis: 113 BVF Data Requirements grouped by FSDM Subject Area
- Y-axis: 112 BVF Capabilities grouped by BVF Area/Sub-area
- Cell color: Blue for standard mapping, Red for profitability-critical, Green for OUTPUT
- Hover: Show capability name, data requirement, FSDM entities
- Sidebar filter: Filter by BVF Area, FSDM Subject Area, Profitability-critical only

### 5.2 Output: `bvf_fsdm_sankey.html`

Sankey diagram (D3.js) showing flow:
```
BVF Areas → BVF Sub-areas → BVF Capabilities → BVF Data Requirements → FSDM Subject Areas → FSDM Entities (top 50)
```
- Width proportional to number of mappings
- Color-coded by BVF Area
- Interactive: click to drill down

### 5.3 Output: `profitability_lineage.html`

Interactive lineage diagram showing:
```
Source Systems → FSDM Entities → BVF Data Requirements → Profitability Star Schema Tables → Profitability Measures
```
- Focus on profitability-critical path
- Highlight coverage gaps in red
- Click any node to see details

### 5.4 Output: `bvf_reuse_network.html`

Network graph (vis.js or D3 force) of capability-to-capability reuse:
- Nodes = 112 capabilities, sized by data requirement count
- Edges = reuse coefficients > 0.5 (threshold adjustable via slider)
- Color by BVF Area
- Cluster detection to identify natural capability groups
- Profitability-critical nodes highlighted with border

### 5.5 Output: `implementation_roadmap.html`

Visual implementation roadmap:
- 4 tiers displayed as phases on a timeline
- Each tier shows data requirements, entity counts, capability unlocks
- Running total of capabilities enabled as data requirements are implemented
- Cumulative coverage percentage chart

---

## Phase 6: Summary Reports

### 6.1 Output: `bvf_fsdm_mapping_report.md`

Comprehensive markdown report:

1. **Executive Summary**: BVF scope, FSDM coverage, key findings
2. **BVF Structure Overview**: 3 areas, 12 sub-areas, 112 capabilities, 113 data requirements
3. **FSDM Coverage Analysis**: 
   - How many BVF data requirements map to FSDM entities
   - Coverage by FSDM domain (Party, Agreement, Event, Product, etc.)
   - Gaps: BVF data requirements with no FSDM entity match
4. **Profitability Engine Readiness**:
   - Star schema coverage from BVF perspective
   - Data requirements needed for each profitability measure
   - Critical path analysis
5. **Data Reuse Analysis**:
   - Most-reused data requirements (highest capability coverage)
   - Capability clusters with high data overlap
   - ROI argument: implementing top 20 data reqs enables X% of all capabilities
6. **Implementation Roadmap**:
   - Tier 1-4 breakdown with entity counts and capability unlocks
   - Recommended implementation sequence
   - Dependencies between tiers
7. **Appendices**:
   - Full BVF-to-FSDM entity mapping table
   - Profitability measure lineage table
   - Capability dependency matrix

### 6.2 Output: `bvf_statistics.json`

```json
{
    "bvf_summary": {
        "total_capabilities": 112,
        "total_data_requirements": 113,
        "bvf_areas": 3,
        "sub_areas": 12,
        "total_mappings": int,
        "avg_data_reqs_per_capability": float,
        "avg_capabilities_per_data_req": float
    },
    "fsdm_coverage": {
        "data_reqs_with_fsdm_match": int,
        "data_reqs_without_match": int,
        "total_fsdm_entities_mapped": int,
        "entities_by_domain": {},
        "coverage_by_subject_area": {}
    },
    "profitability": {
        "profitability_critical_capabilities": int,
        "profitability_data_requirements": int,
        "star_schema_coverage_pct": float,
        "tier1_entity_count": int,
        "tier1_capability_unlock_count": int,
        "top20_data_reqs_capability_coverage_pct": float
    },
    "reuse_analysis": {
        "avg_reuse_coefficient": float,
        "max_reuse_pair": [str, str, float],
        "capability_clusters": int,
        "most_reused_data_req": str,
        "most_reused_data_req_capability_count": int
    }
}
```

---

## Technical Notes

1. **Memory Efficiency**: The XSD is 152K lines — use iterparse or load the Prompt 2 CSV/JSON outputs instead of re-parsing the XSD
2. **Entity Name Matching**: FSDM entity names use UPPER_SNAKE_CASE. BVF data requirement names are natural language. Use fuzzy matching with keyword extraction
3. **Forward-Fill BVF Areas**: In the XLSM, BVF Area and Sub-area columns are only populated on the first row of each group — forward-fill these values
4. **Handle "OUTPUT" markers**: Some cells in Data-to-Capability sheet contain "OUTPUT" instead of "1" — these indicate the capability produces this data (not just consumes it). Track direction separately
5. **Reuse Matrix is symmetric**: Only need to read upper triangle
6. **Progress reporting**: Print progress bars/counters — the mapping phase involves 113 data reqs × 3,933 entities = ~445K comparisons
7. **If Prompt 2 outputs don't exist yet**: Fall back to parsing the XSD directly using the entity extraction logic from Prompt 2

---

## Execution Summary

Run this after Prompt 2 has completed:

```bash
cd /mnt/e/erwin
conda activate erwin
claude < bvf-fsdm-profitability-mapper-prompt.md
```

**Expected outputs (14 files):**

| # | File | Description |
|---|---|---|
| 1 | `bvf_parsed_capabilities.json` | All 112 capabilities with data req mappings |
| 2 | `bvf_parsed_data_requirements.json` | All 113 data reqs with capability mappings |
| 3 | `bvf_reuse_matrix.json` | Capability-to-capability reuse coefficients |
| 4 | `bvf_to_fsdm_entity_map.csv` | BVF data req → FSDM entity mapping |
| 5 | `bvf_to_fsdm_entity_map.json` | Same mapping in structured JSON |
| 6 | `capability_entity_dependencies.csv` | Each capability's FSDM entity footprint |
| 7 | `capability_entity_summary.csv` | Capability summary with entity counts |
| 8 | `profitability_bvf_lineage.csv` | Star schema ← FSDM ← BVF lineage |
| 9 | `bvf_implementation_priority.csv` | Ranked data reqs with implementation tiers |
| 10 | `profitability_data_coverage.json` | Star schema coverage analysis |
| 11 | `bvf_capability_heatmap.html` | Interactive capability × data heatmap |
| 12 | `bvf_fsdm_sankey.html` | BVF → FSDM Sankey flow diagram |
| 13 | `profitability_lineage.html` | Profitability measure lineage visual |
| 14 | `bvf_reuse_network.html` | Capability reuse network graph |
| 15 | `implementation_roadmap.html` | Tiered implementation roadmap |
| 16 | `bvf_fsdm_mapping_report.md` | Comprehensive analysis report |
| 17 | `bvf_statistics.json` | Summary statistics |
