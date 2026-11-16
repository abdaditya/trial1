# Creator Radar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A free local dashboard that shows @zbacktrack's own numbers, other creators' numbers, niche outliers and topic ideas for YouTube, Instagram and TikTok.

**Architecture:** Per-platform collectors return one common record shape and write to SQLite (videos + time-stamped snapshots). A pure-function analysis module computes outlier scores and topic ideas from the database. A standard-library HTTP server exposes JSON endpoints and one static dashboard page.

**Tech Stack:** Python 3 (own virtualenv in `radar/.venv`), `yt-dlp` (only dependency), `sqlite3`, `http.server`, `unittest`, plain HTML/JS.

**Spec:** `docs/superpowers/specs/2026-11-16-creator-radar-design.md`

## Global Constraints

- Everything lives in `radar/`; no file outside it is modified (reads of `ZBACKTRACK_REEL_PLAYBOOK.md` and `ZBACKTRACK_*_SCRIPT.md` are allowed).
- No paid API, no logged-in scraping, no passwords stored. Secrets only in `radar/.env`.
- Only dependency: `yt-dlp`. Tests use `unittest` and never touch the network.
- Outlier score = metric ÷ median metric of that creator's last 30 videos; needs at least 5 videos, else `None`. Outlier threshold: 3.0.
- Metric = views when known, else likes.
- One platform or creator failing never stops the others; the error text is stored and shown.
- No git commits (the owner has not asked for any; the working tree has unrelated changes).

## Review Focus

1. Creator with fewer than 5 videos, or videos with unknown views → score `None`, no crash. (Task 3)
2. Handle typed as `@name`, `name`, or a full profile URL → all resolve to the same creator. (Task 1)
3. Refreshing twice → no duplicate videos; a second snapshot row is added. (Task 1)
4. No Instagram token configured → Instagram creators report "not set up" and YouTube still refreshes. (Task 4)
5. One creator's fetch raising → remaining creators still refresh, error saved on that creator. (Task 4)

---

### Task 1: Database

**Files:** Create `radar/app/__init__.py`, `radar/app/db.py`, `radar/tests/test_db.py`

**Interfaces — Produces:**
- `connect(path: str) -> sqlite3.Connection` (creates tables; `row_factory = sqlite3.Row`)
- `normalize_handle(platform: str, text: str) -> str` (strips `@`, URL parts, trailing slash, query; lower-cases)
- `add_creator(con, platform: str, handle: str, is_me: bool = False) -> int` (idempotent)
- `remove_creator(con, creator_id: int) -> None`
- `list_creators(con) -> list[Row]` (id, platform, handle, is_me, last_ok, last_error)
- `save_videos(con, creator_id: int, records: list[dict], fetched_at: str) -> int` (upsert video, always insert snapshot; returns count)
- `set_fetch_status(con, creator_id: int, ok: bool, error: str | None, at: str) -> None`
- `latest_videos(con) -> list[Row]` (one row per video joined with its newest snapshot and creator: `creator_id, platform, handle, is_me, video_id, url, title, published, duration, kind, views, likes, comments, extra`)
- Record dict shape used by every collector: `{"video_id", "url", "title", "published" (YYYY-MM-DD or None), "duration" (sec or None), "kind" ("short"|"video"|"reel"|"post"), "views", "likes", "comments" (int or None), "extra" (dict)}`
- `known_video_ids(con, creator_id: int) -> set[str]`; `published` is never overwritten with `None`.

- [ ] Test: `normalize_handle("youtube", "https://www.youtube.com/@Fireship/shorts") == "fireship"`, `("instagram", "@ZBackTrack") == "zbacktrack"`, `("tiktok", "https://www.tiktok.com/@a.b?lang=en") == "a.b"`.
- [ ] Test: `add_creator` twice returns the same id.
- [ ] Test: `save_videos` twice with the same record → `latest_videos` has 1 row, `snapshots` has 2 rows, row shows the second call's views.
- [ ] Test: saving a record with `published=None` after one with a date keeps the date.
- [ ] Implement, run `python -m unittest discover -s radar/tests -t radar` → all pass.

### Task 2: YouTube and TikTok collectors

**Files:** Create `radar/app/collect_ytdlp.py`, `radar/tests/test_collect_ytdlp.py`

**Interfaces — Produces:**
- `entry_to_record(platform: str, entry: dict, kind: str) -> dict` (pure; maps a yt-dlp info dict; `upload_date` `YYYYMMDD` or `timestamp` → `published`)
- `fetch_youtube(handle: str, known_ids: set[str], limit: int = 30, new_detail_cap: int = 15) -> list[dict]` (flat-lists `/shorts` and `/videos`; full extraction only for ids not in `known_ids`, capped, to get date and likes)
- `fetch_tiktok(handle: str, limit: int = 30) -> list[dict]`
- `search_youtube(query: str, limit: int = 20) -> list[dict]` (records plus `extra["channel"]`)

- [ ] Test: `entry_to_record` with `{"id":"abc","title":"T","view_count":1200,"upload_date":"20261101","duration":45}` and kind `short` → `published == "2026-11-01"`, `views == 1200`, `url` contains `abc`, `likes is None`.
- [ ] Test: entry with `timestamp` only → correct UTC date; entry with neither → `published is None`.
- [ ] Implement; run unit tests.
- [ ] Live check: `python -m app.collect_ytdlp youtube <a real tech channel>` prints at least 5 records with views.

