# BAIW — Deploy to Production

## Context

BAIW app is built, optimized, and running locally. Deploy it to a public URL for client demos and team access. Use Vercel (preferred — zero-config for Vite/React) with fallback instructions for Netlify.

---

## Task

1. Prepare the app for production deployment
2. Configure Vercel deployment
3. Set up proper SPA routing, caching, and metadata
4. Add PWA basics for offline capability
5. Create deployment scripts

---

## Step 1: Production Preparation

### 1a. Environment-aware base URL

Update `vite.config.ts`:
```typescript
export default defineConfig({
  base: '/',  // Root path for custom domain, or '/baiw/' for subpath
  build: {
    outDir: 'dist',
    sourcemap: false,  // No sourcemaps in production
  }
});
```

### 1b. HTML Meta Tags

Update `index.html`:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  
  <!-- SEO & Social -->
  <title>BAIW — Banking Analytics Intelligence Workbench</title>
  <meta name="description" content="Interactive platform for banking data model exploration, capability assessment, and profitability analytics. Built on Teradata FSDM with Pakistan banking context." />
  <meta name="author" content="BAIW" />
  
  <!-- Open Graph -->
  <meta property="og:title" content="BAIW — Banking Analytics Intelligence Workbench" />
  <meta property="og:description" content="Explore 3,917 FSDM entities, 112 BVF capabilities, and Pakistan banking analytics in one interactive platform." />
  <meta property="og:type" content="website" />
  <meta property="og:image" content="/og-image.png" />
  
  <!-- Favicon -->
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  
  <!-- Theme color -->
  <meta name="theme-color" content="#0F172A" />
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

### 1c. Create Favicon

Create `public/favicon.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#0F172A"/>
  <text x="16" y="22" font-family="system-ui" font-size="16" font-weight="bold" fill="#3B82F6" text-anchor="middle">B</text>
</svg>
```

### 1d. Create OG Image

Create a simple `public/og-image.png` (1200×630) — or generate one programmatically:

Create `scripts/generate_og_image.py`:
```python
"""Generate Open Graph image for BAIW social sharing."""
# Uses Pillow to create a simple branded image
# pip install Pillow
from PIL import Image, ImageDraw, ImageFont

img = Image.new('RGB', (1200, 630), '#0F172A')
draw = ImageDraw.Draw(img)

# Title
try:
    font_large = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 48)
    font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 24)
except:
    font_large = ImageFont.load_default()
    font_small = ImageFont.load_default()

draw.text((80, 200), "BAIW", fill='#3B82F6', font=font_large)
draw.text((80, 270), "Banking Analytics Intelligence Workbench", fill='#E2E8F0', font=font_small)
draw.text((80, 340), "3,917 Entities  •  112 Capabilities  •  793 Assessment Questions", fill='#94A3B8', font=font_small)
draw.text((80, 400), "Teradata FSDM  •  BVF Framework  •  Pakistan Banking Context", fill='#64748B', font=font_small)

img.save('public/og-image.png')
print("✅ OG image generated: public/og-image.png")
```

### 1e. Add robots.txt and sitemap

Create `public/robots.txt`:
```
User-agent: *
Allow: /
```

---

## Step 2: Vercel Configuration

### 2a. Create `vercel.json`

```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/((?!assets/).*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/(.*).json",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=3600"
        }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

Key configurations:
- **SPA rewrites:** All non-asset routes → `index.html` (React Router handles client-side routing)
- **Cache headers:** Assets (JS/CSS with hashes) get immutable 1-year cache. JSON data gets 1-hour cache.
- **Security headers:** Prevent framing, MIME sniffing, referrer leaking

### 2b. Create `.vercelignore`

```
node_modules
scripts/
*.py
*.md
!README.md
.git
```

---

## Step 3: Deployment Scripts

### 3a. Add npm scripts to `package.json`

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "deploy": "vercel --prod",
    "deploy:preview": "vercel",
    "analyze": "npx vite-bundle-visualizer"
  }
}
```

### 3b. Create `scripts/deploy.sh`

```bash
#!/bin/bash
set -e

echo "🏗️  Building BAIW for production..."
npm run build

echo "📊 Build output:"
du -sh dist/
ls -la dist/assets/ | head -20

echo ""
echo "📦 Bundle sizes:"
for f in dist/assets/*.js; do
  size=$(wc -c < "$f")
  gzip_size=$(gzip -c "$f" | wc -c)
  echo "  $(basename $f): $(numfmt --to=iec $size) (gzip: $(numfmt --to=iec $gzip_size))"
done

echo ""
echo "🚀 Deploying to Vercel..."
npx vercel --prod

echo ""
echo "✅ Deployment complete!"
```

