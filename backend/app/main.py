from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .db import Base, engine, SessionLocal
from . import models 
from .routers import auth, zones, records
from .security import hash_password


Base.metadata.create_all(bind=engine)

def seed_demo_user():
    with SessionLocal() as db:
        exists = db.query(models.User).filter_by(email="demo@example.com").first()
        if not exists:
            db.add(
                models.User(
                    email="demo@example.com",
                    hashed_password=hash_password("demo123"),
                )
            )
            db.commit()


seed_demo_user()

app = FastAPI(title="Route53 Clone API")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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