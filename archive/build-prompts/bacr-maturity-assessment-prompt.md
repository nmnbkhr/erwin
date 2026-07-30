# Prompt 4: BACR Maturity Assessment → BVF/FSDM Profitability Engine Integration

## Context

You are working with Teradata's **Business & Analytics Capability Review (BACR)** interview master — a comprehensive maturity assessment framework with 793+ questions scored on a 5-level maturity scale (Emerging → Leading). This integrates with outputs from Prompts 1-3:

**Input Files:**
1. **BACR Interview Master** (`/mnt/e/erwin/BACR_-_INTERVIEW_MASTER_-_DA004462.xlsm`) — 793 questions, 8 categories, 5-level maturity model
2. **BVF Data Mappings** (`/mnt/e/erwin/Banking_Business_Value_Framework_Data_Mappings_1_2.xlsm`) — 112 capabilities, 113 data requirements
3. **FSDM XSD Schema** (`/mnt/e/erwin/tds.xsd`) — 3,933 entities, 15,430 attributes

**Prompt 2 Outputs** (`/mnt/e/erwin/fsdm_output/`):
- `fsdm_entity_catalog.csv`, `fsdm_data_dictionary.csv`, `fsdm_relationships.csv`
- `fsdm_domain_map.json`, `fsdm_inheritance_tree.json`
- `profitability_star_schema.sql`, `profitability_calc_framework.md`

**Prompt 3 Outputs** (`/mnt/e/erwin/bvf_output/`):
- `bvf_parsed_capabilities.json`, `bvf_parsed_data_requirements.json`
- `bvf_to_fsdm_entity_map.csv`, `bvf_to_fsdm_entity_map.json`
- `capability_entity_dependencies.csv`, `capability_entity_summary.csv`
- `profitability_bvf_lineage.csv`, `bvf_implementation_priority.csv`
- `profitability_data_coverage.json`, `bvf_statistics.json`

## Environment

```bash
conda activate erwin
pip install openpyxl lxml networkx pandas
```

## Output Directory

All outputs go to: `/mnt/e/erwin/bacr_output/`

---

## Phase 1: Parse BACR Interview Master

### 1.1 Parse "All Questions" Sheet

Open `BACR_-_INTERVIEW_MASTER_-_DA004462.xlsm` using `openpyxl` (read_only=True, data_only=True).

**Sheet: "All Questions"** — 943 rows

**Header structure:**
- Row 4: Group headers — `Current State` (col 4), `Desired State` (col 5), `State Descriptors` (col 7), `Interviewee Role Filters` (col 13), `Industry Filter` (col 25), `Bus.Function Filter` (col 33)
- Row 5: Column headers with specific names

**Column mapping:**
```python
COL_CATEGORY = 0        # Business, Information, Systems, Agility, etc.
COL_SECTION = 1          # Summary, Strategy, Roadmap, sub-topics
COL_QUESTION = 2         # Full question text
COL_CURRENT_STATE = 4    # Current state score (populated during interview)
COL_DESIRED_STATE = 5    # Desired state score (populated during interview)

# Maturity descriptors (5 levels)
COL_EMERGING = 7         # Level 1
COL_DEVELOPING = 8       # Level 2
COL_PRACTICING = 9       # Level 3
COL_INNOVATING = 10      # Level 4
COL_LEADING = 11         # Level 5

# Role filters (y = applicable to this role)
ROLE_COLS = {
    13: "Business Sponsor",
    14: "Business Analyst",
    15: "Data Analyst/Modeller/Scientist",
    16: "Architect",
    17: "Data Engineer",
    18: "IT Management",
    19: "IT Operations",
    20: "Program & Project Management",
    21: "Power User",
    22: "End User",
    23: "C-Level"
}

# Industry filters
INDUSTRY_COLS = {
    25: "Retail",
    26: "Financial",
    27: "Communications",
    28: "Manufacturing",
    29: "Travel & Transport",
    30: "Energy & Natural Resources",
    31: "Healthcare"
}

# Business function filters
BUS_FUNC_COLS = {
    33: "Customer",
    34: "Product",
    35: "Financial",
    36: "Operations",
    37: "Supply Chain",
    38: "Analytics Operations",
    39: "Asset Lifecycle Mgmt",
    40: "Human Resources",
    41: "Marketing",
    42: "Risks and Threats"
}
```

