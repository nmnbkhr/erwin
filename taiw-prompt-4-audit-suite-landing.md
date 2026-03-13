# TAIW — Prompt 4: Audit, Suite Landing Page & Polish

## Context

TAIW module is running inside BAIW at `/taiw/*` with 8 pages + 25 Phase 2 enhancements. This prompt handles audit fixes, the unified suite landing page, and final polish.

---

## Part A: Audit Gaps (4 fixes)

### Fix 1: Cmd+K Palette Scope

The existing BAIW Cmd+K palette only searches BAIW data. When user is on `/taiw/*` routes, Cmd+K should search TAIW data instead.

**Implementation:**
- Detect current route (`useLocation`)
- If route starts with `/taiw`, use TAIW search data (727 WCO elements + 96 TCF capabilities + 8 TAIW pages)
- If route is BAIW, use BAIW search data (existing behavior)
- Add cross-module actions in both:
  - BAIW palette: "Switch to TAIW →" action
  - TAIW palette: "Switch to BAIW →" action
  - "Go to Suite Home →" action (navigates to `/`)

**Search items for TAIW palette:**
```
Pages (8): Dashboard, WCO Model, Capabilities, Dependencies, Maturity, Analytics, Roadmap, Pakistan Trade
WCO Elements (727): Searchable by name, class, domain
TCF Capabilities (96): Searchable by name, theme, group
Quick Actions: Start TACR, Export Roadmap, Clear Assessment
```

### Fix 2: localStorage Isolation

Ensure TAIW and BAIW localStorage keys don't conflict:
```
BAIW keys:     maturity_*, roadmap_*
TAIW keys:     taiw_maturity_*, taiw_roadmap_*
```

Verify all TAIW components use `taiw_` prefix. Check:
- `TradeMaturityAssessment.tsx` → `taiw_maturity`
- `TradeRoadmapBuilder.tsx` → `taiw_roadmap`
- Any theme/preference keys

### Fix 3: PDF/JSON/CSV Export on All TAIW Pages

Ensure every TAIW page with data has export buttons (top-right corner):

| Page | PDF | JSON | CSV |
|------|-----|------|-----|
| Dashboard | Stats summary | All stats | - |
| WCO Model | Element catalog | All elements | Element list |
| Capabilities | Capability detail | All capabilities | Capability list |
| Dependencies | - | Dependency matrix | Mapping list |
| Maturity | Assessment report | Scores | Scores table |
| Analytics | Schema overview | Schema definition | Table list |
| Roadmap | Roadmap report | Selected capabilities | Phase plan |
| Pakistan Trade | Reference doc | All reference data | - |

Use the same export utility pattern as BAIW. If BAIW has `src/utils/export.ts`, reuse it. If not, create `src/taiw/utils/export.ts`.

### Fix 4: enrichment.json Completeness

Verify `src/data/taiw/enrichment.json` has entries for ALL 96 capabilities (not just the 12 detailed ones). The remaining 84 should have at minimum:
```json
{
  "pakistanObjectives": ["[Capability name] for Pakistan customs modernization"],
  "pakistanDataSources": ["WeBOC transaction data", "PSW integration feeds"],
  "expectedOutcomes": ["Improved trade facilitation and compliance"],
  "keyChallenges": ["Data quality and system integration"],
  "wcoElements": [/* 3-5 relevant elements */],
  "implementationPhase": 2,
  "investmentRange": "PKR 20-50M",
  "priority": "STANDARD"
}
```

If the generate script in Prompt 1 already did this, verify. If not, patch the data.

---

## Part B: Suite Landing Page

### New Component: `src/components/SuiteLanding.tsx`

This replaces the current root `/` route (or the splash page if one exists). It's the **unified entry point** for both BAIW and TAIW.

