# Creator Radar — design (16 Nov 2026)

## Intent
Aditya runs @zbacktrack (Instagram reels, YouTube Shorts and long-form; AI, chips, big-tech deals; English, mostly Indian audience). He keeps running out of vidIQ credits and does not want to pay. He wants a free tool on his own Mac that does the parts of vidIQ he uses: his own account numbers, other creators' numbers, what is trending in his niche, and topic ideas.

## Goals
- **My account:** every reel / Short / video with views, likes, comments (Instagram: also reach, saves, shares), and which ones beat his own median.
- **Creators:** add any handle (YouTube, Instagram, TikTok); pull their recent videos; flag outliers (views ÷ that creator's median views; 3x or more is an outlier).
- **Trending in my niche:** top outliers of the last 7 / 30 days across tracked creators, plus YouTube keyword searches for niche terms.
- **Topic ideas:** a ranked list drawn from outliers, with topics zbacktrack has already made marked as "done" (matched against the playbook's "Reels made so far" and the script files).
- Runs with one command, opens in the browser, costs nothing, keeps all data on the Mac.

## Non-goals
- Keyword search-volume numbers (paid data everywhere).
- Posting, scheduling, thumbnail or title generation.
- YouTube private analytics (retention, impressions). Public numbers only in this version.
- Built-in AI text generation. Hook writing happens by asking Claude in this project, reading the data this tool saved.

## Anti-goals
- Anything that puts the Instagram account at risk: no logged-in scraping, no passwords stored.
- Any paid API or credit system.
- Touching the reel-making files in this repo.

## Constraints
- macOS, Python available (system 3.9, project `.venv` 3.14), Node 24.
- TikTok is blocked in India; it is best-effort and may need a VPN.
- Instagram official API needs a professional (creator/business) account and a one-time Meta developer app + token, done by Aditya in the browser.
- Secrets go in `radar/.env` (`.env` is already gitignored).

## Approaches
1. **Official Instagram API + keyless public readers for YouTube/TikTok — picked by Aditya.** Instagram Graph API gives full own-account insights and, through Business Discovery, other professional accounts' public posts. `yt-dlp` reads YouTube and TikTok public pages with no key. Safe for the account; one 15-minute setup.
2. **Read Instagram through his logged-in session.** No setup, but Instagram flags and locks accounts read this way, and it breaks often. Rejected: account risk.
3. **Official APIs everywhere (YouTube Data API key as well).** More setup for no gain at this scale; can be added later if yt-dlp gets rate-limited.

## How (Claude's calls, not Aditya's)
- Lives in `radar/` at the repo root, with its own virtualenv; one dependency (`yt-dlp`), the rest is Python standard library.
- SQLite file `radar/data/radar.db`: `creators` (platform, handle, is_me, niche tags), `videos` (id, creator, url, title/caption, published, duration), `snapshots` (video, fetched_at, views, likes, comments, extra insights). Snapshots let growth over time be shown later.
- Collectors, one per platform, each returning the same record shape; a failure in one platform never stops the others, and the dashboard shows the last successful fetch per creator.
- Outlier score = views ÷ median views of that creator's last 30 videos (at least 5 videos needed, else no score).
- Topic ideas = outlier titles/captions grouped by shared key terms, scored by summed outlier score and recency, minus topics already made.
- Local web server (standard library) on `localhost`, a single-page dashboard with four tabs: My account, Creators, Trending, Topic ideas. A "Refresh" button runs the collectors.
- `radar/run.sh` starts everything. `radar/README.md` covers the Meta setup step by step.

## Left to the builder
Exact table columns, dashboard styling, key-term grouping details, refresh pacing to stay polite to the sites.
