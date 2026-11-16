"""Public YouTube and TikTok data through yt-dlp. No key, no login."""
import sys
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone

import yt_dlp

BASE = {"quiet": True, "no_warnings": True, "skip_download": True, "ignoreerrors": False,
        "socket_timeout": 20}


def _extract(url, **opts):
    o = dict(BASE)
    o.update(opts)
    with yt_dlp.YoutubeDL(o) as y:
        return y.extract_info(url, download=False) or {}


def _date(entry):
    d = entry.get("upload_date")
    if d and len(d) == 8:
        return "%s-%s-%s" % (d[:4], d[4:6], d[6:])
    ts = entry.get("timestamp") or entry.get("release_timestamp")
    if ts:
        return datetime.fromtimestamp(ts, tz=timezone.utc).strftime("%Y-%m-%d")
    return None


def entry_to_record(platform, entry, kind):
    vid = str(entry.get("id") or "")
    url = entry.get("webpage_url") or entry.get("url")
    if platform == "youtube" and vid:
        url = ("https://www.youtube.com/shorts/" if kind == "short" else "https://www.youtube.com/watch?v=") + vid
    extra = {}
    for k in ("channel", "channel_id", "channel_follower_count", "repost_count"):
        if entry.get(k) is not None:
            extra[k] = entry[k]
    return {"video_id": vid, "url": url, "title": entry.get("title") or entry.get("description") or "",
            "published": _date(entry), "duration": entry.get("duration"), "kind": kind,
            "views": entry.get("view_count"), "likes": entry.get("like_count"),
            "comments": entry.get("comment_count"), "extra": extra}


def _flat(url, limit):
    info = _extract(url, extract_flat="in_playlist", playlistend=limit,
                    extractor_args={"youtubetab": {"approximate_date": ["1"]}})
    return info, [e for e in (info.get("entries") or []) if e]


def _detail(rec):
    """Fill date, likes and comment count for one video (one page load)."""
    try:
        info = _extract(rec["url"])
    except Exception:
        return rec
    full = entry_to_record("youtube", info, rec["kind"])
    for k in ("published", "likes", "comments", "duration", "views"):
        if full.get(k) is not None:
            rec[k] = full[k]
    return rec


def fetch_youtube(handle, known_ids=frozenset(), limit=30, new_detail_cap=20):
    base = "https://www.youtube.com/" + ("channel/" + handle if handle.startswith("UC") and len(handle) == 24
                                         else "@" + handle)
    records, errors, followers, name = [], [], None, None
    for tab, kind in (("shorts", "short"), ("videos", "video")):
        try:
            info, entries = _flat("%s/%s" % (base, tab), limit)
        except Exception as e:  # a channel may simply have no Shorts or no long videos
            errors.append(str(e))
            continue
        followers = followers or info.get("channel_follower_count")
        name = name or info.get("channel") or info.get("uploader")
        records += [entry_to_record("youtube", e, kind) for e in entries]
    if not records and errors:
        raise RuntimeError(errors[0][:300])
    for r in records:
        if followers:
            r["extra"]["channel_follower_count"] = followers
        if name:
            r["extra"]["channel"] = name
    # Shorts lists carry no date: load the page of videos we have not dated yet, newest first.
    todo = [r for r in records if r["video_id"] not in known_ids and
            (r["published"] is None or r["kind"] == "short")][:new_detail_cap]
    if todo:
        with ThreadPoolExecutor(max_workers=4) as pool:
            list(pool.map(_detail, todo))
    return records


def fetch_tiktok(handle, limit=30):
    info, entries = _flat("https://www.tiktok.com/@" + handle, limit)
    return [entry_to_record("tiktok", e, "short") for e in entries]


def search_youtube(query, limit=20):
    info, entries = _flat("ytsearch%d:%s" % (limit, query), limit)
    out = []
    for e in entries:
        kind = "short" if "/shorts/" in (e.get("url") or "") else "video"
        out.append(entry_to_record("youtube", e, kind))
    return out


if __name__ == "__main__":
    platform, handle = sys.argv[1], sys.argv[2]
    recs = fetch_youtube(handle) if platform == "youtube" else fetch_tiktok(handle)
    for r in recs:
        print(r["published"], r["kind"], r["views"], r["likes"], r["title"][:60])
    print(len(recs), "records")
