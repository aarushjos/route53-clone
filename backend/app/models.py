from datetime import datetime, timezone
from sqlalchemy import String, Integer, ForeignKey, JSON, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


def now():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String)


class HostedZone(Base):
    __tablename__ = "hosted_zones"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String, unique=True, index=True) 
    type: Mapped[str] = mapped_column(String, default="public")  
    comment: Mapped[str] = mapped_column(String, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)

    records: Mapped[list["Record"]] = relationship(
        back_populates="zone", cascade="all, delete-orphan"
    )


class Record(Base):
    __tablename__ = "records"

    id: Mapped[int] = mapped_column(primary_key=True)
    zone_id: Mapped[int] = mapped_column(ForeignKey("hosted_zones.id"), index=True)
    name: Mapped[str] = mapped_column(String, index=True) 
    type: Mapped[str] = mapped_column(String)
    ttl: Mapped[int] = mapped_column(Integer, default=300)
    values: Mapped[list] = mapped_column(JSON, default=list) 
    routing_policy: Mapped[str] = mapped_column(String, default="Simple")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)

    zone: Mapped["HostedZone"] = relationship(back_populates="records")