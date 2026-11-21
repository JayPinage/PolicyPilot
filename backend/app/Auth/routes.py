
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.connnection import get_db
from app.models.user import User
from app.schemas.user import (
    EmployeeCreate,
    UserResponse,
    TokenResponse
)
from app.Auth.security import (
    verify_password,
    hash_password,
    create_access_token
)
from app.Auth.dependencies import (
    get_current_user,
    require_admin
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


# Login
@router.post("/login", response_model=TokenResponse)
async def login(
    form: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):

    result = await db.execute(
        select(User).where(User.email == form.username)
    )

    user = result.scalar_one_or_none()

    if not user or not verify_password(
        form.password, user.hashed_password
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="Account is disabled"
        )

    token = create_access_token(
        user_id=user.id,
        role=user.role
    )

    return {
        "access_token": token,
        "token_type": "bearer"
    }


# Admin creates employee
@router.post(
    "/create-employee",
    response_model=UserResponse
)
async def create_employee(
    data: EmployeeCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):

    result = await db.execute(
        select(User).where(User.email == data.email)
    )

    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    if len(data.password) < 5:
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least 5 characters"
        )

    new_user = User(
        full_name=data.full_name,
        email=data.email,
        hashed_password=hash_password(data.password),
        role="employee"
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return new_user


# Get logged-in user
@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: User = Depends(get_current_user)
):
    return current_user
