# PROMPT: BVF PowerPoint — Full Cleanup, Rebrand & Theme (HELLISYNTECH Edition)

## Role

You are a senior presentation designer and banking strategy consultant with 20+ years experience creating executive-quality slide decks for banking/financial services consulting engagements across South Asia and the Middle East. You are an expert in PptxGenJS (preferred for from-scratch builds), python-pptx, and XML-level PPTX manipulation. You deeply understand visual hierarchy, content density management, table overflow prevention, and professional corporate theming. You have worked with Teradata FSDM, Basel III/IV, IFRS 9, SBP regulations, and data warehouse modernization programs for Pakistan's top banks.

---

## Problem Statement

The Banking Business Value Framework (BVF) PowerPoint deck consists of 16 PPTX files that have critical issues requiring a complete rebuild:

1. **CONTENT OVERFLOW** — Text leaks out of tables, text boxes, and placeholder shapes. Slides are chaotic and unreadable. Content intended for 3-4 bullet points was replaced with 5-10 dense paragraphs that overflow containers. Tables have cells with 200+ characters that clip and become invisible.
2. **TERADATA BRANDING** — All slides carry Teradata logos, Teradata orange (#F58220) and blue (#00539F) colors, footer text ("Teradata Confidential"), and "Teradata Business Value Framework" branding that must be completely neutralized and replaced with Hellisyntech branding.
3. **MISSING GLOBAL/REGIONAL PERSPECTIVE** — Content is either generic-Teradata or Pakistan-only. Every capability and use case needs three-tier layering: Global → Regional (South Asia/Middle East) → Pakistan.
4. **NO UNIFIED THEME** — Files have inconsistent formatting after XML-level text edits broke visual consistency. Need a complete, uniform Hellisyntech brand theme across all 16 files.
5. **MISSING SUPPLEMENTARY SLIDES** — Each file needs new slides: Domain Dashboard, Pakistan Market Context, Implementation Roadmap.

---

## Objective

Rebuild ALL 16 BVF PowerPoint files with Hellisyntech branding, producing clean, readable, professionally themed presentations.

```
INPUT:  ./pptout/*_UPDATED.pptx  (or original *.pptx if no _UPDATED exists)
OUTPUT: ./pptout/hellisyntech/[NN]_[Name].pptx
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

## HELLISYNTECH BRAND THEME — COMPLETE SPECIFICATION

### Brand Identity

- **Company:** Hellisyntech
- **Website:** https://hellisyntech.com/
- **Primary Tagline:** "We Deliver Fast, Future-ready Solutions"
- **Secondary:** "Expert IT Services | Software & Web Solutions"
- **Core Values:** Tech-Driven | Result-Oriented | Client-Focused
- **Services:** Software Development, Web Development, UI/UX Design, Data Solutions, AI Solutions, Digital Marketing, Graphics Design, SEO
- **Process:** Discover → Design → Develop → Deliver
- **Primary Industries:** Finance & Fintech, E-commerce & Retail, Healthcare & Wellness, Education & E-learning, Real Estate, Logistics, Gaming
- **Stats:** 95% Client Retention Rate | 50+ Projects Delivered | 8+ Years Experience | 20+ Skilled Professionals
- **Contact:** info@hellisyntech.com | +1 (773) 746-1459 | Palos Park, IL 60464

### Logo Assets

```
Dark logo (for white/light backgrounds):
  URL: https://hellisyntech.com/wp-content/uploads/2025/07/logo.png
  → Download and embed in slide masters for light background slides

White logo (for dark/navy backgrounds):
  URL: https://hellisyntech.com/wp-content/uploads/2025/07/hellisyntech-logo-white.png
  → Download and embed in slide masters for dark background slides
```

Download BOTH logos and embed in slide masters. Use `wget` or `curl` to fetch. If download fails, create text-based logo: "HELLISYNTECH" in Calibri Bold 18pt with a purple-blue (#6C63FF) accent bar beneath.

### Color Palette

```
┌──────────────────────┬───────────┬──────────────────────────────────────────┐
│ Role                 │ Hex       │ Usage                                    │
├──────────────────────┼───────────┼──────────────────────────────────────────┤
│ Primary              │ #0B0D2B   │ Title slide bg, section divider bg,      │
│ (Deep Space Navy)    │           │ heading text on light slides             │
├──────────────────────┼───────────┼──────────────────────────────────────────┤
│ Secondary            │ #1A1F4E   │ Table headers, sidebar accents,          │
│ (Royal Indigo)       │           │ domain tag bar, top accent strips        │
├──────────────────────┼───────────┼──────────────────────────────────────────┤
│ Accent               │ #6C63FF   │ CTAs, highlights, icon fills, accent     │
│ (Vibrant Purple-Blue)│           │ lines, active states, tag decorations    │
├──────────────────────┼───────────┼──────────────────────────────────────────┤
│ Accent 2             │ #4ECDC4   │ Secondary highlights, success metrics,   │
│ (Teal Cyan)          │           │ chart colors, "Leading" maturity level   │
├──────────────────────┼───────────┼──────────────────────────────────────────┤
│ Accent 3             │ #FF6B6B   │ Alerts, warm emphasis, error states,     │
│ (Soft Coral)         │           │ "Emerging" maturity attention color      │
├──────────────────────┼───────────┼──────────────────────────────────────────┤
│ Background           │ #FFFFFF   │ Content slide backgrounds                │
│ (Pure White)         │           │                                          │
├──────────────────────┼───────────┼──────────────────────────────────────────┤
│ Alt Background       │ #F5F5FA   │ Alternate content slides, panel fills,   │
│ (Ghost Lavender)     │           │ table alternating rows                   │
├──────────────────────┼───────────┼──────────────────────────────────────────┤
│ Card Background      │ #F8F9FE   │ Card panels on white slides, info boxes, │
│ (Pale Periwinkle)    │           │ capability detail containers             │
├──────────────────────┼───────────┼──────────────────────────────────────────┤
│ Text Primary         │ #0B0D2B   │ Headings on light backgrounds            │
│ (Deep Space)         │           │                                          │
├──────────────────────┼───────────┼──────────────────────────────────────────┤
│ Text Secondary       │ #555580   │ Body text, descriptions, bullet content  │
│ (Muted Indigo)       │           │                                          │
├──────────────────────┼───────────┼──────────────────────────────────────────┤
│ Text Subtle          │ #8888AA   │ Captions, metadata, footer text,         │
│ (Lavender Gray)      │           │ source attributions                      │
├──────────────────────┼───────────┼──────────────────────────────────────────┤
│ Text on Dark         │ #EEEEF5   │ Body text on dark backgrounds            │
│ (Silver Lavender)    │           │                                          │
├──────────────────────┼───────────┼──────────────────────────────────────────┤
│ Success              │ #4ECDC4   │ Positive metrics, growth, "Leading"      │
│ (Teal)               │           │ maturity level                           │
├──────────────────────┼───────────┼──────────────────────────────────────────┤
│ Warning              │ #FFD93D   │ Caution, attention, "Developing"         │
│ (Golden Yellow)      │           │ maturity level                           │
├──────────────────────┼───────────┼──────────────────────────────────────────┤
│ Border/Divider       │ #E0E0F0   │ Subtle lines, card borders, table       │
│ (Periwinkle)         │           │ borders, separators                      │
└──────────────────────┴───────────┴──────────────────────────────────────────┘

Data Visualization Palette (for charts, diagrams):
  Series 1: #6C63FF (Purple-Blue)
  Series 2: #4ECDC4 (Teal)
  Series 3: #FF6B6B (Coral)
  Series 4: #FFD93D (Golden)
  Series 5: #1A1F4E (Royal Indigo)
```

### Typography

```
Headings:    Calibri Bold
             → Slide titles on dark bg: 36-44pt, white (#FFFFFF)
             → Slide titles on light bg: 28-36pt, deep space (#0B0D2B)
             → Section headers: 20-24pt
             → Card/panel headers: 14-16pt bold, purple-blue (#6C63FF)

Body:        Calibri Regular
             → On light bg: 13-14pt, muted indigo (#555580)
             → On dark bg: 13-14pt, silver lavender (#EEEEF5)
             → Bullets: 12-13pt

Tables:      Calibri Light
             → Header: 11-12pt bold, white on royal indigo bg (#1A1F4E)
             → Content: 10-11pt, muted indigo (#555580)
             → NEVER below 9pt anywhere

Accent:      Calibri Italic (taglines, quotes, callouts)
Monospace:   Consolas 10pt (FSDM entity names in speaker notes)
```

### Visual Design Language

Hellisyntech's website uses a modern, clean aesthetic with these distinctive elements:

1. **Tag Decoration** — Small colored rectangle/badge positioned above section headings (inspired by the recurring "tag.png" element on hellisyntech.com). Implement as:
   - Small rounded rectangle: 0.6" × 0.15"
   - Fill: #6C63FF (purple-blue) on light slides, #4ECDC4 (teal) on dark slides
   - Position: 0.15" above section title, left-aligned with title text

2. **Card-Based Layouts** — Content organized in white or pale periwinkle (#F8F9FE) cards with:
   - Rounded corners: 8-10px (0.08-0.1")
   - Subtle shadow: conceptual (use 1px #E0E0F0 border to simulate)
   - Internal padding: 0.15" all sides
   - Gap between cards: 0.2-0.3"

3. **Generous White Space** — Don't fill every inch. Leave breathing room:
   - Minimum 0.5" margins from slide edges
   - 0.3" gaps between content blocks
   - Content area should use 80% of available space, not 100%

4. **Purple-Blue Accent Lines** — Thin (#6C63FF) accent lines for visual hierarchy:
   - Under titles: 2" wide, 2pt thick
   - Left borders on challenge blocks: 3pt thick
   - Section separators: full-width, 0.5pt

5. **Dark Slide Gradient** — Title and section slides use:
   - Gradient: left-to-right #0B0D2B → #1A1F4E
   - Creates depth without being flat

---

### Slide Master Templates

**APPLY THESE EXACT LAYOUTS to every slide in every file.**

---

#### TEMPLATE 1: Title Slide (Deep Space Gradient Background)

```
Dimensions: 13.333" × 7.5" (widescreen 16:9)
Background: Gradient left-to-right #0B0D2B → #1A1F4E

┌─────────────────────────────────────────────────────────┐
│  [0.5", 0.4"]                                           │
│  Hellisyntech White Logo (2.2" × 0.5")                  │
│                                                         │
│                                                         │
│  [0.8", 2.0"]                                           │
│  ▬ (Purple-blue tag: 0.6" × 0.15", fill #6C63FF)       │  Tag decoration
│                                                         │
│  [0.8", 2.3"]                                           │
│  BANKING BUSINESS VALUE FRAMEWORK                       │  36pt Calibri Bold White
│                                                         │
│  [0.8", 3.1"]                                           │
│  [Domain Name — e.g. "Marketing & Customer Experience"] │  22pt Calibri Bold #4ECDC4
│                                                         │
│  [0.8", 3.9"]                                           │
│  ──────────── (Teal line, 3" wide, 2pt)                 │
│                                                         │
│  [0.8", 4.4"]                                           │
│  Pakistan Banking Edition | 2025-2026                   │  14pt Calibri #EEEEF5
│                                                         │
│                                                         │
│  [0.5", 6.6"]                                           │
│  Hellisyntech                                           │  9pt Calibri #8888AA
│  We Deliver Fast, Future-ready Solutions                 │
│  info@hellisyntech.com                                  │
└─────────────────────────────────────────────────────────┘
```

---

#### TEMPLATE 2: Section Divider (Dark Gradient)

```
Background: Gradient left-to-right #0B0D2B → #1A1F4E

┌─────────────────────────────────────────────────────────┐
│                                                         │
│  [0.8", 1.2"]                                           │
│  ▬ (Teal tag: 0.6" × 0.15", fill #4ECDC4)              │  Tag decoration
│                                                         │
│  [0.8", 1.5"]                                           │
│  [Section Number: "01"]                                 │  64pt Calibri Bold #6C63FF
│                                                         │
│  [0.8", 2.8"]                                           │
│  [Section Title]                                        │  36pt Calibri Bold White
│                                                         │
│  [0.8", 3.6"]                                           │
│  [1-line description]                                   │  16pt Calibri #EEEEF5
│                                                         │
│  [0.8", 4.4"]                                           │
│  ──────── (Teal line, 2" wide, 2pt)                     │
│                                                         │
│                                          [White logo    │
│                                           bottom-right] │
│  [footer bar 0.3" — #080A20 bg]                         │
│  Hellisyntech | Banking BVF | Confidential      [pg #]  │  8pt #8888AA
└─────────────────────────────────────────────────────────┘
```

---

#### TEMPLATE 3: Content Slide (White Background)

```
Background: #FFFFFF

┌─────────────────────────────────────────────────────────┐
│  [Top bar: full width × 0.35" — #1A1F4E (Royal Indigo)]│
│  [Domain Name — white 10pt — left 0.5"]  [Page # right]│
│                                                         │
│  [0.5", 0.65"]                                          │
│  ▬ (Purple-blue tag: 0.5" × 0.12", fill #6C63FF)       │  Tag decoration
│                                                         │
│  [0.5", 0.85"]                                          │
│  [Slide Title]                                          │  24-28pt Calibri Bold #0B0D2B
│                                                         │
│  [0.5", 1.4"]                                           │
│  [Subtitle / description]                               │  14pt Calibri #555580
│                                                         │
│  [0.5", 1.9" — Content area to 6.8"]                    │
│  ┌─────────────────────────────────────────────────┐    │
│  │                                                 │    │
│  │  [CONTENT — see layout options below]           │    │
│  │  Max 6 bullets per area                         │    │
│  │  Max 15 words per bullet                        │    │
│  │  12-14pt Calibri #555580                        │    │
│  │                                                 │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  [Footer line: 0.5pt #E0E0F0 at y=6.95"]               │
│  Hellisyntech | Banking BVF | Confidential      [pg #]  │  8pt #8888AA
└─────────────────────────────────────────────────────────┘
```

---

#### TEMPLATE 4: Capability Detail Slide (2×2 Card Grid)

```
Background: #FFFFFF | Top bar: Royal Indigo

┌─────────────────────────────────────────────────────────┐
│  [Royal Indigo top bar with domain name]         [#]    │
│                                                         │
│  ▬ [Capability Name]                                    │  24pt Bold #0B0D2B
│  [1-line description]                                   │  13pt #555580
│                                                         │
│  ┌─────────────────────┐  ┌─────────────────────┐      │
│  │ ▸ Business           │  │ ▸ Data & Analytics  │      │
│  │   Objectives         │  │   Solution          │      │  Pale Periwinkle cards
│  │                      │  │                     │      │  (#F8F9FE fill)
│  │ • Bullet 1 (≤15 wds)│  │ • Bullet 1          │      │  Purple-blue header
│  │ • Bullet 2           │  │ • Bullet 2          │      │  (#6C63FF, 14pt bold)
│  │ • Bullet 3           │  │ • Bullet 3          │      │  1px #E0E0F0 border
│  │ • Bullet 4           │  │ • Bullet 4          │      │  0.15" internal padding
│  └─────────────────────┘  └─────────────────────┘      │  8px rounded corners
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
  Width: 5.8" each (2-column), gap: 0.3"
  Height: 2.2" each, gap: 0.2"
  Fill: #F8F9FE (Pale Periwinkle)
  Border: 1px #E0E0F0
  Corner radius: 8px (0.08")
  Header: 14pt Bold #6C63FF inside card, top-aligned
  Body: 12pt #555580, bullet list
  Internal margin: 0.15" all sides
```

---

#### TEMPLATE 5: Challenge Slide (Left Purple Accent Border)

```
Background: #FFFFFF | Top bar: Royal Indigo

┌─────────────────────────────────────────────────────────┐
│  [Royal Indigo top bar]                          [#]    │
│                                                         │
│  ▬ What are the challenges?                             │  24pt Bold #0B0D2B
│  [Overall challenge statement — 1-2 lines]              │  13pt #555580 Italic
│                                                         │
│  ┃  [Challenge 1 Title]                                 │  ┃ = 3px #6C63FF border
│  ┃  2-3 line description. Max 50 words.                 │  Title: 14pt Bold #0B0D2B
│  ┃                                                      │  Body: 12pt #555580
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
Left border: 3px #6C63FF (Purple-Blue)
```

---

#### TEMPLATE 6: "Are You Able To…" Slide (Dark Background)

```
Background: Gradient #0B0D2B → #1A1F4E

┌─────────────────────────────────────────────────────────┐
│  [Domain — 10pt #EEEEF5, top-left]               [#]   │
│                                                         │
│  ▬ (Teal tag decoration)                                │
│  Are You Able To…                                       │  28pt Bold #4ECDC4
│                                                         │
│  ✦  Question 1 — max 2 lines, max 25 words             │  14pt Calibri #EEEEF5
│                                                         │
│  ✦  Question 2 — max 2 lines, max 25 words             │  0.45" gap between
│                                                         │
│  ✦  Question 3 — max 2 lines, max 25 words             │  questions
│                                                         │
│  (Max 3-5 questions per slide)                          │
│                                                         │
│  [Footer — muted text on dark]                          │
└─────────────────────────────────────────────────────────┘

✦ = Purple-blue diamond bullet (#6C63FF)
```

---

#### TEMPLATE 7: Maturity Level Table

```
Background: #FFFFFF | Top bar: Royal Indigo

┌─────────────────────────────────────────────────────────┐
│  [Royal Indigo top bar]                          [#]    │
│                                                         │
│  ▬ [Capability] — Maturity Levels                       │  24pt Bold #0B0D2B
│                                                         │
│  ┌──────────┬──────────────────────────────────────┐    │
│  │ Leading  │ 2-3 sentences max. 10-11pt.          │    │  Fill: #4ECDC4 (Teal)
│  │          │ White text.                          │    │  Text: White
│  ├──────────┼──────────────────────────────────────┤    │
│  │ Innovate │ 2-3 sentences max. 10-11pt.          │    │  Fill: #6C63FF (Purple)
│  │          │ White text.                          │    │  Text: White
│  ├──────────┼──────────────────────────────────────┤    │
│  │ Practice │ 2-3 sentences max. 10-11pt.          │    │  Fill: #1A1F4E (Indigo)
│  │          │ White text.                          │    │  Text: White
│  ├──────────┼──────────────────────────────────────┤    │
│  │ Develop  │ 2-3 sentences max. 10-11pt.          │    │  Fill: #F5F5FA (Lavender)
│  │          │ Dark text.                           │    │  Text: #555580
│  ├──────────┼──────────────────────────────────────┤    │
│  │ Emerging │ 2-3 sentences max. 10-11pt.          │    │  Fill: #FFD93D (Golden)
│  │          │ Dark text.                           │    │  Text: #0B0D2B
│  └──────────┴──────────────────────────────────────┘    │
│                                                         │
│  Footer                                                 │
└─────────────────────────────────────────────────────────┘

Table specs:
  Left column: 1.2" wide, label vertically centered, 12pt Bold, white/dark text
  Right column: 10.3" wide, content, 10-11pt
  Row height: 0.9" each
  Cell padding: top=0.06", bottom=0.06", left=0.1", right=0.1"
  Border: 1px white between rows on colored cells
```

---

#### TEMPLATE 8: Use Case Slide (2×3 Card Grid)

```
Background: #FFFFFF | Top bar: Royal Indigo

┌─────────────────────────────────────────────────────────┐
│  [Category — Royal Indigo bar]  [Use Case Title]  [#]  │  Top bar: 0.45"
│  Owner: [Role]                                          │  10pt white
│                                                         │
│  ┌─────────────────────┐  ┌─────────────────────┐      │
│  │ 🎯 Objective        │  │ 💰 Business Benefit │      │  Card: 5.8" × 1.3"
│  │ • Bullet 1 (≤15 wds)│  │ • Bullet 1          │      │  Fill: #F8F9FE
│  │ • Bullet 2          │  │ • Bullet 2          │      │  Border: 1px #E0E0F0
│  │ • Bullet 3          │  │ • Bullet 3          │      │  Corner: 8px rounded
│  └─────────────────────┘  └─────────────────────┘      │  Header: 11pt Bold
│  ┌─────────────────────┐  ┌─────────────────────┐      │  #6C63FF
│  │ 📊 Source Data      │  │ 🔬 Methodology      │      │  Body: 10pt #555580
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
│  │ 🏆 POV Success: Metric 1 | Metric 2 | Metric 3│    │  Purple-blue accent bar
│  └─────────────────────────────────────────────────┘    │  Fill: #6C63FF
│  Footer                                                 │  Text: White 10pt
└─────────────────────────────────────────────────────────┘

Each card: max 3-4 bullets, max 15 words per bullet.
POV bar: single row, 3-4 metrics, " | " separated.
Detailed content → speaker notes.
```

---

#### TEMPLATE 9: Pakistan Market Context Slide (NEW)

```
Background: #FFFFFF | Top bar: Royal Indigo

┌─────────────────────────────────────────────────────────┐
│  [Royal Indigo top bar]                          [#]    │
│                                                         │
│  ▬ (tag)                                                │
│  🇵🇰 Pakistan Banking Sector — [Domain] Context        │  24pt Bold #0B0D2B
│                                                         │
│  ┌────────────────────────────────────────────────┐     │
│  │ KEY STATISTICS (2024-2025)                      │     │  Pale Periwinkle panel
│  │                                                │     │  #F8F9FE
│  │  Banking Assets    PKR 32T+                    │     │  Large stat callouts
│  │  Bank Accounts     60M+                        │     │  28pt Bold #6C63FF
│  │  Mobile Wallets    100M+                       │     │  numbers
│  │  RAAST Monthly     PKR 1.5T+                   │     │  12pt #555580 labels
│  │  Inclusion Rate    30% (target 50% by 2028)    │     │
│  └────────────────────────────────────────────────┘     │
│                                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                │
│  │Regulators│ │Key Regs  │ │Landscape │                │  3 info cards
│  │SBP, SECP │ │Basel III │ │33 banks  │                │  #F8F9FE fill
│  │FBR, FMU  │ │IFRS 9    │ │5 Islamic │                │  Purple-blue headers
│  │PTA       │ │AML/CFT   │ │5 digital │                │
│  └──────────┘ └──────────┘ └──────────┘                │
│  Footer                                                 │
└─────────────────────────────────────────────────────────┘
```

---

#### TEMPLATE 10: Domain Dashboard Slide (NEW)

```
Background: #F5F5FA (Ghost Lavender)

┌─────────────────────────────────────────────────────────┐
│  [Royal Indigo top bar]                          [#]    │
│                                                         │
│  ▬ [Domain Name] — At a Glance                          │  28pt Bold #0B0D2B
│                                                         │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐          │
│  │  🌍 GLOBAL │ │  🌏 REGION │ │  🇵🇰 PAKISTAN│          │
│  │            │ │  (SA/ME)   │ │            │          │
│  │ Metric 1   │ │ Metric 1   │ │ Metric 1   │          │  White cards on
│  │ Metric 2   │ │ Metric 2   │ │ Metric 2   │          │  Ghost Lavender bg
│  │ Metric 3   │ │ Metric 3   │ │ Metric 3   │          │  #FFFFFF fill
│  └────────────┘ └────────────┘ └────────────┘          │  8px rounded corners
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ BVF Sub-caps: [X] │ FSDM Entities: [X]         │    │  Royal Indigo info bar
│  │ BACR Questions: [X]│ Use Cases: [X]             │    │  #1A1F4E fill
│  │ Typical PK Maturity: Level [X]                  │    │  White text
│  └─────────────────────────────────────────────────┘    │
│  Footer                                                 │
└─────────────────────────────────────────────────────────┘
```

---

#### TEMPLATE 11: Implementation Roadmap Slide (NEW)

```
Background: #FFFFFF

┌─────────────────────────────────────────────────────────┐
│  [Royal Indigo top bar]                          [#]    │
│                                                         │
│  ▬ [Domain] — Implementation Roadmap                    │  24pt Bold #0B0D2B
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │                                                 │    │
│  │  Phase 1          Phase 2          Phase 3      │    │  Timeline visual
│  │  0-6 months       6-18 months      18-36 months │    │
│  │  ──●──────────────●──────────────●──            │    │  Purple-blue line
│  │                                                 │    │  (#6C63FF) with
│  │  Foundation       Core Analytics   Advanced AI  │    │  teal dot markers
│  │  • Quick win 1    • Capability 1   • ML models  │    │  (#4ECDC4)
│  │  • Quick win 2    • Capability 2   • Real-time  │    │
│  │  • Quick win 3    • Capability 3   • Automation │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌──────────────────┐  ┌──────────────────┐            │
│  │ Investment Range  │  │ Expected ROI     │            │  Pale Periwinkle cards
│  │ PKR [X]-[X]      │  │ [X]x in [X] yrs  │            │  #F8F9FE fill
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

3. **SPLIT SLIDE** — If content genuinely needs more space, create two slides:
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
| "Teradata Confidential" (footer) | "Hellisyntech \| Banking BVF \| Confidential" |
| #F58220 (Teradata orange) | #6C63FF (Hellisyntech purple-blue) |
| #00539F (Teradata blue) | #0B0D2B (Hellisyntech deep space) |
| Teradata logo images | Hellisyntech logo |
| "© Teradata" / copyright | "© 2026 Hellisyntech. All Rights Reserved." |

### KEEP These References

- "FSDM" / "Financial Services Data Model" — data model standard, not product branding
- All FSDM entity names (INDVDL, ORGN, ACCT, EVNT, TXN, etc.)
- "BVF" — rebrand as "Banking BVF" throughout
- Technical architecture references in speaker notes (can mention "Teradata FSDM" as data model source)

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
REGIONAL: [3-5 sentences — South Asia & ME: RBI, SAMA, CBUAE, BB, CBSL comparisons]
PAKISTAN: [5-10 sentences — SBP, KIBOR, CNIC/NADRA, RAAST, ECIB, PKR, Islamic banking]
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
- Existing content mostly complete — enrich with Pakistan context
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

# Use subagent for fresh-eyes visual inspection
```

### QA Checklist (Every Single Slide)

```
□ NO text overflow — all content fits within containers
□ NO text touching cell/box borders (min 0.06" padding)
□ Font size ≥ 10pt everywhere (nothing unreadably small)
□ NO Teradata logos, orange (#F58220), "Teradata" text, or Teradata copyright
□ Hellisyntech theme applied consistently (Deep Space/Purple-Blue/Teal)
□ Hellisyntech logo visible: white on dark slides, dark on light slides
□ Tag decorations present above section titles
□ Footer: "Hellisyntech | Banking BVF | Confidential" + correct page number
□ Slide title readable (24-36pt, strong contrast)
□ No more than 6 bullet points per content area
□ No more than 15 words per bullet point
□ Tables: max 3 lines per cell, no text cut-off, min 10pt
□ Cards: rounded corners, #F8F9FE fill, #E0E0F0 border visible
□ Speaker notes present with Global/Regional/Pakistan depth
□ Page numbers correct and sequential
□ No blank slides, "Point 1" placeholders, or "Description" text
□ Maturity tables: all 5 levels, correctly color-coded (Teal→Purple→Indigo→Lavender→Gold)
□ Images/shapes not overlapping text
□ Consistent spacing (no cramped areas next to empty areas)
□ Domain tag bar present on all content slides (Royal Indigo)
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
4. Build theme configuration matching Hellisyntech specs above
5. Generate all slides using PptxGenJS with templates
6. Add speaker notes with 3-tier Global/Regional/Pakistan content
7. Visual QA every file

### Theme Configuration Object

```javascript
const HELLISYNTECH = {
  name: 'Hellisyntech',
  colors: {
    primary:       '0B0D2B',
    secondary:     '1A1F4E',
    accent:        '6C63FF',
    accent2:       '4ECDC4',
    accent3:       'FF6B6B',
    bg:            'FFFFFF',
    altBg:         'F5F5FA',
    cardBg:        'F8F9FE',
    textPrimary:   '0B0D2B',
    textSecondary: '555580',
    textSubtle:    '8888AA',
    textOnDark:    'EEEEF5',
    success:       '4ECDC4',
    warning:       'FFD93D',
    border:        'E0E0F0'
  },
  fonts: {
    heading: 'Calibri',
    body:    'Calibri',
    mono:    'Consolas'
  },
  footer: 'Hellisyntech | Banking Business Value Framework | Confidential',
  copyright: '© 2026 Hellisyntech. All Rights Reserved.',
  tagline: 'We Deliver Fast, Future-ready Solutions'
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
./pptout/hellisyntech/
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

./pptout/qa/hellisyntech/
  └── [NN]_slide-*.jpg   (QA images for all slides)

./pptout/HELLISYNTECH_BUILD_REPORT.md
  - Total slides per file (original → final)
  - Content overflow fixes applied
  - Slides split (which ones, why)
  - New supplementary slides added
  - Teradata branding elements removed
  - Pakistan/Regional content added
  - QA issues found and resolved
```
