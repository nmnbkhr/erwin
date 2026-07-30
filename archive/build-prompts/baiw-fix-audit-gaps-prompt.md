# BAIW — Fix Audit Gaps

## Context

The BAIW app is built and running. An audit found 4 gaps between the design brief and implementation. Fix all 4 now.

---

## FIX 1: Global Search (Cmd+K Command Palette)

### Problem
Header search bar only routes to `/model?search=` for entity search. No unified cross-type search, no keyboard shortcut, no typeahead preview.

### Solution
Build a **Cmd+K command palette** (like VS Code, Linear, Raycast) that searches across ALL data types simultaneously.

**Implementation:**

1. **Create `src/components/layout/CommandPalette.tsx`:**
   - Modal overlay triggered by Cmd+K (Mac) / Ctrl+K (Windows) or clicking the search bar
   - Input field at top with "Search entities, capabilities, domains..." placeholder
   - Results grouped by type with icons:
     ```
     🗃️ Entities (showing top 5 matches)
       Party — Party Management domain
       Party_Individual — Party Management domain
     
     📊 Capabilities (showing top 5 matches)  
       Profitability Modelling — Finance & PM > EPM
       Product Profitability — Product Management > Performance
     
     🏛️ Domains (showing top 3 matches)
       Party Management — 622 entities
     
     📋 BACR Categories (showing top 3 matches)
       Business — 120 questions
     ```
   - Each result: click navigates to the relevant page with that item selected
   - Keyboard nav: Arrow up/down to select, Enter to navigate, Escape to close
   - Debounced input (200ms) for performance with 3,917+ entities

2. **Update `src/utils/search.ts`:**
   - Add `globalSearch(query: string)` function that searches:
     - Entities (by name, fuzzy match) → returns `{type: 'entity', name, domain, id}`
     - Capabilities (by sub-capability name, fuzzy) → returns `{type: 'capability', theme, group, sub, id}`
     - Domains (by name) → returns `{type: 'domain', name, entityCount}`
     - BACR categories (by name) → returns `{type: 'bacr', category}`
   - Return max 5 per type, sorted by relevance
   - Fuzzy matching: tolerate typos (simple includes + starts-with scoring)

3. **Update Header component:**
   - Search bar click → opens CommandPalette (instead of navigating)
   - Show "⌘K" hint badge inside search bar
   - Add keyboard listener for Cmd+K / Ctrl+K globally in Layout.tsx

4. **Navigation from results:**
   - Entity result → `/model?search={entityName}`
   - Capability result → `/capabilities?id={capabilityId}`  
   - Domain result → `/model?domain={domainName}`
   - BACR category result → `/maturity?category={categoryName}`

---

## FIX 2: localStorage Persistence for Roadmap Builder

### Problem
Roadmap Builder selections (template choice, selected capabilities, custom phase assignments) are lost on page refresh. Only Maturity Assessment persists.

### Solution

1. **Create `src/hooks/useRoadmapState.ts`:**
   ```typescript
   const STORAGE_KEY = 'baiw-roadmap';
   
   interface RoadmapState {
     selectedTemplate: string | null;
     selectedCapabilities: string[];  // capability IDs
     customPhases: Record<string, 1 | 2 | 3>;  // capId → phase override
     lastUpdated: string;  // ISO timestamp
   }
   ```
   - Save to localStorage on every state change (debounced 500ms)
   - Restore on mount
   - Add `resetRoadmap()` function
   - Wrap JSON.parse in try-catch with fallback to defaults

2. **Update Roadmap Builder page:**
   - Use `useRoadmapState()` hook instead of local state
   - Show "Last saved: X minutes ago" indicator
   - Add "Reset Roadmap" button (with confirmation dialog)

3. **Fix JSON.parse safety in AssessmentContext.tsx too:**
   - Wrap existing localStorage.getItem + JSON.parse in try-catch
   - If corrupt data, reset to empty state instead of crashing
   - Add same pattern to any other localStorage usage

---

## FIX 3: PDF/JSON Export on All Pages

