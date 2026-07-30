# PROMPT: BVF PowerPoint — Full Cleanup, Rebrand & Theme (GODAITEC Edition)

## Role

You are a senior presentation designer and banking strategy consultant with 20+ years experience creating executive-quality slide decks for banking/financial services consulting engagements across South Asia and the Middle East. You are an expert in PptxGenJS (preferred for from-scratch builds), python-pptx, and XML-level PPTX manipulation. You deeply understand visual hierarchy, content density management, table overflow prevention, and professional corporate theming. You have worked with Teradata FSDM, Basel III/IV, IFRS 9, SBP regulations, and data warehouse modernization programs for Pakistan's top banks.

---

## Problem Statement

The Banking Business Value Framework (BVF) PowerPoint deck consists of 16 PPTX files that have critical issues requiring a complete rebuild:

1. **CONTENT OVERFLOW** — Text leaks out of tables, text boxes, and placeholder shapes. Slides are chaotic and unreadable. Content intended for 3-4 bullet points was replaced with 5-10 dense paragraphs that overflow containers. Tables have cells with 200+ characters that clip and become invisible.
2. **TERADATA BRANDING** — All slides carry Teradata logos, Teradata orange (#F58220) and blue (#00539F) colors, footer text ("Teradata Confidential"), and "Teradata Business Value Framework" branding that must be completely neutralized and replaced with Godaitec branding.
3. **MISSING GLOBAL/REGIONAL PERSPECTIVE** — Content is either generic-Teradata or Pakistan-only. Every capability and use case needs three-tier layering: Global → Regional (South Asia/Middle East) → Pakistan.
4. **NO UNIFIED THEME** — Files have inconsistent formatting after XML-level text edits broke visual consistency. Need a complete, uniform Godaitec brand theme across all 16 files.
5. **MISSING SUPPLEMENTARY SLIDES** — Each file needs new slides: Domain Dashboard, Pakistan Market Context, Implementation Roadmap.

---

## Objective

Rebuild ALL 16 BVF PowerPoint files with Godaitec branding, producing clean, readable, professionally themed presentations.

```
INPUT:  ./pptout/*_UPDATED.pptx  (or original *.pptx if no _UPDATED exists)
OUTPUT: ./pptout/godaitec/[NN]_[Name].pptx
```

---

## Reference Data (Local Repo) — Read FIRST

```
./OVERVIEW.md                                           # Full pipeline context, 16 FSDM domains, BVF structure
./fsdm_output/fsdm_analysis_report.json                 # 3,917 FSDM entities
./fsdm_output/fsdm_domain_classification.csv            # Entity-domain mapping
./bvf_fsdm_output/bvf_fsdm_integration_report.json      # 360 BVF→FSDM mappings
./bvf_output/bvf_analysis_report.json                   # 112 BVF sub-capabilities
./bacr_output/bacr_analysis_report.json                 # 793 BACR questions across 8 categories
./erwin_parser_output/fsdm_entity_summary.csv            # UBL ERwin v13 entities
./bvf_fsdm_output/profitability_star_schema.sql          # Star schema with customer/product/channel dimensions
```

Read these files FIRST to inform all content decisions.

---

## FILES TO PROCESS (ALL 16)

| # | File | Slides | Content Severity |
|---|------|--------|-----------------|
| 01 | Introduction_Industry_Challenges | 12 | Medium — enrichment |
| 02 | Marketing_CX_Overview | 23 | Medium — enrichment, stats update |
| 03 | Marketing_CX_Use_Cases | ~24 | Heavy — many "Point 1" placeholders |
| 04 | Profitability_Overview | ~40 | Medium — enrichment |
| 05 | Profitability_Use_Cases | ~24 | Heavy — placeholder use cases |
| 06 | Operational_Efficiency_Overview | ~50 | Medium — enrichment |
| 07 | Operational_Efficiency_Use_Cases | ~24 | Heavy — placeholder use cases |
| 08 | Revenue_Integrity_Overview | ~45 | Medium — enrichment |
| 09 | Revenue_Integrity_Use_Cases | ~24 | Heavy — placeholder use cases |
| 10 | Finance_Overview | ~50 | Medium — enrichment |
| 11 | Finance_Use_Cases | ~24 | Heavy — placeholder use cases |
| 12 | Risk_Management | 60 | Heavy — ~12 empty placeholder slides |
| 13 | Risk_Management_Use_Cases | 24 | Very Heavy — ~20 "Point 1" placeholders |
| 14 | Security_Fraud_Overview | 60 | Heavy — ~20 empty slides |
| 15 | Security_Fraud_Use_Cases | 41 | Extreme — 40 of 41 slides are "Point 1" |
| 16 | Regulatory_Compliance | 45 | Heavy — ~20 empty slides |

---

## GODAITEC BRAND THEME — COMPLETE SPECIFICATION

### Brand Identity

- **Company:** Godaitec Private Limited (Karachi, Pakistan)
- **Website:** https://godai.tech
- **Tagline:** "Empowering Innovation: Your Full-Service Technology Thought Partner"
- **Secondary:** "Smart Solutions in Software, Data & Digital Strategy"
- **Services:** Data Solutions, Emerging Technologies, Solution Consulting, Software Development
- **Primary Industries:** Finance & Banking, Supply Chain & Logistics, Manufacturing, Healthcare & Genomics, Travel & Tourism, Retail & FMCGs
- **Engagement Model:** Consulting → Implementation → Managed Service → BPO
- **Contact:** +92 213 3326866 | info@godai.tech

### Logo Assets

```
Dark logo (for white backgrounds):
  Source page: https://godai.tech (header logo)
  File: godaitec-logo (navy text on transparent)

White logo (for dark backgrounds):
  Source: https://godai.tech (footer area)
  File: godaitec-logo-white (white text on transparent)
```

Download both logo images and embed in slide masters. If download fails, create text-based logo: "GODAITEC" in Calibri Bold 18pt, primary navy color, with a cyan accent dot after the "C".

### Color Palette

```
┌──────────────────────┬───────────┬──────────────────────────────────────────┐
│ Role                 │ Hex       │ Usage                                    │
├──────────────────────┼───────────┼──────────────────────────────────────────┤
│ Primary              │ #0D1B2A   │ Title slide bg, section divider bg,      │
│ (Deep Navy)          │           │ heading text on light slides             │
├──────────────────────┼───────────┼──────────────────────────────────────────┤
│ Secondary            │ #1B3A5C   │ Table headers, sidebar accents,          │
│ (Steel Blue)         │           │ domain tag bar, top accent strips        │
├──────────────────────┼───────────┼──────────────────────────────────────────┤
│ Accent               │ #00B4D8   │ Highlights, CTAs, icon circles,          │
│ (Bright Cyan)        │           │ accent lines, active states              │
├──────────────────────┼───────────┼──────────────────────────────────────────┤
│ Accent 2             │ #48CAE4   │ Secondary highlights, chart colors,      │
│ (Light Cyan)         │           │ hover states, lighter accent areas       │
├──────────────────────┼───────────┼──────────────────────────────────────────┤
│ Background           │ #FFFFFF   │ Content slide backgrounds                │
│ (Pure White)         │           │                                          │
├──────────────────────┼───────────┼──────────────────────────────────────────┤
│ Alt Background       │ #F0F4F8   │ Alternate content slides, card panels,   │
│ (Ice Blue)           │           │ table alternating rows                   │
├──────────────────────┼───────────┼──────────────────────────────────────────┤
│ Text Primary         │ #1A1A2E   │ Headings on light backgrounds            │
│ (Near Black)         │           │                                          │
├──────────────────────┼───────────┼──────────────────────────────────────────┤
│ Text Secondary       │ #4A5568   │ Body text, descriptions, bullets         │
│ (Dark Gray)          │           │                                          │
├──────────────────────┼───────────┼──────────────────────────────────────────┤
│ Text on Dark         │ #E2E8F0   │ Body text on navy/dark backgrounds       │
│ (Light Silver)       │           │                                          │
├──────────────────────┼───────────┼──────────────────────────────────────────┤
│ Success              │ #06D6A0   │ Positive metrics, growth, "Leading"      │
│ (Emerald)            │           │ maturity level                           │
├──────────────────────┼───────────┼──────────────────────────────────────────┤
│ Warning              │ #FFD166   │ Caution, "Emerging" maturity level       │
│ (Amber)              │           │                                          │
├──────────────────────┼───────────┼──────────────────────────────────────────┤
│ Border/Divider       │ #CBD5E1   │ Subtle lines, table borders, separators  │
│ (Slate Gray)         │           │                                          │
└──────────────────────┴───────────┴──────────────────────────────────────────┘
```

### Typography

```
Headings:    Calibri Bold
             → Slide titles on dark bg: 36-44pt, white (#FFFFFF)
             → Slide titles on light bg: 28-36pt, navy (#0D1B2A)
             → Section headers: 20-24pt
             → Card/panel headers: 14-16pt bold

Body:        Calibri Regular
             → On light bg: 13-14pt, dark gray (#4A5568)
             → On dark bg: 13-14pt, light silver (#E2E8F0)
             → Bullets: 12-13pt

Tables:      Calibri Light
             → Header: 11-12pt bold, white on steel blue bg
             → Content: 10-11pt, dark gray
             → NEVER below 9pt anywhere

Accent:      Calibri Italic (taglines, quotes, callouts)
Monospace:   Consolas 10pt (FSDM entity names in speaker notes)
```

### Slide Master Templates

**APPLY THESE EXACT LAYOUTS to every slide in every file.**

---

#### TEMPLATE 1: Title Slide (Deep Navy Background)

```
Dimensions: 13.333" × 7.5" (widescreen 16:9)
Background: Solid #0D1B2A

┌─────────────────────────────────────────────────────────┐
│  [0.5", 0.4"]                                           │
│  Godaitec White Logo (2.0" × 0.5")                      │
│                                                         │
│                                                         │
│  [0.8", 2.2"]                                           │
│  BANKING BUSINESS VALUE FRAMEWORK                       │  36pt Calibri Bold White
│                                                         │
│  [0.8", 3.0"]                                           │
│  [Domain Name — e.g. "Marketing & Customer Experience"] │  22pt Calibri Bold #00B4D8
│                                                         │
│  [0.8", 3.8"]                                           │
│  ──────────── (Cyan line, 3" wide, 1.5pt)               │
│                                                         │
│  [0.8", 4.3"]                                           │
│  Pakistan Banking Edition | 2025-2026                   │  14pt Calibri #E2E8F0
│                                                         │
│                                                         │
│  [0.5", 6.7"]                                           │
│  Godaitec Private Limited                               │  9pt Calibri #8899AA
│  Smart Solutions in Software, Data & Digital Strategy    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

#### TEMPLATE 2: Section Divider (Gradient Navy → Steel Blue)

```
Background: Gradient left-to-right #0D1B2A → #1B3A5C

┌─────────────────────────────────────────────────────────┐
│                                                         │
│  [0.8", 1.5"]                                           │
│  [Section Number: "01"]                                 │  64pt Calibri Bold #00B4D8
│                                                         │
│  [0.8", 2.8"]                                           │
│  [Section Title]                                        │  36pt Calibri Bold White
│                                                         │
│  [0.8", 3.6"]                                           │
│  [1-line description]                                   │  16pt Calibri #E2E8F0
│                                                         │
│  [0.8", 4.4"]                                           │
│  ──────── (Cyan line, 2" wide, 1.5pt)                   │
│                                                         │
│                                          [Logo bottom-  │
│                                           right, white] │
│  [footer bar 0.3" — #0A1520 bg]                         │
│  Godaitec | Banking BVF | Confidential         [pg #]   │  8pt #8899AA
└─────────────────────────────────────────────────────────┘
```

---

#### TEMPLATE 3: Content Slide (White Background)

```
Background: #FFFFFF

┌─────────────────────────────────────────────────────────┐
│  [Top bar: full width × 0.35" — #1B3A5C (Steel Blue)]  │
│  [Domain Name — white text — 10pt — left aligned 0.5"] │
│  [Page # — white — right aligned]                      │
│                                                         │
│  [0.5", 0.7"]                                           │
│  [Slide Title]                                          │  24-28pt Calibri Bold #0D1B2A
│                                                         │
│  [0.5", 1.3"]                                           │
│  [Subtitle / description]                               │  14pt Calibri #4A5568
│                                                         │
│  [0.5", 1.8" — Content area to 6.8"]                    │
│  ┌─────────────────────────────────────────────────┐    │
│  │                                                 │    │
│  │  [CONTENT — see layout options below]           │    │
│  │  Max 6 bullets per area                         │    │
│  │  Max 15 words per bullet                        │    │
│  │  12-14pt Calibri #4A5568                        │    │
│  │                                                 │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  [Footer line: 0.5pt #CBD5E1 at y=6.95"]                │
│  Godaitec | Banking BVF | Confidential         [pg #]   │  8pt #8899AA
└─────────────────────────────────────────────────────────┘
```

---

#### TEMPLATE 4: Capability Detail Slide (2×2 Card Grid)

```
Background: #FFFFFF | Top bar: Steel Blue

┌─────────────────────────────────────────────────────────┐
│  [Steel Blue top bar with domain name]           [#]    │
│                                                         │
│  [Capability Name]                                      │  24pt Bold Navy
│  [1-line description]                                   │  13pt Gray
│                                                         │
│  ┌─────────────────────┐  ┌─────────────────────┐      │
│  │ ▸ Business           │  │ ▸ Data & Analytics  │      │
│  │   Objectives         │  │   Solution          │      │  Ice Blue cards
│  │                      │  │                     │      │  (#F0F4F8 fill)
│  │ • Bullet 1 (≤15 wds)│  │ • Bullet 1          │      │  Steel Blue header
│  │ • Bullet 2           │  │ • Bullet 2          │      │  1px #CBD5E1 border
│  │ • Bullet 3           │  │ • Bullet 3          │      │  0.15" internal padding
│  │ • Bullet 4           │  │ • Bullet 4          │      │
│  └─────────────────────┘  └─────────────────────┘      │
│  ┌─────────────────────┐  ┌─────────────────────┐      │
│  │ ▸ Expected Outcome  │  │ ▸ Maturity Levels   │      │
│  │                      │  │                     │      │
│  │ • Result 1           │  │ Leading: ...        │      │
│  │ • Result 2           │  │ Practicing: ...     │      │
│  │ • Result 3           │  │ Emerging: ...       │      │
│  └─────────────────────┘  └─────────────────────┘      │
│                                                         │
│  Footer                                                 │
└─────────────────────────────────────────────────────────┘

Card specs:
  Width: 5.8" each (for 2-column), gap: 0.3"
  Height: 2.2" each, gap: 0.2"
  Fill: #F0F4F8 (Ice Blue)
  Border: 1px #CBD5E1
  Corner radius: 6px (0.06")
  Header: 14pt Bold #1B3A5C inside card, top-aligned
  Body: 12pt #4A5568, bullet list
  Internal margin: 0.15" all sides
```

---

#### TEMPLATE 5: Challenge Slide (Left Accent Border)

```
Background: #FFFFFF | Top bar: Steel Blue

┌─────────────────────────────────────────────────────────┐
│  [Steel Blue top bar]                            [#]    │
│                                                         │
│  What are the challenges?                               │  24pt Bold Navy
│  [Overall challenge statement — 1-2 lines]              │  13pt Gray Italic
│                                                         │
│  ┃  [Challenge 1 Title]                                 │  ┃ = 3px Cyan border
│  ┃  2-3 line description. Max 50 words.                 │  Title: 14pt Bold Navy
│  ┃                                                      │  Body: 12pt Gray
│                                                         │
│  ┃  [Challenge 2 Title]                                 │  0.4" gap between
│  ┃  2-3 line description. Max 50 words.                 │  challenge blocks
│  ┃                                                      │
│                                                         │
│  ┃  [Challenge 3 Title]                                 │
│  ┃  2-3 line description. Max 50 words.                 │
│  ┃                                                      │
│                                                         │
│  ┃  [Challenge 4 Title]                                 │
│  ┃  2-3 line description. Max 50 words.                 │
│                                                         │
│  Footer                                                 │
└─────────────────────────────────────────────────────────┘

Max 4 challenges per slide. If 5+, split into two slides.
Each challenge: title (14pt bold) + body (12pt, 2-3 lines max).
Left border: 3px #00B4D8, positioned at x=0.5", height matches text block.
```

---

#### TEMPLATE 6: "Are You Able To…" Slide (Navy Background)

```
Background: #0D1B2A

┌─────────────────────────────────────────────────────────┐
│  [Domain — 10pt white, top-left]                 [#]    │
│                                                         │
│  Are You Able To…                                       │  28pt Bold #00B4D8
│                                                         │
│  ✦  Question 1 — max 2 lines, max 25 words             │  14pt Calibri #E2E8F0
│                                                         │
│  ✦  Question 2 — max 2 lines, max 25 words             │  0.45" gap between
│                                                         │
│  ✦  Question 3 — max 2 lines, max 25 words             │  questions
│                                                         │
│  (If space allows, max 5 questions)                     │
│                                                         │
│  [Footer — white on dark]                               │
└─────────────────────────────────────────────────────────┘

✦ = Cyan diamond bullet (Unicode ✦ or ◆ in #00B4D8)
Max 3-5 questions per slide. If more, split into 2 slides.
```

---

#### TEMPLATE 7: Maturity Level Table

```
Background: #FFFFFF | Top bar: Steel Blue

┌─────────────────────────────────────────────────────────┐
│  [Steel Blue top bar]                            [#]    │
│                                                         │
│  [Capability] — Maturity Levels                         │  24pt Bold Navy
│                                                         │
│  ┌──────────┬──────────────────────────────────────┐    │
│  │ Leading  │ 2-3 sentences max. 10-11pt.          │    │  Fill: #06D6A0 (Emerald)
│  │          │ White text.                          │    │  Text: White
│  ├──────────┼──────────────────────────────────────┤    │
│  │ Innovate │ 2-3 sentences max. 10-11pt.          │    │  Fill: #00B4D8 (Cyan)
│  │          │ White text.                          │    │  Text: White
│  ├──────────┼──────────────────────────────────────┤    │
│  │ Practice │ 2-3 sentences max. 10-11pt.          │    │  Fill: #1B3A5C (Steel)
│  │          │ White text.                          │    │  Text: White
│  ├──────────┼──────────────────────────────────────┤    │
│  │ Develop  │ 2-3 sentences max. 10-11pt.          │    │  Fill: #F0F4F8 (Ice Blue)
│  │          │ Dark text.                           │    │  Text: #4A5568
│  ├──────────┼──────────────────────────────────────┤    │
│  │ Emerging │ 2-3 sentences max. 10-11pt.          │    │  Fill: #FFD166 (Amber)
│  │          │ Dark text.                           │    │  Text: #1A1A2E
│  └──────────┴──────────────────────────────────────┘    │
│                                                         │
│  Footer                                                 │
└─────────────────────────────────────────────────────────┘

Table specs:
  Left column: 1.2" wide, label vertically centered, 12pt Bold, white text
  Right column: 10.3" wide, content, 10-11pt
  Row height: 0.9" each (fits 2-3 lines at 10-11pt with padding)
  Cell padding: top=0.06", bottom=0.06", left=0.1", right=0.1"
  Border: 1px white between rows
```

---

#### TEMPLATE 8: Use Case Slide (2×3 Card Grid)

```
Background: #FFFFFF | Top bar: Steel Blue

┌─────────────────────────────────────────────────────────┐
│  [Category — Steel Blue bar]   [Use Case Title]  [#]   │  Top bar: 0.45"
│  Owner: [Role]                                          │  10pt white
│                                                         │
│  ┌─────────────────────┐  ┌─────────────────────┐      │
│  │ 🎯 Objective        │  │ 💰 Business Benefit │      │  Card: 5.8" × 1.4"
│  │ • Bullet 1 (≤15 wds)│  │ • Bullet 1          │      │  Fill: #F0F4F8
│  │ • Bullet 2          │  │ • Bullet 2          │      │  Header: 11pt Bold
│  │ • Bullet 3          │  │ • Bullet 3          │      │  #1B3A5C
│  └─────────────────────┘  └─────────────────────┘      │  Body: 10pt #4A5568
│  ┌─────────────────────┐  ┌─────────────────────┐      │
│  │ 📊 Source Data      │  │ 🔬 Methodology      │      │
│  │ • Data 1            │  │ • Method 1          │      │
│  │ • Data 2            │  │ • Method 2          │      │
│  │ • Data 3            │  │ • Method 3          │      │
│  └─────────────────────┘  └─────────────────────┘      │
│  ┌─────────────────────┐  ┌─────────────────────┐      │
│  │ ✅ Expected Outcome │  │ ⚠️ Challenges       │      │
│  │ • Result 1          │  │ • Issue 1           │      │
│  │ • Result 2          │  │ • Issue 2           │      │
│  └─────────────────────┘  └─────────────────────┘      │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 🏆 POV Success: Metric 1 | Metric 2 | Metric 3│    │  Cyan accent bar
│  └─────────────────────────────────────────────────┘    │  Fill: #00B4D8
│  Footer                                                 │  Text: White 10pt
└─────────────────────────────────────────────────────────┘

Each card: max 3-4 bullets, max 15 words per bullet.
POV bar: single row, 3-4 metrics, separated by " | ".
Detailed content → speaker notes.
```

---

#### TEMPLATE 9: Pakistan Market Context Slide (NEW — add to every file)

```
Background: #FFFFFF | Top bar: Steel Blue

┌─────────────────────────────────────────────────────────┐
│  [Steel Blue top bar]                            [#]    │
│                                                         │
│  🇵🇰 Pakistan Banking Sector — [Domain] Context        │  24pt Bold Navy
│                                                         │
│  ┌────────────────────────────────────────────────┐     │
│  │ KEY STATISTICS (2024-2025)                      │     │  Ice Blue panel
│  │                                                │     │
│  │  Banking Assets    PKR 32T+                    │     │  Large stat callouts
│  │  Bank Accounts     60M+                        │     │  28pt Bold numbers
│  │  Mobile Wallets    100M+                       │     │  12pt labels
│  │  RAAST Monthly     PKR 1.5T+                   │     │
│  │  Inclusion Rate    30% (target 50% by 2028)    │     │
│  └────────────────────────────────────────────────┘     │
│                                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                │
│  │Regulators│ │Key Regs  │ │Landscape │                │  3 info cards
│  │SBP, SECP │ │Basel III │ │33 banks  │                │
│  │FBR, FMU  │ │IFRS 9    │ │5 Islamic │                │
│  │PTA       │ │AML/CFT   │ │5 digital │                │
│  └──────────┘ └──────────┘ └──────────┘                │
│  Footer                                                 │
└─────────────────────────────────────────────────────────┘
```

---

#### TEMPLATE 10: Domain Dashboard Slide (NEW — add after title in every file)

```
Background: #F0F4F8 (Ice Blue)

┌─────────────────────────────────────────────────────────┐
│  [Steel Blue top bar]                            [#]    │
│                                                         │
│  [Domain Name] — At a Glance                            │  28pt Bold Navy
│                                                         │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐          │
│  │  🌍 GLOBAL │ │  🌏 REGION │ │  🇵🇰 PAKISTAN│          │
│  │            │ │  (SA/ME)   │ │            │          │
│  │ Metric 1   │ │ Metric 1   │ │ Metric 1   │          │  3-column comparison
│  │ Metric 2   │ │ Metric 2   │ │ Metric 2   │          │  White cards on
│  │ Metric 3   │ │ Metric 3   │ │ Metric 3   │          │  Ice Blue bg
│  └────────────┘ └────────────┘ └────────────┘          │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ BVF Sub-capabilities: [X] │ FSDM Entities: [X] │    │  Steel Blue info bar
│  │ BACR Questions: [X]       │ Use Cases: [X]      │    │
│  │ Typical PK Maturity: Level [X]                  │    │
│  └─────────────────────────────────────────────────┘    │
│  Footer                                                 │
└─────────────────────────────────────────────────────────┘
```

---

#### TEMPLATE 11: Implementation Roadmap Slide (NEW — add as 2nd-to-last slide)

```
Background: #FFFFFF

┌─────────────────────────────────────────────────────────┐
│  [Steel Blue top bar]                            [#]    │
│                                                         │
│  [Domain] — Implementation Roadmap                      │  24pt Bold Navy
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │                                                 │    │
│  │  Phase 1          Phase 2          Phase 3      │    │  Timeline visual
│  │  0-6 months       6-18 months      18-36 months │    │
│  │  ──●──────────────●──────────────●──            │    │  Cyan timeline line
│  │                                                 │    │  with dot markers
│  │  Foundation       Core Analytics   Advanced AI  │    │
│  │  • Quick win 1    • Capability 1   • ML models  │    │
│  │  • Quick win 2    • Capability 2   • Real-time  │    │
│  │  • Quick win 3    • Capability 3   • Automation │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌──────────────────┐  ┌──────────────────┐            │
│  │ Investment Range  │  │ Expected ROI     │            │  2 summary cards
│  │ PKR [X]-[X]      │  │ [X]x in [X] yrs  │            │
│  └──────────────────┘  └──────────────────┘            │
│  Footer                                                 │
└─────────────────────────────────────────────────────────┘
```

---

## STEP 1: CONTENT OVERFLOW AUDIT & FIX

This is the MOST CRITICAL step. Every slide must be readable.

### 1A: Content Density Rules (STRICT — apply to ALL slides)

| Container Type | Max Lines | Max Words/Line | Font Size | Line Spacing |
|---|---|---|---|---|
| Slide Title | 2 | 10 | 28-36pt | 1.0 |
| Subtitle / Tagline | 2 | 12 | 14-20pt | 1.0 |
| Body text box (full width) | 6 bullets | 15 words each | 13-14pt | 1.15 |
| Body text box (half width) | 4 bullets | 12 words each | 12-13pt | 1.1 |
| Table cell — header | 1 line | 8 words | 11-12pt bold | 1.0 |
| Table cell — content | 3 lines max | 12 words/line | 10-11pt | 1.05 |
| Maturity level cell | 3 sentences | 15 words each | 10-11pt | 1.05 |
| Use case card field | 3-4 bullets | 12 words each | 10-11pt | 1.05 |
| Card header | 1 line | 4 words | 11-12pt bold | 1.0 |
| Footer | 1 line | N/A | 8pt | 1.0 |
| Speaker notes | Unlimited | Unlimited | N/A | N/A |

### 1B: When Content Exceeds Container

1. **CONDENSE** — Rewrite verbose paragraphs as concise bullets
   - BEFORE: "Develop credit scoring models for customers with no prior lending history representing 70% of Pakistan's adult population where financial inclusion stands at approximately 30%"
   - AFTER: "• Score thin-file customers (70% of adults lack ECIB history)"

2. **MOVE TO SPEAKER NOTES** — Detailed explanations, FSDM entity references, regulatory citations, statistical backing, implementation specifics

3. **SPLIT SLIDE** — If content genuinely needs more space, split into two slides:
   - Part 1: Business Context (Objective, Problem, Challenge)
   - Part 2: Solution (Data, Methodology, Outcome, Maturity)

4. **NEVER** auto-shrink text below 9pt. If it doesn't fit, SHORTEN the content.

### 1C: Table Cell Fix Rules

```
EVERY table cell MUST have:
  - Internal margin: top=0.06", bottom=0.06", left=0.1", right=0.1"
  - autoFit: FALSE (never auto-shrink)
  - wordWrap: TRUE
  - Max: 80 characters or 3 short lines per cell
  - Font: minimum 10pt
  - Text must NOT touch cell borders
```

---

## STEP 2: TERADATA BRANDING REMOVAL

### Find and Replace Globally

| Find | Replace With |
|---|---|
| "Teradata Business Value Framework" | "Banking Business Value Framework" |
| "Teradata" (standalone in titles/body) | "Enterprise Analytics Platform" |
| "Teradata Vantage" | "Analytics Platform" |
| "Teradata IntelliCloud" | "Cloud Data Warehouse" |
| "Teradata Confidential" (footer) | "Godaitec \| Banking BVF \| Confidential" |
| #F58220 (Teradata orange) | #00B4D8 (Godaitec cyan) |
| #00539F (Teradata blue) | #0D1B2A (Godaitec navy) |
| Teradata logo images | Godaitec logo |
| "© Teradata" / copyright | "© 2026 Godaitec Private Limited" |

### KEEP These References

- "FSDM" / "Financial Services Data Model" — this is a data model standard, not product branding
- All FSDM entity names (INDVDL, ORGN, ACCT, EVNT, TXN, etc.)
- "BVF" — rebrand as "Banking BVF" throughout
- Technical architecture references in speaker notes (can mention "Teradata FSDM" as source)

---

## STEP 3: GLOBAL / REGIONAL / PAKISTAN CONTENT LAYERING

### Three-Tier Model — Apply to EVERY Capability & Use Case Slide

**ON THE SLIDE (concise — must fit in container):**
```
[Global 1-liner] + [Regional 1-liner] + [Pakistan 2-3 lines — primary focus]
```

**IN SPEAKER NOTES (full depth):**
```
GLOBAL: [3-5 sentences — international standards, global benchmarks, worldwide trends]
REGIONAL: [3-5 sentences — South Asia & Middle East: RBI, SAMA, CBUAE, BB, CBSL comparisons]
PAKISTAN: [5-10 sentences — SBP regulations, KIBOR, CNIC/NADRA, RAAST, ECIB, PKR, Islamic banking, UBL context]
FSDM: [Entity references supporting this capability]
BACR: [Maturity assessment context]
```

### Regional Reference Points

| Country | Regulator | Key Framework | Banking Assets | Inclusion |
|---|---|---|---|---|
| Pakistan 🇵🇰 | SBP, SECP | Basel III, IFRS 9, AML/CFT | PKR 32T+ | 30% |
| India 🇮🇳 | RBI | Basel III, Ind AS 109 | $2.5T+ | 80% |
| Saudi Arabia 🇸🇦 | SAMA | Basel III, IFRS 9 | SAR 3.2T+ | 75% |
| UAE 🇦🇪 | CBUAE | Basel III, IFRS 9 | AED 3.5T+ | 85% |
| Bangladesh 🇧🇩 | BB | Basel III (phased) | BDT 20T+ | 50% |
| Sri Lanka 🇱🇰 | CBSL | Basel III, IFRS 9 | LKR 15T+ | 75% |

### Pakistan Market Data (Use Throughout)

```
Banking accounts:           60M+
Mobile wallets:             100M+ (JazzCash 40M+, Easypaisa 30M+)
RAAST monthly volume:       PKR 1.5T+
Financial inclusion:        30% (NFIS target: 50% by 2028)
Digital banking growth:     40% YoY
Youth population:           60% under 30
Products per customer:      1.8 (mature market benchmark: 4-5)
CASA share:                 47% of deposits
SBP policy rate:            17.5%
KIBOR 6M:                   ~17.8%
NPL ratio:                  ~7.5%
CAR (industry avg):         ~17%
Scheduled banks:            33 (5 public, 22 private, 4 foreign, 2 specialized)
Islamic banks:              5 full + 17 with Islamic branches
Digital bank licenses:      5 (issued 2022)
Branch network:             ~16,000 branches
ATM network:                ~16,000+ ATMs
Core banking systems/bank:  4-5 average
SBP returns:                200+ per bank
Regulatory FTEs:            100+ per large bank
```

---

## STEP 4: SUPPLEMENTARY SLIDES — Add to Every File

### Slide A: Domain Dashboard (add as slide 2, after title)
- Use Template 10 above
- Populate with domain-specific metrics from OVERVIEW.md, bvf_output, fsdm_output, bacr_output
- Three-column Global/Regional/Pakistan comparison

### Slide B: Pakistan Market Context (add before challenges slide)
- Use Template 9 above
- Domain-specific statistics, regulators, regulations, competitive landscape

### Slide C: Implementation Roadmap (add as second-to-last slide)
- Use Template 11 above
- 3-phase roadmap with domain-specific milestones
- Investment range and ROI estimate in PKR

---

## STEP 5: FILE-BY-FILE CONTENT GUIDANCE

### Files 01-02 (Introduction, Marketing CX Overview)
- Existing content is mostly complete — enrich with Pakistan context
- Replace outdated statistics (e.g., "H1 2018") with 2024-2025 data
- Rewrite "Are You Able To" questions for Pakistan banking

### Files 03, 05, 07, 09, 11 (Use Case files with "Point 1" placeholders)
- Each placeholder slide needs complete 7-field use case content
- Use Template 8 (Use Case Card Grid)
- Content source: Previously created prompt files (pptx-13-*, pptx-15-* etc.) OR generate from BVF/FSDM/BACR data
- Every use case must have Global/Regional/Pakistan context in speaker notes

### Files 04, 06, 08, 10 (Domain Overview files)
- Existing Teradata content needs Pakistan enrichment
- Empty capability slides need full content (Objectives, Data, Outcome, Maturity)
- Use Template 4 (Capability Card Grid) and Template 7 (Maturity Table)

### Files 12-16 (Risk, Security, Compliance — heaviest content)
- Multiple empty placeholder slides requiring full content
- Content source: Previously created prompt files (pptx-12-* through pptx-16-*)
- Operational Risk section (File 12, slides 51-55): entirely empty — build from scratch
- Security Use Cases (File 15): 40 of 41 slides are "Point 1" — all need complete content
- Apply strict overflow rules — these files had the worst overflow problems

---

## STEP 6: VISUAL QA

### Mandatory for Every File

```bash
# Convert each output file to images
python scripts/office/soffice.py --headless --convert-to pdf OUTPUT.pptx
pdftoppm -jpeg -r 150 OUTPUT.pdf slide

# Use subagent for visual inspection
```

### QA Checklist (Every Single Slide)

```
□ NO text overflow — all content fits within containers
□ NO text touching cell/box borders (min 0.06" padding)
□ Font size ≥ 10pt everywhere (nothing unreadably small)
□ NO Teradata logos, orange (#F58220), "Teradata" text, or Teradata copyright
□ Godaitec theme colors applied consistently (Navy/Cyan/White)
□ Godaitec logo visible: white on dark slides, dark on light slides
□ Footer: "Godaitec | Banking BVF | Confidential" + correct page number
□ Slide title readable (24-36pt, strong contrast)
□ No more than 6 bullet points per content area
□ No more than 15 words per bullet point
□ Tables: max 3 lines per cell, no text cut-off, min 10pt
□ Speaker notes present with Global/Regional/Pakistan depth
□ Page numbers correct and sequential
□ No blank slides, "Point 1" placeholders, or "Description" placeholder text
□ Maturity tables: all 5 levels populated, correctly color-coded
□ Images/shapes not overlapping text
□ Consistent spacing throughout (no cramped areas next to empty areas)
□ Domain tag bar present on all content slides
□ New slides present: Dashboard, Pakistan Context, Roadmap
```

### Fix-and-Verify Loop

```
1. Generate slides → Convert to images → Inspect
2. List ALL issues found (if zero found, inspect more critically)
3. Fix issues
4. Re-render affected slides and verify fixes
5. Check that fixes didn't create new problems
6. Repeat until full pass reveals no new issues
```

---

## TECHNICAL IMPLEMENTATION

### Recommended: PptxGenJS (Rebuild from Scratch)

Given the severity of overflow + complete theme change, rebuilding with PptxGenJS is more reliable than XML editing.

```bash
# Read the PptxGenJS guide
cat /mnt/skills/public/pptx/pptxgenjs.md
```

**Workflow:**
1. Read ALL text from existing files using `python -m markitdown`
2. Read speaker notes from _UPDATED files where available
3. Apply content density rules — condense all text
4. Build theme configuration matching Godaitec specs above
5. Generate all slides using PptxGenJS with templates
6. Add speaker notes with 3-tier Global/Regional/Pakistan content
7. Visual QA every file

### Theme Configuration Object

```javascript
const GODAITEC = {
  name: 'Godaitec',
  colors: {
    primary:       '0D1B2A',
    secondary:     '1B3A5C',
    accent:        '00B4D8',
    accent2:       '48CAE4',
    bg:            'FFFFFF',
    altBg:         'F0F4F8',
    textPrimary:   '1A1A2E',
    textSecondary: '4A5568',
    textOnDark:    'E2E8F0',
    success:       '06D6A0',
    warning:       'FFD166',
    border:        'CBD5E1'
  },
  fonts: {
    heading: 'Calibri',
    body:    'Calibri',
    mono:    'Consolas'
  },
  footer: 'Godaitec | Banking Business Value Framework | Confidential',
  copyright: '© 2026 Godaitec Private Limited'
};
```

### Processing Order

1. **File 01** (Introduction) — sets framework, test all templates
2. **File 12** (Risk Management) — heaviest overview, validates capability templates
3. **File 15** (Security Use Cases) — 40 use case slides, validates use case template
4. **Files 02-11** — batch process remaining
5. **Files 13-14, 16** — complete remaining heavy files

---

## DELIVERABLES

```
./pptout/godaitec/
  ├── 01_Introduction_Industry_Challenges.pptx
  ├── 02_Marketing_CX_Overview.pptx
  ├── 03_Marketing_CX_Use_Cases.pptx
  ├── 04_Profitability_Overview.pptx
  ├── 05_Profitability_Use_Cases.pptx
  ├── 06_Operational_Efficiency_Overview.pptx
  ├── 07_Operational_Efficiency_Use_Cases.pptx
  ├── 08_Revenue_Integrity_Overview.pptx
  ├── 09_Revenue_Integrity_Use_Cases.pptx
  ├── 10_Finance_Overview.pptx
  ├── 11_Finance_Use_Cases.pptx
  ├── 12_Risk_Management.pptx
  ├── 13_Risk_Management_Use_Cases.pptx
  ├── 14_Security_Fraud_Overview.pptx
  ├── 15_Security_Fraud_Use_Cases.pptx
  └── 16_Regulatory_Compliance.pptx

./pptout/qa/godaitec/
  └── [NN]_slide-*.jpg   (QA images for all slides)

./pptout/GODAITEC_BUILD_REPORT.md
  - Total slides per file (original → final)
  - Content overflow fixes applied
  - Slides split (which ones, why)
  - New supplementary slides added
  - Teradata branding elements removed
  - Pakistan/Regional content added
  - QA issues found and resolved
```
