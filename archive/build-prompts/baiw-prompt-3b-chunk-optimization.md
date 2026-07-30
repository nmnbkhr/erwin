# BAIW — Chunk Size Optimization

## Context

BAIW app builds successfully but Vite shows chunk size warnings for large JSON data files. The main offenders are `entities.json` (3,917 entries), `attributes.json` (15,364 entries), `dependencies.json` (5,218 entries), and `relationships.json` (5,636 entries). These all get bundled into the main JavaScript chunk, causing slow initial page load.

---

## Problem

```
vite build output:
  dist/assets/index-[hash].js    2,847 kB  │ gzip: 412 kB  ⚠️
  (!) Some chunks are larger than 500 kB after minification.
```

Most users only visit 1-2 modules per session. Loading ALL 3,917 entities upfront when someone just wants the Dashboard is wasteful.

---

## Solution: Domain-Based Code Splitting + Lazy Loading

### Strategy

1. **Split large JSON files by domain** (16 domains) into separate chunks
2. **Lazy-load data per module** — only load what each page needs
3. **Keep small files as static imports** (capabilities, reuseScores, domains index)
4. **Use React.lazy() for page components** so module code is also split

---

### Step 1: Split Data Files

#### 1a. Split `entities.json` into per-domain files

Create `src/data/entities/` directory:
```
src/data/entities/
  index.json              # Domain index: [{name, count, file}] — 1KB
  party-management.json   # 622 entities — ~80KB
  agreement-account.json  # 506 entities — ~65KB
  classification.json     # 543 entities — ~70KB
  product-management.json # 209 entities — ~27KB
  ...                     # 12 more domain files
  other.json              # 902 entities — ~115KB
```

`index.json` schema:
```json
[
  {"name": "Party Management", "slug": "party-management", "count": 622},
  {"name": "Agreement & Account", "slug": "agreement-account", "count": 506},
  ...
]
```

Each domain file contains just the entities for that domain.

#### 1b. Split `attributes.json` into per-domain files

Same pattern → `src/data/attributes/` directory. Each domain file contains attributes for entities in that domain. These are the largest files (~3-5MB total) and benefit most from splitting.

```
src/data/attributes/
  party-management.json    # Attributes for 622 Party entities
  agreement-account.json   # Attributes for 506 Agreement entities
  ...
```

#### 1c. Split `relationships.json` into per-domain files

`src/data/relationships/` — relationships where parent OR child is in that domain.

#### 1d. Keep these as single files (they're small enough):

```
src/data/
  domains.json           # ~2KB — domain index (always loaded)
  capabilities.json      # ~15KB — 112 capabilities (always loaded)
  reuseScores.json       # ~8KB — 219 entities
  dataRequirements.json  # ~12KB — 113 requirements
  mappings.json          # ~10KB — 360 mappings
  lineage.json           # ~13KB — 23 entries
  starSchema.json        # ~5KB — 11 tables
  gapExtensions.json     # ~8KB — 21 tables
  enrichment.json        # ~15KB — 10 detailed + 102 placeholder
  pakistanContext.json   # ~3KB
  bacrQuestions.json     # ~40KB — 793 questions (load on /maturity only)
```

#### 1e. Split `dependencies.json` by theme

```
src/data/dependencies/
  marketing.json         # Marketing & CX capabilities
  finance.json           # Finance & PM capabilities
  product.json           # Product Management capabilities
```

---

### Step 2: Create Lazy Data Loader

Create `src/utils/lazyData.ts`:

```typescript
// Cache loaded domain data in memory
const cache = new Map<string, any>();

/**
 * Lazy-load a domain's entity data.
 * First call: dynamic import → cache. Subsequent calls: from cache.
 */
export async function loadDomainEntities(domainSlug: string): Promise<Entity[]> {
  const key = `entities:${domainSlug}`;
  if (cache.has(key)) return cache.get(key);
  
  // Dynamic import — Vite will code-split this into a separate chunk
  const module = await import(`../data/entities/${domainSlug}.json`);
  const data = module.default;
  cache.set(key, data);
  return data;
}

export async function loadDomainAttributes(domainSlug: string): Promise<Record<string, Attribute[]>> {
  const key = `attributes:${domainSlug}`;
  if (cache.has(key)) return cache.get(key);
  
  const module = await import(`../data/attributes/${domainSlug}.json`);
  const data = module.default;
  cache.set(key, data);
  return data;
}

export async function loadDomainRelationships(domainSlug: string): Promise<Relationship[]> {
  const key = `relationships:${domainSlug}`;
  if (cache.has(key)) return cache.get(key);
  
  const module = await import(`../data/relationships/${domainSlug}.json`);
  const data = module.default;
  cache.set(key, data);
  return data;
}

export async function loadBacrQuestions(): Promise<BacrData> {
  const key = 'bacr';
  if (cache.has(key)) return cache.get(key);
  
  const module = await import('../data/bacrQuestions.json');
  const data = module.default;
  cache.set(key, data);
  return data;
}

export async function loadDependencies(theme: string): Promise<Record<string, DependencyData>> {
  const key = `dependencies:${theme}`;
  if (cache.has(key)) return cache.get(key);
  
  const module = await import(`../data/dependencies/${theme}.json`);
  const data = module.default;
  cache.set(key, data);
  return data;
}

/**
 * Preload domains adjacent to the current one (prefetch for smooth navigation)
 */
export function prefetchDomain(domainSlug: string): void {
  // Fire and forget — loads in background
  loadDomainEntities(domainSlug).catch(() => {});
}

/**
 * Clear cache (useful for hot-reload during development)
 */
export function clearCache(): void {
  cache.clear();
}
```

---

### Step 3: Update Data Hooks

#### Update `src/hooks/useEntities.ts`:

```typescript
import { useState, useEffect } from 'react';
import { loadDomainEntities, prefetchDomain } from '../utils/lazyData';
import domainsIndex from '../data/domains.json'; // small, always loaded

export function useEntities(domainSlug: string | null) {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!domainSlug) {
      setEntities([]);
      return;
    }

    setLoading(true);
    setError(null);

    loadDomainEntities(domainSlug)
      .then(data => {
        setEntities(data);
        setLoading(false);
        // Prefetch adjacent domains for smooth navigation
        const domainList = domainsIndex.map(d => d.slug);
        const idx = domainList.indexOf(domainSlug);
        if (idx > 0) prefetchDomain(domainList[idx - 1]);
        if (idx < domainList.length - 1) prefetchDomain(domainList[idx + 1]);
      })
      .catch(err => {
        setError(`Failed to load ${domainSlug} entities`);
        setLoading(false);
      });
  }, [domainSlug]);

  return { entities, loading, error };
}
```

Apply the same pattern for `useAttributes`, `useRelationships`.

#### Update components that consume these hooks:

- **Model Explorer:** Load entities for selected domain only (not all 3,917 upfront). Show loading spinner while domain data loads. When user clicks a different domain, load that domain's data.
- **Capability Navigator:** Load dependencies for selected theme only.
- **Maturity Assessment:** Load BACR questions lazily (only when user navigates to `/maturity`).

---

### Step 4: React.lazy() for Page Components

In `App.tsx`, lazy-load page components:

```typescript
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const ModelExplorer = lazy(() => import('./pages/ModelExplorer'));
const Capabilities = lazy(() => import('./pages/Capabilities'));
const DependencyGraph = lazy(() => import('./pages/DependencyGraph'));
const MaturityAssessment = lazy(() => import('./pages/MaturityAssessment'));
const ProfitabilityEngine = lazy(() => import('./pages/ProfitabilityEngine'));
const RoadmapBuilder = lazy(() => import('./pages/RoadmapBuilder'));
const PakistanReference = lazy(() => import('./pages/PakistanReference'));

// In router:
<Suspense fallback={<PageSkeleton />}>
  <Routes>
    <Route path="/" element={<Dashboard />} />
    <Route path="/model" element={<ModelExplorer />} />
    ...
  </Routes>
</Suspense>
```