### Problem
Only Maturity Assessment has a JSON export button. No PDF capability. 7 other pages have no export.

### Solution

1. **Install jspdf + html2canvas:**
   ```bash
   npm install jspdf html2canvas
   ```

2. **Update `src/utils/export.ts`:**
   ```typescript
   // JSON export (already exists, ensure it works generically)
   export function exportJSON(data: any, filename: string): void {
     const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
     const url = URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url; a.download = `${filename}.json`; a.click();
     URL.revokeObjectURL(url);
   }
   
   // PDF export (new)
   export async function exportPDF(
     elementId: string,    // DOM element to capture
     filename: string,
     title?: string
   ): Promise<void> {
     const html2canvas = (await import('html2canvas')).default;
     const { jsPDF } = await import('jspdf');
     
     const element = document.getElementById(elementId);
     if (!element) return;
     
     const canvas = await html2canvas(element, {
       scale: 2,
       useCORS: true,
       backgroundColor: '#ffffff'
     });
     
     const imgData = canvas.toDataURL('image/png');
     const pdf = new jsPDF('p', 'mm', 'a4');
     const pdfWidth = pdf.internal.pageSize.getWidth();
     const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
     
     if (title) {
       pdf.setFontSize(16);
       pdf.text(title, 14, 20);
       pdf.addImage(imgData, 'PNG', 0, 30, pdfWidth, pdfHeight);
     } else {
       pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
     }
     
     pdf.save(`${filename}.pdf`);
   }
   
   // CSV export (new — for tables)
   export function exportCSV(rows: Record<string, any>[], filename: string): void {
     if (rows.length === 0) return;
     const headers = Object.keys(rows[0]);
     const csv = [
       headers.join(','),
       ...rows.map(row => headers.map(h => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(','))
     ].join('\n');
     const blob = new Blob([csv], {type: 'text/csv'});
     const url = URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url; a.download = `${filename}.csv`; a.click();
     URL.revokeObjectURL(url);
   }
   ```

3. **Create `src/components/layout/ExportMenu.tsx`:**
   - Dropdown button with icon (Download icon from Lucide)
   - Options: "Export as PDF", "Export as JSON", "Export as CSV" (where applicable)
   - Takes props: `data` (for JSON/CSV), `elementId` (for PDF capture), `filename`

4. **Add ExportMenu to each page:**

   | Page | Export Content | Formats |
   |------|---------------|---------|
   | Dashboard | Stats + chart data | PDF (screenshot), JSON |
   | Model Explorer | Selected entity + attributes | JSON, CSV (attributes table) |
   | Capability Navigator | Selected capability + dependencies | JSON |
   | Dependency Graph | Graph data (nodes + edges) | JSON, PDF (screenshot) |
   | Maturity Assessment | Assessment answers + scores | JSON (exists), PDF (radar + gap table) |
   | Profitability Engine | Star schema + P&L structure | JSON, PDF |
   | Roadmap Builder | Selected capabilities + phases + investment | JSON, PDF |
   | Pakistan Reference | Reference data tables | JSON, CSV |

5. **Wrap each page's main content in a div with `id="page-content-{pageName}"` for PDF capture.**

---

## FIX 4: Create enrichment.json

### Problem
`enrichment.json` is referenced in the design brief and data flow diagram but doesn't exist in `src/data/`.

### Solution

Create `src/data/enrichment.json` with Pakistan banking context for key capabilities. This is the knowledge extracted from the 16 BVF enrichment prompts (10,454 lines of domain knowledge).

