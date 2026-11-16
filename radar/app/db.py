"""SQLite storage: creators, their videos, and a snapshot of numbers per refresh."""
import json
import re
import sqlite3

SCHEMA = """
create table if not exists creators (
  id integer primary key, platform text not null, handle text not null,
  is_me integer not null default 0, last_ok text, last_error text,
  unique(platform, handle));
create table if not exists videos (
  id integer primary key, creator_id integer not null, video_id text not null,
  url text, title text, published text, duration real, kind text,
  unique(creator_id, video_id));
create table if not exists snapshots (
  id integer primary key, video_pk integer not null, fetched_at text not null,
  views integer, likes integer, comments integer, extra text);
create index if not exists snap_video on snapshots(video_pk, id);
create table if not exists comments (
  id integer primary key, platform text not null, comment_id text not null,
  video_id text, video_url text, video_title text, author text, text text,
  published text, likes integer, first_seen text, draft text,
  status text not null default 'new',
  unique(platform, comment_id));
create table if not exists news (
  id integer primary key, url text not null unique, source text, title text, summary text,
  published text, score real, fetched_at text, pick text, covered text);
"""


def connect(path):
    con = sqlite3.connect(path, check_same_thread=False)
    con.row_factory = sqlite3.Row
    con.executescript(SCHEMA)
    return con


def normalize_handle(platform, text):
    t = text.strip()
    t = re.sub(r"^https?://", "", t, flags=re.I)
    t = t.split("?")[0].split("#")[0]
    if "/" in t and re.match(r"^(www\.|m\.)?(youtube\.com|instagram\.com|tiktok\.com|youtu\.be)", t, re.I):
        parts = [p for p in t.split("/")[1:] if p]
        t = parts[0] if parts else ""
        if t in ("channel", "c", "user") and len(parts) > 1:
            return parts[1] if t == "channel" else parts[1].lower()
    t = t.strip("/").lstrip("@")
    # YouTube channel ids (UC...) are case-sensitive; everything else is not.
    if platform == "youtube" and re.match(r"^UC[\w-]{22}$", t):
        return t
    return t.lower()


def add_creator(con, platform, handle, is_me=False):
    h = normalize_handle(platform, handle)
    if not h:
        raise ValueError("empty handle")
    con.execute("insert or ignore into creators(platform, handle, is_me) values (?,?,?)",
                (platform, h, int(bool(is_me))))
    if is_me:
        con.execute("update creators set is_me=1 where platform=? and handle=?", (platform, h))
    con.commit()
    return con.execute("select id from creators where platform=? and handle=?",
                       (platform, h)).fetchone()[0]


def remove_creator(con, creator_id):
    con.execute("delete from snapshots where video_pk in (select id from videos where creator_id=?)",
                (creator_id,))
    con.execute("delete from videos where creator_id=?", (creator_id,))
    con.execute("delete from creators where id=?", (creator_id,))
    con.commit()


def list_creators(con):
    return con.execute("select * from creators order by is_me desc, platform, handle").fetchall()


def known_video_ids(con, creator_id, dated_only=False):
    q = "select video_id from videos where creator_id=?"
    if dated_only:
        q += " and published is not null"
    return {r[0] for r in con.execute(q, (creator_id,))}


def save_videos(con, creator_id, records, fetched_at):
    n = 0
    for r in records:
        if not r.get("video_id"):
            continue
        con.execute(
            """insert into videos(creator_id, video_id, url, title, published, duration, kind)
               values (?,?,?,?,?,?,?)
               on conflict(creator_id, video_id) do update set
                 url=coalesce(excluded.url, url), title=coalesce(excluded.title, title),
                 published=coalesce(excluded.published, published),
                 duration=coalesce(excluded.duration, duration), kind=coalesce(excluded.kind, kind)""",
            (creator_id, str(r["video_id"]), r.get("url"), r.get("title"), r.get("published"),
             r.get("duration"), r.get("kind")))
        pk = con.execute("select id from videos where creator_id=? and video_id=?",
                         (creator_id, str(r["video_id"]))).fetchone()[0]
        # A quick listing may not carry likes/comments; keep the last known number instead of losing it.
        prev = con.execute("select views, likes, comments, extra from snapshots where video_pk=? order by id desc limit 1",
                           (pk,)).fetchone()
        vals = [r.get("views"), r.get("likes"), r.get("comments")]
        extra = dict(r.get("extra") or {})
        if prev:
            vals = [v if v is not None else prev[i] for i, v in enumerate(vals)]
            try:
                extra = dict(json.loads(prev["extra"] or "{}"), **extra)
            except ValueError:
                pass
        con.execute("insert into snapshots(video_pk, fetched_at, views, likes, comments, extra) values (?,?,?,?,?,?)",
                    (pk, fetched_at, vals[0], vals[1], vals[2], json.dumps(extra)))
        n += 1
    con.commit()
    return n


def set_fetch_status(con, creator_id, ok, error, at):
    if ok:
        con.execute("update creators set last_ok=?, last_error=null where id=?", (at, creator_id))
    else:
        con.execute("update creators set last_error=? where id=?", (error, creator_id))
    con.commit()


def latest_videos(con):
    return con.execute(
        """select c.id as creator_id, c.platform, c.handle, c.is_me,
                  v.video_id, v.url, v.title, v.published, v.duration, v.kind,
                  s.views, s.likes, s.comments, s.extra, s.fetched_at
           from videos v
           join creators c on c.id = v.creator_id
           join snapshots s on s.id = (select max(id) from snapshots where video_pk = v.id)
           order by v.published desc""").fetchall()