**Parsing rules:**
1. Data rows start at row 7 (index 6)
2. Category (col 0) only populated on first row of each category — forward-fill
3. Section (col 1) only populated on first row of each section — forward-fill
4. Skip separator rows where col 2 contains category headers like "Business Category", "Data Category", "Information Category - Data Strategy" etc.
5. Filter columns contain "y" or "1" for applicable items
6. Maturity descriptors may be empty for some questions ("TBA" questions)

### 1.2 Data Structure

```python
bacr_questions = [
    {
        "id": int,                    # Sequential question ID
        "category": str,              # Business, Information, Systems, Agility, Culture, Governance, Applications, Outcomes
        "section": str,               # Sub-section within category
        "question": str,              # Full question text
        "maturity_descriptors": {
            "1_emerging": str,
            "2_developing": str,
            "3_practicing": str,
            "4_innovating": str,
            "5_leading": str
        },
        "applicable_roles": [str],    # List of job roles this question applies to
        "applicable_industries": [str],  # Industries (filter for "Financial")
        "applicable_bus_functions": [str],  # Business functions
        "is_financial_industry": bool,   # Quick flag
        "is_tba": bool                   # True if question text contains "TBA" or maturity descriptors missing
    }
]
```

### 1.3 Parse "Control Sheet" — Review Types

Extract the review type configurations:

```python
# Row 29 onwards in Control Sheet
REVIEW_TYPES = {
    "Big Data Capability Review": col_6,
    "Data Warehouse Maturity Review": col_7,
    "Ecosystem Architecture Review": col_8,
    "AI and Machine Learning Review": col_9,
    "Custom Review": col_10
}
```

Each review type specifies which Category/Section combinations to Include/Exclude. Parse this mapping to understand which questions belong to which review type.

### 1.4 Outputs

**`bacr_all_questions.json`** — Full parsed question bank (793+ questions)

**`bacr_all_questions.csv`** — Flat CSV with columns:
```
Question_ID, Category, Section, Question_Text, Emerging, Developing, Practicing, Innovating, Leading, Roles, Industries, Business_Functions, Is_Financial, Is_TBA, Review_Types
```

**`bacr_category_summary.json`**:
```json
{
    "categories": {
        "Outcomes": {
            "question_count": 221,
            "sections": ["Analytic Capabilities"],
            "financial_question_count": 69,
            "business_functions": {"Customer": 48, "Financial": 69, "Operations": 86, ...}
        },
        "Information": {
            "question_count": 114,
            "sections": ["Summary", "Strategy", "Architecture", "Master Data Management", ...],
            ...
        }
        // ... all 8 categories
    },
    "totals": {
        "total_questions": int,
        "financial_industry_questions": int,
        "tba_questions": int,
        "questions_by_review_type": {}
    }
}
```

---

## Phase 2: Map BACR Outcomes → BVF Capabilities

### 2.1 Matching Logic

The 221 BACR Outcome questions map to the 112 BVF capabilities. The mapping is based on:

**Direct name matching** — Many BACR Outcomes use identical or very similar names to BVF capabilities:

