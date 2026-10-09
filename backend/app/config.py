import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./route53.db")

_DEV_SECRET = "dev-only-secret-change-me"
SECRET_KEY = os.getenv("SECRET_KEY", _DEV_SECRET)

COOKIE_SECURE = os.getenv("COOKIE_SECURE", "0") == "1"
ALLOWED_ORIGINS = [
    o.strip()
    for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
    if o.strip()
]

DEMO_EMAIL = os.getenv("DEMO_EMAIL", "admin@example.com")
DEMO_PASSWORD = os.getenv("DEMO_PASSWORD", "admin123")
SEED_DEMO_DATA = os.getenv("SEED_DEMO_DATA", "1") == "1"

if COOKIE_SECURE and SECRET_KEY == _DEV_SECRET:
    raise RuntimeError("Set a real SECRET_KEY in production")