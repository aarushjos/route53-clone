from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
import re
from datetime import datetime
from typing import Literal
from pydantic import field_validator
from .validators import is_domain,validate_values


class LoginRequest(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str

class ZoneCreate(BaseModel):
    name: str
    type: Literal["public", "private"] = "public"
    comment: str = ""

    @field_validator("name")
    @classmethod
    def valid_name(cls, v: str) -> str:
        v = v.strip().lower().rstrip(".")
        if not re.fullmatch(r"([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}", v):
            raise ValueError("Invalid domain name")
        return v


class ZoneUpdate(BaseModel):
    comment: str  


class ZoneOut(BaseModel):
    id: int
    name: str
    type: str
    comment: str
    created_at: datetime
    record_count: int


class ZonePage(BaseModel):
    items: list[ZoneOut]
    total: int
    page: int
    page_size: int


RecordType = Literal["A", "AAAA", "CNAME", "TXT", "MX", "NS", "PTR", "SRV", "CAA"]


class RecordCreate(BaseModel):
    name: str = ""
    type: RecordType
    ttl: int = Field(300, ge=0, le=2147483647)
    values: list[str]
    routing_policy: Literal["Simple"] = "Simple"

    @field_validator("name")
    @classmethod
    def clean_name(cls, v: str) -> str:
        v = v.strip().lower().rstrip(".")
        if v and v != "@" and not is_domain(v, allow_wildcard=True):
            raise ValueError("Invalid record name")
        return v

    @model_validator(mode="after")
    def check_values(self):
        self.values = [v.strip() for v in self.values]
        validate_values(self.type, self.values)
        return self


class RecordUpdate(BaseModel):
    ttl: int = Field(ge=0, le=2147483647)
    values: list[str]


class RecordOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    zone_id: int
    name: str
    type: str
    ttl: int
    values: list[str]
    routing_policy: str
    created_at: datetime


class RecordPage(BaseModel):
    items: list[RecordOut]
    total: int
    page: int
    page_size: int

class BulkDelete(BaseModel):
    ids: list[int] = Field(min_length=1, max_length=100)


class BulkDeleteResult(BaseModel):
    deleted: int
    skipped: int