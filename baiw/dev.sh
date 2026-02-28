#!/bin/bash
set -e
cd "$(dirname "$0")"

MODE="${1:-dev}"

case "$MODE" in
  dev)
    echo "=== BAIW Development Server ==="
    npm install
    echo ""
    npx vite --port 5175
    ;;
  build)
    echo "=== BAIW Production Build ==="
    npm install
    echo ""
    npx vite build
    echo ""
    echo "Build complete. Output in dist/"
    ;;
  preview)
    echo "=== BAIW Production Preview ==="
    if [ ! -d "dist" ]; then
      echo "No dist/ found. Building first..."
      npm install
      npx vite build
    fi
    echo ""
    npx vite preview --port 4173
    ;;
  data)
    echo "=== BAIW Data Conversion ==="
    pip install openpyxl 2>/dev/null
    python3 scripts/prepare_data.py --repo /mnt/e/erwin --output src/data/ "${@:2}"
    ;;
  *)
    echo "Usage: ./dev.sh [dev|build|preview|data]"
    echo ""
    echo "  dev      Start development server (default)"
    echo "  build    Production build to dist/"
    echo "  preview  Serve production build locally"
    echo "  data     Re-run data conversion (add --dry-run to test)"
    ;;
esac
