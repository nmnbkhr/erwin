# Claude Code Prompt: DPS Market-Watch Poller Service

## Context

PSX DPS at `https://dps.psx.com.pk/market-watch` returns a raw HTML `<table>` 
with 475 symbols and 11 fields. One HTTP GET = full market snapshot.

This is a standalone service — runs independently alongside tick_service.py.
No WebSocket, no pagination, just a simple HTTP poll every 30 seconds.

**Fields per row (11 columns):**
```
[0]  Symbol        e.g. "HUBC"
[1]  Sector        e.g. "34"
[2]  Listed In     e.g. "KSE100,KSE30,KMI30"
[3]  LDCP          Last Day Closing Price (previousClose)
[4]  Open          Today's open
[5]  High          Today's high
[6]  Low           Today's low
[7]  Current       Last traded price
[8]  Change        Price change (absolute)
[9]  Change%       Percentage change
[10] Volume        Today's cumulative volume
```

## Output

**JSONL file**: `~/psxdata/intraday/dps_market_watch_YYYY-MM-DD.jsonl`

Each line = one snapshot of one symbol at one point in time:
```json
{"symbol":"HUBC","sector":"34","indices":"KSE100,KSE30","ldcp":195.1,"open":195.1,"high":197.9,"low":187.1,"current":188.38,"change":-6.72,"changePct":-3.44,"volume":5978764,"_ts":"2026-03-17T13:49:30.000+05:00","_poll":1}
```

Also saves to SQLite: `~/psxdata/tick_bars.db` → table `market_snapshots`

## Step 1: Check existing files

```bash
ls ~/pakfindata/src/pakfindata/services/ 2>/dev/null
cat ~/pakfindata/src/pakfindata/config.py 2>/dev/null | head -20
```

## Step 2: Create the service

Create `~/pakfindata/src/pakfindata/services/market_watch_poller.py`:

```python
"""
DPS Market-Watch Poller — polls dps.psx.com.pk/market-watch every 30 seconds.

Captures: LDCP, Open, High, Low, Current, Change, Change%, Volume for all ~475 symbols.
Saves to: JSONL file (daily) + SQLite table (market_snapshots).

This is a SEPARATE service from tick_service.py.
Run it alongside: provides OHLC + LDCP data even if WebSocket is down.

Usage:
    python -m pakfindata.services.market_watch_poller

Output:
    ~/psxdata/intraday/dps_market_watch_YYYY-MM-DD.jsonl
    ~/psxdata/tick_bars.db → market_snapshots table
"""

import requests
import re
import json
import sqlite3
import time
import signal
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

# ═══════════════════════════════════════════════════════
# CONFIG
# ═══════════════════════════════════════════════════════

DPS_URL = "https://dps.psx.com.pk/market-watch"
POLL_INTERVAL = 30  # seconds between polls

PKT = timezone(timedelta(hours=5))
DATA_DIR = Path.home() / "psxdata"
INTRADAY_DIR = DATA_DIR / "intraday"
DB_PATH = DATA_DIR / "tick_bars.db"

# Market hours (PKT)
MARKET_PRE_OPEN = (9, 10)   # start polling at 9:10
MARKET_CLOSE = (15, 35)      # stop polling at 15:35

# Ensure dirs exist
DATA_DIR.mkdir(parents=True, exist_ok=True)
INTRADAY_DIR.mkdir(parents=True, exist_ok=True)

# Graceful shutdown
running = True
def signal_handler(sig, frame):
    global running
    running = False
    log("🛑 Shutdown signal received")
signal.signal(signal.SIGTERM, signal_handler)
signal.signal(signal.SIGINT, signal_handler)


# ═══════════════════════════════════════════════════════
# LOGGING
# ═══════════════════════════════════════════════════════

def log(msg: str):
    ts = datetime.now(PKT).strftime("%H:%M:%S")
    print(f"[{ts}] {msg}", flush=True)


# ═══════════════════════════════════════════════════════
# PARSER — Extract table rows from DPS HTML
# ═══════════════════════════════════════════════════════

def parse_market_watch(html: str) -> list[dict]:
    """
    Parse the raw <table> HTML from DPS market-watch.
    Returns list of dicts with all 11 fields.
    """
    rows = re.findall(r'<tr[^>]*>(.*?)</tr>', html, re.DOTALL)
    results = []
    
    for row in rows:
        cells = re.findall(r'<td[^>]*>(.*?)</td>', row, re.DOTALL)
        if len(cells) < 11:
            continue  # skip header or malformed rows
        
        # Strip HTML tags from cell content
        cells = [re.sub(r'<[^>]+>', '', c).strip() for c in cells]
        
        # Parse fields
        try:
            symbol = cells[0].strip()
            if not symbol:
                continue
            
            record = {
                "symbol": symbol,
                "sector": cells[1].strip(),
                "indices": cells[2].strip(),
                "ldcp": safe_float(cells[3]),
                "open": safe_float(cells[4]),
                "high": safe_float(cells[5]),
                "low": safe_float(cells[6]),
                "current": safe_float(cells[7]),
                "change": safe_float(cells[8]),
                "changePct": safe_float(cells[9]),
                "volume": safe_int(cells[10]),
            }
            results.append(record)
        except Exception:
            continue
    
    return results


def safe_float(s: str) -> float:
    """Parse float, handling commas and empty strings."""
    s = s.replace(",", "").replace("−", "-").replace("–", "-").strip()
    if not s or s == "--" or s == "-":
        return 0.0
    try:
        return float(s)
    except ValueError:
        return 0.0


def safe_int(s: str) -> int:
    """Parse int, handling commas, M/K suffixes, and empty strings."""
    s = s.replace(",", "").strip()
    if not s or s == "--" or s == "-":
        return 0
    
    # Handle M (millions) and K (thousands) suffixes
    multiplier = 1
    if s.upper().endswith("M"):
        s = s[:-1]
        multiplier = 1_000_000
    elif s.upper().endswith("K"):
        s = s[:-1]
        multiplier = 1_000
    elif s.upper().endswith("B"):
        s = s[:-1]
        multiplier = 1_000_000_000
    
    try:
        return int(float(s) * multiplier)
    except ValueError:
        return 0


# ═══════════════════════════════════════════════════════
# FETCH
# ═══════════════════════════════════════════════════════

session = requests.Session()
session.headers.update({
    "User-Agent": "pakfindata/1.0",
    "Accept": "text/html",
})

def fetch_market_watch() -> list[dict]:
    """Fetch and parse market-watch in one call."""
    try:
        r = session.get(DPS_URL, timeout=15)
        if r.status_code != 200:
            log(f"⚠️ HTTP {r.status_code}")
            return []
        return parse_market_watch(r.text)
    except requests.exceptions.RequestException as e:
        log(f"⚠️ Fetch error: {e}")
        return []


# ═══════════════════════════════════════════════════════
# STORAGE — JSONL
# ═══════════════════════════════════════════════════════

def get_jsonl_path() -> Path:
    date_str = datetime.now(PKT).strftime("%Y-%m-%d")
    return INTRADAY_DIR / f"dps_market_watch_{date_str}.jsonl"


def append_jsonl(records: list[dict], poll_num: int):
    """Append snapshot to daily JSONL file."""
    now = datetime.now(PKT)
    ts_iso = now.strftime("%Y-%m-%dT%H:%M:%S.000+05:00")
    ts_epoch = now.timestamp()
    
    fp = get_jsonl_path()
    with open(fp, "a") as f:
        for rec in records:
            rec["_ts"] = ts_iso
            rec["_epoch"] = round(ts_epoch, 3)
            rec["_poll"] = poll_num
            f.write(json.dumps(rec, separators=(",", ":")) + "\n")


# ═══════════════════════════════════════════════════════
# STORAGE — SQLite
# ═══════════════════════════════════════════════════════

def init_db():
    """Create market_snapshots table if not exists."""
    con = sqlite3.connect(str(DB_PATH), timeout=30)
    con.execute("PRAGMA journal_mode=WAL")
    con.execute("""
        CREATE TABLE IF NOT EXISTS market_snapshots (
            symbol TEXT NOT NULL,
            timestamp REAL NOT NULL,
            date TEXT NOT NULL,
            poll INTEGER NOT NULL,
            ldcp REAL,
            open REAL,
            high REAL,
            low REAL,
            current REAL,
            change REAL,
            change_pct REAL,
            volume INTEGER,
            sector TEXT,
            indices TEXT,
            PRIMARY KEY (symbol, timestamp)
        )
    """)
    con.execute("""
        CREATE INDEX IF NOT EXISTS idx_mw_date 
        ON market_snapshots(date)
    """)
    con.execute("""
        CREATE INDEX IF NOT EXISTS idx_mw_symbol_date 
        ON market_snapshots(symbol, date)
    """)
    con.commit()
    con.close()


def save_to_db(records: list[dict], poll_num: int):
    """Insert snapshot into SQLite."""
    now = datetime.now(PKT)
    ts = now.timestamp()
    date_str = now.strftime("%Y-%m-%d")
    
    con = sqlite3.connect(str(DB_PATH), timeout=30)
    inserted = 0
    for rec in records:
        try:
            con.execute("""
                INSERT OR IGNORE INTO market_snapshots 
                (symbol, timestamp, date, poll, ldcp, open, high, low, 
                 current, change, change_pct, volume, sector, indices)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                rec["symbol"], ts, date_str, poll_num,
                rec["ldcp"], rec["open"], rec["high"], rec["low"],
                rec["current"], rec["change"], rec["changePct"],
                rec["volume"], rec["sector"], rec["indices"]
            ))
            inserted += 1
        except Exception:
            pass
    con.commit()
    con.close()
    return inserted


# ═══════════════════════════════════════════════════════
# MARKET HOURS CHECK
# ═══════════════════════════════════════════════════════

def is_market_hours() -> bool:
    """Check if current time is within polling window."""
    now = datetime.now(PKT)
    hour, minute = now.hour, now.minute
    
    # Weekend check
    if now.weekday() >= 5:
        return False
    
    start = MARKET_PRE_OPEN[0] * 60 + MARKET_PRE_OPEN[1]
    end = MARKET_CLOSE[0] * 60 + MARKET_CLOSE[1]
    current = hour * 60 + minute
    
    return start <= current <= end


def seconds_until_market_open() -> int:
    """Calculate seconds until next market open."""
    now = datetime.now(PKT)
    
    # Find next weekday
    target = now.replace(
        hour=MARKET_PRE_OPEN[0], minute=MARKET_PRE_OPEN[1], 
        second=0, microsecond=0
    )
    
    if now >= target or now.weekday() >= 5:
        # Move to next day
        target += timedelta(days=1)
        while target.weekday() >= 5:
            target += timedelta(days=1)
    
    return max(0, int((target - now).total_seconds()))


# ═══════════════════════════════════════════════════════
# MAIN LOOP
# ═══════════════════════════════════════════════════════

def main():
    global running
    
    log("═══════════════════════════════════════════════")
    log("  DPS MARKET-WATCH POLLER")
    log(f"  Poll interval: {POLL_INTERVAL}s")
    log(f"  Market hours: {MARKET_PRE_OPEN[0]:02d}:{MARKET_PRE_OPEN[1]:02d} → {MARKET_CLOSE[0]:02d}:{MARKET_CLOSE[1]:02d} PKT")
    log(f"  JSONL: {get_jsonl_path()}")
    log(f"  DB: {DB_PATH}")
    log("═══════════════════════════════════════════════")
    
    # Init DB
    init_db()
    
    # Wait for market hours if needed
    if not is_market_hours():
        wait = seconds_until_market_open()
        if wait > 0:
            log(f"😴 Market closed. Sleeping {wait//3600}h {(wait%3600)//60}m until next open...")
            
            # Sleep in chunks so we can respond to signals
            while wait > 0 and running:
                chunk = min(wait, 60)
                time.sleep(chunk)
                wait -= chunk
            
            if not running:
                log("Shutdown during sleep")
                return
    
    log("🚀 Starting market-watch polling...")
    
    poll_num = 0
    total_records = 0
    
    while running and is_market_hours():
        poll_start = time.time()
        poll_num += 1
        
        # Fetch
        records = fetch_market_watch()
        
        if records:
            # Save to JSONL
            append_jsonl(records, poll_num)
            
            # Save to DB
            saved = save_to_db(records, poll_num)
            total_records += len(records)
            
            # Log summary (every 10 polls = every 5 min)
            if poll_num % 10 == 1 or poll_num <= 3:
                # Find a sample symbol for display
                sample = next((r for r in records if r["symbol"] == "HUBC"), records[0])
                log(
                    f"📊 Poll #{poll_num}: {len(records)} symbols | "
                    f"Total: {total_records:,} | "
                    f"{sample['symbol']} {sample['current']} ({sample['change']:+.2f})"
                )
        else:
            log(f"⚠️ Poll #{poll_num}: empty response")
        
        # Sleep until next poll
        elapsed = time.time() - poll_start
        sleep_time = max(0, POLL_INTERVAL - elapsed)
        
        # Sleep in small chunks for signal responsiveness
        while sleep_time > 0 and running:
            chunk = min(sleep_time, 1)
            time.sleep(chunk)
            sleep_time -= chunk
    
    # Final summary
    date_str = datetime.now(PKT).strftime("%Y-%m-%d")
    jsonl_path = get_jsonl_path()
    jsonl_size = jsonl_path.stat().st_size if jsonl_path.exists() else 0
    
    log("")
    log("═══════════════════════════════════════════════")
    log(f"✅ DONE — {date_str}")
    log(f"   Polls: {poll_num}")
    log(f"   Records: {total_records:,}")
    log(f"   JSONL: {jsonl_path.name} ({jsonl_size / 1024:.0f} KB)")
    log(f"   DB: market_snapshots table")
    log("═══════════════════════════════════════════════")


if __name__ == "__main__":
    main()
```