| BACR Outcome Question | BVF Capability |
|---|---|
| Customer Value and Profitability | Customer Value |
| Customer Segmentation | Customer Segmentation |
| Event Analytics | Event Detection |
| Contact Optimization | Scope of Contact / Customer Contact Policy |
| Response Optimization | Omni Channel Campaign Management |
| Cross Channel Customer Experience | Channel Coverage |
| Contextual Decisioning | Contextual Decisioning |
| Next Best Action Arbitration | Next Best Action Arbitration |
| Personalization | Personalisation |
| Multi-Step Campaigns | Multi-Step Dialogue |
| Campaign Effectiveness | Campaign ROI Reporting by Channel |
| Marketing Attribution | Marketing Attribution MI across all channels |
| Transaction Classification | Transaction Classification |
| Profitability Analytics and Optimisation | Profitability Analytics and Optimisation |
| Activity-Based Costing | Activity Based Costing |
| Future / Lifetime Value | Future / Lifetime Value |
| Performance Management and KPIs | Performance Management and KPIs |
| Funds Transfer Pricing | Funds Transfer Pricing |
| Asset and Liability Management | Asset & Liability Management |
| Capital Planning and Management | Capital Planning and Management |
| Cashflow Generation | Cashflow Generation |
| Liquidity Management | Liquidity Management |
| FX and Trading Book Management | FX & Trading Book Management |
| Interest Rate Management | Interest Rate Management |
| Statutory Financial Reporting | Statutory Financial Reporting |
| Regulatory and Compliance Reporting | Regulatory & Compliance Reporting |
| Sales Reporting | Sales Reporting |
| Performance Reporting | Performance Reporting |
| Exception Reporting | Exception Reporting |
| Executive Dashboards | Executive Dashboards |
| Financial Consolidation | Financial Consolidation |
| Functional Profit and Loss Statement | Functional Profit & Loss Statement (P&L) |
| Financial Budgetting, Planning and Forecasting | Financial Budgeting, Planning & Forecasting |
| Fair Value and Hedge Accounting | Fair Value & Hedge Accounting |
| Tax Management and Optimisation | Tax Management & Optimisation |
| Reconciliation, Validation and Adjustment | Reconciliation, Validation & Adjustments |
| Risk Scenario and Stress Test | Risk Scenario & Stress Testing Results (Analytical Model) |
| Credit Risk Appetite | Risk Appetite |
| Risk-based pricing | Credit Risk Based Pricing Model |
| Credit Portfolio Management | Active Portfolio Management |
| Collections and Recoveries Optimization | Collection Strategy Model |
| Risk Propensity and Modelling | Credit Risk Scoring / Fraud Likelihood Model |
| Risk Severity Modelling | Credit Risk Expected Loss Model |
| Capital Calculation and Management | Capital Management (Planning and Allocation) / Capital Consumption |
| Risk/Reward Strategy Optimization | Strategy (Rules) Performance MI |
| Model Performance Reporting | Model Performance Analytics |
| Risk Model Champion Analysis | A/B and Test and Learn Deployment |
| Business Process Analytics and Optimisation | Business Process Analytics & Optimisation |

**Keyword-based matching** for remaining questions:
1. Extract key phrases from BACR question text
2. Compare against BVF capability names using fuzzy string matching (difflib.SequenceMatcher, threshold > 0.6)
3. Also match on business function alignment (e.g., BACR "Financial" function → BVF "Finance & Performance Management" area)

**For BACR questions with no BVF match:**
- Mark as "BACR-only" — these represent capabilities not covered by BVF
- Particularly: Supply Chain, Asset Lifecycle, and some Operations questions have no BVF equivalent

### 2.2 Implementation

```python
import difflib

def match_bacr_to_bvf(bacr_question, bvf_capabilities):
    """Match a BACR Outcome question to BVF capability."""
    matches = []
    q_text = bacr_question['question'].lower()
    
    for cap in bvf_capabilities:
        cap_name = cap['name'].lower()
        
        # 1. Direct name similarity
        ratio = difflib.SequenceMatcher(None, q_text[:len(cap_name)*2], cap_name).ratio()
        
        # 2. Keyword overlap
        q_keywords = set(q_text.split()) - STOPWORDS
        cap_keywords = set(cap_name.split()) - STOPWORDS
        keyword_overlap = len(q_keywords & cap_keywords) / max(len(cap_keywords), 1)
        
        # 3. Business function alignment
        func_score = business_function_alignment(bacr_question, cap)
        
        # Combined score
        score = (ratio * 0.4) + (keyword_overlap * 0.4) + (func_score * 0.2)
        
        if score > 0.3:
            matches.append({
                'bvf_capability': cap['name'],
                'bvf_area': cap['bvf_area'],
                'match_score': score,
                'match_method': 'name_similarity' if ratio > 0.5 else 'keyword_overlap'
            })
    
    return sorted(matches, key=lambda x: x['match_score'], reverse=True)[:3]
```

### 2.3 Output: `bacr_to_bvf_mapping.csv`

```
BACR_Question_ID, BACR_Category, BACR_Section, BACR_Question_Short, BVF_Capability, BVF_Area, BVF_Sub_Area, Match_Score, Match_Method, Is_Profitability_Critical, Business_Functions
```