**Structure:**
```json
{
  "capabilities": {
    "profitability_modelling": {
      "pakistanObjectives": [
        "Calculate multi-dimensional profitability at Customer/Product/Branch/Segment/Channel/Region level",
        "Full P&L: FTP-adjusted NII + fees − direct costs − ABC costs − IFRS 9 provision − capital charge = EVA",
        "Core output of UBL Customer Profitability Engine on FSDM star schema",
        "<15% of Pakistan banks can calculate customer-level profitability"
      ],
      "pakistanDataSources": [
        "FSDM Customer Profitability star schema (FACT_CUSTOMER_PROFITABILITY)",
        "FTP rates based on KIBOR yield curve",
        "ABC unit costs by channel (branch PKR 150-300, ATM PKR 30-50, digital PKR 5-15)",
        "IFRS 9 ECL provisions by stage (1/2/3)",
        "Economic capital based on RWA and SBP capital requirements"
      ],
      "expectedOutcomes": [
        "Identify top 20% customers generating 150%+ of bank profit",
        "Identify bottom 20% customers destroying 30-50% of profit",
        "Product-level profitability to rationalize portfolio",
        "Branch P&L for network optimization (16,000+ branches)"
      ],
      "keyChallenges": [
        "4-5 core banking systems with no unified customer view",
        "FTP methodology not established at most banks",
        "ABC costing requires activity analysis (no Pakistan bank has formal ABC)",
        "Islamic transactions need dual accounting (IFRS + AAOIFI)"
      ],
      "fsdmEntities": ["Party", "Agreement", "Account", "GL_Entry", "Product", "Branch", "Channel", "Risk_Assessment"],
      "implementationPhase": 1,
      "investmentRange": "PKR 60-120M",
      "priority": "CRITICAL"
    },
    "raroc": {
      "pakistanObjectives": [
        "Calculate RAROC at customer/product/branch/segment level for SBP ICAAP compliance",
        "Formula: (Revenue − Costs − Expected Loss) / Economic Capital",
        "Optimize capital allocation from low-RAROC to high-RAROC segments",
        "Cost of equity ~18-22% in Pakistan's high-rate environment"
      ],
      "pakistanDataSources": [
        "FSDM: Revenue (NII + fees), Operating costs (ABC), Expected Loss (IFRS 9 ECL)",
        "Economic Capital = RWA × SBP minimum CAR (11.5%) or internal capital model",
        "ECIB scores for PD estimation",
        "Collateral valuations for LGD"
      ],
      "expectedOutcomes": [
        "Risk-adjusted performance measurement replacing crude ROE",
        "Capital optimization — redirect from low-RAROC to high-RAROC segments",
        "SBP ICAAP compliance with documented methodology",
        "Target: 15-25% improvement in risk-adjusted returns"
      ],
      "keyChallenges": [
        "Most Pakistan banks use crude ROE, not risk-adjusted metrics",
        "Economic capital models require sophisticated PD/LGD/EAD estimation",
        "SBP has not mandated specific RAROC methodology yet",
        "Cost of equity estimation contested (CAPM vs. build-up method)"
      ],
      "fsdmEntities": ["Risk_Assessment", "GL_Entry", "Agreement", "Collateral", "Party", "Product"],
      "implementationPhase": 2,
      "investmentRange": "PKR 40-80M",
      "priority": "CRITICAL"
    },
    "activity_based_costing": {
      "pakistanObjectives": [
        "Calculate true cost per transaction by channel",
        "Branch transaction: PKR 150-300, ATM: PKR 30-50, Digital: PKR 5-15",
        "Prerequisite for customer profitability — no Pakistan bank has formal ABC",
        "Enable digital migration ROI quantification"
      ],
      "pakistanDataSources": [
        "HR cost data (staff cost 40-50% of opex), branch operating costs",
        "Transaction volumes by channel from FSDM",
        "IT cost allocation, premises cost, marketing cost",
        "Gap Extension: ABC Costing module (6 tables)"
      ],
      "expectedOutcomes": [
        "True unit cost per transaction per channel",
        "Activity cost pools: account maintenance, transaction processing, sales, compliance",
        "Cost driver rates for allocation to customers/products",
        "Business case for branch rationalization and digital migration"
      ],
      "keyChallenges": [
        "No Pakistan bank has implemented formal ABC methodology",
        "Cost data scattered across HR, finance, IT, operations systems",
        "Requires detailed activity analysis and time-motion studies",
        "Cultural resistance — branches resist cost transparency"
      ],
      "fsdmEntities": ["Cost_Center", "Branch", "Channel", "Transaction", "Activity"],
      "implementationPhase": 2,
      "investmentRange": "PKR 30-60M",
      "priority": "CRITICAL"
    },
    "reconciliation_process": {
      "pakistanObjectives": [
        "Automate GL-to-sub-ledger reconciliation across 4-5 core banking systems",
        "RAAST/1Link/NIFT/card network settlement reconciliation",
        "Nostro/vostro account reconciliation",
        "Currently consumes 40-50% of finance team time"
      ],
      "pakistanDataSources": [
        "GL postings from each core banking system",
        "Sub-ledger entries (loans, deposits, cards, trade finance)",
        "Payment switch data (RAAST, 1Link, NIFT)",
        "Nostro/vostro statements from correspondent banks"
      ],
      "expectedOutcomes": [
        "Auto-resolve 70-80% of reconciliation breaks (pattern-based)",
        "Reduce reconciliation time from weeks to days per month-end",
        "Real-time break detection instead of month-end discovery",
        "Audit trail for all reconciliation actions"
      ],
      "keyChallenges": [
        "Multiple core systems with different GL structures",
        "Legacy payment systems with non-standard formats",
        "Manual processes deeply embedded in finance culture",
        "Real-time settlement (RAAST) creates intraday reconciliation need"
      ],
      "fsdmEntities": ["GL_Account", "GL_Entry", "Settlement", "Payment", "Nostro_Account"],
      "implementationPhase": 1,
      "investmentRange": "PKR 20-40M",
      "priority": "HIGH"
    },
    "close_process_optimization": {
      "pakistanObjectives": [
        "Reduce monthly close from 15-30 days to <10 days (target <5 days)",
        "Key bottlenecks: reconciliation, IFRS 9 ECL calculation, Islamic entries, inter-branch reconciliation",
        "Automate GL feeds from 4-5 core systems into FSDM warehouse"
      ],
      "pakistanDataSources": [
        "All GL data from core banking systems",
        "IFRS 9 ECL calculation engine outputs",
        "Islamic accounting entries (dual booking)",
        "Inter-company/inter-branch elimination entries"
      ],
      "expectedOutcomes": [
        "Monthly close: 30 days → 15 days (Phase 1), → 5 days (Phase 2)",
        "Automated close checklist with real-time status dashboard",
        "Parallel processing of independent close tasks",
        "Early warning for delayed close steps"
      ],
      "keyChallenges": [
        "Dependencies between close steps create sequential bottleneck",
        "IFRS 9 ECL calculation requires complete month-end data",
        "Islamic entries require Shariah review before posting",
        "16,000+ branches create massive inter-branch reconciliation volume"
      ],
      "fsdmEntities": ["GL_Account", "GL_Entry", "Close_Process", "Adjustment", "Period"],
      "implementationPhase": 1,
      "investmentRange": "PKR 25-50M",
      "priority": "HIGH"
    },
    "regulatory_reporting": {
      "pakistanObjectives": [
        "Automate 30+ SBP statutory returns from single FSDM data source",
        "WSP (weekly), MSA (monthly), QFS (quarterly), annual capital adequacy",
        "LCR/NSFR (daily), ECIB (monthly), STR/CTR (event-driven)",
        "Currently 40%+ of finance team bandwidth consumed by manual reporting"
      ],
      "pakistanDataSources": [
        "FSDM warehouse as single source of truth",
        "SBP return templates and validation rules",
        "Basel III calculation engine (CAR, LCR, NSFR)",
        "AML/CFT transaction monitoring data"
      ],
      "expectedOutcomes": [
        "Automate top-5 SBP returns (WSP, MSA, QFS, capital adequacy, ECIB)",
        "Reduce reporting errors by 90% (single source, automated validation)",
        "Free 40%+ of finance team capacity for analytics",
        "Full data lineage from GL to regulatory return"
      ],
      "keyChallenges": [
        "SBP frequently changes return formats and requirements",
        "Multiple data sources need reconciliation before reporting",
        "Some returns require manual judgment (loan classification overrides)",
        "Data privacy restrictions on certain regulatory submissions"
      ],
      "fsdmEntities": ["Regulatory_Report", "GL_Account", "Agreement", "Risk_Assessment", "Party", "Basel_Calculation"],
      "implementationPhase": 1,
      "investmentRange": "PKR 40-80M",
      "priority": "HIGH"
    },
    "liquidity_management": {
      "pakistanObjectives": [
        "Comply with SBP Basel III LCR (min 100%) and NSFR (min 100%)",
        "Intraday liquidity monitoring for RAAST real-time settlement",
        "Optimize HQLA composition (PIB vs T-Bill vs Sukuk)",
        "Real-time liquidity dashboard for treasury"
      ],
      "pakistanDataSources": [
        "Deposit maturity profile from FSDM",
        "Loan repayment schedule",
        "Government securities portfolio (PIB, T-Bill, Sukuk maturities)",
        "SBP CRR/SLR requirements",
        "RAAST settlement flows (real-time)"
      ],
      "expectedOutcomes": [
        "Real-time LCR/NSFR calculation (currently monthly)",
        "Intraday liquidity buffer monitoring",
        "Stress test: 30-day liquidity coverage under 3 scenarios",
        "Optimize funding cost by 10-20bps through better cash management"
      ],
      "keyChallenges": [
        "RAAST real-time settlement creates new intraday liquidity volatility",
        "Government securities market liquidity varies significantly",
        "SBP may increase LCR/NSFR buffers beyond Basel minimum",
        "Cash forecasting accuracy limited by deposit withdrawal unpredictability"
      ],
      "fsdmEntities": ["Liquidity_Position", "HQLA", "Deposit", "Loan", "Security", "Settlement"],
      "implementationPhase": 1,
      "investmentRange": "PKR 30-60M",
      "priority": "HIGH"
    },
    "single_customer_view": {
      "pakistanObjectives": [
        "Unified 360° customer view across 4-5 core banking systems",
        "CNIC-based golden record for individuals, NTN for corporates",
        "Integrate: deposits, loans, cards, trade finance, Islamic products, digital channels"
      ],
      "pakistanDataSources": [
        "Core banking (conventional), Islamic banking sub-system, card management",
        "Trade finance system, treasury system",
        "NADRA CNIC verification, ECIB credit bureau",
        "Mobile app data, internet banking, call center CRM"
      ],
      "expectedOutcomes": [
        "Single golden customer record linked to all product holdings",
        "KYC completeness score per customer",
        "Household/group linkage for relationship management",
        "Foundation for all analytics (profitability, risk, cross-sell)"
      ],
      "keyChallenges": [
        "4-5 core systems with different customer ID schemes",
        "CNIC not always captured for legacy accounts",
        "Islamic and conventional customer records may be separate",
        "Data quality: duplicate customers, incomplete demographics"
      ],
      "fsdmEntities": ["Party", "Individual", "Organization", "Party_Relationship", "Agreement", "KYC"],
      "implementationPhase": 1,
      "investmentRange": "PKR 50-100M",
      "priority": "CRITICAL"
    },
    "card_spend_stimulation": {
      "pakistanObjectives": [
        "Pakistan has 30M+ debit cards but <30% used for POS purchases",
        "Most debit cards used ONLY for ATM cash withdrawal",
        "Stimulate card spend to increase interchange revenue",
        "Reduce cash handling cost across the economy"
      ],
      "pakistanDataSources": [
        "Card transaction data (ATM vs POS vs e-commerce split)",
        "Customer FSDM profile (salary, demographics, segment)",
        "Merchant category codes and merchant location data",
        "1Link POS switch data"
      ],
      "expectedOutcomes": [
        "Activate 30% of dormant POS cards",
        "Increase average POS spend by 25% in targeted segment",
        "Revenue impact: PKR 2-5B additional interchange industry-wide",
        "Merchant offer matching for personalized stimulation"
      ],
      "keyChallenges": [
        "Cash culture deeply embedded in Pakistan society",
        "POS terminal coverage limited outside major cities",
        "Card fraud concerns reduce consumer confidence",
        "Merchant discount rate resistance"
      ],
      "fsdmEntities": ["Card", "Card_Transaction", "POS_Transaction", "Merchant", "Customer"],
      "implementationPhase": 1,
      "investmentRange": "PKR 20-40M",
      "priority": "HIGH"
    },
    "credit_risk_new_to_lending": {
      "pakistanObjectives": [
        "150M+ adults with no formal credit history",
        "Build credit models using alternative data (mobile wallet, utility payments)",
        "Enable lending to unbanked — SBP financial inclusion mandate",
        "Expand addressable lending market from 30M to 80M+"
      ],
      "pakistanDataSources": [
        "Mobile wallet transactions (JazzCash 50M+, Easypaisa 40M+)",
        "Utility payment history (K-Electric, SSGC, SNGPL)",
        "Telecom usage/payment data (Jazz, Telenor, Zong)",
        "RAAST P2P patterns, NADRA demographic data"
      ],
      "expectedOutcomes": [
        "Alternative data credit scoring for thin-file customers",
        "Enable nano-lending (PKR 5K-50K) via digital channel",
        "If 10% of unbanked get PKR 50K credit → PKR 750B+ new lending",
        "Improve Gini coefficient by 10-20% vs. bureau-only models"
      ],
      "keyChallenges": [
        "ECIB has limited data for 70%+ of population",
        "Data sharing agreements with telcos/wallets complex",
        "SBP regulatory framework for alternative data evolving",
        "Model validation for non-traditional variables"
      ],
      "fsdmEntities": ["Party", "Credit_Score", "Alternative_Data", "Risk_Assessment", "Agreement"],
      "implementationPhase": 1,
      "investmentRange": "PKR 30-60M",
      "priority": "CRITICAL"
    }
  },
  "metadata": {
    "source": "Extracted from 16 BVF enrichment prompts (10,454 lines)",
    "capabilitiesEnriched": 10,
    "totalCapabilities": 112,
    "note": "Remaining 102 capabilities have generic placeholder enrichment. Detailed enrichment available in prompt files."
  }
}
```

