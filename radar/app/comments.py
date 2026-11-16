"""New comments on my own Shorts / videos / reels, and reply drafts for them.

Drafts are written by Claude (a scheduled check in the Claude app) and stored
here; nothing is ever posted by this tool.

  python -m app.comments check                      fetch, then print comments waiting for a draft (JSON)
  python -m app.comments pending                    print comments waiting for a draft (JSON)
  python -m app.comments draft <platform> <id> <text>
  python -m app.comments notify                     macOS notification about drafts ready to post
"""
import json
import subprocess
import sys
from datetime import datetime

from . import collect_instagram, db

MAX_WORDS = 99
VIDEOS_PER_ACCOUNT = 8


def rows_from_ytdlp(comments):
    """yt-dlp comment list -> top-level comments with 'answered' (the channel replied) and 'mine'."""
    comments = comments or []
    answered = {c.get("parent") for c in comments
                if c.get("parent") not in (None, "root") and c.get("author_is_uploader")}
    out = []
    for c in comments:
        if c.get("parent") not in (None, "root"):
            continue
        ts = c.get("timestamp")
        out.append({"comment_id": str(c.get("id")), "author": c.get("author") or "", "text": c.get("text") or "",
                    "published": datetime.fromtimestamp(ts).isoformat(timespec="seconds") if ts else None,
                    "likes": c.get("like_count"), "answered": c.get("id") in answered,
                    "mine": bool(c.get("author_is_uploader"))})
    return out


def fetch_youtube_comments(url):
    import yt_dlp
    opts = {"quiet": True, "no_warnings": True, "skip_download": True, "getcomments": True,
            "extractor_args": {"youtube": {"comment_sort": ["new"], "max_comments": ["80", "50", "all", "5"]}}}
    with yt_dlp.YoutubeDL(opts) as y:
        info = y.extract_info(url, download=False) or {}
    return rows_from_ytdlp(info.get("comments"))


def _fetch(video, env):
    if video["platform"] == "youtube":
        return fetch_youtube_comments(video["url"])
    if video["platform"] == "instagram":
        return collect_instagram.fetch_comments(env, video["video_id"])
    return []


def my_recent_videos(con, per_account=VIDEOS_PER_ACCOUNT):
    seen, out = {}, []
    rows = sorted((dict(r) for r in db.latest_videos(con) if r["is_me"]),
                  key=lambda r: r["published"] or "", reverse=True)
    for r in rows:
        n = seen.get(r["creator_id"], 0)
        if n < per_account and r["comments"] != 0:
            seen[r["creator_id"]] = n + 1
            out.append(r)
    return out


def store(con, video, rows, now):
    """Insert new comments; mark ones I have since answered as done. Returns number of new ones."""
    new = 0
    for c in rows:
        if c["mine"] or not c["text"].strip():
            continue
        cur = con.execute("select status from comments where platform=? and comment_id=?",
                          (video["platform"], c["comment_id"])).fetchone()
        if cur is None:
            con.execute(
                """insert into comments(platform, comment_id, video_id, video_url, video_title, author, text,
                                         published, likes, first_seen, status) values (?,?,?,?,?,?,?,?,?,?,?)""",
                (video["platform"], c["comment_id"], video["video_id"], video["url"], video["title"],
                 c["author"], c["text"], c["published"], c["likes"], now, "done" if c["answered"] else "new"))
            new += 0 if c["answered"] else 1
        elif c["answered"] and cur["status"] != "done":
            con.execute("update comments set status='done' where platform=? and comment_id=?",
                        (video["platform"], c["comment_id"]))
    con.commit()
    return new


def check(con, env, fetch=_fetch, now=None):
    now = now or datetime.now().isoformat(timespec="seconds")
    report = {"new": 0, "errors": []}
    for v in my_recent_videos(con):
        try:
            report["new"] += store(con, v, fetch(v, env), now)
        except Exception as e:  # noqa: BLE001
            msg = "%s: %s" % (v["platform"], str(e)[:160])
            if msg not in report["errors"]:
                report["errors"].append(msg)
    return report


def pending(con):
    return [dict(r) for r in con.execute(
        "select platform, comment_id, video_title, video_url, author, text, published, likes "
        "from comments where status='new' order by published desc")]


def listing(con, limit=200):
    return [dict(r) for r in con.execute(
        "select * from comments where status in ('new','drafted') order by status='drafted' desc, published desc limit ?",
        (limit,))]


def save_draft(con, platform, comment_id, text):
    text = " ".join(text.split())
    if not text:
        raise ValueError("empty draft")
    if len(text.split()) > MAX_WORDS:
        raise ValueError("draft has %d words; replies must stay under 100" % len(text.split()))
    cur = con.execute("update comments set draft=?, status='drafted' where platform=? and comment_id=? "
                      "and status in ('new','drafted')", (text, platform, comment_id))
    con.commit()
    if cur.rowcount == 0:
        raise ValueError("no open comment %s/%s" % (platform, comment_id))


def set_status(con, platform, comment_id, status):
    if status not in ("new", "drafted", "done", "skipped"):
        raise ValueError("bad status")
    con.execute("update comments set status=? where platform=? and comment_id=?", (status, platform, comment_id))
    con.commit()


def notify(con):
    n = con.execute("select count(*) from comments where status='drafted'").fetchone()[0]
    if n:
        msg = "%d comment repl%s drafted. Open Creator Radar > Comments." % (n, "y" if n == 1 else "ies")
        subprocess.run(["osascript", "-e", 'display notification "%s" with title "zbacktrack comments" sound name "Glass"' % msg],
                       check=False)
    return n


def main(argv):
    from . import config
    con = db.connect(config.DB_PATH)
    cmd = argv[0] if argv else ""
    if cmd == "check":
        report = check(con, config.load_env())
        print(json.dumps({"report": report, "pending": pending(con)}, ensure_ascii=False, indent=1))
    elif cmd == "pending":
        print(json.dumps(pending(con), ensure_ascii=False, indent=1))
    elif cmd == "draft" and len(argv) >= 4:
        try:
            save_draft(con, argv[1], argv[2], " ".join(argv[3:]))
        except ValueError as e:
            sys.exit("Not saved: %s" % e)
        print("saved")
    elif cmd == "notify":
        print("%d drafted" % notify(con))
    else:
        sys.exit(__doc__)


if __name__ == "__main__":
    main(sys.argv[1:])
