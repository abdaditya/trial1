# Creator Radar

A free, local replacement for the parts of vidIQ used for @zbacktrack: your own numbers, other creators' numbers, what is beating normal in your niche, topic ideas, and reply drafts for new comments. Everything is stored on this Mac in `radar/data/radar.db`.

## Start it

```bash
bash radar/run.sh
```

It opens http://127.0.0.1:8765. Press **Refresh numbers** to pull fresh data. Stop it with Ctrl+C.

## The tabs

- **My account** — totals (views, likes, comments, videos) for YouTube, Instagram or both, for the last 30 days or lifetime, then every video. Sort by newest, most views, most likes, most comments or best vs normal. "vs normal" is views divided by your own median; 3x or more is highlighted.
- **Creators** — 130+ YouTube channels in the niche are tracked (found by `python -m app.discover`). Add any YouTube or Instagram handle or profile link, filter by name, remove what you do not want. Click a creator to see their videos sorted by how far each beat their normal.
- **Trending** — videos from tracked creators that did 3x or more of that creator's normal in the last 7 or 30 days, plus a YouTube search box.
- **Topic ideas** — words and phrases shared by those outliers in the last 60 days. A tag shows when it overlaps a reel you already made (read from the playbook, the script files and your own titles).
- **News** — the 20 newest stories closest to the niche from BBC, TechCrunch, CNBC, The Verge, Ars Technica, Wired, Economic Times, Mint, The Register, IEEE Spectrum and Rest of World. New stories push old ones out. Claude's picks for a reel sit on top (written by the 8 AM scheduled check).
- **Comments** — only unanswered comments on your 8 newest videos per account, each with a reply draft. Copy, open the video, paste. Once you have replied, the comment leaves the list at the next check (it re-checks by itself when you come back to the tab). Nothing is ever posted for you.

All links open in a new tab.

## Using it from reel-making chats

Any Claude chat in this project can read the radar: `cd radar && .venv/bin/python -m app.report` prints a text digest (your numbers, outliers, topic terms, topics already made, news and picks). `START_HERE.md` tells new chats about it. Say "pitch topics from the radar" or "make a reel from news".

## What works without any setup

YouTube (your channel, any other channel, search, comments). No key and no login.

## Instagram: one-time setup (about 15 minutes)

Needed for your reel insights (reach, saves, shares), other creators' reels, and Instagram comments. It uses Meta's official API, so your account is not at risk. Menu names on Meta's site change now and then; the steps are the same.

1. Instagram app → Settings → Account type: make sure @zbacktrack is a **Professional** account (Creator or Business) and is **linked to a Facebook Page** (create an empty Page if you have none).
2. Go to https://developers.facebook.com → **My Apps** → **Create App**. Pick "Other" → "Business". Any name works. The app can stay in Development mode forever.
3. In the app: **App settings → Basic**. Create the file `radar/.env` with these two lines:
   ```
   FB_APP_ID=your app id
   FB_APP_SECRET=your app secret
   ```
4. Open **Tools → Graph API Explorer**. Choose your app, then "Get User Access Token" and tick:
   `instagram_basic`, `instagram_manage_insights`, `instagram_manage_comments`, `pages_show_list`, `pages_read_engagement`, `business_management`.
   Press Generate, and in the popup allow your Page and your Instagram account. Copy the token.
5. Run this with the token pasted at the end:
   ```bash
   cd radar && .venv/bin/python -m app.collect_instagram setup PASTE_TOKEN_HERE
   ```
   It should print "Connected Instagram @zbacktrack". Then press Refresh numbers.

Other Instagram creators only work if their account is Professional (almost every creator's is). Instagram shares their likes and comments, and view counts where it allows; when views are missing the tool compares likes instead.

## Limits

- No keyword search-volume numbers (that data is paid everywhere).
- TikTok is switched off in the dashboard for now.
- A full refresh of 130+ creators takes a few minutes; the first one is the slowest.
- YouTube dates for long videos are approximate ("3 weeks ago"); Shorts dates are exact.
- YouTube private stats (retention, impressions) are not included.

## Scheduled checks (Claude app, only while the app is open)

- **8 AM:** refresh numbers and news, and mark up to 3 stories as reel picks.
- **10 AM, 3 PM, 9 PM:** comment check, described next.

The comment task runs `python -m app.comments check`, writes a short reply draft for each new comment, and shows a Mac notification. It only runs while the Claude app is open. Commands, if you want them by hand:

```bash
cd radar
.venv/bin/python -m app.comments check      # fetch new comments
.venv/bin/python -m app.comments pending    # those without a draft
.venv/bin/python -m app.refresh             # refresh numbers without the dashboard
.venv/bin/python -m app.news fetch          # refresh the news list
.venv/bin/python -m app.report              # text digest for research
.venv/bin/python -m app.discover 50         # search for 50 more niche channels to track
bash connect_instagram.sh                   # one-time Instagram connection (copy, then press Enter)
.venv/bin/python -m unittest discover -s tests -t .
```
