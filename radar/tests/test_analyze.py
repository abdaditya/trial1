import unittest
from datetime import date
from app import analyze as A

TODAY = date(2026, 11, 16)


def vid(i, views, creator=1, published="2026-11-14", title="t", is_me=0, likes=None):
    return {"creator_id": creator, "handle": "c%d" % creator, "platform": "youtube", "is_me": is_me,
            "video_id": "v%d" % i, "url": "u", "title": title, "published": published,
            "views": views, "likes": likes}


class TestAnalyze(unittest.TestCase):
    def test_outlier_score(self):
        s = A.score_videos([vid(i, 100) for i in range(5)] + [vid(9, 1000)])
        self.assertEqual([v["score"] for v in s], [1.0] * 5 + [10.0])

    def test_too_few(self):
        s = A.score_videos([vid(i, 100) for i in range(4)])
        self.assertTrue(all(v["score"] is None for v in s))

    def test_unknown_metric(self):
        s = A.score_videos([vid(i, 100) for i in range(5)] + [vid(9, None)])
        self.assertIsNone(s[-1]["metric"])
        self.assertIsNone(s[-1]["score"])
        self.assertEqual(s[0]["median"], 100)

    def test_likes_fallback(self):
        self.assertEqual(A.metric(vid(1, None, likes=7)), 7)
        self.assertEqual(A.metric(vid(1, 0, likes=7)), 0)

    def test_trending_filters(self):
        base = [vid(i, 100) for i in range(5)]
        vs = base + [vid(10, 1000), vid(11, 1000, published="2026-11-08"), vid(12, 1000, published=None)]
        mine = [vid(i, 100, creator=2, is_me=1) for i in range(20, 25)] + [vid(30, 1000, creator=2, is_me=1)]
        t = A.trending(A.score_videos(vs + mine), 7, TODAY)
        self.assertEqual([v["video_id"] for v in t], ["v10"])

    def test_duplicates_and_busy(self):
        base = [vid(i, 100) for i in range(5)] + [vid(10, 1000)]
        twin = [dict(v, creator_id=2, handle="c2") for v in base]
        self.assertEqual(len(A.trending(A.score_videos(base + twin), 7, TODAY)), 1)
        desk = [vid(i, 100, creator=3, published="2026-11-%02d" % (10 + i % 5)) for i in range(30)]
        slow = [vid(i, 100, creator=4, published="2026-%02d-01" % (1 + i % 11)) for i in range(30)]
        self.assertEqual(A.busy_creators(desk + slow), {3})

    def test_key_terms(self):
        t = A.key_terms("Why Nvidia paid $1 billion for Nokia #ai")
        for w in ("nvidia", "nokia", "ai", "nvidia paid"):
            self.assertIn(w, t)
        for w in ("why", "for"):
            self.assertNotIn(w, t)

    def test_topic_done(self):
        vs = [vid(i, 100) for i in range(5)] + [vid(10, 1000, title="Google buys Wiz for $32B"),
                                                 vid(11, 900, title="Zeiss mirrors and the chip war")]
        ideas = {i["term"]: i for i in A.topic_ideas(A.score_videos(vs), [("Google × Wiz", frozenset({"google", "wiz"}))], TODAY)}
        self.assertTrue(ideas["wiz"]["done"])
        self.assertFalse(ideas["zeiss"]["done"])
        self.assertEqual(ideas["wiz"]["examples"][0]["score"], 10.0)


if __name__ == "__main__":
    unittest.main()
