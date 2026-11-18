"""Local dashboard server. Listens on this Mac only."""
import json
import os
import re
import threading
import urllib.parse
from datetime import date
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from . import analyze, comments, config, db, news
from .refresh import refresh_all

PORT = 8765
MIN_VIEWS = 5000   # an "outlier" with fewer views than this is noise from very small or very busy channels
WEB = os.path.join(config.ROOT, "web")
JOB = {"running": False, "what": "", "current": "", "results": [], "comments": None, "done": 0, "total": 0}
JOB_LOCK = threading.Lock()


def scored_videos(con):
    videos = []
    for r in db.latest_videos(con):
        v = dict(r)
        try:
            v["extra"] = json.loads(v.get("extra") or "{}")
        except ValueError:
            v["extra"] = {}
        if not v["is_me"]:
            v["extra"] = {k: v["extra"][k] for k in ("channel", "channel_follower_count") if k in v["extra"]}
        videos.append(v)
    return analyze.score_videos(videos)


def build_state(con, repo_root, today, env=None):
    env = env or {}
    scored = scored_videos(con)
    # News desks post about everything; from them keep only videos whose title is on the niche.
    busy = analyze.busy_creators(scored)
    relevant = [v for v in scored if v["creator_id"] not in busy
                or news.score({"title": v.get("title") or "", "summary": ""}) >= 6]
    own_titles = [v["title"] for v in scored if v["is_me"]]
    done = analyze.done_topics(repo_root, own_titles)
    creators = []
    for c in db.list_creators(con):
        c = dict(c)
        mine = [v for v in scored if v["creator_id"] == c["id"]]
        c["videos"] = len(mine)
        c["median"] = next((v["median"] for v in mine if v["median"] is not None), None)
        c["name"] = next((v["extra"].get("channel") for v in mine if v["extra"].get("channel")), None)
        c["followers"] = next((v["extra"].get("channel_follower_count") for v in mine
                               if v["extra"].get("channel_follower_count")), None)
        c["outliers"] = sum(1 for v in mine if (v["score"] or 0) >= analyze.OUTLIER)
        creators.append(c)
    return {"today": today.isoformat(), "creators": creators,
            "videos": [v for v in scored if v["is_me"]],   # other creators' videos load on click
            "trending7": analyze.trending(relevant, 7, today, min_metric=MIN_VIEWS)[:150],
            "trending30": analyze.trending(relevant, 30, today, min_metric=MIN_VIEWS)[:150],
            "ideas": analyze.topic_ideas(relevant, done, today, min_metric=MIN_VIEWS)[:60],
            "comments": comments.listing(con), "news": news.listing(con),
            "ig_ready": bool(env.get("IG_TOKEN") and env.get("IG_USER_ID")),
            "done_topics": [n for n, _ in done]}


def _run_job(what):
    con = db.connect(config.DB_PATH)
    env = config.load_env()
    try:
        def progress(res):
            JOB.update(current="accounts" if what == "mine" else "creators", done=res["done"], total=res["total"])
        if what == "mine":          # my YouTube + Instagram numbers, then my comments
            JOB["results"] = refresh_all(con, env, on_progress=progress, only_me=True)
            JOB.update(current="comments", done=0, total=0)
            JOB["comments"] = comments.check(con, env)
        elif what == "creators":    # the other tracked creators (trending, topic ideas)
            JOB["results"] = refresh_all(con, env, on_progress=progress, only_others=True)
        elif what == "news":
            JOB["current"] = "news"
            news.fetch_and_store(con, config.REPO)
    finally:
        JOB["running"] = False
        JOB["current"] = ""
        con.close()