**Design:**

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│              ✦ Analytics Intelligence Suite                   │
│           Enterprise Data Model Workbench Platform           │
│                                                              │
│   ┌─────────────────────┐    ┌─────────────────────┐        │
│   │                     │    │                     │        │
│   │   💰 BAIW           │    │   🌐 TAIW           │        │
│   │   Banking Analytics │    │   Trade Analytics   │        │
│   │   Intelligence      │    │   Intelligence      │        │
│   │   Workbench         │    │   Workbench         │        │
│   │                     │    │                     │        │
│   │   ────────────────  │    │   ────────────────  │        │
│   │                     │    │                     │        │
│   │   Teradata FSDM v13 │    │   WCO Data Model    │        │
│   │   3,917 entities    │    │   v4.2              │        │
│   │   16 domains        │    │   727 data elements │        │
│   │                     │    │   14 domains        │        │
│   │   BVF Framework     │    │                     │        │
│   │   112 capabilities  │    │   TCF Framework     │        │
│   │                     │    │   96 capabilities   │        │
│   │   BACR Assessment   │    │                     │        │
│   │   793 questions     │    │   TACR Assessment   │        │
│   │                     │    │   640+ questions    │        │
│   │   🇵🇰 SBP, KIBOR,   │    │                     │        │
│   │   Islamic Banking   │    │   🇵🇰 FBR, WeBOC,   │        │
│   │                     │    │   CPEC, GSP+        │        │
│   │   ┌───────────┐    │    │                     │        │
│   │   │ Enter →   │    │    │   ┌───────────┐    │        │
│   │   └───────────┘    │    │   │ Enter →   │    │        │
│   │   purple/blue      │    │   └───────────┘    │        │
│   └─────────────────────┘    │   teal/cyan        │        │
│                              └─────────────────────┘        │
│                                                              │
│   Built for Pakistan 🇵🇰 │ Powered by Claude Code           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Styling:**
- Dark background (`bg-gray-950`)
- Cards have subtle gradient borders (BAIW: purple-blue, TAIW: teal-cyan)
- Hover: cards scale slightly, glow effect
- Responsive: stack vertically on mobile
- Animated entry (fade-in, slide-up)

**Route Changes:**
```
/              → SuiteLanding (NEW — the unified landing)
/dashboard     → BAIW Dashboard (move from / if currently there)
/model         → BAIW Model Explorer (existing)
/capabilities  → BAIW Capabilities (existing)
... etc ...
/taiw          → TAIW Dashboard
/taiw/model    → TAIW WCO Model
... etc ...
```

If BAIW currently has its dashboard at `/`, move it to `/dashboard` and put the suite landing at `/`. Update BAIW's sidebar "Dashboard" link to `/dashboard`. **Be careful — update ALL internal links in BAIW components that reference `/`.**

**OR simpler approach:** If BAIW has a splash page at one route and dashboard at another, just update the splash page to be the suite landing. Use whichever approach requires fewer changes to existing BAIW code.

---

## Part C: Module Switcher Polish

### In BAIW Layout (minimal change)

Add to the existing BAIW `Layout.tsx` header area — a small module indicator:

```tsx
// Add near the logo/title area
<div className="flex items-center gap-2 ml-4">
  <span className="bg-purple-600 text-white px-2 py-0.5 rounded text-xs font-medium">BAIW</span>
  <Link to="/taiw" className="bg-gray-700 text-gray-300 hover:bg-teal-600 hover:text-white px-2 py-0.5 rounded text-xs transition-colors">
    TAIW →
  </Link>
</div>
```

### In TAIW Layout

Already has switcher. Add "Suite Home" link:

```tsx
<Link to="/" className="text-gray-400 hover:text-white text-xs">
  ← Suite Home
</Link>
```

---

## Part D: Shared Components

If BAIW and TAIW share any patterns (export buttons, skeleton loaders, chart wrappers), extract them to:

```
src/shared/
├── ExportButtons.tsx       # PDF/JSON/CSV export button group
├── SkeletonLoaders.tsx     # Loading skeletons
├── SearchInput.tsx         # Fuzzy search input
└── StatCard.tsx            # Metric display card
```

Only do this if there's clear duplication. If BAIW components are self-contained, create TAIW equivalents in `src/taiw/components/shared/` instead.

---

## Part E: Mobile Responsiveness

Verify all TAIW pages work on mobile viewport (375px width):
- Sidebar collapses to hamburger menu
- Tables become scrollable
- Charts resize
- Module switcher stays accessible
- Suite landing stacks cards vertically

---

## Verification Checklist

```
Audit Fixes:
□ Cmd+K searches correct module based on route
□ localStorage keys use taiw_ prefix (no conflicts)
□ All TAIW pages have export buttons
□ enrichment.json has entries for all 96 capabilities

Suite Landing:
□ / route shows suite landing with both module cards
□ BAIW dashboard accessible (either /dashboard or original route)
□ TAIW dashboard accessible at /taiw
□ Cards link correctly
□ Responsive on mobile

Module Switcher:
□ BAIW shows TAIW → link
□ TAIW shows ← BAIW and ← Suite Home links
□ Switching preserves scroll position

Polish:
□ No console errors on any page
□ No TypeScript errors
□ Production build succeeds
□ All BAIW pages still work perfectly
□ All TAIW pages work perfectly
□ Cross-module navigation (12+ links) verified
```
