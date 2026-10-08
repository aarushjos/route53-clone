from fastapi import Cookie, Depends, HTTPException
from sqlalchemy.orm import Session

from .db import get_db
from .models import User
from .security import decode_token


def get_current_user(
    access_token: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
) -> User:
    if not access_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user_id = decode_token(access_token)
    user = db.get(User, user_id) if user_id else None
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    return user