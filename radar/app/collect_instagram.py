"""Instagram through Meta's official Graph API (Facebook Login flavour).

Own account: media + insights + comments. Other creators: Business Discovery
(works for any professional account, public numbers only).
"""
import json
import sys
import urllib.error
import urllib.parse
import urllib.request

GRAPH = "https://graph.facebook.com"
MEDIA_FIELDS = "id,caption,media_type,media_product_type,permalink,timestamp,like_count,comments_count"
INSIGHT_SETS = ["views,reach,saved,shares,total_interactions", "reach,saved,shares", "reach"]


class NotConfigured(Exception):
    pass


class GraphError(Exception):
    pass


def _get(path, params=None, token=None):
    url = "%s/%s" % (GRAPH, path.lstrip("/"))
    if params:
        url += "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url)
    if token:
        req.add_header("Authorization", "Bearer " + token)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        try:
            msg = json.loads(e.read().decode("utf-8"))["error"]["message"]
        except Exception:
            msg = "HTTP %s" % e.code
        raise GraphError(msg)


def _need(env):
    if not env.get("IG_TOKEN") or not env.get("IG_USER_ID"):
        raise NotConfigured("Instagram is not set up yet (see radar/README.md)")
    return env["IG_TOKEN"], env["IG_USER_ID"]


def media_to_record(m):
    caption = (m.get("caption") or "").strip()
    product = (m.get("media_product_type") or "").upper()
    kind = "reel" if product == "REELS" or m.get("media_type") == "VIDEO" else "post"
    extra = {"caption": caption[:600]} if caption else {}
    return {"video_id": str(m.get("id")), "url": m.get("permalink"),
            "title": caption.split("\n")[0][:140] if caption else "",
            "published": (m.get("timestamp") or "")[:10] or None, "duration": None, "kind": kind,
            "views": m.get("view_count"), "likes": m.get("like_count"),
            "comments": m.get("comments_count"), "extra": extra}


def _insights(media_id, token):
    for metrics in INSIGHT_SETS:
        try:
            data = _get("%s/insights" % media_id, {"metric": metrics}, token).get("data", [])
        except GraphError:
            continue
        out = {}
        for d in data:
            vals = d.get("values") or [{}]
            out[d.get("name")] = vals[0].get("value")
        return out
    return {}


def fetch_own(env, limit=50):
    token, uid = _need(env)
    data = _get("%s/media" % uid, {"fields": MEDIA_FIELDS, "limit": limit}, token).get("data", [])
    records = []
    for m in data:
        r = media_to_record(m)
        ins = _insights(m["id"], token)
        for k in ("reach", "saved", "shares", "total_interactions"):
            if ins.get(k) is not None:
                r["extra"][k] = ins[k]
        if ins.get("views") is not None:
            r["views"] = ins["views"]
        records.append(r)
    return records


def fetch_other(env, handle, limit=30):
    token, uid = _need(env)
    last = None
    for fields in (MEDIA_FIELDS + ",view_count", MEDIA_FIELDS):
        q = "business_discovery.username(%s){followers_count,media_count,media.limit(%d){%s}}" % (handle, limit, fields)
        try:
            bd = _get(uid, {"fields": q}, token).get("business_discovery", {})
        except GraphError as e:
            last = e
            continue
        records = [media_to_record(m) for m in (bd.get("media") or {}).get("data", [])]
        for r in records:
            if bd.get("followers_count") is not None:
                r["extra"]["channel_follower_count"] = bd["followers_count"]
        return records
    raise GraphError("%s (Instagram only shares numbers of professional accounts)" % last)


def fetch_comments(env, media_id):
    """Top-level comments on one of my posts, with whether I already replied."""
    token, uid = _need(env)
    me = (env.get("IG_USERNAME") or "").lower()
    data = _get("%s/comments" % media_id,
                {"fields": "id,text,username,timestamp,like_count,replies{username,text}", "limit": 50},
                token).get("data", [])
    out = []
    for c in data:
        replies = (c.get("replies") or {}).get("data", [])
        out.append({"comment_id": str(c["id"]), "author": c.get("username") or "", "text": c.get("text") or "",
                    "published": (c.get("timestamp") or "")[:19], "likes": c.get("like_count"),
                    "answered": any((r.get("username") or "").lower() == me for r in replies),
                    "mine": (c.get("username") or "").lower() == me})
    return out


def setup(env_path, short_token):
    """Turn the token pasted from Meta's Graph API Explorer into a lasting one and find the account."""
    from . import config
    env = config.load_env(env_path)
    token, lasting = short_token.strip(), False
    if env.get("FB_APP_ID") and env.get("FB_APP_SECRET"):
        token = _get("oauth/access_token", {"grant_type": "fb_exchange_token", "client_id": env["FB_APP_ID"],
                                            "client_secret": env["FB_APP_SECRET"],
                                            "fb_exchange_token": token})["access_token"]
        lasting = True
    pages = _get("me/accounts", {"fields": "name,access_token,instagram_business_account{id,username}"},
                 token).get("data", [])
    linked = [p for p in pages if p.get("instagram_business_account")]
    if not linked:
        raise GraphError("No Facebook Page with a linked Instagram professional account was found for this token.")
    page = linked[0]
    ig = page["instagram_business_account"]
    config.save_env({"IG_TOKEN": page.get("access_token") or token, "IG_USER_ID": ig["id"],
                     "IG_USERNAME": ig.get("username", "")}, env_path)
    return {"username": ig.get("username"), "page": page.get("name"), "lasting": lasting}


if __name__ == "__main__":
    from . import config
    if len(sys.argv) == 3 and sys.argv[1] == "setup":
        try:
            r = setup(config.ENV_PATH, sys.argv[2])
        except (GraphError, KeyError) as e:
            sys.exit("Setup failed: %s" % e)
        print("Connected Instagram @%s through Facebook Page '%s'." % (r["username"], r["page"]))
        print("Token lasts." if r["lasting"] else
              "Warning: FB_APP_ID / FB_APP_SECRET are not in radar/.env, so this token expires in about an hour.")
    else:
        print("usage: python -m app.collect_instagram setup <token>")