## Step 3: Test it

```bash
cd ~/pakfindata
source .venv/bin/activate  # or conda activate psx
export PYTHONPATH=~/pakfindata/src

# Quick test — single fetch
python -c "
from pakfindata.services.market_watch_poller import fetch_market_watch
import json
records = fetch_market_watch()
print(f'{len(records)} symbols')
if records:
    print(json.dumps(records[0], indent=2))
"

# Run the poller (Ctrl+C to stop)
python -m pakfindata.services.market_watch_poller
```

## Step 4: Run alongside tick_service

Open two terminals:

```bash
# Terminal 1: WebSocket tick collector
python -m pakfindata.services.tick_service

# Terminal 2: Market-watch poller (THIS service)
python -m pakfindata.services.market_watch_poller
```

Or with nohup:

```bash
# Run both in background
nohup python -m pakfindata.services.tick_service >> ~/psxdata/logs/tick_service.log 2>&1 &
nohup python -m pakfindata.services.market_watch_poller >> ~/psxdata/logs/market_watch.log 2>&1 &

# Check both
jobs
tail -f ~/psxdata/logs/market_watch.log
```

## What gets saved

**JSONL file** — `~/psxdata/intraday/dps_market_watch_2026-03-17.jsonl`:
```
{"symbol":"HUBC","sector":"34","indices":"KSE100,KSE30","ldcp":195.1,"open":195.1,"high":197.9,"low":187.1,"current":188.38,"change":-6.72,"changePct":-3.44,"volume":5978764,"_ts":"2026-03-17T09:30:30.000+05:00","_epoch":1773635430.0,"_poll":1}
{"symbol":"OGDC","sector":"34","indices":"KSE100","ldcp":98.5,"open":97.8,...,"_poll":1}
... (475 symbols × ~750 polls = ~356,250 lines/day)
```

