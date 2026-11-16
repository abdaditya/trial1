"""Niche news from well-known sites' public feeds. At most 20 items are kept; new ones push old ones out.

  python -m app.news fetch            pull feeds, keep the best 20, print them (JSON)
  python -m app.news list             print the stored 20 (JSON)
  python -m app.news pick <id> <text> mark an item as a recommended reel topic, with the reason / hook
  python -m app.news clear-picks
"""
import html
import json
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime

from . import analyze

CAP = 20
PER_SOURCE = 4
MAX_AGE_DAYS = 5

FEEDS = [
    ("BBC", "https://feeds.bbci.co.uk/news/technology/rss.xml"),
    ("TechCrunch", "https://techcrunch.com/feed/"),
    ("The Verge", "https://www.theverge.com/rss/index.xml"),
    ("Ars Technica", "https://feeds.arstechnica.com/arstechnica/index"),
    ("CNBC", "https://www.cnbc.com/id/19854910/device/rss/rss.html"),
    ("Economic Times", "https://economictimes.indiatimes.com/tech/rssfeeds/13357270.cms"),
    ("Mint", "https://www.livemint.com/rss/technology"),
    ("Wired", "https://www.wired.com/feed/category/business/latest/rss"),
    ("The Register", "https://www.theregister.com/headlines.atom"),
    ("IEEE Spectrum", "https://spectrum.ieee.org/feeds/feed.rss"),
    ("Rest of World", "https://restofworld.org/feed/latest/"),
]

# What zbacktrack covers: AI, chips, data centres, big-tech money, India tech, space, deep engineering.
NICHE = {
    3: """nvidia tsmc asml openai anthropic semiconductor semiconductors chip chips chipmaker gpu gpus
          datacenter isro spacex acquisition acquires acquire""".split(),
    2: """ai amd intel qualcomm arm samsung foxconn micron broadcom huawei deepseek xai google alphabet microsoft
          amazon aws meta apple tesla starlink satellite satellites rocket jio reliance tata adani india indian
          billion trillion merger buyout stake antitrust export fab foundry lithography quantum fusion nuclear
          robot robots robotics humanoid gigawatt power grid cooling supercomputer cloud nokia sony zeiss
          softbank oracle stargate ipo valuation funding""".split(),
    1: """startup startups model models compute energy battery batteries ev launch shortage supply tariff
          tariffs ban china chinese taiwan japan korea deal invest investment revenue profit layoffs
          engineer engineering factory 5g 6g network spectrum telecom""".split(),
}
PHRASES = {"data center": 3, "data centre": 3, "data centers": 3, "data centres": 3, "artificial intelligence": 2}
WEIGHT = {w: k for k, ws in NICHE.items() for w in ws}


def _text(s, limit=None):
    s = html.unescape(re.sub(r"<[^>]+>", " ", s or ""))
    s = " ".join(s.split())
    if limit and len(s) > limit:
        s = s[:limit].rsplit(" ", 1)[0] + "…"
    return s


def _when(s):
    if not s:
        return None
    s = s.strip()
    try:
        d = parsedate_to_datetime(s)
    except (TypeError, ValueError):
        try:
            d = datetime.fromisoformat(s.replace("Z", "+00:00"))
        except ValueError:
            return None
    if d.tzinfo is None:
        d = d.replace(tzinfo=timezone.utc)
    return d.astimezone(timezone.utc).isoformat(timespec="seconds")


def parse_feed(xml_text, source):
    """RSS or Atom -> [{source, title, url, summary, published}]"""
    try:
        root = ET.fromstring(xml_text)
    except ET.ParseError:
        return []
    out = []
    for el in root.iter():
        tag = el.tag.split("}")[-1]
        if tag not in ("item", "entry"):
            continue
        f = {}
        for ch in el:
            k = ch.tag.split("}")[-1]
            if k == "link":
                href = ch.attrib.get("href")
                if href and ch.attrib.get("rel", "alternate") == "alternate":
                    f.setdefault("link", href)
                elif (ch.text or "").strip():
                    f.setdefault("link", ch.text.strip())
            elif k in ("title", "description", "summary", "content", "pubDate", "published", "updated", "date"):
                f.setdefault(k, ch.text or "")
        url = f.get("link", "")
        title = _text(f.get("title"))
        if not title or not url.startswith("http"):
            continue
        out.append({"source": source, "title": title, "url": url,
                    "summary": _text(f.get("description") or f.get("summary") or f.get("content"), 260),
                    "published": _when(f.get("pubDate") or f.get("published") or f.get("date") or f.get("updated"))})
    return out


def score(item, extra_terms=frozenset()):
    """How close an article is to the niche. Headline words count double."""
    def pts(text, mult):
        low = text.lower()
        words = set(re.findall(r"[a-z0-9]+", low))
        p = sum(w for t, w in WEIGHT.items() if t in words)
        p += sum(w for ph, w in PHRASES.items() if ph in low)
        p += sum(1 for t in extra_terms if t in words and t not in WEIGHT)
        return p * mult
    return pts(item["title"], 2) + pts(item.get("summary") or "", 1)


