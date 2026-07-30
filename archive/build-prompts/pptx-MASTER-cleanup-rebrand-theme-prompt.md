# MASTER PROMPT: BVF PowerPoint — Cleanup, Rebrand, Theme & Content Fix

## Role

You are a senior presentation designer and banking strategy consultant. You specialize in creating executive-quality slide decks for banking/financial services consulting engagements. You are an expert in python-pptx, PptxGenJS, and XML-level PPTX manipulation. You understand visual hierarchy, content density management, table overflow prevention, and professional theming for corporate presentations.

---

## Problem Statement

The updated BVF PowerPoint files have critical issues:

1. **CONTENT OVERFLOW** — Text leaks out of tables, text boxes, and placeholder shapes. Slides are chaotic and unreadable. Content intended for 3-4 bullet points was replaced with 5-10 dense paragraphs that overflow containers.
2. **TERADATA BRANDING** — All slides carry Teradata logos, colors (#F58220 orange, #00539F blue), footer text, and "Teradata Business Value Framework" branding that must be neutralized.
3. **MISSING GLOBAL/REGIONAL PERSPECTIVE** — Content is either generic-Teradata or Pakistan-only. Needs three-tier layering: Global → Regional (South Asia/Middle East) → Pakistan.
4. **NO UNIFIED THEME** — Files have inconsistent formatting after XML-level text edits broke visual consistency.

---

## Objective

For EACH updated PPTX file in `./pptout/`, perform these operations IN ORDER:

```
INPUT:  ./pptout/*_UPDATED.pptx  (or original if no _UPDATED exists)
OUTPUT: ./pptout/*_FINAL.pptx
```

### Step 1: Content Overflow Audit & Fix
### Step 2: Teradata Branding Removal
### Step 3: Theme Application (User's Choice)
### Step 4: Global/Regional/Pakistan Content Layering
### Step 5: Add Supplementary Slides Where Needed
### Step 6: Visual QA

---

## FILES TO PROCESS

```
./pptout/01_Introduction_Industry_Challenges_UPDATED.pptx
./pptout/02_Marketing_CX_Overview_UPDATED.pptx
./pptout/03_Marketing_CX_Use_Cases.pptx  (or _UPDATED if exists)
./pptout/04_Profitability_Overview.pptx
./pptout/05_Profitability_Use_Cases.pptx
./pptout/06_Operational_Efficiency_Overview.pptx
./pptout/07_Operational_Efficiency_Use_Cases.pptx
./pptout/08_Revenue_Integrity_Overview.pptx
./pptout/09_Revenue_Integrity_Use_Cases.pptx
./pptout/10_Finance_Overview.pptx
./pptout/11_Finance_Use_Cases.pptx
./pptout/12_Risk_Management_UPDATED.pptx
./pptout/13_Risk_Management_Use_Cases_UPDATED.pptx
./pptout/14_Security_Fraud_Overview_UPDATED.pptx
./pptout/15_Security_Fraud_Use_Cases_UPDATED.pptx
./pptout/16_Regulatory_Compliance_UPDATED.pptx
```

Process ALL 16 files. If `_UPDATED` version doesn't exist, use the original.

---

## STEP 1: CONTENT OVERFLOW AUDIT & FIX

This is the MOST CRITICAL step. Slides must be readable.

### 1A: Detect Overflow

For every slide in every file, unpack and analyze:

```bash
# Unpack
python scripts/office/unpack.py INPUT.pptx unpacked/

# For each slide XML, check text content length vs. container size
# Look for <a:t> blocks with paragraph counts > what the container can hold
```

**Overflow Indicators:**
- Text box height < text content height (text spills below visible area)
- Table cells with > 150 characters per cell (content won't display properly)
- Bullet points > 6 per text box (typical container fits 4-6 at 14pt)
- Paragraphs > 3 lines each inside containers designed for short bullets
- Speaker notes content accidentally placed in slide body

### 1B: Fix Overflow — Content Density Rules

Apply these STRICT rules to ALL text containers:

| Container Type | Max Content | Font Size | Line Spacing |
|---|---|---|---|
| Slide Title | 2 lines max | 28-36pt | 1.0 |
| Subtitle / Tagline | 1-2 lines | 16-20pt | 1.0 |
| Body Text Box (full slide) | 6 bullet points max | 13-14pt | 1.15 |
| Body Text Box (half slide) | 4 bullet points max | 12-13pt | 1.1 |
| Table Cell — Header | 1 line, 8 words max | 11-12pt bold | 1.0 |
| Table Cell — Content | 2-3 lines max, 80 chars | 10-11pt | 1.0 |
| Maturity Level Cell | 2-3 sentences max | 10-11pt | 1.05 |
| Use Case Field | 3-4 short bullets max | 10-11pt | 1.05 |
| Speaker Notes | Unlimited (not displayed) | N/A | N/A |

### 1C: Content Redistribution Strategy

When content exceeds container capacity:

1. **CONDENSE** — Rewrite verbose paragraphs as concise bullet points (e.g., "Detect and prevent fraudulent activity by bank employees including unauthorized transactions, embezzlement, and collusion" → "Detect employee fraud: unauthorized transactions, embezzlement, collusion")

2. **MOVE TO SPEAKER NOTES** — Detailed explanations, FSDM entity references, regulatory citation details, and implementation specifics go into speaker notes. The slide shows the headline; notes carry the depth.

3. **SPLIT SLIDE** — If content genuinely needs more space, split one slide into two:
   - Part 1: Overview / Problem / Objectives
   - Part 2: Solution / Data / Outcome / Maturity

4. **USE TABLES PROPERLY** — For use case slides with 7 fields, use a structured table layout, NOT paragraph-style text crammed into a single text box.

### 1D: Table Content Fix Rules

For ALL tables in ALL files:

```
CRITICAL: Every table cell must have:
- internalMargin: top=0.05", bottom=0.05", left=0.08", right=0.08"
- Text must NOT touch cell borders
- autoFit=false (NEVER let text auto-shrink below 9pt — unreadable)
- If content won't fit at 10pt, SHORTEN the content
- wordWrap=true
- Each cell: max 80 characters or 3 short lines
```

### 1E: Use Case Slide Layout Fix

Use case slides (files 03, 05, 07, 09, 11, 13, 15) have 7 fields that overflow when filled with paragraphs. Apply this FIXED LAYOUT:

```
┌─────────────────────────────────────────────┐
│ [Category]              [Use Case Title]     │  ← Row 1: 0.5" tall
│ Owner: [Role]                                │
├──────────────────────┬──────────────────────┤
│ Objective            │ Business Benefit      │  ← Row 2: 1.2" tall
│ • Bullet 1           │ • Bullet 1           │
│ • Bullet 2           │ • Bullet 2           │
│ • Bullet 3           │ • Bullet 3           │
├──────────────────────┼──────────────────────┤
│ Source Data           │ Methodology          │  ← Row 3: 1.2" tall
│ • Data 1             │ • Method 1           │
│ • Data 2             │ • Method 2           │
│ • Data 3             │ • Method 3           │
├──────────────────────┼──────────────────────┤
│ Expected Outcome     │ Challenges            │  ← Row 4: 1.0" tall
│ • Outcome 1          │ • Challenge 1        │
│ • Outcome 2          │ • Challenge 2        │
├──────────────────────┴──────────────────────┤
│ POV Success Criteria: • Metric 1 • Metric 2 │  ← Row 5: 0.5" tall
└─────────────────────────────────────────────┘
```

Each bullet: MAX 15 words. Each field: MAX 3-4 bullets.
Detailed content goes in SPEAKER NOTES.

---

## STEP 2: TERADATA BRANDING REMOVAL

### 2A: Elements to Remove/Replace

| Element | Location | Action |
|---|---|---|
| Teradata logo (orange 'T') | Slide masters, layouts, individual slides | **REMOVE** — replace with theme logo |
| "Teradata" text in titles | Slide titles ("Teradata Business Value Framework") | **REPLACE** with "Banking Business Value Framework" |
| "Teradata" in body text | Throughout content | **REPLACE** with "Enterprise Data Warehouse" or "Integrated Analytics Platform" |
| Teradata color scheme | #F58220 (orange), #00539F (blue) | **REPLACE** with new theme colors |
| Footer: "Teradata Confidential" | Slide footers | **REPLACE** with selected brand footer |
| "Teradata" in speaker notes | Notes referencing "Teradata" | **KEEP** technical references (e.g., "Teradata FSDM") but **REMOVE** marketing text |
| Product names | "Teradata Vantage", "Teradata IntelliCloud" | **REPLACE** with generic: "Analytics Platform", "Cloud Data Warehouse" |
| Copyright notice | Footer/last slide | **REMOVE** or replace |

### 2B: FSDM References — KEEP

FSDM is a data model, not a product brand. Keep ALL references to:
- "FSDM" (Financial Services Data Model)
- FSDM entity names (INDVDL, ORGN, ACCT, EVNT, etc.)
- "BVF" (Business Value Framework) — rebrand to "Banking BVF"

### 2C: Implementation

```bash
# In unpacked slide XMLs, find-and-replace:
# "Teradata Business Value Framework" → "Banking Business Value Framework"  
# "Teradata" (standalone in body text) → "Enterprise Analytics Platform"
# Remove logo image references from slide masters
# Replace color hex values in theme XML
```

Work on slide masters and layouts FIRST — this cascades to all slides.

---

## STEP 3: THEME APPLICATION

### Two Theme Options — User Will Select One

---

### THEME A: GODAITEC

**Source:** https://godai.tech — "Smart Solutions in Software, Data & Digital Strategy"

**Brand Identity:**
- Company: Godaitec Private Limited (Karachi, Pakistan)
- Tagline: "Empowering Innovation: Your Full-Service Technology Thought Partner"
- Services: Data Solutions, Emerging Technologies, Solution Consulting, Software Development
- Industries: Finance & Banking (primary), Supply Chain, Manufacturing, Healthcare

**Color Palette:**
```
Primary:        #0D1B2A  (Deep Navy — dominant background for title/section slides)
Secondary:      #1B3A5C  (Steel Blue — content slide accents, table headers)
Accent:         #00B4D8  (Bright Cyan — highlights, call-to-action elements, icons)
Accent 2:       #48CAE4  (Light Cyan — secondary highlights, chart colors)
Background:     #FFFFFF  (White — content slide backgrounds)
Alt Background: #F0F4F8  (Ice Blue — alternate content slides for variety)
Text Primary:   #1A1A2E  (Near Black — headings)
Text Secondary: #4A5568  (Dark Gray — body text)
Text on Dark:   #E2E8F0  (Light Silver — text on navy backgrounds)
Success/Growth: #06D6A0  (Emerald — positive metrics, growth indicators)
Warning:        #FFD166  (Amber — caution indicators)
```

**Typography:**
```
Headings:       Calibri Bold (36-44pt on titles, 20-24pt on sections)
Body:           Calibri (13-14pt)
Data/Tables:    Calibri Light (10-12pt)
Accent Text:    Calibri Italic (for taglines, quotes)
```

**Visual Elements:**
- Clean, minimal design — white space is intentional
- Rounded corners on cards/containers (radius: 8-12px)
- Subtle gradient overlays on section header slides (Navy → Steel Blue)
- Icon style: Line icons in cyan circles
- Data visualization: Cyan/Emerald/Amber palette
- Footer: "Godaitec | Banking Business Value Framework | Confidential" + page number
- Logo: Godaitec logo (download from https://godai.tech/wp-content/uploads/elementor/thumbs/godaitec-logo-rblck4tcu2b00b7rxe587qtwhxl63f3radom3sz5z2.png)
- White logo variant for dark backgrounds

**Slide Templates:**

```
TITLE SLIDE (Navy background):
┌─────────────────────────────────────────────┐
│                                             │
│  [Godaitec Logo — white]                    │
│                                             │
│  BANKING BUSINESS VALUE FRAMEWORK           │  ← 36pt, White, Calibri Bold
│  [Domain Name]                              │  ← 20pt, Cyan accent
│                                             │
│  Prepared for [Client] | [Date]             │  ← 12pt, Light Silver
│                                             │
│  ─────────────── Cyan accent line ────────  │
│  Godaitec Private Limited                   │  ← 10pt, Light Silver
│  Smart Solutions in Software, Data          │
│  & Digital Strategy                         │
└─────────────────────────────────────────────┘

SECTION DIVIDER (Gradient Navy→Steel Blue):
┌─────────────────────────────────────────────┐
│                                             │
│  [Section Number]                           │  ← 60pt, Cyan, Bold
│  [Section Title]                            │  ← 32pt, White, Bold
│  [1-line description]                       │  ← 16pt, Light Silver
│                                             │
│  ─────── Thin cyan divider line ──────      │
│  [Godaitec logo small — bottom right]       │
└─────────────────────────────────────────────┘

CONTENT SLIDE (White background):
┌─────────────────────────────────────────────┐
│  [Domain Tag — Steel Blue bar]   [Page #]   │  ← Top bar: 0.35" height
│                                             │
│  [Slide Title]                              │  ← 24pt, Navy, Bold
│  [Subtitle if needed]                       │  ← 14pt, Dark Gray
│                                             │
│  [Content Area — see layout options below]  │
│                                             │
│                                             │
│                                             │
│  ──────────────────────────────────────────  │
│  Godaitec | Banking BVF | Confidential  [#] │  ← Footer: 8pt, Gray
└─────────────────────────────────────────────┘

CAPABILITY SLIDE (White + Ice Blue panels):
┌─────────────────────────────────────────────┐
│  [Domain Tag]                        [#]    │
│  [Capability Name]                          │  ← 24pt, Navy
│                                             │
│  ┌──────────────────┐ ┌──────────────────┐  │
│  │ Business          │ │ Data & Solution  │  │ ← Ice Blue cards
│  │ Objectives        │ │                  │  │    with Steel Blue
│  │ • Point 1         │ │ • Data source 1  │  │    headers
│  │ • Point 2         │ │ • Analytics 1    │  │
│  │ • Point 3         │ │ • Analytics 2    │  │
│  └──────────────────┘ └──────────────────┘  │
│  ┌──────────────────┐ ┌──────────────────┐  │
│  │ Expected Outcome │ │ Maturity Levels  │  │
│  │ • Result 1       │ │ Leading: ...     │  │
│  │ • Result 2       │ │ Practicing: ...  │  │
│  │ • Result 3       │ │ Emerging: ...    │  │
│  └──────────────────┘ └──────────────────┘  │
│  Footer                                     │
└─────────────────────────────────────────────┘

CHALLENGE SLIDE (White bg, accent left border):
┌─────────────────────────────────────────────┐
│  [Domain Tag]                        [#]    │
│  What are the challenges?                   │  ← 24pt, Navy
│                                             │
│  ┃ Challenge 1 Title                        │  ← Cyan left border
│  ┃ 2-3 line description                     │     10pt, per challenge
│  ┃                                          │
│  ┃ Challenge 2 Title                        │
│  ┃ 2-3 line description                     │
│  ┃                                          │
│  ┃ Challenge 3 Title                        │
│  ┃ 2-3 line description                     │
│  ┃                                          │
│  ┃ Challenge 4 Title                        │
│  ┃ 2-3 line description                     │
│                                             │
│  Footer                                     │
└─────────────────────────────────────────────┘

"ARE YOU ABLE TO" SLIDE (Navy bg):
┌─────────────────────────────────────────────┐
│  [Domain Tag — White text]           [#]    │
│                                             │
│  Are You Able To…                           │  ← 28pt, Cyan, Bold
│                                             │
│  ✦ Question 1 (2 lines max)                │  ← 14pt, White
│                                             │
│  ✦ Question 2 (2 lines max)                │
│                                             │
│  ✦ Question 3 (2 lines max)                │
│                                             │
│  Footer (white text)                        │
└─────────────────────────────────────────────┘

MATURITY SLIDE (table format):
┌─────────────────────────────────────────────┐
│  [Domain Tag]                        [#]    │
│  [Capability] — Maturity Levels             │  ← 24pt, Navy
│                                             │
│  ┌────────┬────────────────────────────┐    │
│  │Leading │ 2-3 sentence description   │    │ ← Emerald bg
│  ├────────┼────────────────────────────┤    │
│  │Innovate│ 2-3 sentence description   │    │ ← Cyan bg  
│  ├────────┼────────────────────────────┤    │
│  │Practice│ 2-3 sentence description   │    │ ← Steel Blue bg
│  ├────────┼────────────────────────────┤    │
│  │Develop │ 2-3 sentence description   │    │ ← Light Gray bg
│  ├────────┼────────────────────────────┤    │
│  │Emerging│ 2-3 sentence description   │    │ ← Amber bg
│  └────────┴────────────────────────────┘    │
│  Footer                                     │
└─────────────────────────────────────────────┘
```

---

### THEME B: HELLISYNTECH

**Source:** Hellisyntech — "Expert IT Services | Software & Web Solutions"

**Brand Identity:**
- Company: Hellisyntech (Pakistan-based IT services & consulting)
- Tagline: "Expert IT Services | Software & Web Solutions"
- Focus: Enterprise IT consulting, banking technology, digital transformation

**Color Palette:**
```
Primary:        #1A1A2E  (Dark Indigo — premium tech feel)
Secondary:      #16213E  (Midnight Blue — section backgrounds)
Accent:         #E94560  (Vibrant Coral Red — energy, call-to-action)
Accent 2:       #0F3460  (Royal Blue — supporting accent)
Background:     #FFFFFF  (White — content slides)
Alt Background: #F7F7FA  (Lavender White — alternate content)
Text Primary:   #1A1A2E  (Dark Indigo)
Text Secondary: #5A5A7A  (Muted Indigo-Gray)
Text on Dark:   #F0E6EF  (Soft Lavender White)
Success:        #00C9A7  (Teal Green — positive metrics)
Warning:        #FFC93C  (Golden Yellow)
```

**Typography:**
```
Headings:       Trebuchet MS Bold (modern tech feel)
Body:           Calibri (clean readability)
Data/Tables:    Calibri Light
Accent:         Trebuchet MS Italic
```

**Visual Elements:**
- Bold, high-contrast design — dark backgrounds with vibrant accents
- Angular geometric patterns (subtle tech-grid overlay on section slides)
- Icon style: Filled icons in coral circles or line icons on dark backgrounds
- Sharp-edged cards (no border-radius — modern angular feel)
- Gradient: Dark Indigo → Midnight Blue on headers
- Footer: "Hellisyntech | Banking BVF | Confidential" + page number
- Logo: [User to provide — placeholder: "HELLISYNTECH" in Trebuchet MS Bold + coral accent bar]

**Same slide templates as Theme A but with Theme B colors/typography applied.**

---

## STEP 4: GLOBAL / REGIONAL / PAKISTAN CONTENT LAYERING

### Three-Tier Content Model

For EVERY capability and use case slide, content must show THREE perspectives:

```
🌍 GLOBAL CONTEXT (1-2 lines)
   Industry-wide challenge/trend. Reference international standards,
   global benchmarks, and worldwide adoption patterns.
   
🌏 REGIONAL CONTEXT — South Asia & Middle East (1-2 lines)
   Regional regulatory landscape (RBI India, SAMA Saudi, CBUAE).
   Shared challenges: financial inclusion, Islamic banking, remittance
   corridors, FATF compliance, emerging market volatility.
   
🇵🇰 PAKISTAN CONTEXT (2-3 lines — primary focus)
   SBP regulations, KIBOR, CNIC/NADRA, RAAST/IBFT, ECIB, PKR
   denomination, Islamic banking, UBL-specific implementation context.
```

### How to Apply in Practice

**On the SLIDE itself** — keep it concise (fits in container):
```
"Credit risk modeling is a global imperative under Basel III/IV, with 
South Asian banks rapidly upgrading from Standardized to IRB approaches. 
In Pakistan, SBP requires Basel III CAR of 11.5%+ with IFRS 9 ECL 
provisioning — creating urgent need for integrated PD/LGD/EAD engines 
spanning the bank's 4-5 core systems."
```

**In SPEAKER NOTES** — full depth:
```
GLOBAL: Basel Committee finalized Basel III.1 reforms with 2028 
implementation deadline. 80%+ of G-SIBs now use IRB models.

REGIONAL: India (RBI) mandated IRB for top 10 banks by 2025. 
Saudi Arabia (SAMA) completed Basel III implementation. UAE (CBUAE) 
requires Standardized with IRB roadmap. Pakistan lags peer markets — 
still primarily Standardized Approach.

PAKISTAN: SBP Basel III capital adequacy framework requires minimum 
CAR 11.5% (CET1 6%, AT1 1.5%, Tier 2 2%, CCB 2.5%) with D-SIB 
surcharge 1-1.5% for 5 systemically important banks. Only 2-3 banks 
exploring IRB feasibility. IFRS 9 ECL models operational but model 
validation frameworks immature. ECIB provides bureau data but 
advanced analytics capability limited.
```

### Regional Reference Points to Use

| Country | Regulator | Key Regulations | Currency |
|---|---|---|---|
| Pakistan | SBP, SECP, FBR | Basel III, IFRS 9, AML/CFT, PRs | PKR |
| India | RBI | Basel III, Ind AS 109, AML | INR |
| Saudi Arabia | SAMA | Basel III, IFRS 9, AML | SAR |
| UAE | CBUAE | Basel III, IFRS 9, AML | AED |
| Bangladesh | BB | Basel III (phased), IFRS 9 | BDT |
| Sri Lanka | CBSL | Basel III, IFRS 9 | LKR |

---

## STEP 5: ADD SUPPLEMENTARY SLIDES WHERE NEEDED

### 5A: Mandatory New Slides (Add to EVERY file)

**Slide A — Domain Dashboard (add after title slide in each file):**
```
[Domain Name] — At a Glance

┌──────────────┬──────────────┬──────────────┐
│ GLOBAL       │ REGIONAL     │ PAKISTAN      │
│              │              │              │
│ Key metric 1 │ Key metric 1 │ Key metric 1 │
│ Key metric 2 │ Key metric 2 │ Key metric 2 │
│ Key metric 3 │ Key metric 3 │ Key metric 3 │
│              │ (SA/ME)      │ (SBP/KIBOR)  │
└──────────────┴──────────────┴──────────────┘

# of BVF Sub-capabilities: [X]
# of FSDM Entities (Domain): [X]  
# of BACR Assessment Questions: [X]
# of Use Cases: [X]
Typical Pakistan Bank Maturity: Level [X]
```

**Slide B — Pakistan Market Context (add before challenges slide in each file):**
```
Pakistan Banking Sector — [Domain] Context

Key statistics relevant to this domain:
• Banking assets: PKR 32T+ (2024)
• [Domain-specific stat 1]
• [Domain-specific stat 2]
• [Domain-specific stat 3]

Key regulators: SBP, SECP, [others relevant to domain]
Key regulations: [2-3 most relevant to domain]

Competitive landscape:
• Traditional banks: [context]
• Digital/fintech: [context]  
• Islamic banking: [context]
```

**Slide C — Implementation Roadmap (add as second-to-last slide in each file):**
```
[Domain] — Implementation Roadmap

Phase 1 (0-6 months): Foundation
• Data integration from core systems → FSDM
• [Domain-specific quick wins]

Phase 2 (6-18 months): Core Capabilities  
• [Domain-specific analytics deployment]
• [Key use cases — priority order]

Phase 3 (18-36 months): Advanced Analytics
• [ML/AI use cases]
• [Real-time capabilities]

Dependencies: [Key systems, data, organizational]
Investment Range: PKR [X]-[X]
Expected ROI: [X]x within [X] years
```

### 5B: Split Overflowing Slides

Any slide where content audit (Step 1) shows >40% overflow MUST be split:
- Overview slides → split into "Overview" + "Deep Dive"
- Use case slides with dense content → split into "Business Context" + "Technical Solution"
- Challenge slides with 5+ challenges → split into "External Challenges" + "Internal Challenges"

---

## STEP 6: VISUAL QA

### Mandatory for Every File

```bash
# Convert to PDF then images
python scripts/office/soffice.py --headless --convert-to pdf OUTPUT.pptx
pdftoppm -jpeg -r 150 OUTPUT.pdf qa-slide

# Verify visually — use subagent
```

### QA Checklist (Every Slide)

```
□ No text overflow — all content fits within containers
□ No text touching cell/box borders (minimum 0.05" padding)
□ Font size ≥ 10pt everywhere (nothing unreadably small)
□ No Teradata logos, orange (#F58220), or "Teradata" text visible
□ Theme colors applied consistently
□ Footer shows correct brand (Godaitec or Hellisyntech)
□ Slide title readable (28-36pt, strong contrast)
□ No more than 6 bullet points per content area
□ Tables: max 3 lines per cell, no text cut-off
□ Speaker notes present with Global/Regional/Pakistan depth
□ Page numbers correct and sequential
□ No blank/empty slides or leftover "Point 1" placeholders
□ Maturity level tables: all 5 levels populated, color-coded
□ Images/shapes not overlapping text
□ Consistent spacing — no cramped areas next to empty areas
```

### Overflow-Specific QA

```bash
# After conversion to images, check EVERY slide for:
# 1. Text running off bottom of text boxes
# 2. Table cells with clipped content
# 3. Overlapping elements
# 4. Text smaller than 10pt (squished to fit)

# If ANY of these are found → fix and re-render
```

---

## TECHNICAL IMPLEMENTATION

### Recommended Approach: PptxGenJS (Create from Scratch)

Given the severity of overflow issues and complete theme change, **rebuilding slides from scratch using PptxGenJS** is more reliable than XML editing:

```bash
# Read pptxgenjs.md for full guide
cat /mnt/skills/public/pptx/pptxgenjs.md
```

**Workflow:**
1. Extract ALL text content from existing slides using markitdown
2. Apply content density rules (Step 1) to condense
3. Generate new slides using PptxGenJS with theme templates
4. Add speaker notes from original content + new Global/Regional context
5. Visual QA

### Alternative: XML Edit (For files with minimal overflow)

If a file has < 5 overflow slides:
1. Unpack existing PPTX
2. Edit theme XML for colors/branding
3. Fix specific overflow slides (reduce text, adjust font size)
4. Clean and repack

### File Processing Order

Process in dependency order:
1. **File 01** (Introduction) — sets the overall framework
2. **Files 02-11** (Domain overviews + use cases) — core content
3. **Files 12-16** (Risk, Security, Compliance) — heaviest content
4. Do one file end-to-end as proof of concept, then batch the rest

---

## CONTENT CONDENSATION EXAMPLES

### Before (Overflowing):
```
Objective / Problem Statement:
Develop credit scoring models for customers with no prior lending history — 
the "thin file" or "new-to-credit" segment representing 70% of Pakistan's 
adult population (financial inclusion at ~30%). Traditional bureau-based 
scoring fails for individuals without ECIB history. Banks miss profitable 
lending opportunities in the unbanked/underbanked segment while competitors 
(JazzCash, SadaPay) advance digital lending without traditional credit data.
```

### After (Fits in table cell):
```
Objective:
• Score "thin file" customers (70% of Pakistan adults lack ECIB history)
• Build alternative data models using mobile/utility/RAAST patterns
• Expand addressable lending market by 40-60%
```

### Moved to Speaker Notes:
```
Traditional bureau-based scoring fails for the 70% of Pakistan's adult 
population without ECIB credit history. The "new-to-credit" segment 
represents the largest untapped lending market. Competitors like JazzCash 
and SadaPay are already using alternative data (mobile wallet transactions, 
utility payments) for digital lending. Banks must build alternative scoring 
capabilities using FSDM's Event and Transaction entities (EVNT, TXN) to 
capture mobile money, RAAST, and utility payment data as credit signals. 
Globally, alternative data scoring has been proven in India (IndiaStack), 
Kenya (M-Pesa), and China (Ant Financial) with Gini improvements of 
10-20 points over traditional bureau-only models.
```

---

## BRAND APPLICATION DECISION

**The user will select Theme A (Godaitec) or Theme B (Hellisyntech) before execution.**

If no selection is made, default to Theme A (Godaitec) since the website is live and accessible.

For the selected theme:
1. Download/create logo assets
2. Apply color palette to slide masters
3. Set typography in theme XML
4. Create footer template
5. Apply consistently across ALL 16 files

---

## DELIVERABLES

For each of the 16 files:
```
./pptout/[NN]_[Name]_FINAL.pptx       ← Cleaned, rebranded, themed presentation
./pptout/qa/[NN]_slide-*.jpg           ← QA images for visual verification
```

Summary report:
```
./pptout/CLEANUP_REPORT.md             ← Document listing:
                                          - Slides fixed per file
                                          - Content moved to speaker notes
                                          - Slides added
                                          - Branding changes made
                                          - QA issues found and resolved
```
