# WCO Data Model v4.2.0 Audit Report
## Real WCO DM vs TAIW Synthetic Data — Gap Analysis

**Date**: 2026-03-14
**Source Project**: `/home/adnoman/projects/wco_data_model/wco_dm_app_v4.2.0`
**Target Project**: `/mnt/e/erwin/baiw/src/data/taiw/`

---

## 1. WCO DM v4.2 Project Summary

| Aspect | Details |
|--------|---------|
| **Version** | 4.2.0 (final) |
| **Total Files** | 125 files (128.16 MB) |
| **Format** | Excel (.xlsx) + XML Schema (.xsd) + JSON (manifest) |
| **Framework** | Not a web app — official WCO distribution package |
| **Data Format** | All substantive data in Excel workbooks |

### File Structure
```
wco_dm_app_v4.2.0/
├── MANIFEST.json
├── 1. Library/
│   └── 1.1 WCO DM LIB_V4.2.0.xlsx        ← 273 classes, 135 code lists, 10 CDTs
├── 2. Overall Information Package (OIS)/
│   ├── 2.1 Data Model/
│   │   └── WCO DM OIS_V4.2.0.xlsx          ← 9,987 data elements (master)
│   ├── 2.2 UML Diagram/                    ← (HTML archives, not extracted)
│   └── 2.3 XML Schema/
│       ├── With Notes/                      ← 58.4 MB annotated OIS schema
│       └── Without Notes/                   ← 1.7 MB clean OIS schema
├── 3. Information Packages/
│   ├── 3.1 Data Model/
│   │   ├── Section 3.1. MDIP_V4.2.0.xlsx   ← 57 unique elements
│   │   ├── Section 3.2. AIP_V4.2.0.xlsx    ← 160 unique elements
│   │   ├── Section 3.3. BIP DEC_V4.2.0.xlsx ← 982 unique elements (9,240 rows)
│   │   └── Section 3.4. BIP LPCO_V4.2.0.xlsx ← 379 unique elements
│   ├── 3.2 UML Diagram/                    ← (HTML archives)
│   └── 3.3 XML Schema/                     ← 116 XSD files (BIP + DIP schemas)
└── 5. Changes/
    └── 5.1. Overview of Changes_V4.2.0.xlsx ← 26,360 change entries from v4.1→v4.2
```

---

## 2. Data Inventory

| Data Type | Source File | Record Count | Key Fields | Notes |
|-----------|------------|-------------|-----------|-------|
| **Classes** | LIB_V4.2.0.xlsx | **273** | ID, Name, Definition, Format, Code List, Superclass | Hierarchical with superclass markers (DOC, GOV, LOC, PAR, TRA) |
| **Data Elements (OIS)** | OIS_V4.2.0.xlsx | **9,987** | UML Path, WCO ID, Name, Definition, Format, Code List, IM/EX/CRI flags | Master combined structure |
| **Elements (Declaration)** | BIP DEC_V4.2.0.xlsx | **982 unique** (9,240 rows) | WCO ID, Name, Definition, Format, Code List, Class ID, Attribute ID | Includes IM, EX, CRI, BRI, UPU columns |
| **Elements (LPCO)** | BIP LPCO_V4.2.0.xlsx | **379 unique** (757 rows) | WCO ID, Name, Definition, Format, Code List, CDT mapping | Licenses, Permits, Certificates |
| **Elements (AIP)** | AIP_V4.2.0.xlsx | **160 unique** (439 rows) | WCO ID, Name, Definition, AEO/SSTL/UPU flags | Additional/Response info |
| **Elements (MDIP)** | MDIP_V4.2.0.xlsx | **57 unique** (68 rows) | WCO ID, Name, Definition, Format | Metadata/document info |
| **Code Lists** | LIB_V4.2.0.xlsx | **135** | Name, Source (WCO/UN/EDIFACT/ISO/User) | Includes values for each code list |
| **Core Data Types** | LIB_V4.2.0.xlsx | **10** | Amount, Binary Object, Code, DateTime, Identifier, Indicator, Measure, Numeric, Quantity, Text | With extended attributes |
| **XML Schemas** | 2.3 + 3.3 folders | **116 files** | XSD with type definitions | Dual: With Notes (annotated) and Without Notes (clean) |
| **Information Packages** | 3.1 Data Model/ | **4 BIPs + 5 DIPs** | MDIP, Declaration, LPCO, AIP (BIPs) + BRI, CUSITM, REFRSP, e-CO, CustomsBond (DIPs) | Modular architecture |