For the remaining ~102 capabilities that don't have detailed enrichment, generate a lighter-weight entry with:
- `pakistanObjectives`: 1-2 generic sentences based on the capability name
- `pakistanDataSources`: ["FSDM warehouse data"]
- `expectedOutcomes`: ["Improved analytics capability"]
- `keyChallenges`: ["Data integration across core systems", "Analytics talent scarcity"]
- `fsdmEntities`: 2-3 logical FSDM entities based on the capability's domain
- `implementationPhase`: 2 or 3
- `investmentRange`: "PKR 15-40M"
- `priority`: "MEDIUM"

**Then wire `enrichment.json` into the Capability Navigator (Module 3):** When a capability is selected and enrichment data exists for it, show the Pakistan Context section with the 4 subsections (Objectives, Data Sources, Outcomes, Challenges). If only placeholder enrichment exists, show it with a muted style and a note "Detailed Pakistan context available in BVF prompt files."

---

## VERIFICATION CHECKLIST

After completing all 4 fixes, verify:

```
□ Cmd+K opens command palette from any page
□ Typing in command palette shows results from entities, capabilities, domains, BACR
□ Clicking a result navigates to the correct page with correct item selected
□ Escape closes the palette
□ Arrow keys navigate results

□ Roadmap Builder selections survive page refresh
□ Maturity Assessment still persists (regression check)
□ Corrupt localStorage doesn't crash the app (try: localStorage.setItem('baiw-assessment', 'corrupt'))

□ Every page has an ExportMenu component in top-right area
□ JSON export works on all 8 pages
□ PDF export works on at least Dashboard, Maturity Results, Profitability Engine, Roadmap Builder
□ CSV export works on Model Explorer (attributes table) and Pakistan Reference (tables)

□ enrichment.json exists in src/data/
□ Capability Navigator shows Pakistan Context section when capability is selected
□ 10 capabilities show detailed enrichment
□ 102 capabilities show placeholder enrichment with muted style

□ No TypeScript errors
□ No console errors
□ All routes still work
```
