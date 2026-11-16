import unittest
from datetime import datetime, timedelta, timezone
from app import db, news

NOW = datetime(2026, 11, 16, 8, 0, tzinfo=timezone.utc)
RSS = """<rss><channel><item><title>Nvidia buys &amp; builds</title><link>https://a.com/1</link>
<description><![CDATA[<p>A <b>chip</b> story</p>]]></description><pubDate>Mon, 16 Nov 2026 06:00:00 GMT</pubDate></item>
<item><title></title><link>https://a.com/2</link></item></channel></rss>"""
ATOM = """<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>OpenAI data center</title>
<link rel="alternate" href="https://b.com/1"/><summary>big</summary><published>2026-11-15T10:00:00Z</published></entry></feed>"""


def item(i, title="Nvidia chip deal number %d", age_h=1, source=None):
    return {"source": source or "S%d" % (i % 7), "title": title % i if "%d" in title else title,
            "url": "https://x.com/%d" % i, "summary": "", "published": (NOW - timedelta(hours=age_h)).isoformat()}


class TestNews(unittest.TestCase):
    def test_parse_rss(self):
        got = news.parse_feed(RSS, "A")
        self.assertEqual(len(got), 1)
        self.assertEqual((got[0]["title"], got[0]["url"], got[0]["summary"]), ("Nvidia buys & builds", "https://a.com/1", "A chip story"))
        self.assertEqual(got[0]["published"], "2026-11-16T06:00:00+00:00")

    def test_parse_atom_and_garbage(self):
        got = news.parse_feed(ATOM, "B")
        self.assertEqual((got[0]["url"], got[0]["published"]), ("https://b.com/1", "2026-11-15T10:00:00+00:00"))
        self.assertEqual(news.parse_feed("not xml", "C"), [])

    def test_score(self):
        self.assertGreater(news.score({"title": "Nvidia to build AI data center in India", "summary": ""}), 12)
        self.assertEqual(news.score({"title": "Ten recipes for a rainy weekend", "summary": ""}), 0)

    def test_rank_filters(self):
        distinct = ["Nvidia opens Texas plant", "TSMC raises wafer prices", "OpenAI signs Oracle contract",
                    "ASML ships new scanner", "ISRO launches navigation satellite", "SpaceX buys spectrum licence"]
        items = [dict(item(i, t), source="Same") for i, t in enumerate(distinct)]
        items += [item(50, "Cooking pasta at home"), item(51, "Nvidia earnings beat forecasts", age_h=24 * 9)]
        out = news.rank(items, NOW)
        self.assertEqual(len(out), 4)                       # per-source limit
        self.assertTrue(all(i["source"] == "Same" for i in out))
        dup = [item(1, "Nvidia buys chip startup for $2 billion"), item(2, "Nvidia buys chip startup for $2 billion in cash", source="Z")]
        self.assertEqual(len(news.rank(dup, NOW)), 1)

    def test_cap_and_eviction(self):
        con = db.connect(":memory:")
        names = ["alpha", "bravo", "charlie", "delta", "echo", "foxtrot", "golf", "hotel", "india2", "juliet", "kilo",
                 "lima", "mike", "november", "oscar", "papa", "quebec", "romeo", "sierra", "tango", "uniform", "victor",
                 "whiskey", "xray", "yankee", "zulu", "amber", "bronze", "copper", "diamond"]
        old = [item(i, "Nvidia chip %s factory" % names[i], age_h=48) for i in range(25)]
        news.update(con, old, NOW)
        self.assertEqual(len(news.listing(con)), 20)
        first = news.listing(con)[0]
        news.set_pick(con, first["id"], "Pick: why")
        fresh = [item(100 + i, "Nvidia chip %s factory" % names[i % 30] + " %d" % i, age_h=1) for i in range(30)]
        fresh = [dict(f, title="TSMC semiconductor %s plant" % names[i]) for i, f in enumerate(fresh)]
        added = news.update(con, fresh, NOW)
        rows = news.listing(con)
        self.assertEqual(len(rows), 20)
        self.assertEqual(added, 20)
        self.assertTrue(all(r["title"].startswith("TSMC") for r in rows))
        with self.assertRaises(ValueError):
            news.set_pick(con, 99999, "x")

    def test_covered(self):
        con = db.connect(":memory:")
        news.update(con, [item(1, "Google completes Wiz acquisition")], NOW, done=[("Google × Wiz", frozenset({"google", "wiz"}))])
        self.assertEqual(news.listing(con)[0]["covered"], "Google × Wiz")


if __name__ == "__main__":
    unittest.main()
