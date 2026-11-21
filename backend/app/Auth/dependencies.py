
import jwt

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.connnection import get_db
from app.models.user import User
from app.config import settings


oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/auth/login"
)


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):

    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"}
    )

    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )

        user_id = payload.get("sub")

        if user_id is None:
            raise credentials_error

    except jwt.InvalidTokenError:
        raise credentials_error

    result = await db.execute(
        select(User).where(User.id == int(user_id))
    )

    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise credentials_error

    return user


async def require_admin(
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )

    return current_user


async def require_employee(
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "employee":
        raise HTTPException(
            status_code=403,
            detail="Employee access required"
        )

    return current_user