def _age_days(published, now):
    if not published:
        return 2.0
    try:
        return max(0.0, (now - datetime.fromisoformat(published)).total_seconds() / 86400)
    except ValueError:
        return 2.0


def rank(items, now, extra_terms=frozenset(), cap=CAP, per_source=PER_SOURCE):
    """Best `cap` items: niche score minus age, a few per source at most, no near-duplicate headlines."""
    scored = []
    for it in items:
        age = _age_days(it.get("published"), now)
        s = it.get("score") if it.get("score") is not None else score(it, extra_terms)
        if s < 4 or age > MAX_AGE_DAYS:
            continue
        scored.append((s - 2.0 * age, dict(it, score=s)))
    scored.sort(key=lambda x: x[0], reverse=True)
    out, per, seen = [], {}, []
    for _, it in scored:
        words = {w for w in re.findall(r"[a-z0-9]+", it["title"].lower()) if len(w) > 3}
        if any(len(words & s) >= max(4, 0.6 * min(len(words), len(s))) for s in seen):
            continue
        if per.get(it["source"], 0) >= per_source:
            continue
        per[it["source"]] = per.get(it["source"], 0) + 1
        seen.append(words)
        out.append(it)
        if len(out) >= cap:
            break
    return out


def download(feeds=FEEDS):
    def one(feed):
        name, url = feed
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (feed reader)"})
            with urllib.request.urlopen(req, timeout=20) as r:
                return parse_feed(r.read().decode("utf-8", "replace"), name), None
        except Exception as e:  # noqa: BLE001
            return [], "%s: %s" % (name, str(e)[:80])
    items, errors = [], []
    with ThreadPoolExecutor(max_workers=6) as pool:
        for got, err in pool.map(one, feeds):
            items += got
            if err:
                errors.append(err)
    return items, errors


def update(con, fresh, now=None, done=(), extra_terms=frozenset(), cap=CAP):
    """Merge fresh items with the stored ones and keep the best `cap`; the rest are dropped."""
    now = now or datetime.now(timezone.utc)
    stored = {r["url"]: dict(r) for r in con.execute("select * from news")}
    pool = dict(stored)
    for it in fresh:
        if it["url"] not in pool:
            pool[it["url"]] = dict(it, score=None, pick=None)
    keep = rank(list(pool.values()), now, extra_terms, cap)
    keep_urls = {it["url"] for it in keep}
    for url in stored:
        if url not in keep_urls:
            con.execute("delete from news where url=?", (url,))
    for it in keep:
        words = {t for t in analyze.key_terms(it["title"] + " " + (it.get("summary") or "")) if " " not in t}
        covered = ", ".join(name for name, ws in done if len(ws) >= 2 and ws <= words)[:200] or None
        if it["url"] in stored:
            con.execute("update news set score=?, covered=? where url=?", (it["score"], covered, it["url"]))
        else:
            con.execute("insert into news(url, source, title, summary, published, score, fetched_at, covered) "
                        "values (?,?,?,?,?,?,?,?)",
                        (it["url"], it["source"], it["title"], it.get("summary"), it.get("published"), it["score"],
                         now.isoformat(timespec="seconds"), covered))
    con.commit()
    return len(keep_urls - set(stored))


def listing(con):
    return [dict(r) for r in con.execute(
        "select * from news order by pick is not null desc, published desc")]


def set_pick(con, news_id, text):
    cur = con.execute("update news set pick=? where id=?", (" ".join(text.split()) or None, news_id))
    con.commit()
    if cur.rowcount == 0:
        raise ValueError("no news item %s" % news_id)


def fetch_and_store(con, repo_root):
    from . import db
    own = [r["title"] for r in db.latest_videos(con) if r["is_me"]]
    done = analyze.done_topics(repo_root, own)
    items, errors = download()
    added = update(con, items, done=done)
    return {"fetched": len(items), "added": added, "errors": errors}


def main(argv):
    from . import config, db
    con = db.connect(config.DB_PATH)
    cmd = argv[0] if argv else ""
    if cmd == "fetch":
        print(json.dumps({"report": fetch_and_store(con, config.REPO), "news": listing(con)}, ensure_ascii=False, indent=1))
    elif cmd == "list":
        print(json.dumps(listing(con), ensure_ascii=False, indent=1))
    elif cmd == "pick" and len(argv) >= 3:
        try:
            set_pick(con, int(argv[1]), " ".join(argv[2:]))
        except ValueError as e:
            sys.exit("Not saved: %s" % e)
        print("saved")
    elif cmd == "clear-picks":
        con.execute("update news set pick=null")
        con.commit()
        print("cleared")
    else:
        sys.exit(__doc__)


if __name__ == "__main__":
    main(sys.argv[1:])
