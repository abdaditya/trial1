import unittest
from app import collect_instagram as IG


class TestInstagram(unittest.TestCase):
    def test_media_to_record(self):
        r = IG.media_to_record({"id": "1", "caption": "Hello\nworld", "media_product_type": "REELS",
                                "permalink": "p", "timestamp": "2026-11-01T10:00:00+0000",
                                "like_count": 5, "comments_count": 2, "view_count": 900})
        self.assertEqual((r["kind"], r["published"], r["views"], r["title"]), ("reel", "2026-11-01", 900, "Hello"))
        self.assertEqual((r["likes"], r["comments"], r["url"]), (5, 2, "p"))

    def test_no_caption_image(self):
        r = IG.media_to_record({"id": 2, "media_type": "IMAGE"})
        self.assertEqual((r["kind"], r["title"], r["views"], r["published"]), ("post", "", None, None))

    def test_not_configured(self):
        with self.assertRaises(IG.NotConfigured):
            IG.fetch_own({})
        with self.assertRaises(IG.NotConfigured):
            IG.fetch_other({"IG_TOKEN": "x"}, "someone")


if __name__ == "__main__":
    unittest.main()
