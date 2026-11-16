import unittest
from app import db


def rec(vid="v1", views=100, published="2026-11-01"):
    return {"video_id": vid, "url": "u/" + vid, "title": "T", "published": published,
            "duration": 30, "kind": "short", "views": views, "likes": 1, "comments": 0, "extra": {}}


class TestDb(unittest.TestCase):
    def setUp(self):
        self.con = db.connect(":memory:")

    def test_normalize(self):
        self.assertEqual(db.normalize_handle("youtube", "https://www.youtube.com/@Fireship/shorts"), "fireship")
        self.assertEqual(db.normalize_handle("instagram", "@ZBackTrack"), "zbacktrack")
        self.assertEqual(db.normalize_handle("tiktok", "https://www.tiktok.com/@a.b?lang=en"), "a.b")
        self.assertEqual(db.normalize_handle("instagram", "https://www.instagram.com/zbacktrack/"), "zbacktrack")
        self.assertEqual(db.normalize_handle("youtube", " name "), "name")

    def test_add_creator_idempotent(self):
        a = db.add_creator(self.con, "youtube", "@X")
        b = db.add_creator(self.con, "youtube", "x")
        self.assertEqual(a, b)
        self.assertEqual(len(db.list_creators(self.con)), 1)

    def test_save_twice(self):
        c = db.add_creator(self.con, "youtube", "x")
        db.save_videos(self.con, c, [rec(views=100)], "2026-11-01T00:00:00")
        db.save_videos(self.con, c, [rec(views=250)], "2026-11-02T00:00:00")
        rows = db.latest_videos(self.con)
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["views"], 250)
        self.assertEqual(self.con.execute("select count(*) from snapshots").fetchone()[0], 2)
        self.assertEqual(db.known_video_ids(self.con, c), {"v1"})

    def test_published_not_erased(self):
        c = db.add_creator(self.con, "youtube", "x")
        db.save_videos(self.con, c, [rec()], "2026-11-01T00:00:00")
        db.save_videos(self.con, c, [rec(published=None)], "2026-11-02T00:00:00")
        self.assertEqual(db.latest_videos(self.con)[0]["published"], "2026-11-01")

    def test_remove_and_status(self):
        c = db.add_creator(self.con, "youtube", "x")
        db.save_videos(self.con, c, [rec()], "2026-11-01T00:00:00")
        db.set_fetch_status(self.con, c, False, "boom", "2026-11-01T00:00:00")
        self.assertEqual(db.list_creators(self.con)[0]["last_error"], "boom")
        db.remove_creator(self.con, c)
        self.assertEqual(db.latest_videos(self.con), [])


if __name__ == "__main__":
    unittest.main()
