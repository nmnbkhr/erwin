# Fix: WCOModelExplorer.tsx — Missing Globe Import

## Issue
The WCO Model Explorer page (`/taiw/model`) renders blank. Zero TypeScript errors at build time, but a **runtime crash** occurs because `Globe` is used as a JSX component (line ~693, empty-state placeholder icon) but was never imported from `lucide-react`.

## Fix
In `src/taiw/components/WCOModelExplorer.tsx`, find the existing `lucide-react` import line and add `Globe` to it.

For example, if the current import is:
```tsx
import { Search, Filter, ChevronRight, Database, ... } from 'lucide-react';
```

Change it to:
```tsx
import { Search, Filter, ChevronRight, Database, Globe, ... } from 'lucide-react';
```

## Verify
1. Page loads at `localhost:5173/taiw/model` without blank screen
2. Empty state (before selecting any element) shows the Globe icon placeholder
3. No console errors
4. `npm run build` still succeeds with 0 errors
