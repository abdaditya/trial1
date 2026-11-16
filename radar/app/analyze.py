"""Outlier scores, trending lists and topic ideas. Pure functions over video dicts."""
import glob
import os
import re
from datetime import date, timedelta
from statistics import median

OUTLIER = 3.0
MIN_VIDEOS = 5
WINDOW = 30

STOP = set("""a an the and or but if so of for to in on at by with from into over under about as is are was
were be been being it its this that these those i you he she we they my your our their me us them what why how
when where who which will would can could should did do does done has have had not no yes just now new more most
than then there here out up down off all any some one two three first last ever never still even also only very
really vs via per get got make made says said say like dont don't cant can't isnt it's im i'm youre heres here's
thats that's video videos short shorts reel reels part ep episode watch full official explained explains
today day days year years week month time thing things way people guy man every much many too after before
between again back going go goes went take takes need needs want know think see look looks actually ft feat
their there's whats what's lets let's amp live best next exactly reveals says inside here goes gone left big biggest
shorts hindi english news update latest breaking truth real really vs""".split())


def metric(v):
    if v.get("views") is not None:
        return v["views"]
    return v.get("likes")


def score_videos(videos):
    """Add metric, median and score (metric / creator median over their 30 newest videos)."""
    by_creator = {}
    out = []
    for v in videos:
        v = dict(v)
        v["metric"] = metric(v)
        v["median"] = None
        v["score"] = None
        out.append(v)
        by_creator.setdefault((v.get("creator_id"), v.get("kind")), []).append(v)   # Shorts and long videos have different normals
    for vs in by_creator.values():
        have = [v for v in vs if v["metric"] is not None]
        have.sort(key=lambda v: v.get("published") or "", reverse=True)
        base = [v["metric"] for v in have[:WINDOW]]
        if len(base) < MIN_VIDEOS:
            continue
        med = median(base)
        if med <= 0:
            continue
        for v in have:
            v["median"] = med
            v["score"] = round(v["metric"] / med, 2)
    return out


def trending(scored, days, today, min_score=OUTLIER, min_metric=0):
    since = (today - timedelta(days=days)).isoformat()
    hits = [v for v in scored
            if not v.get("is_me") and v.get("score") is not None and v["score"] >= min_score
            and v.get("published") and v["published"] >= since and (v["metric"] or 0) >= min_metric]
    # Past 30x the exact multiple says little (tiny normals), so rank those by raw reach.
    hits.sort(key=lambda v: (min(v["score"], 30), v["metric"] or 0), reverse=True)
    seen, unique = set(), []
    for v in hits:   # the same video can reach us through two tracked handles of one channel
        key = (v.get("platform"), v.get("video_id"))
        if key not in seen:
            seen.add(key)
            unique.append(v)
    hits = unique
    return hits


def busy_creators(videos, days=10, sample=25):
    """Creators who post so much (news desks) that their newest `sample` videos fit inside `days` days."""
    by = {}
    for v in videos:
        if v.get("published"):
            by.setdefault(v.get("creator_id"), []).append(v["published"])
    busy = set()
    for cid, dates in by.items():
        dates.sort(reverse=True)
        if len(dates) >= sample and (date.fromisoformat(dates[0]) - date.fromisoformat(dates[sample - 1])).days <= days:
            busy.add(cid)
    return busy


def key_terms(text):
    words = re.findall(r"[A-Za-z][A-Za-z0-9'’+-]*", (text or "").replace("#", " "))
    terms, prev = [], None
    for w in words:
        t = re.sub(r"['’]s$", "", w.lower()).strip("'’-")
        if t in STOP or (len(t) < 2):
            prev = None
            continue
        if t not in terms:
            terms.append(t)
        if prev:
            bi = prev + " " + t
            if bi not in terms:
                terms.append(bi)
        prev = t
    return terms


def done_topics(repo_root, own_titles=()):
    """Topics zbacktrack has already made: [(name, frozenset of single words)]."""
    names = []
    for p in sorted(glob.glob(os.path.join(repo_root, "ZBACKTRACK_*_SCRIPT.md"))):
        names.append(os.path.basename(p)[len("ZBACKTRACK_"):-len("_SCRIPT.md")].replace("_", " ").title())
    pb = os.path.join(repo_root, "ZBACKTRACK_REEL_PLAYBOOK.md")
    if os.path.exists(pb):
        on = False
        for line in open(pb, encoding="utf-8", errors="ignore"):
            if line.startswith("### Reels made so far"):
                on = True
                continue
            if on and line.startswith("#"):
                break
            if on:
                for part in re.split(r"[·•|]", line):
                    part = re.sub(r"\([^)]*\)", "", part).strip(" -*\n")
                    if part:
                        names.append(part)
    names += [t for t in own_titles if t]
    out, seen = [], set()
    for n in names:
        words = frozenset(t for t in key_terms(n) if " " not in t)
        if words and words not in seen:
            seen.add(words)
            out.append((n[:80], words))
    return out


def topic_ideas(scored, done, today, days=60, min_metric=0):
    hits = trending(scored, days, today, min_metric=min_metric)
    groups = {}
    for v in hits:
        v = dict(v)
        v["_terms"] = key_terms(v.get("title"))
        for t in v["_terms"]:
            groups.setdefault(t, []).append(v)
    ideas = []
    for term, vs in groups.items():
        top = max(v["score"] for v in vs)
        if len(vs) < 2 and top < 5:
            continue
        words = set()
        for v in vs:
            words.update(t for t in v["_terms"] if " " not in t)
        covered = [name for name, ws in done if ws <= words and set(term.split()) & ws]
        recency = sum(1 for v in vs if v["published"] >= (today - timedelta(days=14)).isoformat())
        ideas.append({
            "term": term, "count": len(vs),
            "score_sum": round(sum(v["score"] for v in vs), 1),
            "recent": recency,
            "creators": sorted({v["handle"] for v in vs}),
            "examples": [{k: v.get(k) for k in ("title", "url", "handle", "platform", "score", "metric", "published")}
                         for v in sorted(vs, key=lambda v: v["score"], reverse=True)[:3]],
            "done": bool(covered), "covered_by": covered[:3]})
    # A two-word phrase beats its own single words when it groups the same videos.
    ideas = [i for i in ideas if " " not in i["term"] or i["count"] >= 2]
    keyed = {i["term"]: i for i in ideas}
    drop = set()
    for i in ideas:
        if " " in i["term"]:
            for w in i["term"].split():
                if w in keyed and keyed[w]["count"] == i["count"]:
                    drop.add(w)
    ideas = [i for i in ideas if i["term"] not in drop]
    ideas.sort(key=lambda i: (len(i["creators"]) > 1, i["score_sum"]), reverse=True)
    return ideas