Create `src/components/layout/PageSkeleton.tsx` — a loading placeholder that matches the page layout (sidebar + header + grey content blocks). Shows while page JS chunk loads.

---

### Step 5: Vite Config for Chunking

Update `vite.config.ts`:

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-charts': ['recharts', 'd3'],
          'vendor-export': ['jspdf', 'html2canvas'],
          
          // Data chunks are auto-split by dynamic import
          // No need to manually chunk data files — Vite handles this
        }
      }
    },
    chunkSizeWarningLimit: 600, // Raise slightly since we've optimized
  }
});
```

---

### Step 6: Loading States

Every component that uses lazy-loaded data must show a loading state:

```typescript
// Pattern for all data-consuming components:
function EntityList({ domainSlug }) {
  const { entities, loading, error } = useEntities(domainSlug);
  
  if (loading) return <EntityListSkeleton />;  // Grey animated placeholder
  if (error) return <ErrorCard message={error} />;
  if (entities.length === 0) return <EmptyState message="No entities in this domain" />;
  
  return <>{entities.map(e => <EntityRow key={e.id} entity={e} />)}</>;
}
```

Create skeleton components:
- `EntityListSkeleton` — 10 grey animated rows
- `CapabilityDetailSkeleton` — grey blocks matching the capability detail layout
- `ChartSkeleton` — grey rectangle matching chart dimensions

Use Tailwind's `animate-pulse bg-slate-200` for skeleton animations.

---

### Step 7: Update `generate_sample_data.py`

If the sample data generator exists, update it to output split files in the new directory structure:

```python
# Instead of one big entities.json:
# Write src/data/entities/index.json + src/data/entities/{slug}.json per domain
# Same for attributes, relationships, dependencies
```

---

## Expected Results

**Before optimization:**
```
dist/assets/index-[hash].js    2,847 kB  │ gzip: 412 kB  ⚠️
```

**After optimization:**
```
dist/assets/index-[hash].js          180 kB  │ gzip: 52 kB   ✅ (app shell + routing)
dist/assets/vendor-react-[hash].js   140 kB  │ gzip: 45 kB   ✅
dist/assets/vendor-charts-[hash].js  280 kB  │ gzip: 88 kB   ✅
dist/assets/Dashboard-[hash].js       25 kB  │ gzip: 8 kB    ✅ (lazy page)
dist/assets/ModelExplorer-[hash].js   35 kB  │ gzip: 11 kB   ✅ (lazy page)
dist/assets/party-management-[hash].js 80 kB │ gzip: 18 kB   ✅ (lazy data)
... (16 domain data chunks, loaded on demand)
```

**Initial page load:** ~400KB → Dashboard renders in <1s
**Model Explorer first domain click:** +80-115KB for that domain's data
**Subsequent domain clicks:** instant (prefetched or cached)

---

## Verification Checklist

```
□ No chunk size warnings in production build
□ Dashboard loads without loading ALL entity data
□ Model Explorer shows loading spinner when switching domains
□ After first domain load, switching back is instant (cached)
□ Maturity Assessment questions load lazily (not on Dashboard)
□ Page transitions show skeleton screen briefly, then content
□ All existing functionality still works (no regressions)
□ Global search (Cmd+K) still works — searches domain index, not full entity list
□ TypeScript compiles clean
□ No console errors
□ Build succeeds
```

## Notes on Global Search

The Cmd+K command palette currently searches all entities. After this optimization, it should:
1. Search the **domain index** for domain matches (always available)
2. Search **capabilities.json** for capability matches (always available — it's small)
3. For entity search: search entity names from the **domain index metadata** (which includes a top-entities-per-domain preview list), NOT the full entity data
4. When user selects an entity result, THEN load that domain's data and navigate

Update `src/utils/search.ts` → `globalSearch()` to work with the domain index instead of the full entity list. Add a small `entityIndex.json` (~50KB) containing just entity names + domains (no descriptions or attributes) for search purposes.
