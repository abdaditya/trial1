"""Paths and the .env file (secrets stay on this Mac)."""
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))   # radar/
REPO = os.path.dirname(ROOT)                                          # zbacktrack/
DB_PATH = os.path.join(ROOT, "data", "radar.db")
ENV_PATH = os.path.join(ROOT, ".env")


def load_env(path=ENV_PATH):
    env = {}
    if os.path.exists(path):
        for line in open(path, encoding="utf-8"):
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip().strip('"').strip("'")
    return env


def save_env(values, path=ENV_PATH):
    env = load_env(path)
    env.update({k: v for k, v in values.items() if v is not None})
    with open(path, "w", encoding="utf-8") as f:
        for k, v in env.items():
            f.write("%s=%s\n" % (k, v))
    os.chmod(path, 0o600)
    return env