**SQLite table** — `market_snapshots` in tick_bars.db:
```sql
SELECT symbol, time(timestamp, 'unixepoch', '+5 hours') as time, 
       current, volume, change_pct
FROM market_snapshots 
WHERE date = '2026-03-17' AND symbol = 'HUBC'
ORDER BY timestamp;
```

## Expected daily output

```
Polls:     ~750 (every 30s for 6.25 hours)
Symbols:   475 per poll
Records:   ~356,250 per day
JSONL:     ~40-60 MB per day
DB rows:   ~356,250 per day
```

## NOTES

1. **Volume field may have M/K suffix** — the parser handles `"32.2M"` → `32200000`
   and `"500K"` → `500000`. Also handles commas like `"5,978,764"`.

2. **LDCP = previousClose** — this is the field missing from klines CSV.
   Use it to compute accurate change/changePct in the CSV→JSONL converter.

3. **No bid/ask** — DPS market-watch doesn't have it. Only the WebSocket has bid/ask.

4. **One HTTP request = entire market** — very efficient. No per-symbol API calls needed.

5. **30 seconds is conservative** — DPS probably updates every 15s. You can lower 
   POLL_INTERVAL to 15 if you want finer granularity (doubles file size).

6. **Graceful shutdown** — Ctrl+C or SIGTERM stops cleanly. No data corruption.

7. **File grows all day** — ~50MB JSONL is fine. Compress at end of day if needed:
   `gzip ~/psxdata/intraday/dps_market_watch_2026-03-17.jsonl`
