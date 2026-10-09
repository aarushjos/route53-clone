from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import String, cast, or_
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_current_user
from ..models import HostedZone, Record
from ..schemas import RecordCreate, RecordOut, RecordPage, RecordUpdate, BulkDelete, BulkDeleteResult, RecordBatchCreate
from ..validators import validate_values


router = APIRouter(
    prefix="/zones/{zone_id}/records",
    tags=["records"],
    dependencies=[Depends(get_current_user)],
)


def get_zone_or_404(db: Session, zone_id: int) -> HostedZone:
    zone = db.get(HostedZone, zone_id)
    if not zone:
        raise HTTPException(status_code=404, detail="Hosted zone not found")
    return zone


def get_record_or_404(db: Session, zone_id: int, record_id: int) -> Record:
    record = db.get(Record, record_id)
    if not record or record.zone_id != zone_id:
        raise HTTPException(status_code=404, detail="Record not found")
    return record


def full_name(zone: HostedZone, name: str) -> str:
    if not name or name == "@":
        return zone.name
    if name == zone.name or name.endswith("." + zone.name):
        return name
    return f"{name}.{zone.name}"


def is_protected(zone: HostedZone, record: Record) -> bool:
    return record.type == "SOA" or (record.type == "NS" and record.name == zone.name)

def check_conflicts(existing: list[Record], name: str, rtype: str) -> None:
    if any(r.type == rtype for r in existing):
        raise HTTPException(status_code=409, detail=f"A {rtype} record named {name} already exists")
    if rtype == "CNAME" and existing:
        raise HTTPException(status_code=409, detail="A CNAME cannot share a name with another record")
    if rtype != "CNAME" and any(r.type == "CNAME" for r in existing):
        raise HTTPException(status_code=409, detail="This name already has a CNAME record")


@router.get("", response_model=RecordPage)
def list_records(
    zone_id: int,
    search: str = "",
    type: str = "",
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    get_zone_or_404(db, zone_id)
    query = db.query(Record).filter(Record.zone_id == zone_id)
    if search.strip():
        like = f"%{search.strip()}%"
        query = query.filter(or_(Record.name.ilike(like), cast(Record.values, String).ilike(like)))
    if type:
        query = query.filter(Record.type == type.upper())

    total = query.count()
    items = (
        query.order_by(Record.name, Record.type)
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return RecordPage(items=items, total=total, page=page, page_size=page_size)


@router.post("", response_model=RecordOut, status_code=201)
def create_record(zone_id: int, data: RecordCreate, db: Session = Depends(get_db)):
    zone = get_zone_or_404(db, zone_id)
    name = full_name(zone, data.name)

    same_name = db.query(Record).filter(Record.zone_id == zone.id, Record.name == name).all()
    check_conflicts(same_name, name, data.type)

    record = Record(
        zone_id=zone.id,
        name=name,
        type=data.type,
        ttl=data.ttl,
        values=data.values,
        routing_policy=data.routing_policy,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

@router.post("/batch", response_model=list[RecordOut], status_code=201)
def create_records_batch(zone_id: int, data: RecordBatchCreate, db: Session = Depends(get_db)):
    zone = get_zone_or_404(db, zone_id)
    names = {full_name(zone, item.name) for item in data.records}

    by_name: dict[str, list[Record]] = {}
    for r in db.query(Record).filter(Record.zone_id == zone.id, Record.name.in_(list(names))).all():
        by_name.setdefault(r.name, []).append(r)

    created: list[Record] = []
    for i, item in enumerate(data.records, start=1):
        name = full_name(zone, item.name)
        try:
            check_conflicts(by_name.get(name, []), name, item.type)
        except HTTPException as e:
            raise HTTPException(status_code=e.status_code, detail=f"Record {i}: {e.detail}")
        rec = Record(
            zone_id=zone.id,
            name=name,
            type=item.type,
            ttl=item.ttl,
            values=item.values,
            routing_policy=item.routing_policy,
        )
        by_name.setdefault(name, []).append(rec) 
        created.append(rec)

    db.add_all(created) 
    db.commit()
    for rec in created:
        db.refresh(rec)
    return created

@router.post("/bulk-delete", response_model=BulkDeleteResult)
def bulk_delete_records(zone_id: int, data: BulkDelete, db: Session = Depends(get_db)):
    zone = get_zone_or_404(db, zone_id)
    ids = set(data.ids)
    records = db.query(Record).filter(Record.zone_id == zone.id, Record.id.in_(ids)).all()
    deletable = [r for r in records if not is_protected(zone, r)]
    for r in deletable:
        db.delete(r)
    db.commit()
    return BulkDeleteResult(deleted=len(deletable), skipped=len(ids) - len(deletable))

@router.get("/{record_id}", response_model=RecordOut)
def get_record(zone_id: int, record_id: int, db: Session = Depends(get_db)):
    get_zone_or_404(db, zone_id)
    return get_record_or_404(db, zone_id, record_id)


@router.put("/{record_id}", response_model=RecordOut)
def update_record(zone_id: int, record_id: int, data: RecordUpdate, db: Session = Depends(get_db)):
    get_zone_or_404(db, zone_id)
    record = get_record_or_404(db, zone_id, record_id)
    if record.type == "SOA":
        raise HTTPException(status_code=400, detail="The SOA record cannot be edited")

    values = [v.strip() for v in data.values]
    try:
        validate_values(record.type, values)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    record.ttl = data.ttl
    record.values = values
    db.commit()
    db.refresh(record)
    return record


@router.delete("/{record_id}", status_code=204)
def delete_record(zone_id: int, record_id: int, db: Session = Depends(get_db)):
    zone = get_zone_or_404(db, zone_id)
    record = get_record_or_404(db, zone_id, record_id)
    if is_protected(zone, record):
        raise HTTPException(
            status_code=400,
            detail="The default NS and SOA records of a hosted zone cannot be deleted",
        )
    db.delete(record)
    db.commit()