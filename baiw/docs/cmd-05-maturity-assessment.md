# Module 5 — Maturity Assessment

> Route: `/maturity` | Status: DONE | Lines: 354

## Files Created

```bash
src/pages/MaturityAssessment.tsx    # 354 lines (self-contained)
src/context/AssessmentContext.tsx    # 69 lines (state management + localStorage)
```

## What It Renders

### Assessment Mode (default)

- **Mode toggle** buttons: Assessment Mode | Results
- **Progress bar**: X% complete, visual bar
- **Category navigation**: left/right arrows + category name + dots
- **9 categories** stepped through sequentially:
  1. Business (~120 questions, 8 shown)
  2. Culture (~80 questions, 8 shown)
  3. Governance (~95 questions, 8 shown)
  4. Information (~110 questions, 8 shown)
  5. Applications (~90 questions, 8 shown)
  6. Systems (~85 questions, 8 shown)
  7. Agility (~70 questions, 8 shown)
  8. Outcomes (~75 questions, 8 shown)
  9. Overall Assessment (~68 questions, 8 shown)

- **Per question:**
  - Statement text
  - Current State slider (1-5): Emerging → Developing → Practicing → Innovating → Leading
  - Desired State slider (1-5): same labels

### Results Mode (after completing or toggling)

- **Radar chart**: 9 categories, blue line (current) vs green line (desired) overlay
- **Overall maturity score**: weighted average, large number display with maturity label
- **Score heat map**: 9×2 grid, color intensity by score
- **Gap analysis table**: Category | Current Avg | Desired Avg | Gap | Priority (sorted by gap desc)
- **Export button**: downloads assessment as JSON
- **Reset button**: clears all answers, returns to assessment mode

## Data Dependencies

```
bacrQuestions.json   → 793 questions (filtered to 8 per category per step)
```

## State Management

```
AssessmentContext (React Context + useReducer)
├── answers: Record<questionId, {questionId, currentState, desiredState}>
├── currentCategory: number (0-8)
├── completed: boolean
└── Persists to localStorage key: "baiw-assessment"
```

## Actions

| Action | Effect |
|--------|--------|
| SET_ANSWER | Save current/desired scores for a question |
| SET_CATEGORY | Jump to category index |
| COMPLETE | Mark assessment as completed |
| RESET | Clear all answers, restart |
| LOAD | Restore from localStorage |

## Run & Verify

```bash
npm run dev
# Open http://localhost:5173/maturity
# Verify: questions display per category, sliders work
# Verify: navigate between categories with arrows/dots
# Verify: progress bar updates
# Verify: switch to Results — radar chart, gap table render
# Verify: close browser, reopen — answers persist
# Verify: Export downloads JSON, Reset clears everything
```
