
from sqlalchemy import String, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.connnection import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, index=True
    )

    email: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )

    full_name: Mapped[str] = mapped_column(
        String(150), nullable=False
    )

    hashed_password: Mapped[str] = mapped_column(
        String(255), nullable=False
    )

    role: Mapped[str] = mapped_column(
        String(20), nullable=False, default="employee"
    )

    is_active: Mapped[bool] = mapped_column(
        default=True
    )
    chats = relationship(
    "Chat",
    back_populates="user",
    cascade="all, delete-orphan"
    )