def start_job(what):
    with JOB_LOCK:
        if JOB["running"]:
            return False
        JOB.update(running=True, what=what, results=[], comments=None, done=0, total=0)
    threading.Thread(target=_run_job, args=(what,), daemon=True).start()
    return True


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def _send(self, code, body, ctype="application/json"):
        data = body if isinstance(body, bytes) else json.dumps(body, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", ctype + "; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)

    def _local(self):
        """Refuse requests that come from another website or another host name."""
        ok = ("127.0.0.1:%d" % PORT, "localhost:%d" % PORT)
        origin = self.headers.get("Origin")
        return self.headers.get("Host") in ok and (origin is None or origin.split("//")[-1] in ok)

    def _body(self):
        n = int(self.headers.get("Content-Length") or 0)
        return json.loads(self.rfile.read(n).decode("utf-8") or "{}") if n else {}

    def do_GET(self):
        if not self._local():
            return self._send(403, {"error": "local only"})
        url = urllib.parse.urlparse(self.path)
        if url.path == "/":
            return self._send(200, open(os.path.join(WEB, "index.html"), "rb").read(), "text/html")
        if url.path == "/api/state":
            con = db.connect(config.DB_PATH)
            try:
                return self._send(200, build_state(con, config.REPO, date.today(), config.load_env()))
            finally:
                con.close()
        if url.path == "/api/creator":
            cid = urllib.parse.parse_qs(url.query).get("id", [""])[0]
            con = db.connect(config.DB_PATH)
            try:
                return self._send(200, {"videos": [v for v in scored_videos(con) if str(v["creator_id"]) == cid]})
            finally:
                con.close()
        if url.path == "/api/job":
            return self._send(200, JOB)
        if url.path == "/api/search":
            q = urllib.parse.parse_qs(url.query).get("q", [""])[0].strip()
            if not q:
                return self._send(400, {"error": "empty search"})
            from . import collect_ytdlp
            try:
                return self._send(200, {"results": collect_ytdlp.search_youtube(q, 25)})
            except Exception as e:  # noqa: BLE001
                return self._send(502, {"error": str(e)[:200]})
        self._send(404, {"error": "not found"})

    def do_POST(self):
        if not self._local():
            return self._send(403, {"error": "local only"})
        try:
            body = self._body()
        except ValueError:
            return self._send(400, {"error": "bad request"})
        con = db.connect(config.DB_PATH)
        try:
            if self.path == "/api/creators":
                if body.get("platform") not in ("youtube", "instagram", "tiktok"):
                    return self._send(400, {"error": "pick a platform"})
                try:
                    cid = db.add_creator(con, body["platform"], body.get("handle") or "", bool(body.get("is_me")))
                except ValueError:
                    return self._send(400, {"error": "type a handle or profile link"})
                return self._send(200, {"id": cid})
            if self.path == "/api/refresh":
                scope = body.get("scope")
                if scope not in ("mine", "creators", "news"):
                    return self._send(400, {"error": "unknown refresh"})
                return self._send(200, {"started": start_job(scope)})
            if self.path == "/api/comments":
                try:
                    if body.get("action") == "draft":
                        comments.save_draft(con, body["platform"], body["comment_id"], body.get("text") or "")
                    else:
                        comments.set_status(con, body["platform"], body["comment_id"],
                                            {"done": "done", "skip": "skipped"}[body.get("action")])
                except (ValueError, KeyError) as e:
                    return self._send(400, {"error": str(e)})
                return self._send(200, {"ok": True})
            self._send(404, {"error": "not found"})
        finally:
            con.close()

    def do_DELETE(self):
        if not self._local():
            return self._send(403, {"error": "local only"})
        m = re.match(r"^/api/creators/(\d+)$", self.path)
        if not m:
            return self._send(404, {"error": "not found"})
        con = db.connect(config.DB_PATH)
        try:
            db.remove_creator(con, int(m.group(1)))
        finally:
            con.close()
        self._send(200, {"ok": True})


def main():
    os.makedirs(os.path.dirname(config.DB_PATH), exist_ok=True)
    db.connect(config.DB_PATH).close()
    srv = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    print("Creator Radar is running at http://127.0.0.1:%d  (Ctrl+C to stop)" % PORT)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