### 2.4 Output: `bacr_to_bvf_mapping.json`

Structured JSON with full question text, maturity descriptors, and all matched BVF capabilities.

---

## Phase 3: Map BACR Information → FSDM Data Domains

### 3.1 Information Category Mapping

The 114 BACR Information questions assess data management maturity. Map each section to FSDM domains:

| BACR Information Section | FSDM Domains | Data Management Aspect |
|---|---|---|
| Summary | All domains | Overall data accessibility |
| Strategy | All domains | Data strategy maturity |
| Roadmap | All domains | Implementation planning |
| Architecture | All domains | Data model / integration architecture |
| Data Centricity | Party, Agreement | Customer-centric data design |
| Data Coverage | All domains | Completeness of data sourcing |
| Data Organisation | All domains | Logical data organization |
| Data Quality | All domains | Data quality management |
| Data Tiers | All domains | Data tiering and lifecycle |
| Data Usage Zones | All domains | Analytics sandboxes, labs, production |
| Master Data Management | Party, Product, Agreement, Location | MDM maturity |
| Metadata Management | All domains | Metadata catalog, lineage |
| Security and Privacy | Party (PII), Agreement (financial) | Data protection |

### 3.2 Mapping to FSDM Entity Groups

For each Information question, determine which FSDM entity groups are impacted:

```python
INFORMATION_TO_FSDM = {
    "Master Data Management": {
        "primary_fsdm_domains": ["Party", "Product", "Location", "Agreement"],
        "key_entities": ["PARTY", "INDIVIDUAL", "ORGANIZATION", "PRODUCT", "GEOGRAPHICAL_AREA", "CURRENCY"],
        "bvf_data_requirements": [
            "Single Customer View (Master Record)",
            "Master & Reference Data - product",
            "Master & Reference Data - geography / location",
            "Master & Reference Data - staff / colleague",
            "Master & Reference Data - Channel",
            "Master & Reference Data - Campaign",
            "Master & Reference Data - FTP rates",
            "Master & Reference Data - exchange rates",
            "Master & Reference Data - merchant / transaction",
            "Master & Reference Data - organisation hierarchy",
            "Master & Reference Data - Risk Policy Rules"
        ]
    },
    "Data Quality": {
        "primary_fsdm_domains": ["Party", "Agreement", "Event"],
        "impacts": "All entities - quality assessment across entire model",
        "profitability_impact": "Data quality directly affects profitability calculation accuracy"
    },
    "Architecture": {
        "primary_fsdm_domains": ["All"],
        "key_entities": ["All 3,933 entities"],
        "profitability_impact": "Architecture maturity determines if FSDM can be deployed as integrated model vs. siloed"
    },
    "Data Coverage": {
        "primary_fsdm_domains": ["Party", "Agreement", "Event", "Product"],
        "bvf_data_requirements": "All 113 data requirements - coverage assessment",
        "profitability_impact": "Gaps in data coverage = gaps in profitability measures"
    },
    "Security and Privacy": {
        "primary_fsdm_domains": ["Party"],
        "key_entities": ["PARTY", "INDIVIDUAL", "PARTY_IDENTIFICATION", "CONTACT_POINT"],
        "profitability_impact": "Privacy constraints may limit customer-level profitability granularity"
    }
}
```

### 3.3 Output: `bacr_information_to_fsdm.csv`

```
BACR_Question_ID, BACR_Section, Question_Short, FSDM_Domains, FSDM_Key_Entities, BVF_Data_Requirements, Profitability_Impact, Maturity_Level_Required_For_Profitability
```

### 3.4 Output: `bacr_information_to_fsdm.json`

---

## Phase 4: Build Maturity-Informed Implementation Priority

### 4.1 Maturity Assessment Template

Generate a **UBL-specific assessment template** pre-filtered for Financial industry:

```python
ubl_assessment = {
    "bank_name": "United Bank Limited",
    "industry": "Financial",
    "review_type": "Data Warehouse Maturity Review",
    "assessment_date": None,  # To be filled
    "assessor": None,
    
    "categories": {
        "Outcomes": {
            "questions": [
                {
                    "id": int,
                    "question": str,
                    "section": str,
                    "current_state": None,     # 1-5, to be filled during assessment
                    "desired_state": None,     # 1-5, to be filled during assessment
                    "maturity_gap": None,      # desired - current, calculated
                    "maturity_descriptors": {...},
                    "bvf_capability": str,     # Mapped BVF capability
                    "is_profitability_critical": bool,
                    "fsdm_entities": [str],    # Via BVF → FSDM mapping
                    "business_functions": [str]
                }
            ]
        },
        "Information": { ... },
        // ... all categories
    }
}
```

### 4.2 Default Maturity Scores for Estimation

Since actual UBL assessment hasn't been done, create **estimated default scores** based on what we know about UBL:

```python
# UBL context from Noman's background:
# - Has Teradata DW (TD 2850 → IntelliFlex)
# - Built on FSDM v13
# - Has Customer Profitability Engine (built by Noman)
# - Has CTL core banking integration
# - 4-5 core banking systems integrated

UBL_ESTIMATED_DEFAULTS = {
    "Outcomes": {
        "Customer Value and Profitability": {"current": 3, "desired": 5},  # Has profitability engine
        "Single Customer View": {"current": 3, "desired": 5},             # FSDM deployed
        "Customer Segmentation": {"current": 2, "desired": 4},
        "Funds Transfer Pricing": {"current": 2, "desired": 5},
        "Activity Based Costing": {"current": 2, "desired": 4},
        "Profitability Analytics": {"current": 3, "desired": 5},
        "Financial Accounting": {"current": 2, "desired": 4},
        "Functional P&L": {"current": 2, "desired": 5},
        "Regulatory Reporting": {"current": 2, "desired": 4},
        "Executive Dashboards": {"current": 2, "desired": 4},
        # Default for others
        "_default": {"current": 2, "desired": 4}
    },
    "Information": {
        "Architecture": {"current": 3, "desired": 5},      # Has FSDM
        "Master Data Management": {"current": 2, "desired": 4},
        "Data Quality": {"current": 2, "desired": 4},
        "Data Coverage": {"current": 3, "desired": 5},
        "_default": {"current": 2, "desired": 4}
    },
    "Systems": {
        "_default": {"current": 3, "desired": 4}            # Has Teradata infrastructure
    },
    "_default": {"current": 2, "desired": 4}
}
```

### 4.3 Enhanced Priority Scoring

Combine BVF priority (Prompt 3) with maturity gap:

```python
def calculate_enhanced_priority(data_req, bvf_priority, maturity_scores):
    """
    Enhanced priority = BVF Priority × Maturity Gap Factor × Readiness Factor
    """
    # From Prompt 3
    bvf_score = bvf_priority['priority_score']
    
    # Maturity gap for capabilities using this data requirement
    capability_gaps = []
    for cap in data_req['capabilities']:
        if cap in maturity_scores:
            gap = maturity_scores[cap]['desired'] - maturity_scores[cap]['current']
            capability_gaps.append(gap)
    
    avg_maturity_gap = sum(capability_gaps) / len(capability_gaps) if capability_gaps else 2.0
    
    # Higher gap = more urgently needed
    maturity_gap_factor = avg_maturity_gap / 4.0  # Normalize to 0-1
    
    # Readiness: lower current state = harder to implement but higher value
    avg_current = sum(maturity_scores.get(c, {}).get('current', 2) for c in data_req['capabilities']) / max(len(data_req['capabilities']), 1)
    
    # Readiness factor: quick wins (current=3-4) get slight boost, but big gaps still prioritized
    readiness_factor = 1.0
    if avg_current >= 3:
        readiness_factor = 1.2  # Quick win bonus
    elif avg_current <= 1:
        readiness_factor = 0.8  # Harder to implement
    
    enhanced_score = bvf_score * (1.0 + maturity_gap_factor) * readiness_factor
    
    return {
        'data_requirement': data_req['name'],
        'bvf_priority_score': bvf_score,
        'avg_maturity_gap': avg_maturity_gap,
        'avg_current_maturity': avg_current,
        'readiness_factor': readiness_factor,
        'enhanced_priority_score': enhanced_score,
        'implementation_tier': assign_tier(enhanced_score)
    }
```

### 4.4 Output: `enhanced_implementation_priority.csv`

