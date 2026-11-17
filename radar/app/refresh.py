"""Pull fresh numbers for every tracked creator. One failure never stops the rest."""
import sys
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime

from . import collect_instagram, db


def _youtube(creator, env, known):
    from . import collect_ytdlp
    if creator["is_me"]:   # my own channel: everything, with likes and comment counts on every video
        return collect_ytdlp.fetch_youtube(creator["handle"], frozenset(), limit=300, new_detail_cap=300)
    return collect_ytdlp.fetch_youtube(creator["handle"], known, limit=30, new_detail_cap=8)


def _tiktok(creator, env, known):
    from . import collect_ytdlp
    return collect_ytdlp.fetch_tiktok(creator["handle"])


def _instagram(creator, env, known):
    if creator["is_me"]:
        return collect_instagram.fetch_own(env)
    return collect_instagram.fetch_other(env, creator["handle"])


FETCHERS = {"youtube": _youtube, "tiktok": _tiktok, "instagram": _instagram}


def friendly(platform, e):
    msg = str(e).replace("ERROR: ", "").strip()
    if isinstance(e, collect_instagram.NotConfigured):
        return "Instagram is not set up yet (see radar/README.md)"
    if platform == "tiktok":
        return "TikTok did not answer (it is blocked in India and often blocks readers): " + msg[:160]
    return msg[:240] or e.__class__.__name__


def refresh_all(con, env, fetchers=None, now=None, on_progress=None, workers=6, only_me=False, only_others=False):
    """Fetch creators a few at a time (network), save one at a time (database)."""
    fetchers = fetchers or FETCHERS
    now = now or datetime.now().isoformat(timespec="seconds")
    jobs = [(dict(c), db.known_video_ids(con, c["id"], dated_only=True)) for c in db.list_creators(con)
            if (c["is_me"] or not only_me) and (not c["is_me"] or not only_others)]
    total, done = len(jobs), [0]

    def work(job):
        c, known = job
        try:
            return c, fetchers[c["platform"]](c, env, known), None
        except Exception as e:  # noqa: BLE001 - every failure is reported, none is fatal
            return c, None, friendly(c["platform"], e)

    results = []
    with ThreadPoolExecutor(max_workers=workers) as pool:
        for c, records, error in pool.map(work, jobs):
            res = {"handle": c["handle"], "platform": c["platform"], "ok": error is None, "count": 0, "error": error}
            if error is None:
                res["count"] = db.save_videos(con, c["id"], records, now)
                db.set_fetch_status(con, c["id"], True, None, now)
            else:
                db.set_fetch_status(con, c["id"], False, error, now)
            results.append(res)
            done[0] += 1
            if on_progress:
                on_progress(dict(res, done=done[0], total=total))
    return results


if __name__ == "__main__":
    from . import config
    con = db.connect(config.DB_PATH)
    for r in refresh_all(con, config.load_env(), only_me="--mine" in sys.argv):   # --mine: only my own accounts (fast)
        print(("ok  " if r["ok"] else "FAIL"), r["platform"], r["handle"], r["count"], r["error"] or "")
    sys.exit(0)
