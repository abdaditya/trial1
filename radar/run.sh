#!/bin/bash
# Start Creator Radar and open it in the browser.
cd "$(dirname "$0")" || exit 1
if [ ! -x .venv/bin/python ]; then
  PY=../.venv/bin/python; [ -x "$PY" ] || PY=python3
  "$PY" -m venv .venv || exit 1
fi
.venv/bin/python -c "import yt_dlp" 2>/dev/null || .venv/bin/pip install -q yt-dlp || exit 1
# yt-dlp needs to stay current to keep reading YouTube; update at most once a week.
if [ -z "$(find .venv/.ytdlp_updated -mtime -7 2>/dev/null)" ]; then
  .venv/bin/pip install -q -U yt-dlp >/dev/null 2>&1 && touch .venv/.ytdlp_updated
fi
(sleep 1 && open "http://127.0.0.1:8765") &
exec .venv/bin/python -m app.server
