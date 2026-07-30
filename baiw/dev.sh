#!/bin/bash
# BAIW dev helper.  Usage:  ./dev.sh [dev|build|preview|data]   (or: bash dev.sh …)
#
# The project now lives on ext4, so node_modules runs natively — no symlink,
# no polling, no workarounds. Plain Vite.
set -e
cd "$(dirname "$0")"

REPO_ROOT="$(cd .. && pwd)"
# The pipeline outputs and the BACR workbook that prepare_data.py reads now live
# in data-sources/ rather than scattered across the repo root. The layout inside
# that folder is unchanged, so prepare_data.py needs no edit — only this path.
DATA_SOURCES="$REPO_ROOT/data-sources"
MODE="${1:-dev}"

case "$MODE" in
  dev)
    echo "=== BAIW Development Server ==="
    npx vite                              # port comes from vite.config.ts (5174)
    ;;
  build)
    echo "=== BAIW Production Build ==="
    npx tsc -b && npx vite build
    echo ""
    echo "Build complete. Output in dist/"
    ;;
  preview)
    echo "=== BAIW Production Preview ==="
    if [ ! -d "dist" ]; then
      echo "No dist/ found. Building first..."
      npx tsc -b && npx vite build
    fi
    echo ""
    npx vite preview --port 4173
    ;;
  data)
    echo "=== BAIW Data Conversion ==="
    pip install openpyxl 2>/dev/null || true
    if [ ! -d "$DATA_SOURCES" ]; then
      echo "Missing $DATA_SOURCES — the pipeline outputs prepare_data.py reads." >&2
      exit 1
    fi
    python3 scripts/prepare_data.py --repo "$DATA_SOURCES" --output src/data/ "${@:2}"
    ;;
  *)
    echo "Usage: ./dev.sh [dev|build|preview|data]"
    echo ""
    echo "  dev      Start development server (default, port 5174)"
    echo "  build    Production build to dist/"
    echo "  preview  Serve production build locally (port 4173)"
    echo "  data     Re-run data conversion (add --dry-run to test)"
    ;;
esac