### Task 3: Analysis

**Files:** Create `radar/app/analyze.py`, `radar/tests/test_analyze.py`

**Interfaces — Consumes** `latest_videos` rows as dicts. **Produces:**
- `metric(v: dict) -> int | None` (views, else likes)
- `score_videos(videos: list[dict]) -> list[dict]` (adds `metric`, `median`, `score`; median over each creator's 30 newest with a metric)
- `trending(scored: list[dict], days: int, today: date, min_score: float = 3.0) -> list[dict]` (excludes `is_me`; newest window; sorted by score desc; videos with unknown date excluded)
- `key_terms(text: str) -> list[str]` (lower-case words and capitalised names, stop-words and hashtags' `#` removed)
- `done_topics(repo_root: str) -> set[str]` (terms from `ZBACKTRACK_*_SCRIPT.md` filenames and the playbook's "Reels made so far" section)
- `topic_ideas(scored: list[dict], done: set[str], today: date, days: int = 60) -> list[dict]` (`{"term", "score_sum", "count", "creators", "examples" (top 3 videos), "done" (bool)}`; a term needs 2+ outlier videos or one with score ≥ 5; sorted by `score_sum`)

- [ ] Test: creator with views `[100,100,100,100,100,1000]` → the 1000 video scores `10.0`; others `1.0`.
- [ ] Test: creator with 4 videos → every score `None`. Video with `views=None, likes=None` → `metric None`, `score None`, not counted in median.
- [ ] Test: views `None` but likes present → metric is likes.
- [ ] Test: `trending(days=7)` drops an 8-day-old outlier, an undated outlier and an `is_me` outlier.
- [ ] Test: `key_terms("Why Nvidia paid $1 billion for Nokia #ai")` contains `nvidia`, `nokia`, `ai`; not `why`, `for`.
- [ ] Test: `topic_ideas` marks a term in `done` as `done=True`.
- [ ] Implement; run unit tests.

### Task 4: Instagram collector and refresh runner

**Files:** Create `radar/app/collect_instagram.py`, `radar/app/refresh.py`, `radar/app/config.py`, `radar/tests/test_refresh.py`, `radar/tests/test_instagram.py`

**Interfaces — Produces:**
- `config.load_env(path: str) -> dict` (reads `KEY=value` lines; keys `IG_TOKEN`, `IG_USER_ID`, `FB_APP_ID`, `FB_APP_SECRET`)
- `collect_instagram.NotConfigured(Exception)`
- `collect_instagram.media_to_record(m: dict) -> dict` (pure; Graph API media object → record; reels kind `reel`)
- `collect_instagram.fetch_own(env: dict, limit: int = 50) -> list[dict]` (own media plus per-media insights in `extra`: reach, saved, shares, views; missing metrics skipped)
- `collect_instagram.fetch_other(env: dict, handle: str, limit: int = 30) -> list[dict]` (Business Discovery; retries without `view_count` if the field is rejected)
- `collect_instagram.setup(env_path: str, short_token: str) -> dict` (exchanges for a long-lived token, finds the Instagram user id, writes `.env`)
- `refresh.refresh_all(con, env: dict, fetchers: dict | None = None, now: str | None = None) -> list[dict]` (per creator `{"handle","platform","ok","count","error"}`; `fetchers` injectable for tests)

- [ ] Test: `media_to_record` with `{"id":"1","caption":"Hello\nworld","media_product_type":"REELS","permalink":"p","timestamp":"2026-11-01T10:00:00+0000","like_count":5,"comments_count":2,"view_count":900}` → kind `reel`, published `2026-11-01`, views 900, title `Hello`.
- [ ] Test: `fetch_own({})` raises `NotConfigured`.
- [ ] Test: `refresh_all` with fake fetchers where Instagram raises `NotConfigured` and YouTube returns 2 records → YouTube result `ok`, count 2; Instagram result `ok False`, error mentions "not set up"; `list_creators` shows the error.
- [ ] Test: fake fetcher raising `RuntimeError("boom")` for creator A → creator B still saved.
- [ ] Implement; run unit tests.

### Task 5: Server, dashboard, launcher, guide

**Files:** Create `radar/app/server.py`, `radar/web/index.html`, `radar/run.sh`, `radar/README.md`, `radar/tests/test_server.py`

**Interfaces — Produces** JSON endpoints on `127.0.0.1:8765`:
- `GET /api/state` → `{"creators", "videos" (scored), "trending7", "trending30", "ideas", "ig_ready"}`
- `POST /api/creators` `{platform, handle, is_me}`; `DELETE /api/creators/<id>`
- `POST /api/refresh` (starts a background refresh; `GET /api/refresh` → `{"running", "results"}`)
- `GET /api/search?q=` → YouTube search records
- `server.build_state(con, repo_root: str, today: date) -> dict` (pure enough to test)

- [ ] Test: `build_state` on a database with one creator and 6 videos returns the keys above and one video with `score == 10.0`.
- [ ] Implement server and dashboard (tabs: My account, Creators, Trending, Topic ideas; Refresh button; sortable tables; links open the video).
- [ ] `run.sh`: create `radar/.venv` if missing, install `yt-dlp`, start server, open the browser.
- [ ] `README.md`: daily use, and the Meta setup step by step.
- [ ] Live check: start it, add real creators, refresh, load every tab in the browser, confirm real numbers and no console errors.
