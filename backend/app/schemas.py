from pydantic import BaseModel, ConfigDict
import re
from datetime import datetime
from typing import Literal
from pydantic import field_validator


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