---

## 3. Gap Analysis: Real WCO DM vs Current TAIW Data

| Aspect | Real WCO DM v4.2.0 | Current TAIW (Synthetic) | Gap | Impact |
|--------|--------------------|-----------------------|-----|--------|
| **Classes** | **273** | 103 | **-170 classes missing** | TAIW has only 38% of real classes |
| **Data Elements** | **982 unique** (Declaration) + 379 (LPCO) + 160 (AIP) + 57 (MDIP) = **~1,578 unique** | 727 | **-851 elements missing** | TAIW has only 46% of real elements |
| **OIS Total Elements** | **9,987** (with procedure variants) | N/A | Not applicable — OIS is expanded view | TAIW uses flattened unique elements |
| **Code Lists** | **135** | 50 | **-85 code lists missing** | TAIW has only 37% of real code lists |
| **Core Data Types** | **10** | Not explicitly modeled | **Missing CDT layer** | No formal type system |
| **Information Packages** | **4 BIPs + 5 DIPs = 9** | 23 (BIPs + DIPs) | **TAIW has MORE** | TAIW added Pakistan-specific DIPs (WH, FZ, ECOMM, etc.) — this is correct |
| **Relationships** | Class-attribute hierarchical | 600+ synthetic | **Structure differs** | Real uses superclass markers; TAIW uses explicit parent-child |
| **Domains** | Implicit via superclass (DOC, GOV, LOC, PAR, TRA, NONE) | 14 explicit domains | **Different taxonomy** | TAIW's 14 domains are a useful categorization not in raw WCO DM |
| **XML Schemas** | 116 XSD files | Not used | N/A | Schemas not needed for web app |
| **Pakistan Context** | Not present | Yes (WeBOC, PSW, FBR, CPEC) | N/A | TAIW addition — must preserve |
| **Capabilities (TCF)** | Not present | 100 capabilities | N/A | TAIW addition — must preserve |
| **TACR Questions** | Not present | 640 questions | N/A | TAIW addition — must preserve |
| **Star Schema** | Not present | 21 tables | N/A | TAIW addition — must preserve |
| **Gap Extensions** | Not present | 25 tables | N/A | TAIW addition — must preserve |

### Key Findings

1. **TAIW is missing 170 classes** — The real WCO DM has 273 classes (e.g., AcceptanceLocation, Producer, Packer, AdditionalDocument, PropertyOperator, TradingParty, etc.). TAIW only has 103.

2. **TAIW is missing ~851 data elements** — Real model has ~1,578 unique elements across all packages vs TAIW's 727.

3. **TAIW is missing 85 code lists** — Real model has 135 code lists (WCO, UN/EDIFACT, ISO, user-defined) vs TAIW's 50. Missing code lists include CommodityCategoryCode, CommodityPhysicalStateCode, BondActivityTypeCode, etc.

4. **TAIW's 14 domains are a USEFUL ADDITION** — The real WCO DM doesn't have explicit "domains" — it uses superclass markers (DOC, GOV, LOC, PAR, TRA, NONE). TAIW's 14-domain taxonomy (Declaration, Consignment, Goods, Transport, Party, Location, Financial, Document, Classification, Risk & Control, Origin, Warehouse, E-Commerce, Response) is a valid analytical categorization.

5. **TAIW's information packages are RICHER** — Real WCO DM has 9 packages; TAIW has 23 including Pakistan-specific DIPs (Warehouse, Free Zone, E-Commerce, etc.) mapped to WeBOC GD types. This is correct and should be preserved.

6. **Data extraction challenge** — Real WCO DM data is in Excel (.xlsx) files, not JSON. Extraction requires openpyxl or similar library to parse Excel sheets and transform to JSON.

---

## 4. Enrichment Opportunities

