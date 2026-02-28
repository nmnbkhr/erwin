#!/bin/bash
set -e

echo "Building BAIW for production..."
npm run build

echo ""
echo "Build output:"
du -sh dist/
ls -la dist/assets/ | head -20

echo ""
echo "Bundle sizes:"
for f in dist/assets/*.js; do
  size=$(wc -c < "$f")
  echo "  $(basename $f): ${size} bytes"
done

echo ""
echo "Deploying to Vercel..."
npx vercel --prod

echo ""
echo "Deployment complete!"