```
Rank, Data_Requirement, FSDM_Subject_Area, BVF_Priority_Score, Avg_Maturity_Gap, Avg_Current_Maturity, Readiness_Factor, Enhanced_Priority_Score, Implementation_Tier, Capabilities_Unlocked, Profitability_Impact
```

### 4.5 Output: `maturity_gap_analysis.csv`

```
BVF_Capability, BVF_Area, BACR_Question_ID, Current_State, Desired_State, Maturity_Gap, Is_Profitability_Critical, FSDM_Entity_Count, Priority_Tier
```

---

## Phase 5: Profitability Engine Maturity Assessment

### 5.1 Profitability-Specific Maturity Profile

Extract and score every BACR question that impacts the profitability engine:

**Revenue Maturity:**
- Transaction Classification → Financial Transactions data
- Customer Value and Profitability → Revenue attribution
- Revenue Analytics → Revenue recognition
- Manage Product Profitability → Product revenue/cost/margin
- Billing and Collections → Fee income

**Cost Maturity:**
- Activity-Based Costing → Direct/indirect cost allocation
- GL, AP, HR Expense Analytics → Overhead costs
- Business Process Analytics → Operational costs
- Service Cost Management → Channel servicing costs

**Risk-Adjusted Return Maturity:**
- Risk Propensity and Modelling → PD models
- Risk Severity Modelling → LGD models
- Capital Calculation and Management → Economic capital
- Risk-based Pricing → RAROC
- Credit Portfolio Management → Portfolio optimization
- Risk Scenario and Stress Test → Stress testing

**Treasury/Pricing Maturity:**
- Funds Transfer Pricing → FTP rates
- Asset and Liability Management → Balance sheet management
- Interest Rate Management → NII sensitivity
- Liquidity Management → Liquidity costs
- Cashflow Generation → Cashflow projections

**Reporting Maturity:**
- Functional P&L Statement → P&L production
- Financial Consolidation → Group consolidation
- Statutory Financial Reporting → Regulatory financials
- Performance Management and KPIs → Dashboards
- Executive Dashboards → C-suite access

### 5.2 Output: `profitability_maturity_profile.json`

```json
{
    "profitability_maturity": {
        "overall_score": float,         // Weighted average
        "overall_target": float,
        "overall_gap": float,
        
        "components": {
            "revenue": {
                "current_avg": float,
                "target_avg": float,
                "gap": float,
                "questions": [
                    {
                        "bacr_id": int,
                        "question_short": str,
                        "bvf_capability": str,
                        "current": int,
                        "desired": int,
                        "gap": int,
                        "fsdm_entities": [str],
                        "star_schema_impact": str  // Which fact/dim table
                    }
                ]
            },
            "cost": { ... },
            "risk_adjusted_return": { ... },
            "treasury_pricing": { ... },
            "reporting": { ... }
        },
        
        "critical_gaps": [
            // Top 10 gaps sorted by impact on profitability engine
            {
                "capability": str,
                "current": int,
                "desired": int,
                "gap": int,
                "profitability_component": str,
                "star_schema_measures_affected": [str],
                "fsdm_entities_required": [str],
                "recommended_actions": [str]
            }
        ],
        
        "implementation_sequence": [
            // Ordered list of capabilities to implement
            {
                "phase": int,
                "capability": str,
                "current_maturity": int,
                "target_maturity": int,
                "fsdm_entities": int,
                "bvf_data_requirements": int,
                "profitability_measures_enabled": [str],
                "prerequisite_phases": [int],
                "estimated_effort": str  // S/M/L/XL
            }
        ]
    }
}
```

### 5.3 Output: `profitability_implementation_sequence.csv`

```
Phase, Capability, BVF_Area, Current_Maturity, Target_Maturity, Gap, FSDM_Entities, Data_Requirements, Profitability_Measures_Enabled, Prerequisites, Effort_Estimate
```

### 5.4 Implementation Phases

Define the implementation phases for the profitability engine based on maturity progression:

**Phase 1: Foundation (Maturity 1→2)**
- Single Customer View (Party hub)
- Account Holdings (Agreement hub)
- Financial Transactions (Event hub)
- Product Master Data
- Organization Hierarchy (Branch dimension)
- → Enables: Basic customer profitability at account level

