import unittest
from app.collect_ytdlp import entry_to_record


class TestEntry(unittest.TestCase):
    def test_upload_date(self):
        r = entry_to_record("youtube", {"id": "abc", "title": "T", "view_count": 1200,
                                        "upload_date": "20261101", "duration": 45}, "short")
        self.assertEqual(r["published"], "2026-11-01")
        self.assertEqual(r["views"], 1200)
        self.assertIn("abc", r["url"])
        self.assertIsNone(r["likes"])
        self.assertEqual(r["kind"], "short")

    def test_timestamp_only(self):
        r = entry_to_record("youtube", {"id": "a", "timestamp": 1794528000}, "video")
        self.assertEqual(r["published"], "2026-11-13")

    def test_no_date(self):
        r = entry_to_record("tiktok", {"id": "a", "url": "https://t/a"}, "short")
        self.assertIsNone(r["published"])
        self.assertEqual(r["url"], "https://t/a")


if __name__ == "__main__":
    unittest.main()
