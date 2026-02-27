#!/bin/bash
# BIApp — Banking Intelligence Application Launcher
# Opens the BVF → FSDM Profitability Mapper dashboard in your browser

PORT=8089
DIR="/mnt/e/erwin/bvf_output"

# Kill any existing server on this port
fuser -k $PORT/tcp 2>/dev/null

# Start server in background
cd "$DIR"
python -m http.server $PORT &>/dev/null &
SERVER_PID=$!

echo "BIApp server started on http://localhost:$PORT (PID: $SERVER_PID)"

# Open in browser
if command -v cmd.exe &>/dev/null; then
    cmd.exe /c start "http://localhost:$PORT" 2>/dev/null
elif command -v xdg-open &>/dev/null; then
    xdg-open "http://localhost:$PORT" 2>/dev/null
elif command -v open &>/dev/null; then
    open "http://localhost:$PORT"
else
    echo "Open http://localhost:$PORT in your browser"
fi

echo "Press Ctrl+C to stop the server"
wait $SERVER_PID
