from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_current_user
from ..models import HostedZone, Record
from ..schemas import ZoneCreate, ZoneOut, ZonePage, ZoneUpdate


router = APIRouter(
    prefix="/zones",
    tags=["hosted zones"],
    dependencies=[Depends(get_current_user)],
)

DEFAULT_NS = [
    "ns-1536.awsdns-00.co.uk.",
    "ns-0.awsdns-00.com.",
    "ns-1024.awsdns-00.org.",
    "ns-512.awsdns-00.net.",
]
DEFAULT_SOA = "ns-1536.awsdns-00.co.uk. awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400"


def to_out(zone: HostedZone, record_count: int) -> ZoneOut:
    return ZoneOut(
        id=zone.id,
        name=zone.name,
        type=zone.type,
        comment=zone.comment,
        created_at=zone.created_at,
        record_count=record_count,
    )


def count_records(db: Session, zone_id: int) -> int:
    return db.query(func.count(Record.id)).filter(Record.zone_id == zone_id).scalar()


def get_zone_or_404(db: Session, zone_id: int) -> HostedZone:
    zone = db.get(HostedZone, zone_id)
    if not zone:
        raise HTTPException(status_code=404, detail="Hosted zone not found")
    return zone


@router.get("", response_model=ZonePage)
def list_zones(
    search: str = "",
    type: str = "",
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(HostedZone)
    if search.strip():
        like = f"%{search.strip()}%"
        query = query.filter(or_(HostedZone.name.ilike(like), HostedZone.comment.ilike(like)))
    if type:
        query = query.filter(HostedZone.type == type)

    total = query.count()
    zones = (
        query.order_by(HostedZone.name)
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    counts = dict(
        db.query(Record.zone_id, func.count(Record.id))
        .filter(Record.zone_id.in_([z.id for z in zones]))
        .group_by(Record.zone_id)
        .all()
    )
    items = [to_out(z, counts.get(z.id, 0)) for z in zones]
    return ZonePage(items=items, total=total, page=page, page_size=page_size)


@router.post("", response_model=ZoneOut, status_code=201)
def create_zone(data: ZoneCreate, db: Session = Depends(get_db)):
    if db.query(HostedZone).filter(HostedZone.name == data.name).first():
        raise HTTPException(status_code=409, detail="A hosted zone with this name already exists")

    zone = HostedZone(name=data.name, type=data.type, comment=data.comment)
    zone.records = [
        Record(name=data.name, type="NS", ttl=172800, values=DEFAULT_NS),
        Record(name=data.name, type="SOA", ttl=900, values=[DEFAULT_SOA]),
    ]
    db.add(zone)
    db.commit()
    db.refresh(zone)
    return to_out(zone, 2)


@router.get("/{zone_id}", response_model=ZoneOut)
def get_zone(zone_id: int, db: Session = Depends(get_db)):
    zone = get_zone_or_404(db, zone_id)
    return to_out(zone, count_records(db, zone.id))


@router.put("/{zone_id}", response_model=ZoneOut)
def update_zone(zone_id: int, data: ZoneUpdate, db: Session = Depends(get_db)):
    zone = get_zone_or_404(db, zone_id)
    zone.comment = data.comment
    db.commit()
    db.refresh(zone)
    return to_out(zone, count_records(db, zone.id))


@router.delete("/{zone_id}", status_code=204)
def delete_zone(zone_id: int, db: Session = Depends(get_db)):
    zone = get_zone_or_404(db, zone_id)
    extra = (
        db.query(Record)
        .filter(Record.zone_id == zone.id, Record.type.notin_(["NS", "SOA"]))
        .count()
    )
    if extra:
        raise HTTPException(
            status_code=400,
            detail="The hosted zone contains non-required resource record sets and cannot be deleted",
        )
    db.delete(zone)
    db.commit()