import os
import tempfile
import unittest
from datetime import date
from app import db
from app.server import build_state


class TestState(unittest.TestCase):
    def test_build_state(self):
        con = db.connect(":memory:")
        c = db.add_creator(con, "youtube", "x")
        recs = [{"video_id": "v%d" % i, "url": "u", "title": "Nvidia chips", "published": "2026-11-14",
                 "duration": 30, "kind": "short", "views": 100000 if i == 5 else 10000, "likes": None,
                 "comments": None, "extra": {"channel_follower_count": 5000}} for i in range(6)]
        db.save_videos(con, c, recs, "t")
        with tempfile.TemporaryDirectory() as repo:
            s = build_state(con, repo, date(2026, 11, 16))
        for k in ("creators", "videos", "trending7", "trending30", "ideas", "comments", "news", "ig_ready"):
            self.assertIn(k, s)
        self.assertEqual(s["videos"], [])   # other creators load on click
        from app.server import scored_videos
        self.assertEqual(sorted(v["score"] for v in scored_videos(con))[-1], 10.0)
        self.assertEqual(len(s["trending7"]), 1)
        self.assertEqual((s["creators"][0]["median"], s["creators"][0]["followers"], s["creators"][0]["outliers"]),
                         (10000, 5000, 1))
        self.assertFalse(s["ig_ready"])
        self.assertEqual(s["ideas"][0]["examples"][0]["score"], 10.0)


if __name__ == "__main__":
    unittest.main()