**Phase 2: Core Profitability (Maturity 2→3)**
- Funds Transfer Pricing
- Activity-Based Costing
- Account Balances & Summaries
- Fee/Commission tracking
- → Enables: NII calculation, direct cost allocation, basic P&L by customer

**Phase 3: Risk-Adjusted (Maturity 3→4)**
- Credit Risk Scoring & Expected Loss
- Risk-Based Pricing
- Capital Calculation
- Provisions & Write-offs
- → Enables: RAROC, risk-adjusted profitability, economic capital allocation

**Phase 4: Advanced Analytics (Maturity 4→5)**
- Profitability Analytics and Optimisation
- Future/Lifetime Value
- Customer Segmentation (profitability-based)
- Performance Management & KPIs
- → Enables: Predictive profitability, LTV models, dynamic pricing, real-time dashboards

---

## Phase 6: Cross-Category Analysis

### 6.1 Category Interdependency Matrix

Analyze how BACR categories depend on each other for profitability:

```
Information (Data) → Outcomes (Capabilities) → Business (Value)
     ↑                      ↑                        ↑
 Governance ←─── Systems (Technology) ──→ Applications
     ↑                      ↑
  Culture ←──────── Agility
```

For profitability specifically:
1. **Information** maturity gates what data is available → determines which FSDM entities can be populated
2. **Systems** maturity determines if Teradata/FSDM can handle the workload
3. **Governance** ensures data quality and consistency for profitability calculations
4. **Outcomes** (Financial function) measures the profitability capability maturity
5. **Applications** determines how profitability results are consumed

### 6.2 Output: `cross_category_dependencies.json`

```json
{
    "profitability_dependency_chain": {
        "data_readiness": {
            "category": "Information",
            "critical_sections": ["Architecture", "Master Data Management", "Data Quality", "Data Coverage"],
            "question_count": int,
            "avg_maturity": float,
            "blocking_gaps": [str]
        },
        "technology_readiness": {
            "category": "Systems",
            "critical_sections": ["Architecture", "Teradata", "Infrastructure"],
            "question_count": int,
            "avg_maturity": float,
            "blocking_gaps": [str]
        },
        "governance_readiness": {
            "category": "Governance",
            "critical_sections": ["Data Governance", "Bus Governance"],
            "question_count": int,
            "avg_maturity": float,
            "blocking_gaps": [str]
        },
        "capability_maturity": {
            "category": "Outcomes",
            "critical_sections": ["Analytic Capabilities"],
            "filter": "Financial business function",
            "question_count": int,
            "avg_maturity": float,
            "top_gaps": [str]
        }
    }
}
```

---

## Phase 7: Generate Reports

### 7.1 Output: `bacr_assessment_template.xlsx`

Generate an Excel workbook for UBL assessment:

**Sheet 1: "Assessment Dashboard"**
- Summary scores by category (radar chart data)
- Profitability readiness score
- Top 10 gaps

**Sheet 2: "Profitability Questions"**
- All profitability-critical questions (filtered)
- Pre-populated with estimated defaults
- Columns for Current State, Desired State, Notes
- Color-coded by gap severity

**Sheet 3: "All Financial Questions"**
- All questions filtered for Financial industry
- Grouped by Category → Section
- Score entry columns

**Sheet 4: "Maturity Mapping"**
- BACR Question → BVF Capability → FSDM Entities → Star Schema
- Full traceability chain

**Sheet 5: "Implementation Roadmap"**
- Phased implementation plan
- Dependencies between phases
- Effort estimates
- Capability unlock sequence

### 7.2 Output: `bacr_maturity_report.md`

Comprehensive markdown report:

1. **Executive Summary**: BACR scope, maturity overview, profitability readiness
2. **BACR Structure**: 8 categories, 793 questions, maturity model explanation
3. **BACR → BVF Mapping**: How interview questions map to business capabilities
4. **BACR → FSDM Mapping**: How data maturity questions map to FSDM entities
5. **Profitability Maturity Profile**: Revenue/Cost/Risk/Treasury/Reporting maturity
6. **Gap Analysis**: Biggest gaps, critical blockers, quick wins
7. **Implementation Roadmap**: 4-phase implementation with maturity progression
8. **Cross-Category Dependencies**: What needs to improve together
9. **UBL-Specific Recommendations**: Based on known UBL context

