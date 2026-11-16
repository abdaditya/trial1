"""Research digest for reel-making chats: prints what the radar knows, as plain text.

  python -m app.report            everything (my numbers, outliers, topic ideas, news)
  python -m app.report news       only the news list
  python -m app.report --fresh    refresh news first (numbers are refreshed from the dashboard)
"""
import sys
from datetime import date

from . import analyze, config, db, news
from .server import build_state


def n(x):
    return "-" if x is None else "{:,}".format(int(x))


def main(argv):
    con = db.connect(config.DB_PATH)
    if "--fresh" in argv:
        news.fetch_and_store(con, config.REPO)
    s = build_state(con, config.REPO, date.today(), config.load_env())
    only_news = "news" in argv
    out = ["# Creator Radar digest (%s)" % s["today"], ""]
    if not only_news:
        mine = sorted((v for v in s["videos"] if v["is_me"]), key=lambda v: v["published"] or "", reverse=True)
        out += ["## My last videos (views, likes, comments, vs my normal)"]
        out += ["- %s [%s] %s | %s views, %s likes, %s comments | %sx" % (
            v["published"], v["platform"], v["title"][:90], n(v["views"]), n(v["likes"]), n(v["comments"]),
            v["score"] if v["score"] is not None else "-") for v in mine[:15]]
        best = sorted((v for v in mine if v["score"]), key=lambda v: v["score"], reverse=True)[:5]
        out += ["", "## My best performers"] + ["- %sx | %s views | %s" % (v["score"], n(v["metric"]), v["title"][:90]) for v in best]
        out += ["", "## Outliers from %d tracked creators, last 30 days (3x+ their normal)" % len(s["creators"])]
        out += ["- %sx | %s views | %s | %s | %s | %s" % (v["score"], n(v["metric"]), v["published"],
                                                         v["extra"].get("channel") or v["handle"], v["title"][:100], v["url"])
                for v in s["trending30"][:40]] or ["- none yet"]
        out += ["", "## Recurring terms in those outliers (topic ideas)"]
        out += ["- %s (%d videos, %d creators)%s" % (i["term"], i["count"], len(i["creators"]),
                                                     " ALREADY COVERED: " + ", ".join(i["covered_by"]) if i["done"] else "")
                for i in s["ideas"][:25]] or ["- none yet"]
        out += ["", "## Topics already made (never repeat)", ", ".join(s["done_topics"][:80])]
    out += ["", "## News in the niche (max 20, newest pushed in each morning)"]
    for item in s["news"]:
        out += ["- [%s] %s | %s | %s%s%s" % (item["source"], (item["published"] or "")[:10], item["title"], item["url"],
                                             " | ALREADY COVERED: " + item["covered"] if item["covered"] else "",
                                             " | PICK: " + item["pick"] if item["pick"] else "")]
        if item["summary"]:
            out += ["  " + item["summary"]]
    print("\n".join(out))


if __name__ == "__main__":
    main(sys.argv[1:])
