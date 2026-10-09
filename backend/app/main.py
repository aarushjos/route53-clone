from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models
from .config import ALLOWED_ORIGINS, DEMO_EMAIL, DEMO_PASSWORD, SEED_DEMO_DATA
from .db import Base, SessionLocal, engine
from .routers import auth, records, zones
from .routers.zones import DEFAULT_NS, DEFAULT_SOA
from .security import hash_password

Base.metadata.create_all(bind=engine)


def seed() -> None:
    with SessionLocal() as db:
        if db.query(models.User).count() > 0:
            return 

        db.add(models.User(email=DEMO_EMAIL, hashed_password=hash_password(DEMO_PASSWORD)))

        if SEED_DEMO_DATA:
            zone = models.HostedZone(name="example.com", type="public", comment="Sample hosted zone")
            zone.records = [
                models.Record(name="example.com", type="NS", ttl=172800, values=DEFAULT_NS),
                models.Record(name="example.com", type="SOA", ttl=900, values=[DEFAULT_SOA]),
                models.Record(name="example.com", type="A", ttl=300, values=["192.0.2.10"]),
                models.Record(name="www.example.com", type="CNAME", ttl=300, values=["example.com"]),
                models.Record(name="example.com", type="MX", ttl=300, values=["10 mail.example.com"]),
                models.Record(name="example.com", type="TXT", ttl=300, values=['"v=spf1 mx -all"']),
            ]
            db.add(zone)
        db.commit()


seed()

app = FastAPI(title="Route53 Clone API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(zones.router)
app.include_router(records.router)


@app.get("/health")
def health():
    return {"status": "ok"}