---

## Step 4: Netlify Alternative

If using Netlify instead of Vercel:

### 4a. Create `netlify.toml`

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.json"
  [headers.values]
    Cache-Control = "public, max-age=3600"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

### 4b. Create `public/_redirects` (backup)

```
/*    /index.html   200
```

---

## Step 5: GitHub Actions CI/CD (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy BAIW

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Type check
        run: npx tsc --noEmit
      
      - name: Build
        run: npm run build
      
      - name: Check bundle sizes
        run: |
          echo "Bundle sizes:"
          du -sh dist/
          ls -la dist/assets/*.js | awk '{print $5, $9}' | sort -rn | head -10
      
      # Vercel deployment (uncomment and add VERCEL_TOKEN secret)
      # - name: Deploy to Vercel
      #   uses: amondnet/vercel-action@v25
      #   with:
      #     vercel-token: ${{ secrets.VERCEL_TOKEN }}
      #     vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
      #     vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
      #     vercel-args: '--prod'
```

---

## Step 6: Performance Monitoring

### 6a. Add Web Vitals tracking

Install: `npm install web-vitals`

Create `src/utils/vitals.ts`:
```typescript
import { onCLS, onFID, onLCP, onFCP, onTTFB } from 'web-vitals';

export function reportWebVitals() {
  onCLS(metric => console.log('CLS:', metric.value));
  onFID(metric => console.log('FID:', metric.value));
  onLCP(metric => console.log('LCP:', metric.value));
  onFCP(metric => console.log('FCP:', metric.value));
  onTTFB(metric => console.log('TTFB:', metric.value));
}
```

Call from `main.tsx`:
```typescript
import { reportWebVitals } from './utils/vitals';
reportWebVitals();
```

### 6b. Add loading performance log

In `App.tsx`, log initial load time:
```typescript
useEffect(() => {
  const loadTime = performance.now();
  console.log(`BAIW loaded in ${Math.round(loadTime)}ms`);
}, []);
```

---

## Step 7: README Update

Update `README.md` with deployment info:

```markdown
# BAIW — Banking Analytics Intelligence Workbench

Interactive platform for banking data model exploration, capability assessment, 
and profitability analytics built on Teradata FSDM.

## Quick Start

```bash
npm install
npm run dev          # Development server at http://localhost:5173
```

## Production Build

```bash
npm run build        # Build to dist/
npm run preview      # Preview production build locally
```

## Deploy

### Vercel (recommended)
```bash
npx vercel --prod
```

### Netlify
Push to GitHub and connect the repo in Netlify dashboard.

### Manual
Upload the `dist/` folder to any static hosting (S3, GitHub Pages, etc.)

## Stack

- React 18 + TypeScript + Vite
- Tailwind CSS
- Recharts + D3.js
- Lucide React icons

## Data

The app uses pre-processed JSON data from the [FSDM/BVF analysis project](https://github.com/nmnbkhr/erwin).

To update data from the repo:
```bash
python scripts/prepare_data.py --repo /path/to/erwin --output src/data/
npm run build
```

## Modules

| Module | Route | Description |
|--------|-------|-------------|
| Dashboard | `/` | Overview stats, charts, quick navigation |
| Data Model | `/model` | Browse 3,917 FSDM entities across 16 domains |
| Capabilities | `/capabilities` | Explore 112 BVF capabilities with FSDM mappings |
| Dependencies | `/graph` | Interactive force/Sankey visualization |
| Maturity | `/maturity` | 793-question BACR assessment wizard |
| Profitability | `/profitability` | Star schema ERD, P&L builder, gap extensions |
| Roadmap | `/roadmap` | Capability picker with investment calculator |
| Pakistan | `/pakistan` | SBP, KIBOR, Islamic banking, payment systems |
```

---

## Deployment Checklist

```
Pre-deploy:
□ npm run build succeeds with no errors
□ npm run preview works locally (test all 8 routes)
□ No console errors in production build
□ All routes return content (no 404s on refresh)
□ favicon.svg exists in public/
□ og-image.png exists in public/

Deploy:
□ vercel.json or netlify.toml configured
□ SPA rewrites working (refresh on /model doesn't 404)
□ Asset caching headers set (immutable for hashed files)
□ Security headers present

Post-deploy:
□ All 8 module routes accessible via direct URL
□ Cmd+K search works
□ Assessment data persists in localStorage
□ PDF/JSON export works
□ Page load time <2s on 4G connection
□ Lighthouse Performance score >80
```