### A. Replace/Expand Data Elements (HIGH PRIORITY)
- Extract all unique elements from BIP DEC, BIP LPCO, AIP, and MDIP Excel files
- Expand from 727 to ~1,578 unique elements
- Add real WCO IDs (D048, D053, etc.), definitions, formats, and code list references
- Preserve TAIW's domain assignments and capability mappings

### B. Replace/Expand Classes (HIGH PRIORITY)
- Extract all 273 classes from LIB_V4.2.0.xlsx
- Add real class hierarchy with superclass markers
- Add real attribute counts and definitions
- Preserve TAIW's domain assignments

### C. Expand Code Lists (HIGH PRIORITY)
- Extract all 135 code lists with their values from LIB_V4.2.0.xlsx
- Add code list values (actual codes + descriptions)
- Preserve Pakistan-specific code mappings (WeBOC GD types, etc.)

### D. Add Core Data Types (MEDIUM PRIORITY)
- Add the 10 CDTs as a new data file
- Map existing elements to their CDTs

### E. Update Relationships (MEDIUM PRIORITY)
- Extract real class-to-attribute relationships from Library
- Update relationship types with superclass hierarchy

### F. Enrich Information Packages (LOW PRIORITY)
- Cross-reference TAIW's 23 packages against real BIP/DIP structures
- Add element-level mappings per package from real Excel data

---

## 5. Recommended Actions (Prioritized)

| # | Action | Files Affected | Difficulty | Value |
|---|--------|---------------|------------|-------|
| 1 | **Extract classes from LIB xlsx** | classes.json | Medium (xlsx parsing) | HIGH — 273 real classes |
| 2 | **Extract elements from BIP DEC/LPCO/AIP/MDIP xlsx** | dataElements.json | Medium-High | HIGH — ~1,578 real elements |
| 3 | **Extract code lists from LIB xlsx** | codeLists.json | Medium | HIGH — 135 real code lists |
| 4 | **Update relationships from real hierarchy** | relationships.json | Medium | MEDIUM — real parent-child |
| 5 | **Add Core Data Types file** | new: coreDataTypes.json | Low | MEDIUM — type system |
| 6 | **Cross-reference information packages** | informationPackages.json | Low | LOW — TAIW already richer |
| 7 | **Update domain assignments** | domains.json | Low | LOW — TAIW taxonomy is valid |

### Prerequisites
- Need `openpyxl` Python library to parse Excel files
- Must create extraction scripts to transform xlsx → JSON
- Must merge (not replace) to preserve TAIW-specific fields

### Files to PRESERVE (never overwrite):
- capabilities.json (TCF — our creation)
- tacrQuestions.json (TACR — our creation)
- pakistanContext.json (our creation)
- starSchema.json (our creation)
- gapExtensions.json (our creation)
- enrichment.json (our creation)
- mappings.json (our creation)
- dataRequirements.json (our creation)
- reuseScores.json (our creation)
- dependencies.json (our creation)
- index.json (metadata)

---

## Appendix: Information Package Architecture

```
OIS (Overall Information Structure) — 9,987 elements
├── MDIP (Meta Data Information Package) — 57 unique elements
├── Declaration BIP — 982 unique elements
│   ├── Maritime BRI DIP
│   ├── UPU CUSITM DIP
│   └── UPU REFRSP DIP
├── LPCO BIP — 379 unique elements
│   ├── Certificate of Origin DIP (WCO TCRO)
│   └── Customs Bond DIP
└── AIP (Additional Information Package) — 160 unique elements
    ├── AEO MasterData DIP
    └── UPU CUSRSP DIP
```

### TAIW's Extended Packages (Pakistan-specific — PRESERVE)
```
TAIW Additions:
├── DIP_GD (Goods Declaration — WeBOC)
├── DIP_CARGO (Cargo Manifest — IGM/EGM)
├── DIP_TRANSIT (Transit Declaration — ATTA)
├── DIP_LPC (License/Permit/Certificate — 70+ OGAs)
├── DIP_PHYTO (Phytosanitary — DPP)
├── DIP_VET (Veterinary — AQSD)
├── DIP_WH (Warehouse Declaration)
├── DIP_FZ (Free Zone — Gwadar, SEZs)
└── DIP_ECOMM (E-Commerce/Postal)
```
