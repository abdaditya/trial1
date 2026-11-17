import unittest
from app import collect_instagram, comments, db
from app.refresh import refresh_all


def rec(vid, comments=3):
    return {"video_id": vid, "url": "u/" + vid, "title": "T " + vid, "published": "2026-11-01", "duration": 30,
            "kind": "short", "views": 10, "likes": 1, "comments": comments, "extra": {}}


def not_set_up(c, env, known):
    raise collect_instagram.NotConfigured("x")


class TestRefresh(unittest.TestCase):
    def setUp(self):
        self.con = db.connect(":memory:")

    def test_instagram_not_configured_does_not_stop_youtube(self):
        db.add_creator(self.con, "instagram", "zbacktrack", True)
        db.add_creator(self.con, "youtube", "x")
        res = {r["platform"]: r for r in refresh_all(
            self.con, {}, {"instagram": not_set_up, "youtube": lambda c, e, k: [rec("a"), rec("b")]})}
        self.assertTrue(res["youtube"]["ok"])
        self.assertEqual(res["youtube"]["count"], 2)
        self.assertFalse(res["instagram"]["ok"])
        self.assertIn("not set up", res["instagram"]["error"])
        errs = {c["platform"]: c["last_error"] for c in db.list_creators(self.con)}
        self.assertIn("not set up", errs["instagram"])
        self.assertIsNone(errs["youtube"])

    def test_one_creator_failing(self):
        db.add_creator(self.con, "youtube", "a")
        db.add_creator(self.con, "youtube", "b")

        def f(c, env, known):
            if c["handle"] == "a":
                raise RuntimeError("boom")
            return [rec("v")]
        res = {r["handle"]: r for r in refresh_all(self.con, {}, {"youtube": f})}
        self.assertEqual(res["a"]["error"], "boom")
        self.assertTrue(res["b"]["ok"])
        self.assertEqual(len(db.latest_videos(self.con)), 1)


class TestComments(unittest.TestCase):
    def setUp(self):
        self.con = db.connect(":memory:")
        me = db.add_creator(self.con, "youtube", "me", True)
        other = db.add_creator(self.con, "youtube", "other")
        db.save_videos(self.con, me, [rec("mine"), rec("quiet", comments=0)], "t")
        db.save_videos(self.con, other, [rec("theirs")], "t")

    def test_rows_from_ytdlp(self):
        rows = comments.rows_from_ytdlp([
            {"id": "c1", "text": "nice", "author": "@a", "parent": "root", "timestamp": 1794528000},
            {"id": "c2", "text": "how?", "author": "@b", "parent": "root"},
            {"id": "c2.r1", "text": "like this", "author": "@me", "parent": "c2", "author_is_uploader": True},
            {"id": "c3", "text": "pinned", "author": "@me", "parent": "root", "author_is_uploader": True}])
        self.assertEqual([(r["comment_id"], r["answered"], r["mine"]) for r in rows],
                         [("c1", False, False), ("c2", True, False), ("c3", False, True)])
        self.assertEqual(comments.rows_from_ytdlp(None), [])

    def test_check_only_my_videos_and_no_duplicates(self):
        seen = []

        def fetch(v, env):
            seen.append(v["video_id"])
            return [{"comment_id": "c1", "author": "a", "text": "nice", "published": None, "likes": 0,
                     "answered": False, "mine": False},
                    {"comment_id": "c2", "author": "b", "text": "old", "published": None, "likes": 0,
                     "answered": True, "mine": False},
                    {"comment_id": "c3", "author": "me", "text": "hi", "published": None, "likes": 0,
                     "answered": False, "mine": True}]
        self.assertEqual(comments.check(self.con, {}, fetch)["new"], 1)
        self.assertEqual(comments.check(self.con, {}, fetch)["new"], 0)
        self.assertEqual(seen, ["mine", "mine"])
        self.assertEqual([p["comment_id"] for p in comments.pending(self.con)], ["c1"])

    def test_draft_rules(self):
        comments.check(self.con, {}, lambda v, e: [{"comment_id": "c1", "author": "a", "text": "nice",
                                                    "published": None, "likes": 0, "answered": False, "mine": False}])
        with self.assertRaises(ValueError):
            comments.save_draft(self.con, "youtube", "c1", "word " * 100)
        with self.assertRaises(ValueError):
            comments.save_draft(self.con, "youtube", "nope", "thanks")
        comments.save_draft(self.con, "youtube", "c1", "Thanks,  glad it helped.")
        self.assertEqual(comments.pending(self.con), [])
        row = comments.listing(self.con)[0]
        self.assertEqual((row["draft"], row["status"]), ("Thanks, glad it helped.", "drafted"))

    def test_answered_later_closes(self):
        c = {"comment_id": "c1", "author": "a", "text": "nice", "published": None, "likes": 0,
             "answered": False, "mine": False}
        comments.check(self.con, {}, lambda v, e: [c])
        comments.check(self.con, {}, lambda v, e: [dict(c, answered=True)])
        self.assertEqual(comments.listing(self.con), [])

    def test_fetch_error_reported(self):
        def boom(v, e):
            raise RuntimeError("nope")
        self.assertEqual(comments.check(self.con, {}, boom)["errors"], ["youtube: nope"])


if __name__ == "__main__":
    unittest.main()


class TestScopes(unittest.TestCase):
    def test_only_others_and_only_me(self):
        con = db.connect(":memory:")
        db.add_creator(con, "youtube", "me", True)
        db.add_creator(con, "youtube", "other")
        seen = []

        def f(c, env, known):
            seen.append(c["handle"])
            return []
        refresh_all(con, {}, {"youtube": f}, only_others=True)
        self.assertEqual(seen, ["other"])
        seen.clear()
        refresh_all(con, {}, {"youtube": f}, only_me=True)
        self.assertEqual(seen, ["me"])
