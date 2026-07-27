#!/bin/bash
# Run the BAIW app from the repo root — no need to `cd baiw` first.
# Usage:  ./dev.sh [dev|build|preview|data]
cd "$(dirname "$0")/baiw" && exec ./dev.sh "$@"