### 7.3 Output: `bacr_statistics.json`

```json
{
    "bacr_summary": {
        "total_questions": int,
        "categories": 8,
        "financial_industry_questions": int,
        "tba_questions": int,
        "questions_by_category": {},
        "questions_by_business_function": {},
        "questions_by_review_type": {}
    },
    "bvf_mapping": {
        "bacr_outcomes_mapped_to_bvf": int,
        "bacr_outcomes_unmapped": int,
        "bvf_capabilities_covered": int,
        "bvf_capabilities_not_in_bacr": int
    },
    "fsdm_mapping": {
        "bacr_info_questions_mapped": int,
        "fsdm_domains_covered": int,
        "fsdm_entities_impacted": int
    },
    "profitability": {
        "profitability_questions_count": int,
        "avg_current_maturity": float,
        "avg_desired_maturity": float,
        "avg_gap": float,
        "implementation_phases": 4,
        "phase1_entity_count": int,
        "phase1_capability_count": int
    }
}
```

---

## Phase 8: Visualizations

### 8.1 Output: `maturity_radar.html`

Interactive radar/spider chart:
- 8 axes = 8 BACR categories
- Current state (blue polygon) vs. Desired state (green polygon)
- Hover for category breakdown
- Toggle: All questions vs. Financial-only vs. Profitability-critical

### 8.2 Output: `maturity_heatmap.html`

Heatmap matrix:
- Rows: BACR questions (grouped by Category → Section)
- Columns: Current State, Desired State, Gap
- Color: Red (gap ≥ 3) → Yellow (gap = 2) → Green (gap ≤ 1)
- Profitability-critical questions highlighted

### 8.3 Output: `profitability_maturity_dashboard.html`

Profitability-specific dashboard:
- 5 gauge charts: Revenue, Cost, Risk, Treasury, Reporting maturity
- Bar chart: Capability gaps ranked by profitability impact
- Sankey: BACR Questions → BVF Capabilities → FSDM Entities → Star Schema
- Timeline: Implementation phases with maturity progression

### 8.4 Output: `implementation_gantt.html`

Interactive Gantt-style chart:
- 4 phases with estimated durations
- Dependencies shown as arrows
- Capability unlocks at each milestone
- Cumulative profitability measures enabled over time

---

## Execution

Run after Prompts 2 and 3 have completed:

```bash
cd /mnt/e/erwin
conda activate erwin
claude < bacr-maturity-assessment-prompt.md
```

**Expected outputs (17 files):**

| # | File | Description |
|---|---|---|
| 1 | `bacr_all_questions.json` | Full parsed question bank |
| 2 | `bacr_all_questions.csv` | Flat CSV of all questions |
| 3 | `bacr_category_summary.json` | Category statistics |
| 4 | `bacr_to_bvf_mapping.csv` | BACR Outcomes → BVF Capabilities |
| 5 | `bacr_to_bvf_mapping.json` | Same in structured JSON |
| 6 | `bacr_information_to_fsdm.csv` | BACR Information → FSDM domains |
| 7 | `bacr_information_to_fsdm.json` | Same in structured JSON |
| 8 | `enhanced_implementation_priority.csv` | Maturity-enhanced priority ranking |
| 9 | `maturity_gap_analysis.csv` | Gap analysis per capability |
| 10 | `profitability_maturity_profile.json` | Profitability maturity deep-dive |
| 11 | `profitability_implementation_sequence.csv` | Phased implementation plan |
| 12 | `cross_category_dependencies.json` | Category interdependencies |
| 13 | `bacr_assessment_template.xlsx` | UBL assessment workbook |
| 14 | `bacr_maturity_report.md` | Comprehensive analysis report |
| 15 | `bacr_statistics.json` | Summary statistics |
| 16 | `maturity_radar.html` | Radar chart visualization |
| 17 | `maturity_heatmap.html` | Maturity heatmap |
| 18 | `profitability_maturity_dashboard.html` | Profitability dashboard |
| 19 | `implementation_gantt.html` | Gantt chart timeline |
