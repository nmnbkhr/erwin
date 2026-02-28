# BAIW — Setup & Scaffold Commands

## 1. Create Project

```bash
npm create vite@latest baiw -- --template react-ts
cd baiw
```

## 2. Install Dependencies

```bash
# Core
npm install

# App dependencies
npm install react-router-dom recharts d3 lucide-react

# Dev dependencies
npm install -D @types/d3 tailwindcss @tailwindcss/vite
```

## 3. Configure Tailwind + Vite

**vite.config.ts:**
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

**src/index.css:**
```css
@import "tailwindcss";

body {
  margin: 0;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
```

## 4. Generate Sample Data

```bash
python3 scripts/generate_sample_data.py
```

Output:
```
[1/15] Generating domains...        → 16 domains (4 KB)
[2/15] Generating entities...       → 3,917 entities (820 KB)
[3/15] Generating attributes...     → 15,364 attributes (2.3 MB)
[4/15] Generating relationships...  → 5,636 relationships (892 KB)
[5/15] Generating capabilities...   → 112 sub-capabilities (44 KB)
[6/15] Generating data reqs...      → 113 requirements (24 KB)
[7/15] Generating dependencies...   → 5,218 dependencies (932 KB)
[8/15] Generating reuse scores...   → 219 scored entities (32 KB)
[9/15] Generating reuse matrix...   → 500 similarity pairs (36 KB)
[10/15] Generating lineage...       → 23 lineage entries (8 KB)
[11/15] Generating star schema...   → 1 fact + 7 dims + 2 aggs + 3 views (36 KB)
[12/15] Generating gap extensions.. → 5 modules, 21 tables (32 KB)
[13/15] Generating BACR questions.. → 793 questions (184 KB)
[14/15] Generating Pakistan ctx...  → regulatory + Islamic + payments (8 KB)
[15/15] Generating inheritance...   → 839 chains (116 KB)
```

## 5. Create Directory Structure

```bash
mkdir -p src/data
mkdir -p src/components/{layout,dashboard,model,capabilities,graph,maturity,profitability,roadmap,pakistan}
mkdir -p src/pages src/hooks src/context src/utils
```

## 6. Start Dev Server

```bash
npm run dev
```

Opens at: http://localhost:5173

## 7. Build for Production

```bash
npm run build
```

Output goes to `dist/` — 2,765 modules, built in ~45s.

## 8. TypeScript Check

```bash
npx tsc --noEmit
```

Result: 0 errors.
