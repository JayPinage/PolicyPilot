
from datetime import datetime, timezone

from sqlalchemy import String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.database.connnection import Base


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, index=True
    )

    filename: Mapped[str] = mapped_column(
        String(255), nullable=False
    )

    file_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )

    uploaded_by: Mapped[int] = mapped_column(
        ForeignKey("users.id"), nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )
